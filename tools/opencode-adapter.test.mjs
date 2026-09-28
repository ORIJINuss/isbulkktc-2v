import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { createServer } from "node:http";
import { once } from "node:events";
import test from "node:test";
import { OpenCodeAdapter } from "./opencode-adapter.mjs";

const root = execFileSync("git", ["rev-parse", "--show-toplevel"], { encoding: "utf8" }).trim();

function openApiDocument() {
  const operations = [
    ["/project/current", "get", "project.current", 200],
    ["/provider", "get", "provider.list", 200],
    ["/agent", "get", "app.agents", 200],
    ["/session", "get", "session.list", 200],
    ["/session", "post", "session.create", 200],
    ["/session/{sessionID}", "get", "session.get", 200],
    ["/session/{sessionID}/prompt_async", "post", "session.prompt_async", 204],
    ["/session/{sessionID}/message", "get", "session.messages", 200],
    ["/session/{sessionID}/message/{messageID}", "get", "session.message", 200],
    ["/session/status", "get", "session.status", 200],
  ];
  const paths = {};
  for (const [path, method, operationId, status] of operations) {
    paths[path] ??= {};
    paths[path][method] = { operationId, responses: { [status]: {} } };
  }
  return { openapi: "3.1.0", paths, components: { schemas: {} } };
}

function reply(response, status, body, headers = {}) {
  response.writeHead(status, { "content-type": "application/json", ...headers });
  response.end(body === null ? undefined : JSON.stringify(body));
}

async function fixture({
  wrongProject = false,
  firstSession429 = false,
  firstModel403 = false,
  delayHealth = 0,
  intermediateAssistant = false,
  incompleteFinalAssistant = false,
} = {}) {
  const data = { session: null, sessions: [], messages: [], sessionCreates: 0, dispatched: 0 };
  const server = createServer(async (request, response) => {
    const url = new URL(request.url, "http://127.0.0.1");
    let body = {};
    if (request.method === "POST") {
      const chunks = [];
      for await (const chunk of request) chunks.push(chunk);
      body = JSON.parse(Buffer.concat(chunks).toString("utf8"));
    }
    if (url.pathname === "/global/health") {
      if (delayHealth) {
        setTimeout(() => reply(response, 200, { healthy: true, version: "fixture" }), delayHealth);
        return;
      }
      reply(response, 200, { healthy: true, version: "fixture" });
      return;
    }
    if (url.pathname === "/doc") {
      reply(response, 200, openApiDocument());
      return;
    }
    if (url.pathname === "/project/current") {
      reply(response, 200, {
        id: wrongProject ? "wrong-project" : "project-fixture",
        worktree: root,
        vcs: "git",
      });
      return;
    }
    if (url.pathname === "/provider") {
      reply(response, 200, {
        all: [{ id: "provider-fixture", models: { model: { status: "active" }, fallback: { status: "active" } } }],
        connected: ["provider-fixture"],
      });
      return;
    }
    if (url.pathname === "/agent") {
      reply(response, 200, [{ name: "build" }, { name: "plan" }]);
      return;
    }
    if (url.pathname === "/session" && request.method === "GET") {
      reply(response, 200, data.sessions);
      return;
    }
    if (url.pathname === "/session" && request.method === "POST") {
      data.sessionCreates += 1;
      if (firstSession429 && data.sessionCreates === 1) {
        reply(response, 429, { error: "rate limited" }, { "retry-after": "0" });
        return;
      }
      data.session = {
        id: `ses_fixture_${data.sessions.length + 1}`,
        projectID: "project-fixture",
        directory: root,
        title: "fixture",
        version: "fixture",
        time: { created: Date.now(), updated: Date.now() },
        agent: body.agent,
        model: body.model,
        permission: body.permission,
        metadata: body.metadata,
      };
      data.sessions.push(data.session);
      reply(response, 200, data.session);
      return;
    }
    if (url.pathname === "/session/status" && request.method === "GET") {
      reply(response, 200, {});
      return;
    }
    const sessionMatch = url.pathname.match(/^\/session\/([^/]+)$/);
    if (sessionMatch && request.method === "GET") {
      const session = data.sessions.find((entry) => entry.id === sessionMatch[1]);
      reply(response, session ? 200 : 404, session ?? { error: "not found" });
      return;
    }
    const promptMatch = url.pathname.match(/^\/session\/([^/]+)\/prompt_async$/);
    if (promptMatch && request.method === "POST") {
      data.dispatched += 1;
      const sessionId = promptMatch[1];
      const session = data.sessions.find((entry) => entry.id === sessionId);
      const userId = body.messageID;
      const assistantId = `msg_assistant_${sessionId}`;
      const modelFailed = firstModel403 && body.model.modelID === "model";
      const finalCreatedAt = Date.now();
      data.messages = [
        {
          info: {
            id: userId,
            sessionID: sessionId,
            role: "user",
            time: { created: Date.now() },
            agent: body.agent,
            model: { providerID: "provider-fixture", modelID: "model" },
          },
          parts: body.parts,
        },
        ...(intermediateAssistant ? [{
          info: {
            id: `msg_progress_${sessionId}`,
            sessionID: sessionId,
            role: "assistant",
            time: { created: finalCreatedAt - 1, completed: finalCreatedAt },
            parentID: userId,
            modelID: body.model.modelID,
            providerID: "provider-fixture",
            agent: body.agent,
            path: { cwd: root, root },
          },
          parts: [{
            id: "prt_progress",
            sessionID: sessionId,
            messageID: `msg_progress_${sessionId}`,
            type: "text",
            text: "I am inspecting the assigned files.",
          }],
        }] : []),
        {
          info: {
            id: assistantId,
            sessionID: sessionId,
            role: "assistant",
            time: {
              created: finalCreatedAt,
              ...(incompleteFinalAssistant ? {} : { completed: finalCreatedAt + 1 }),
            },
            parentID: userId,
            modelID: body.model.modelID,
            providerID: "provider-fixture",
            mode: "fixture",
            agent: body.agent,
            path: { cwd: root, root },
            cost: 0,
            tokens: { input: 1, output: 1, reasoning: 0, cache: { read: 0, write: 0 } },
            ...(modelFailed ? { error: { name: "APIError", data: { message: "model rejected", statusCode: 403 } } } : {}),
          },
          parts: [{
            id: "prt_fixture",
            sessionID: sessionId,
            messageID: assistantId,
            type: "text",
            text: modelFailed ? "" : `project root: ${root}\nreceived = yes\nwrite permission = denied`,
          }],
        },
      ];
      session.messages = data.messages;
      data.session = session;
      response.writeHead(204);
      response.end();
      return;
    }
    const messagesMatch = url.pathname.match(/^\/session\/([^/]+)\/message$/);
    if (messagesMatch && request.method === "GET") {
      const session = data.sessions.find((entry) => entry.id === messagesMatch[1]);
      reply(response, 200, session?.messages ?? []);
      return;
    }
    const exactMessageMatch = url.pathname.match(/^\/session\/([^/]+)\/message\/([^/]+)$/);
    if (exactMessageMatch && request.method === "GET") {
      const session = data.sessions.find((entry) => entry.id === exactMessageMatch[1]);
      const message = session?.messages?.find((entry) => entry.info.id === exactMessageMatch[2]);
      reply(response, message ? 200 : 404, message ?? { error: "not found" });
      return;
    }
    reply(response, 404, { error: "not found" });
  });
  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  const address = server.address();
  return {
    data,
    server,
    config: {
      enabled: true,
      baseUrl: `http://127.0.0.1:${address.port}`,
      projectId: "project-fixture",
      worktree: root,
      providerId: "provider-fixture",
      modelId: "model",
      fallbackModelIds: [],
      agent: "build",
      readOnlyAgent: "plan",
      timeouts: { connectMs: 80, dispatchMs: 80, resultMs: 1000, pollMs: 5, maxPollMs: 20 },
      retry: { maxAttempts: 2, backoffMs: 0, maxBackoffMs: 20 },
    },
  };
}

function sampleTask() {
  return {
    id: "tsk_fixture",
    correlationId: "cor_fixture",
    idempotencyKey: null,
    title: "adapter fixture task",
    description: "Read-only test.",
    acceptanceCriteria: "Return a concise response.",
    files: [],
    opencode: null,
  };
}

test("rejects a mismatched project before creating a session", async (t) => {
  const server = await fixture({ wrongProject: true });
  t.after(() => server.server.close());
  const attempts = [];
  const adapter = new OpenCodeAdapter(server.config, { root });
  await assert.rejects(
    adapter.runTask(sampleTask(), {
      readOnly: true,
      onSession: async () => {},
      onAttempt: async (attempt) => attempts.push(attempt),
    }),
    (error) => error.code === "OPENCODE_PROJECT_MISMATCH",
  );
  assert.equal(server.data.sessionCreates, 0);
  assert.equal(attempts.at(-1).status, "DISPATCH_FAILED");
});

test("retries a documented transient 429 and retrieves a real fixture response", async (t) => {
  const server = await fixture({ firstSession429: true });
  t.after(() => server.server.close());
  const attempts = [];
  let session;
  const adapter = new OpenCodeAdapter(server.config, { root });
  const result = await adapter.runTask(sampleTask(), {
    readOnly: true,
    onSession: async (created) => { session = created; },
    onAttempt: async (attempt) => attempts.push(attempt),
  });
  assert.equal(server.data.sessionCreates, 2);
  assert.equal(server.data.dispatched, 1);
  assert.equal(attempts[0].status, "RETRYABLE_FAILURE");
  assert.equal(attempts[0].httpStatus, 429);
  assert.equal(session.sessionId, result.sessionId);
  assert.equal(result.messageId, "msg_assistant_ses_fixture_1");
  assert.match(result.response, /write permission = denied/);
});

test("returns the final assistant message instead of a completed progress message", async (t) => {
  const server = await fixture({ intermediateAssistant: true });
  t.after(() => server.server.close());
  const adapter = new OpenCodeAdapter(server.config, { root });
  const result = await adapter.runTask(sampleTask(), {
    readOnly: true,
    onSession: async () => {},
    onAttempt: async () => {},
  });
  assert.equal(result.messageId, "msg_assistant_ses_fixture_1");
  assert.match(result.response, /write permission = denied/);
});

test("does not accept a completed progress message when the latest assistant message is incomplete", async (t) => {
  const server = await fixture({
    intermediateAssistant: true,
    incompleteFinalAssistant: true,
  });
  t.after(() => server.server.close());
  const adapter = new OpenCodeAdapter({
    ...server.config,
    timeouts: { ...server.config.timeouts, resultMs: 120, pollMs: 5, maxPollMs: 10 },
    retry: { ...server.config.retry, maxAttempts: 1 },
  }, { root });
  await assert.rejects(
    adapter.runTask(sampleTask(), {
      readOnly: true,
      onSession: async () => {},
      onAttempt: async () => {},
    }),
    (error) => error.code === "OPENCODE_TIMEOUT",
  );
});

test("switches only to an explicitly configured model after a non-retryable 403", async (t) => {
  const server = await fixture({ firstModel403: true });
  t.after(() => server.server.close());
  const attempts = [];
  const sessions = [];
  const adapter = new OpenCodeAdapter({
    ...server.config,
    fallbackModelIds: ["fallback"],
    retry: { ...server.config.retry, maxAttempts: 3 },
  }, { root });
  const result = await adapter.runTask(sampleTask(), {
    readOnly: true,
    onSession: async (session) => sessions.push(session),
    onAttempt: async (attempt) => attempts.push(attempt),
  });
  assert.equal(server.data.sessionCreates, 2);
  assert.equal(server.data.dispatched, 2);
  assert.equal(attempts.find((attempt) => attempt.errorCode === "OPENCODE_MODEL_REJECTED")?.httpStatus, 403);
  assert.equal(sessions.at(-1).modelId, "fallback");
  assert.equal(result.modelId, "fallback");
  assert.equal(result.modelChangedFrom, "model");
});

test("surfaces connection timeouts without treating them as success", async (t) => {
  const server = await fixture({ delayHealth: 250 });
  t.after(() => server.server.close());
  const attempts = [];
  const adapter = new OpenCodeAdapter({
    ...server.config,
    timeouts: { ...server.config.timeouts, connectMs: 15, resultMs: 100 },
    retry: { ...server.config.retry, maxAttempts: 1 },
  }, { root });
  await assert.rejects(
    adapter.runTask(sampleTask(), {
      readOnly: true,
      onSession: async () => {},
      onAttempt: async (attempt) => attempts.push(attempt),
    }),
    (error) => error.code === "OPENCODE_TIMEOUT",
  );
  assert.equal(attempts.at(-1).status, "OPENCODE_TIMEOUT");
  assert.equal(attempts.at(-1).exitCode, null);
});

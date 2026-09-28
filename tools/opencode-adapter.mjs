import { execFileSync } from "node:child_process";
import { randomUUID } from "node:crypto";

const TRANSIENT_HTTP = new Set([429, 500, 502, 503, 504]);
const TRANSIENT_NETWORK = new Set(["ECONNRESET", "ECONNREFUSED", "ETIMEDOUT", "EAI_AGAIN", "UND_ERR_CONNECT_TIMEOUT"]);

export class OpenCodeAdapterError extends Error {
  constructor(message, {
    code = "OPENCODE_ERROR",
    endpoint = "",
    httpStatus = null,
    retryAfterMs = null,
    transient = false,
  } = {}) {
    super(message);
    this.name = "OpenCodeAdapterError";
    this.code = code;
    this.endpoint = endpoint;
    this.httpStatus = httpStatus;
    this.retryAfterMs = retryAfterMs;
    this.transient = transient;
  }
}

function normalizePath(path) {
  return path.replace(/\//g, "\\").replace(/\\+$/, "").toLowerCase();
}

function retryAfterMilliseconds(value, now = Date.now()) {
  if (!value) return null;
  const seconds = Number(value);
  if (Number.isFinite(seconds) && seconds >= 0) return Math.ceil(seconds * 1000);
  const date = Date.parse(value);
  return Number.isFinite(date) ? Math.max(0, date - now) : null;
}

function errorCode(error) {
  return error?.cause?.code ?? error?.code ?? "";
}

function operation(doc, path, method, operationId, successStatus) {
  const found = doc?.paths?.[path]?.[method];
  if (!found || found.operationId !== operationId) {
    throw new OpenCodeAdapterError(
      `OpenCode API contract mismatch for ${method.toUpperCase()} ${path}.`,
      { code: "OPENCODE_API_CONTRACT" },
    );
  }
  if (successStatus && !Object.hasOwn(found.responses ?? {}, String(successStatus))) {
    throw new OpenCodeAdapterError(
      `OpenCode API contract does not document HTTP ${successStatus} for ${method.toUpperCase()} ${path}.`,
      { code: "OPENCODE_API_CONTRACT" },
    );
  }
  return found;
}

function extractText(parts) {
  return parts
    .filter((part) => part && part.type === "text" && typeof part.text === "string")
    .map((part) => part.text)
    .join("\n")
    .trim();
}

export function isTransientOpenCodeError(error) {
  return error instanceof OpenCodeAdapterError
    ? error.transient
    : TRANSIENT_NETWORK.has(errorCode(error));
}

export class OpenCodeAdapter {
  constructor(config, { root }) {
    if (!config?.enabled) {
      throw new OpenCodeAdapterError("OpenCode adapter is disabled.", { code: "OPENCODE_DISABLED" });
    }
    this.config = config;
    this.root = root;
    this.baseUrl = new URL(config.baseUrl);
    this.doc = null;
    this.version = null;
    this.lastInspection = null;
    this.lastProject = null;
  }

  async request(path, {
    method = "GET",
    body,
    expected = [200],
    timeoutMs = this.config.timeouts.connectMs,
    allowEmpty = false,
  } = {}) {
    const endpoint = new URL(path, this.baseUrl);
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const response = await fetch(endpoint, {
        method,
        headers: body === undefined ? { accept: "application/json" } : {
          accept: "application/json",
          "content-type": "application/json",
        },
        body: body === undefined ? undefined : JSON.stringify(body),
        redirect: "manual",
        signal: controller.signal,
      });
      if (!expected.includes(response.status)) {
        const retryAfterMs = retryAfterMilliseconds(response.headers.get("retry-after"));
        throw new OpenCodeAdapterError(
          `OpenCode returned HTTP ${response.status} for ${method} ${endpoint.pathname}.`,
          {
            code: `OPENCODE_HTTP_${response.status}`,
            endpoint: `${method} ${endpoint.pathname}`,
            httpStatus: response.status,
            retryAfterMs,
            transient: TRANSIENT_HTTP.has(response.status),
          },
        );
      }
      if (allowEmpty && response.status === 204) return null;
      const contentType = response.headers.get("content-type") ?? "";
      if (!contentType.toLowerCase().includes("application/json")) {
        throw new OpenCodeAdapterError(
          `OpenCode returned a non-JSON response for ${method} ${endpoint.pathname}.`,
          { code: "OPENCODE_INVALID_RESPONSE", endpoint: `${method} ${endpoint.pathname}` },
        );
      }
      try {
        return await response.json();
      } catch {
        throw new OpenCodeAdapterError(
          `OpenCode returned invalid JSON for ${method} ${endpoint.pathname}.`,
          { code: "OPENCODE_INVALID_RESPONSE", endpoint: `${method} ${endpoint.pathname}` },
        );
      }
    } catch (error) {
      if (error instanceof OpenCodeAdapterError) throw error;
      if (controller.signal.aborted || error?.name === "AbortError") {
        throw new OpenCodeAdapterError(
          `OpenCode request timed out for ${method} ${endpoint.pathname}.`,
          { code: "OPENCODE_TIMEOUT", endpoint: `${method} ${endpoint.pathname}`, transient: true },
        );
      }
      const networkCode = errorCode(error);
      throw new OpenCodeAdapterError(
        `OpenCode connection failed for ${method} ${endpoint.pathname}${networkCode ? ` (${networkCode})` : ""}.`,
        {
          code: networkCode ? `OPENCODE_NETWORK_${networkCode}` : "OPENCODE_NETWORK_ERROR",
          endpoint: `${method} ${endpoint.pathname}`,
          transient: TRANSIENT_NETWORK.has(networkCode),
        },
      );
    } finally {
      clearTimeout(timer);
    }
  }

  async loadApiContract() {
    if (this.doc) return this.doc;
    const health = await this.request("/global/health");
    if (health?.healthy !== true || typeof health.version !== "string") {
      throw new OpenCodeAdapterError("OpenCode health response is invalid.", { code: "OPENCODE_INVALID_RESPONSE" });
    }
    this.version = health.version;
    const doc = await this.request("/doc", { timeoutMs: this.config.timeouts.connectMs });
    if (typeof doc?.openapi !== "string" || !doc.paths || !doc.components?.schemas) {
      throw new OpenCodeAdapterError("OpenCode /doc did not return an OpenAPI document.", { code: "OPENCODE_API_CONTRACT" });
    }
    operation(doc, "/project/current", "get", "project.current", 200);
    operation(doc, "/provider", "get", "provider.list", 200);
    operation(doc, "/agent", "get", "app.agents", 200);
    operation(doc, "/session", "get", "session.list", 200);
    operation(doc, "/session", "post", "session.create", 200);
    operation(doc, "/session/{sessionID}", "get", "session.get", 200);
    operation(doc, "/session/{sessionID}/prompt_async", "post", "session.prompt_async", 204);
    operation(doc, "/session/{sessionID}/message", "get", "session.messages", 200);
    operation(doc, "/session/{sessionID}/message/{messageID}", "get", "session.message", 200);
    operation(doc, "/session/status", "get", "session.status", 200);
    this.doc = doc;
    return doc;
  }

  async inspect() {
    await this.loadApiContract();
    const directory = this.config.worktree;
    const projectUrl = new URL("/project/current", this.baseUrl);
    projectUrl.searchParams.set("directory", directory);
    const project = await this.request(`${projectUrl.pathname}${projectUrl.search}`);
    const gitRoot = execFileSync("git", ["rev-parse", "--show-toplevel"], {
      cwd: this.root,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    }).trim();
    if (
      project.id !== this.config.projectId ||
      typeof project.worktree !== "string" ||
      normalizePath(project.worktree) !== normalizePath(this.config.worktree) ||
      normalizePath(gitRoot) !== normalizePath(this.config.worktree)
    ) {
      throw new OpenCodeAdapterError(
        `OPENCODE_PROJECT_MISMATCH: configured project/worktree did not match live project and Git root.`,
        { code: "OPENCODE_PROJECT_MISMATCH", endpoint: "GET /project/current" },
      );
    }
    this.lastProject = project;

    const [providers, agents] = await Promise.all([
      this.request("/provider"),
      this.request("/agent"),
    ]);
    const connected = new Set(providers.connected);
    if (!Array.isArray(providers.all) || !Array.isArray(providers.connected) || !Array.isArray(agents)) {
      throw new OpenCodeAdapterError("OpenCode provider or agent response is invalid.", { code: "OPENCODE_INVALID_RESPONSE" });
    }
    const configuredModels = [this.config.modelId, ...this.config.fallbackModelIds];
    const choices = configuredModels
      .map((modelId) => {
        const provider = providers.all.find((entry) => entry.id === this.config.providerId);
        const model = provider?.models?.[modelId];
        return {
          providerId: this.config.providerId,
          modelId,
          model,
          connected: connected.has(this.config.providerId),
        };
      })
      .filter((choice) => choice.connected && choice.model?.status === "active");
    if (choices.length === 0) {
      throw new OpenCodeAdapterError(
        `No configured active model is available from connected provider ${this.config.providerId}.`,
        { code: "OPENCODE_MODEL_UNAVAILABLE", endpoint: "GET /provider" },
      );
    }
    const selected = choices[0];
    const requiredAgents = new Set([this.config.agent, this.config.readOnlyAgent]);
    const availableAgents = new Set(agents.map((agent) => agent.name));
    for (const name of requiredAgents) {
      if (!availableAgents.has(name)) {
        throw new OpenCodeAdapterError(`Configured OpenCode agent is unavailable: ${name}.`, { code: "OPENCODE_AGENT_UNAVAILABLE" });
      }
    }
    this.lastInspection = {
      version: this.version,
      project,
      gitRoot,
      providers,
      model: selected,
      models: choices,
      modelChangedFrom: selected.modelId === this.config.modelId ? null : this.config.modelId,
    };
    return this.lastInspection;
  }

  createPermissionRules(files, readOnly) {
    if (readOnly) return [{ permission: "*", pattern: "*", action: "deny" }];
    return [
      { permission: "*", pattern: "*", action: "deny" },
      { permission: "read", pattern: "*", action: "allow" },
      ...files.flatMap((file) => [
        { permission: "edit", pattern: file, action: "allow" },
        { permission: "write", pattern: file, action: "allow" },
      ]),
    ];
  }

  makePrompt(task, readOnly) {
    const rules = [
      "Do not commit or push. The Chief exclusively owns commit and push.",
      "Do not access secrets, environment file contents, credentials, tokens, or private keys.",
    ];
    if (readOnly) {
      rules.push("READ-ONLY TEST: do not edit, write, create, delete, execute commands, or invoke tools.");
      rules.push("Reply briefly with the project root, confirmation you received the task, and write permission = denied.");
    } else {
      rules.push("Only edit files listed in the task and only when each is owned by OpenCode.");
      rules.push("The orchestrator will run the actual quality gate; do not claim success without process evidence.");
    }
    return [
      `CORRELATION_ID: ${task.correlationId}`,
      `TASK_ID: ${task.id}`,
      "ROLE: IMPLEMENTER",
      `PROJECT_ROOT: ${this.config.worktree}`,
      `ASSIGNED_FILES: ${task.files.length > 0 ? task.files.join(", ") : "(none; read-only task)"}`,
      "OWNERSHIP RULES:",
      ...rules.map((rule) => `- ${rule}`),
      "TASK DESCRIPTION:",
      task.description,
      "ACCEPTANCE CRITERIA:",
      task.acceptanceCriteria ?? "Return a concise result that addresses the task description.",
      "QUALITY GATE EXPECTATION:",
      "The Chief will run the real quality gate and treats this response only as AGENT_RESPONSE evidence.",
    ].join("\n");
  }

  async getSession(sessionId) {
    const query = new URLSearchParams({ directory: this.config.worktree });
    return this.request(`/session/${encodeURIComponent(sessionId)}?${query}`);
  }

  async findTaskSession(task, modelId) {
    const query = new URLSearchParams({ directory: this.config.worktree, limit: "100" });
    const sessions = await this.request(`/session?${query}`);
    if (!Array.isArray(sessions)) {
      throw new OpenCodeAdapterError("OpenCode session list response is invalid.", { code: "OPENCODE_INVALID_RESPONSE" });
    }
    const matches = sessions.filter((session) =>
      session.metadata?.orchestratorTaskId === task.id &&
      session.metadata?.orchestratorCorrelationId === task.correlationId &&
      session.metadata?.orchestratorModelId === modelId,
    );
    if (matches.length > 1) {
      throw new OpenCodeAdapterError("Multiple OpenCode sessions match this task; automatic recovery is unsafe.", {
        code: "OPENCODE_RECOVERY_AMBIGUOUS",
      });
    }
    return matches[0] ?? null;
  }

  validateSession(session, model, agent) {
    if (
      typeof session?.id !== "string" ||
      session.projectID !== this.config.projectId ||
      typeof session.directory !== "string" ||
      normalizePath(session.directory) !== normalizePath(this.config.worktree) ||
      session.model?.providerID !== model.providerId ||
      session.model?.id !== model.modelId ||
      session.agent !== agent
    ) {
      throw new OpenCodeAdapterError(
        "OpenCode session does not belong to the verified configured project, worktree, model, and agent.",
        { code: "OPENCODE_PROJECT_MISMATCH", endpoint: "OpenCode session" },
      );
    }
    if (
      !Array.isArray(session.permission) ||
      !session.permission.some((rule) => rule.permission === "*" && rule.pattern === "*" && rule.action === "deny")
    ) {
      throw new OpenCodeAdapterError("OpenCode session did not confirm its required deny-all permission rule.", {
        code: "OPENCODE_PERMISSION_DENIED",
      });
    }
  }

  async createSession(task, model, agent, readOnly, attempt, promptMessageId, onSession) {
    const session = await this.request("/session", {
      method: "POST",
      expected: [200],
      timeoutMs: this.config.timeouts.connectMs,
      body: {
        title: `Orchestrator ${task.id} attempt ${attempt}`,
        agent,
        model: { providerID: model.providerId, id: model.modelId },
        permission: this.createPermissionRules(task.files, readOnly),
        metadata: {
          orchestratorTaskId: task.id,
          orchestratorCorrelationId: task.correlationId,
          orchestratorIdempotencyKey: task.idempotencyKey ?? `${task.id}:${task.correlationId}`,
          orchestratorPromptMessageId: promptMessageId,
          orchestratorProviderId: model.providerId,
          orchestratorModelId: model.modelId,
          orchestratorAgent: agent,
          orchestratorReadOnly: readOnly,
        },
      },
    });
    if (
      typeof session?.id !== "string" ||
      session.projectID !== this.config.projectId ||
      typeof session.directory !== "string" ||
      normalizePath(session.directory) !== normalizePath(this.config.worktree)
    ) {
      throw new OpenCodeAdapterError(
        "OpenCode session does not belong to the verified configured project and worktree.",
        { code: "OPENCODE_PROJECT_MISMATCH", endpoint: "POST /session" },
      );
    }
    const createdAt = new Date().toISOString();
    await onSession({
      attempt,
      sessionId: session.id,
      projectId: session.projectID,
      providerId: model.providerId,
      modelId: model.modelId,
      worktree: session.directory,
      agent,
      readOnly,
      createdAt,
      promptMessageId,
      messageId: null,
    });
    this.validateSession(session, model, agent);
    return session;
  }

  async readMessages(sessionId) {
    const query = new URLSearchParams({ directory: this.config.worktree, limit: "50" });
    return this.request(`/session/${encodeURIComponent(sessionId)}/message?${query}`);
  }

  async waitForPromptMessage(sessionId, promptMessageId, deadline) {
    let delay = this.config.timeouts.pollMs;
    const query = new URLSearchParams({ directory: this.config.worktree });
    while (Date.now() < deadline) {
      const [messages, statuses] = await Promise.all([
        this.readMessages(sessionId),
        this.request(`/session/status?${query}`),
      ]);
      if (!Array.isArray(messages)) {
        throw new OpenCodeAdapterError("OpenCode messages response is invalid.", { code: "OPENCODE_INVALID_RESPONSE" });
      }
      if (messages.some(({ info }) => info?.id === promptMessageId && info.role === "user")) return true;
      if (statuses?.[sessionId]?.type === "idle" || statuses?.[sessionId] === undefined) return false;
      const remaining = deadline - Date.now();
      if (remaining <= 0) break;
      await new Promise((resolve) => setTimeout(resolve, Math.min(delay, remaining)));
      delay = Math.min(delay * 2, this.config.timeouts.maxPollMs);
    }
    throw new OpenCodeAdapterError(
      `OPENCODE_TIMEOUT: prompt ${promptMessageId} could not be recovered for session ${sessionId}.`,
      { code: "OPENCODE_TIMEOUT", endpoint: "GET /session/{sessionID}/message", transient: true },
    );
  }

  async pollResult(sessionId, promptMessageId, deadline) {
    let delay = this.config.timeouts.pollMs;
    let retryAfterMs = null;
    while (Date.now() < deadline) {
      try {
        const [messages, statuses] = await Promise.all([
          this.readMessages(sessionId),
          this.request(`/session/status?${new URLSearchParams({ directory: this.config.worktree })}`),
        ]);
        if (!Array.isArray(messages)) {
          throw new OpenCodeAdapterError("OpenCode messages response is invalid.", { code: "OPENCODE_INVALID_RESPONSE" });
        }
        const promptExists = messages.some(({ info }) => info?.id === promptMessageId && info.role === "user");
        const assistantMessages = promptExists ? messages.filter(({ info }) =>
          info?.role === "assistant" &&
          info.sessionID === sessionId &&
          info.parentID === promptMessageId,
        ) : [];
        assistantMessages.sort((left, right) =>
          (left.info.time?.created ?? 0) - (right.info.time?.created ?? 0),
        );
        const assistant = assistantMessages.at(-1);
        const reportedStatus = statuses?.[sessionId]?.type;
        if (assistant && assistant.info.time?.completed && (reportedStatus === "idle" || reportedStatus === undefined)) {
          const exact = await this.request(
            `/session/${encodeURIComponent(sessionId)}/message/${encodeURIComponent(assistant.info.id)}?${new URLSearchParams({ directory: this.config.worktree })}`,
          );
          if (
            exact?.info?.id !== assistant.info.id ||
            exact.info.role !== "assistant" ||
            exact.info.sessionID !== sessionId ||
            exact.info.parentID !== promptMessageId
          ) {
            throw new OpenCodeAdapterError("OpenCode message retrieval returned a different message.", { code: "OPENCODE_INVALID_RESPONSE" });
          }
          if (exact.info.error) {
            const providerStatus = exact.info.error.data?.statusCode;
            if (providerStatus === 403) {
              throw new OpenCodeAdapterError(
                "The configured OpenCode model was rejected with HTTP 403; only explicitly configured active alternatives may be considered.",
                {
                  code: "OPENCODE_MODEL_REJECTED",
                  endpoint: "GET /session/{sessionID}/message/{messageID}",
                  httpStatus: providerStatus,
                },
              );
            }
            throw new OpenCodeAdapterError("OpenCode assistant message contains an execution error.", {
              code: "OPENCODE_AGENT_ERROR",
              httpStatus: Number.isInteger(providerStatus) ? providerStatus : null,
            });
          }
          const response = extractText(exact.parts ?? []);
          if (!response) throw new OpenCodeAdapterError("OpenCode assistant message has no text response.", { code: "OPENCODE_EMPTY_RESPONSE" });
          return { messageId: exact.info.id, response, message: exact.info, status: reportedStatus ?? "idle" };
        }
        retryAfterMs = null;
      } catch (error) {
        if (!isTransientOpenCodeError(error)) throw error;
        retryAfterMs = error instanceof OpenCodeAdapterError ? error.retryAfterMs : null;
      }
      const remaining = deadline - Date.now();
      if (remaining <= 0) break;
      await new Promise((resolve) => setTimeout(resolve, Math.min(retryAfterMs ?? delay, remaining)));
      delay = Math.min(delay * 2, this.config.timeouts.maxPollMs);
    }
    throw new OpenCodeAdapterError(
      `OPENCODE_TIMEOUT: no completed assistant message was retrieved for session ${sessionId}.`,
      { code: "OPENCODE_TIMEOUT", endpoint: "GET /session/{sessionID}/message", transient: true },
    );
  }

  async runTask(task, { readOnly = false, onSession, onAttempt }) {
    const agent = readOnly ? this.config.readOnlyAgent : this.config.agent;
    let delay = this.config.retry.backoffMs;
    const resultDeadline = Date.now() + this.config.timeouts.resultMs;
    let sessionMetadata = task.opencode ?? null;
    let promptMessageId = sessionMetadata?.promptMessageId ?? `msg_${randomUUID()}`;
    let forcedModelId = null;
    const rejectedModelIds = new Set();

    for (let attempt = 1; attempt <= this.config.retry.maxAttempts; attempt += 1) {
      const startedAt = new Date().toISOString();
      const started = Date.now();
      let session = null;
      let inspection = null;
      let model = null;
      try {
        inspection = await this.inspect();
        console.log("[OPENCODE] project verified");
        console.log("[OPENCODE] model verified");
        model = sessionMetadata
          ? inspection.models.find((choice) =>
            choice.providerId === sessionMetadata.providerId &&
            choice.modelId === sessionMetadata.modelId,
          )
          : forcedModelId
            ? inspection.models.find((choice) => choice.modelId === forcedModelId)
            : inspection.model;
        if (!model) {
          throw new OpenCodeAdapterError("The stored session model is no longer a configured active model.", {
            code: "OPENCODE_MODEL_UNAVAILABLE",
          });
        }
        if (sessionMetadata) {
          if (
            sessionMetadata.projectId !== inspection.project.id ||
            sessionMetadata.providerId !== model.providerId ||
            sessionMetadata.modelId !== model.modelId ||
            normalizePath(sessionMetadata.worktree) !== normalizePath(this.config.worktree) ||
            sessionMetadata.readOnly !== readOnly ||
            sessionMetadata.agent !== agent
          ) {
            throw new OpenCodeAdapterError("Stored OpenCode session metadata does not match this task configuration.", {
              code: "OPENCODE_PROJECT_MISMATCH",
            });
          }
          promptMessageId = sessionMetadata.promptMessageId;
          if (typeof promptMessageId !== "string" || !promptMessageId.startsWith("msg")) {
            throw new OpenCodeAdapterError("Stored OpenCode session has no recoverable prompt message ID.", {
              code: "OPENCODE_RECOVERY_REQUIRED",
            });
          }
          session = await this.getSession(sessionMetadata.sessionId);
          try {
            this.validateSession(session, model, agent);
          } catch {
            throw new OpenCodeAdapterError("Stored OpenCode session no longer matches the verified project.", {
              code: "OPENCODE_PROJECT_MISMATCH",
              endpoint: "GET /session/{sessionID}",
            });
          }
        } else {
          session = await this.findTaskSession(task, model.modelId);
          if (session) {
            promptMessageId = session.metadata?.orchestratorPromptMessageId;
            if (typeof promptMessageId !== "string" || !promptMessageId.startsWith("msg")) {
              throw new OpenCodeAdapterError("A matching OpenCode session exists without a recoverable prompt ID.", {
                code: "OPENCODE_RECOVERY_REQUIRED",
              });
            }
            this.validateSession(session, model, agent);
            sessionMetadata = {
              sessionId: session.id,
              projectId: session.projectID,
              providerId: model.providerId,
              modelId: model.modelId,
              worktree: session.directory,
              agent,
              readOnly,
              createdAt: new Date(session.time?.created ?? Date.now()).toISOString(),
              attempt,
              promptMessageId,
              messageId: null,
            };
            await onSession(sessionMetadata);
          } else {
            session = await this.createSession(
              task,
              model,
              agent,
              readOnly,
              attempt,
              promptMessageId,
              async (created) => {
                sessionMetadata = created;
                await onSession(created);
              },
            );
            sessionMetadata = {
              sessionId: session.id,
              projectId: session.projectID,
              providerId: model.providerId,
              modelId: model.modelId,
              worktree: session.directory,
              agent,
              readOnly,
              createdAt: new Date().toISOString(),
              attempt,
              promptMessageId,
              messageId: null,
            };
          }
        }
        const messages = await this.readMessages(session.id);
        if (!Array.isArray(messages)) {
          throw new OpenCodeAdapterError("OpenCode messages response is invalid.", { code: "OPENCODE_INVALID_RESPONSE" });
        }
        let promptExists = messages.some(({ info }) => info?.id === promptMessageId && info.role === "user");
        const sessionStatus = await this.request(`/session/status?${new URLSearchParams({ directory: this.config.worktree })}`);
        if (!promptExists && sessionStatus?.[session.id]?.type === "busy") {
          promptExists = await this.waitForPromptMessage(session.id, promptMessageId, resultDeadline);
        }
        if (!promptExists) {
          const query = new URLSearchParams({ directory: this.config.worktree });
          const promptEndpoint = `/session/${encodeURIComponent(session.id)}/prompt_async?${query}`;
          await this.request(promptEndpoint, {
            method: "POST",
            expected: [204],
            allowEmpty: true,
            timeoutMs: this.config.timeouts.dispatchMs,
            body: {
              messageID: promptMessageId,
              model: { providerID: model.providerId, modelID: model.modelId },
              agent,
              ...(readOnly ? { tools: {} } : {}),
              parts: [{ type: "text", text: this.makePrompt(task, readOnly) }],
            },
          });
        }
        console.log("[OPENCODE] prompt dispatched");
        const dispatchedAt = new Date().toISOString();
        const pending = {
          attempt,
          sessionId: session.id,
          promptMessageId,
          providerId: model.providerId,
          modelId: model.modelId,
          projectId: inspection.project.id,
          worktree: this.config.worktree,
          agent,
          readOnly,
          command: "POST /session/{sessionID}/prompt_async",
          startedAt,
          finishedAt: dispatchedAt,
          durationMs: Date.now() - started,
          status: "PROMPT_DISPATCHED",
          exitCode: 0,
        };
        await onAttempt(pending);
        console.log("[OPENCODE] waiting for result");
        const result = await this.pollResult(session.id, promptMessageId, resultDeadline);
        const finishedAt = new Date().toISOString();
        const output = {
          ...pending,
          messageId: result.messageId,
          response: result.response,
          sessionStatus: result.status,
          finishedAt,
          durationMs: Date.now() - started,
          status: "RESPONSE_RECEIVED",
          exitCode: 0,
          modelChangedFrom: model.modelId === this.config.modelId ? null : this.config.modelId,
        };
        sessionMetadata.messageId = result.messageId;
        await onAttempt(output);
        console.log("[OPENCODE] response received");
        return { ...output, inspection, message: result.message };
      } catch (error) {
        const adapterError = error instanceof OpenCodeAdapterError
          ? error
          : new OpenCodeAdapterError(
            `Unexpected OpenCode adapter failure: ${error?.message ?? String(error)}.`,
            { code: "OPENCODE_ERROR" },
          );
        const finishedAt = new Date().toISOString();
        const retryable = adapterError.transient &&
          attempt < this.config.retry.maxAttempts &&
          Date.now() < resultDeadline;
        const retryAfterMs = adapterError.retryAfterMs ?? Math.min(delay, this.config.retry.maxBackoffMs);
        const failure = {
          attempt,
          sessionId: session?.id ?? null,
          promptMessageId,
          providerId: model?.providerId ?? sessionMetadata?.providerId ?? this.config.providerId,
          modelId: model?.modelId ?? sessionMetadata?.modelId ?? this.config.modelId,
          projectId: inspection?.project.id ?? sessionMetadata?.projectId ?? this.config.projectId,
          worktree: this.config.worktree,
          agent,
          readOnly,
          command: adapterError.endpoint || "OpenCode API request",
          startedAt,
          finishedAt,
          durationMs: Date.now() - started,
          status: adapterError.code === "OPENCODE_TIMEOUT" ? "OPENCODE_TIMEOUT" : retryable ? "RETRYABLE_FAILURE" : "DISPATCH_FAILED",
          exitCode: adapterError.code === "OPENCODE_TIMEOUT" ? null : adapterError.httpStatus,
          httpStatus: adapterError.httpStatus,
          errorCode: adapterError.code,
          error: adapterError.message,
          retryAfterMs: retryable ? retryAfterMs : null,
          modelChangedFrom: model && model.modelId !== this.config.modelId ? this.config.modelId : null,
        };
        await onAttempt(failure);
        if (adapterError.code === "OPENCODE_MODEL_REJECTED" && adapterError.httpStatus === 403 && model) {
          rejectedModelIds.add(model.modelId);
          const fallback = inspection?.models.find((choice) => !rejectedModelIds.has(choice.modelId));
          if (fallback && attempt < this.config.retry.maxAttempts) {
            console.log(`[OPENCODE] configured model rejected with HTTP 403; switching to configured alternative ${fallback.modelId}`);
            forcedModelId = fallback.modelId;
            sessionMetadata = null;
            promptMessageId = `msg_${randomUUID()}`;
            continue;
          }
        }
        if (!retryable) throw adapterError;
        await new Promise((resolve) => setTimeout(resolve, Math.min(retryAfterMs, resultDeadline - Date.now())));
        delay = Math.min(delay * 2, this.config.retry.maxBackoffMs);
      }
    }
    throw new OpenCodeAdapterError("OpenCode retry limit exhausted.", { code: "OPENCODE_RETRY_EXHAUSTED" });
  }
}

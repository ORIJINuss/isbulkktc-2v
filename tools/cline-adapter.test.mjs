import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import {
  buildReviewPrompt,
  ClineAdapter,
  ClineAdapterError,
  createReviewIdentity,
  inspectRestrictedActions,
  normalizeReviewResult,
} from "./cline-adapter.mjs";

const task = {
  id: "tsk_fixture",
  correlationId: "cor_fixture",
  risk: "LOW",
  description: "Review only the assigned changed files.",
  acceptanceCriteria: "No files are modified.",
};
const validReview = JSON.stringify({
  verdict: "PASS",
  findings: [],
  summary: "No findings.",
  confidence: "HIGH",
});
const config = {
  enabled: true,
  extensionId: "saoudrizwan.claude-dev",
  version: "4.1.21",
  cliCommand: "code",
  timeouts: { dispatchMs: 1000, resultMs: 30, pollMs: 10 },
};

async function withSessionRoot(callback) {
  const directory = mkdtempSync(join(tmpdir(), "cline-adapter-test-"));
  const sessionRoot = join(directory, "sessions");
  mkdirSync(sessionRoot);
  try {
    await callback({ directory, sessionRoot });
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
}

function writeSession(sessionRoot, sessionId, prompt, response, status = "idle", cwd = process.cwd(), nested = false) {
  const sessionDirectory = nested ? join(sessionRoot, sessionId) : sessionRoot;
  mkdirSync(sessionDirectory, { recursive: true });
  const messagesPath = join(sessionDirectory, `${sessionId}.messages.json`);
  writeFileSync(messagesPath, JSON.stringify({
    messages: [
      { role: "user", content: [{ type: "text", text: prompt }] },
      { role: "assistant", content: [{ type: "text", text: response }] },
    ],
  }));
  writeFileSync(join(sessionDirectory, `${sessionId}.json`), JSON.stringify({
    session_id: sessionId,
    prompt,
    status,
    cwd,
    workspace_root: cwd,
    messages_path: messagesPath,
  }));
}

test("normalizes a structured review and derives severity counts", () => {
  const review = normalizeReviewResult(`\`\`\`json\n${JSON.stringify({
    verdict: "fail",
    findings: [
      { severity: "critical", category: "security", file: "tools/a.mjs", line: 9, issue: "Issue", evidence: "Proof", recommendation: "Fix" },
      { severity: "medium", category: "correctness", file: "tools/b.mjs", line: null, issue: "Issue", evidence: "Proof", recommendation: "Fix" },
    ],
    summary: "Two findings.",
    confidence: "medium",
  })}\n\`\`\``);
  assert.equal(review.verdict, "FAIL");
  assert.equal(review.criticalIssues, 1);
  assert.equal(review.majorIssues, 0);
  assert.equal(review.minorIssues, 1);
});

test("rejects malformed and incomplete review responses", () => {
  assert.throws(() => normalizeReviewResult("not a review"), (error) =>
    error instanceof ClineAdapterError && error.code === "REVIEW_PARSE_FAILED",
  );
  assert.throws(() => normalizeReviewResult(JSON.stringify({ verdict: "PASS", findings: [] })), (error) =>
    error instanceof ClineAdapterError && error.code === "REVIEW_PARSE_FAILED",
  );
});

test("detects attempted write, execute, and network tools while allowing read tools", () => {
  const result = inspectRestrictedActions([
    { role: "assistant", content: [{ type: "tool_use", name: "read_file" }] },
    { role: "assistant", content: [{ type: "tool_use", name: "execute_command" }] },
    { role: "assistant", content: [{ type: "text", text: "<write_to_file>" }] },
  ]);
  assert.deepEqual(result.execution, ["execute_command"]);
  assert.deepEqual(result.write, ["write_to_file"]);
  assert.deepEqual(result.unknownTools, []);
});

test("builds a read-only prompt with a stable task/correlation identity", () => {
  const prompt = buildReviewPrompt(task, {
    projectRoot: "D:\\isbulkktc",
    changedFiles: ["tools/orchestrator.mjs"],
    implementationSummary: "Added Cline adapter.",
    qualityGateEvidenceIds: ["ev_quality"],
    buildEvidenceId: "ev_build",
  });
  assert.match(prompt, /ROLE: ADVERSARIAL_REVIEWER/);
  assert.match(prompt, /WRITE: FORBIDDEN/);
  assert.match(prompt, /EXECUTE: FORBIDDEN/);
  assert.match(prompt, new RegExp(createReviewIdentity(task.id, task.correlationId)));
  assert.match(prompt, /tools\/orchestrator\.mjs/);
});

test("fails closed when Cline is unavailable", () => {
  withSessionRoot(({ sessionRoot }) => {
    const adapter = new ClineAdapter({ ...config, enabled: false }, {
      root: process.cwd(),
      sessionRoot,
      codeExecutable: "code",
    });
    assert.throws(() => adapter.verifyAvailable(), (error) =>
      error instanceof ClineAdapterError && error.code === "CLINE_UNAVAILABLE",
    );
  });
});

test("times out rather than accepting a missing Cline response", async () => {
  await withSessionRoot(async ({ sessionRoot }) => {
    let now = 100;
    const adapter = new ClineAdapter(config, {
      root: process.cwd(),
      sessionRoot,
      codeExecutable: "code",
      clock: () => now,
      sleep: async (duration) => { now += duration; },
      verifyExtension: () => {},
      launchUri: () => {},
    });
    await assert.rejects(adapter.runReview(task, {
      changedFiles: [],
      implementationSummary: "Fixture timeout.",
      qualityGateEvidenceIds: ["ev_quality"],
      buildEvidenceId: "ev_build",
    }), (error) => error instanceof ClineAdapterError && error.code === "CLINE_TIMEOUT");
  });
});

test("does not start a duplicate review when the same identity has multiple sessions", async () => {
  await withSessionRoot(async ({ sessionRoot }) => {
    const marker = `CLINE_REVIEW_ID=${createReviewIdentity(task.id, task.correlationId)}`;
    writeSession(sessionRoot, "ses_fixture_one", marker, validReview);
    writeSession(sessionRoot, "ses_fixture_two", marker, validReview);
    const adapter = new ClineAdapter(config, {
      root: process.cwd(),
      sessionRoot,
      codeExecutable: "code",
      verifyExtension: () => {},
      launchUri: () => assert.fail("A duplicate review must not be dispatched."),
    });
    await assert.rejects(adapter.runReview(task, {
      changedFiles: [],
      implementationSummary: "Fixture duplicate.",
      qualityGateEvidenceIds: ["ev_quality"],
      buildEvidenceId: "ev_build",
    }), (error) => error instanceof ClineAdapterError && error.code === "CLINE_DUPLICATE_REVIEW");
  });
});

test("ignores malformed unrelated session metadata while finding a fresh review", async () => {
  await withSessionRoot(async ({ sessionRoot }) => {
    const marker = `CLINE_REVIEW_ID=${createReviewIdentity(task.id, task.correlationId)}`;
    const malformedDirectory = join(sessionRoot, "ses_malformed");
    mkdirSync(malformedDirectory);
    writeFileSync(join(malformedDirectory, "ses_malformed.json"), "{");
    const sessionId = "ses_fresh_fixture";
    const adapter = new ClineAdapter(config, {
      root: process.cwd(),
      sessionRoot,
      codeExecutable: "code",
      verifyExtension: () => {},
      launchUri: (uri) => {
        const prompt = new URL(uri).searchParams.get("prompt");
        assert.ok(prompt);
        writeSession(sessionRoot, sessionId, prompt, validReview, "idle", process.cwd(), true);
      },
    });
    const result = await adapter.runReview(task, {
      changedFiles: [],
      implementationSummary: "Fresh review after a corrupted stale session.",
      qualityGateEvidenceIds: ["ev_quality"],
      buildEvidenceId: "ev_build",
    });
    assert.equal(result.sessionId, sessionId);
    assert.equal(result.result.verdict, "PASS");
  });
});

test("retrieves a completed session response and its actual session ID", async () => {
  await withSessionRoot(async ({ sessionRoot }) => {
    const sessionId = "ses_cline_fixture";
    const adapter = new ClineAdapter(config, {
      root: process.cwd(),
      sessionRoot,
      codeExecutable: "code",
      verifyExtension: () => {},
      launchUri: (uri) => {
        const prompt = new URL(uri).searchParams.get("prompt");
        assert.ok(prompt);
        writeSession(sessionRoot, sessionId, prompt, validReview, "idle", process.cwd(), true);
      },
    });
    const result = await adapter.runReview(task, {
      changedFiles: [],
      implementationSummary: "Fixture response.",
      qualityGateEvidenceIds: ["ev_quality"],
      buildEvidenceId: "ev_build",
    });
    assert.equal(result.sessionId, sessionId);
    assert.equal(result.status, "REVIEW_RECEIVED");
    assert.equal(result.result.verdict, "PASS");
    assert.deepEqual(result.violations, { execution: [], write: [], unknownTools: [] });
  });
});

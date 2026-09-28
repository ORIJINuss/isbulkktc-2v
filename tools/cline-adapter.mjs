import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import {
  existsSync,
  lstatSync,
  readFileSync,
  readdirSync,
  realpathSync,
} from "node:fs";
import { homedir } from "node:os";
import { isAbsolute, join, relative, resolve, sep } from "node:path";
import { pathToFileURL } from "node:url";

const TERMINAL_STATUSES = new Set(["completed", "complete", "done", "finished", "idle"]);
const READ_ONLY_TOOLS = new Set([
  "ask_followup_question",
  "attempt_completion",
  "list_code_definition_names",
  "list_files",
  "plan_mode_respond",
  "read_file",
  "search_files",
  "summarize_task",
]);
const DISALLOWED_TOOL_PATTERN =
  /^(?:write_to_file|replace_in_file|execute_command|browser_action|web_search|web_fetch|use_mcp_tool|use_mcp_resource|commit|push|git|new_task)$/i;
const DISALLOWED_ACTION_PATTERN =
  /<(?:write_to_file|replace_in_file|execute_command|browser_action|web_search|web_fetch|use_mcp_tool|use_mcp_resource|commit|push)\b/i;
const SEVERITIES = new Set(["CRITICAL", "HIGH", "MEDIUM", "LOW", "INFO"]);
const CONFIDENCE = new Set(["HIGH", "MEDIUM", "LOW"]);

export class ClineAdapterError extends Error {
  constructor(code, message, details = {}) {
    super(message);
    this.name = "ClineAdapterError";
    this.code = code;
    this.sessionId = details.sessionId ?? null;
    this.retryable = details.retryable === true;
  }
}

export function createReviewIdentity(taskId, correlationId, iteration = 1) {
  if (!Number.isInteger(iteration) || iteration < 1 || iteration > 3) {
    throw new ClineAdapterError("MAX_REVIEW_ITERATIONS_EXCEEDED", "Cline review iteration must be between 1 and 3.");
  }
  const digest = createHash("sha256").update(`${taskId}\n${correlationId}\n${iteration}`).digest("hex");
  return `rev_${digest.slice(0, 32)}`;
}

export function buildReviewPrompt(task, scope) {
  const reviewIteration = scope.reviewIteration ?? task.reviewIteration ?? 1;
  const reviewId = createReviewIdentity(task.id, task.correlationId, reviewIteration);
  const marker = `CLINE_REVIEW_ID=${reviewId}`;
  return [
    "ROLE: ADVERSARIAL_REVIEWER",
    "AGENT: CLINE",
    "READ ONLY: YES",
    "WRITE: FORBIDDEN",
    "EXECUTE: FORBIDDEN",
    "COMMIT: FORBIDDEN",
    "PUSH: FORBIDDEN",
    "NETWORK TOOLS: FORBIDDEN",
    marker,
    `TASK_ID=${task.id}`,
    `CORRELATION_ID=${task.correlationId}`,
    `REVIEW_ITERATION=${reviewIteration}`,
    `PROJECT_ROOT=${scope.projectRoot}`,
    `RISK_LEVEL=${task.risk}`,
    "",
    "Do not modify any file. Do not execute commands. Do not create files. Do not delete files. Do not commit. Do not push. Do not use browser, network, or MCP tools.",
    "Read only the changed files listed below and the minimum project context required to assess them.",
    "",
    "TASK:",
    task.description,
    "",
    "IMPLEMENTATION SUMMARY:",
    scope.implementationSummary,
    "",
    "ACCEPTANCE CRITERIA:",
    task.acceptanceCriteria || "(none provided)",
    "",
    "CHANGED FILES:",
    ...scope.changedFiles.map((file) => `- ${file}`),
    "",
    "QUALITY GATE: PASS",
    `QUALITY GATE EVIDENCE: ${scope.qualityGateEvidenceIds.join(", ")}`,
    `BUILD: PASS (${scope.buildEvidenceId})`,
    "",
    "Review correctness, requirement compliance, type safety, security, secret exposure, error handling, edge cases, architecture, regression risk, i18n, accessibility and performance where applicable, project conventions, ownership violations, unnecessary changes, and failures not caught by tests/build.",
    "Return only a JSON object with this shape:",
    JSON.stringify({
      verdict: "PASS | FAIL",
      findings: [{
        severity: "CRITICAL | HIGH | MEDIUM | LOW | INFO",
        category: "string",
        file: "repository-relative path",
        line: 1,
        issue: "string",
        evidence: "string",
        recommendation: "string",
      }],
      summary: "string",
      confidence: "HIGH | MEDIUM | LOW",
    }, null, 2),
    "Use an empty findings array when no issues are found. Do not claim that a test ran unless its evidence is provided above.",
  ].join("\n");
}

function extractJsonObject(text) {
  const fenced = [...text.matchAll(/```(?:json)?\s*([\s\S]*?)```/gi)].map((match) => match[1].trim());
  const candidates = [...fenced, text.trim()];
  for (const candidate of candidates) {
    try {
      const parsed = JSON.parse(candidate);
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) return parsed;
    } catch {
      const start = candidate.indexOf("{");
      const end = candidate.lastIndexOf("}");
      if (start >= 0 && end > start) {
        try {
          const parsed = JSON.parse(candidate.slice(start, end + 1));
          if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) return parsed;
        } catch {
          continue;
        }
      }
    }
  }
  throw new ClineAdapterError("REVIEW_PARSE_FAILED", "Cline response did not contain a valid review JSON object.");
}

export function normalizeReviewResult(text) {
  const parsed = extractJsonObject(text);
  const verdict = typeof parsed.verdict === "string" ? parsed.verdict.toUpperCase() : "";
  const confidence = typeof parsed.confidence === "string" ? parsed.confidence.toUpperCase() : "";
  if (!["PASS", "FAIL"].includes(verdict) || !CONFIDENCE.has(confidence) || !Array.isArray(parsed.findings)) {
    throw new ClineAdapterError("REVIEW_PARSE_FAILED", "Cline review JSON is missing a valid verdict, findings array, or confidence.");
  }
  const findings = parsed.findings.map((finding, index) => {
    if (!finding || typeof finding !== "object" || Array.isArray(finding)) {
      throw new ClineAdapterError("REVIEW_PARSE_FAILED", `Cline finding ${index + 1} is not an object.`);
    }
    const severity = typeof finding.severity === "string" ? finding.severity.toUpperCase() : "";
    if (
      !SEVERITIES.has(severity) ||
      typeof finding.category !== "string" ||
      typeof finding.file !== "string" ||
      (finding.line !== null && finding.line !== undefined && !Number.isInteger(finding.line)) ||
      typeof finding.issue !== "string" ||
      typeof finding.evidence !== "string" ||
      typeof finding.recommendation !== "string"
    ) {
      throw new ClineAdapterError("REVIEW_PARSE_FAILED", `Cline finding ${index + 1} has invalid fields.`);
    }
    return {
      severity,
      category: finding.category,
      file: finding.file,
      line: finding.line ?? null,
      issue: finding.issue,
      evidence: finding.evidence,
      recommendation: finding.recommendation,
    };
  });
  if (typeof parsed.summary !== "string") {
    throw new ClineAdapterError("REVIEW_PARSE_FAILED", "Cline review JSON is missing its summary.");
  }
  return {
    verdict,
    findings,
    summary: parsed.summary,
    confidence,
    criticalIssues: findings.filter((finding) => finding.severity === "CRITICAL").length,
    majorIssues: findings.filter((finding) => finding.severity === "HIGH").length,
    minorIssues: findings.filter((finding) => ["MEDIUM", "LOW", "INFO"].includes(finding.severity)).length,
  };
}

function normalizePath(path) {
  return resolve(path).replace(/[\\/]+$/, "").toLowerCase();
}

function isWithin(parent, candidate) {
  const relativePath = relative(parent, candidate);
  return relativePath === "" || (!relativePath.startsWith(`..${sep}`) && relativePath !== ".." && !isAbsolute(relativePath));
}

function validateSessionId(sessionId) {
  return typeof sessionId === "string" && /^[A-Za-z0-9_-]{1,100}$/.test(sessionId);
}

function resolveSessionRoot(sessionRoot) {
  try {
    const info = lstatSync(sessionRoot);
    if (info.isSymbolicLink() || !info.isDirectory()) {
      throw new ClineAdapterError("CLINE_SESSION_STORE_INVALID", "Cline session store must be a real directory.");
    }
    return realpathSync(sessionRoot);
  } catch (error) {
    if (error instanceof ClineAdapterError) throw error;
    throw new ClineAdapterError("CLINE_UNAVAILABLE", "Cline local session store is unavailable.");
  }
}

function readJson(path, label) {
  try {
    return JSON.parse(readFileSync(path, "utf8"));
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new ClineAdapterError("CLINE_SESSION_JSON_INVALID", `${label} contains invalid JSON.`);
    }
    throw new ClineAdapterError("CLINE_SESSION_STORE_INVALID", `${label} could not be read: ${error.message}`);
  }
}

function findAssistantText(messages) {
  if (!Array.isArray(messages)) return "";
  return messages
    .filter((message) => message && message.role === "assistant")
    .map((message) => {
      if (typeof message.content === "string") return message.content;
      if (!Array.isArray(message.content)) return "";
      return message.content
        .filter((part) => part && part.type === "text" && typeof part.text === "string")
        .map((part) => part.text)
        .join("\n");
    })
    .filter(Boolean)
    .join("\n");
}

function collectToolNames(value, names = []) {
  if (Array.isArray(value)) {
    for (const item of value) collectToolNames(item, names);
  } else if (value && typeof value === "object") {
    if (
      typeof value.name === "string" &&
      (value.type === "tool_use" || value.type === "tool_call" || value.type === "function_call")
    ) {
      names.push(value.name);
    }
    for (const nested of Object.values(value)) collectToolNames(nested, names);
  }
  return names;
}

export function inspectRestrictedActions(messages) {
  const violations = new Set();
  if (!Array.isArray(messages)) {
    return { execution: ["session transcript missing"], write: [], unknownTools: [] };
  }
  const assistantMessages = messages.filter((message) => message && message.role === "assistant");
  const toolNames = assistantMessages.flatMap((message) => collectToolNames(message.content));
  const unknownTools = [];
  for (const tool of toolNames) {
    if (DISALLOWED_TOOL_PATTERN.test(tool)) violations.add(tool);
    else if (!READ_ONLY_TOOLS.has(tool)) unknownTools.push(tool);
  }
  const assistantText = findAssistantText(assistantMessages);
  const taggedActions = assistantText.match(new RegExp(DISALLOWED_ACTION_PATTERN.source, "gi")) ?? [];
  for (const action of taggedActions) violations.add(action.slice(1).split(/\s|>/, 1)[0]);
  const write = [...violations].filter((tool) => /write|replace|commit|push/i.test(tool));
  const execution = [...violations].filter((tool) => !write.includes(tool));
  return { execution, write, unknownTools: [...new Set(unknownTools)] };
}

function readSessionRecord(sessionRoot, sessionId) {
  if (!validateSessionId(sessionId)) {
    throw new ClineAdapterError("CLINE_RECOVERY_FAILED", "Stored Cline session ID is invalid.");
  }
  const realSessionRoot = resolveSessionRoot(sessionRoot);
  const flatPath = join(realSessionRoot, `${sessionId}.json`);
  const nestedDirectory = join(realSessionRoot, sessionId);
  const nestedPath = join(nestedDirectory, `${sessionId}.json`);
  let path = flatPath;

  if (!existsSync(flatPath)) {
    if (!existsSync(nestedDirectory)) return null;
    const directoryInfo = lstatSync(nestedDirectory);
    if (directoryInfo.isSymbolicLink() || !directoryInfo.isDirectory()) {
      throw new ClineAdapterError("CLINE_SESSION_STORE_INVALID", `Cline session ${sessionId} has an unsafe storage directory.`);
    }
    path = nestedPath;
    if (!existsSync(path)) return null;
  }

  const recordInfo = lstatSync(path);
  const realRecordPath = realpathSync(path);
  if (
    recordInfo.isSymbolicLink() ||
    !recordInfo.isFile() ||
    !isWithin(realSessionRoot, realRecordPath)
  ) {
    throw new ClineAdapterError("CLINE_SESSION_STORE_INVALID", `Cline session ${sessionId} points outside its session store.`);
  }

  const record = readJson(realRecordPath, `Cline session ${sessionId}`);
  if (
    record.session_id !== sessionId ||
    typeof record.prompt !== "string" ||
    typeof record.status !== "string" ||
    typeof record.messages_path !== "string"
  ) {
    throw new ClineAdapterError("CLINE_SESSION_STORE_INVALID", `Cline session ${sessionId} is missing required metadata.`);
  }
  const messagesPath = isAbsolute(record.messages_path)
    ? resolve(record.messages_path)
    : resolve(realSessionRoot, record.messages_path);
  if (!isWithin(realSessionRoot, messagesPath) || !existsSync(messagesPath) || lstatSync(messagesPath).isSymbolicLink()) {
    throw new ClineAdapterError("CLINE_SESSION_STORE_INVALID", `Cline session ${sessionId} points outside its session store.`);
  }
  const realMessagesPath = realpathSync(messagesPath);
  if (!isWithin(realSessionRoot, realMessagesPath)) {
    throw new ClineAdapterError("CLINE_SESSION_STORE_INVALID", `Cline session ${sessionId} points outside its session store.`);
  }
  const messages = readJson(realMessagesPath, `Cline message history ${sessionId}`);
  if (!Array.isArray(messages.messages)) {
    throw new ClineAdapterError("CLINE_SESSION_STORE_INVALID", `Cline session ${sessionId} has no message list.`);
  }
  return { record, messages: messages.messages };
}

function findSessionForReview(sessionRoot, marker, workspaceRoot) {
  const matches = [];
  const realSessionRoot = resolveSessionRoot(sessionRoot);
  for (const entry of readdirSync(realSessionRoot, { withFileTypes: true })) {
    let sessionId;
    let path;
    if (entry.isFile() && entry.name.endsWith(".json") && !entry.name.endsWith(".messages.json")) {
      sessionId = entry.name.slice(0, -5);
      path = join(realSessionRoot, entry.name);
    } else if (entry.isDirectory() && validateSessionId(entry.name)) {
      sessionId = entry.name;
      const directory = join(realSessionRoot, entry.name);
      if (lstatSync(directory).isSymbolicLink()) continue;
      path = join(directory, `${sessionId}.json`);
      if (!existsSync(path)) continue;
    } else {
      continue;
    }
    if (!validateSessionId(sessionId) || lstatSync(path).isSymbolicLink()) continue;
    const realPath = realpathSync(path);
    if (!isWithin(realSessionRoot, realPath)) continue;
    let record;
    try {
      record = readJson(realPath, `Cline session ${sessionId}`);
    } catch (error) {
      if (error instanceof ClineAdapterError && error.code === "CLINE_SESSION_JSON_INVALID") continue;
      throw error;
    }
    if (record.session_id !== sessionId) continue;
    if (typeof record.prompt !== "string" || !record.prompt.includes(marker)) continue;
    if (normalizePath(record.workspace_root ?? record.cwd ?? "") !== normalizePath(workspaceRoot)) continue;
    matches.push(sessionId);
  }
  if (matches.length > 1) {
    throw new ClineAdapterError("CLINE_DUPLICATE_REVIEW", "Multiple Cline sessions contain the same review identity.");
  }
  return matches[0] ?? null;
}

function defaultSessionRoot() {
  return join(homedir(), ".cline", "data", "sessions");
}

function invokeCode(command, args, timeoutMs, uriEnvironment = {}) {
  const windows = process.platform === "win32";
  const commandLine = windows
    ? args[0] === "--list-extensions"
      ? `${command} --list-extensions --show-versions`
      : `${command} --reuse-window --folder-uri "%CLINE_WORKSPACE_URI%" --open-url "%CLINE_OPEN_URL%"`
    : null;
  const result = spawnSync(
    windows ? process.env.ComSpec ?? "cmd.exe" : command,
    windows ? ["/d", "/s", "/c", commandLine] : args,
    {
    encoding: "utf8",
    env: { ...process.env, ELECTRON_RUN_AS_NODE: process.env.ELECTRON_RUN_AS_NODE, ...uriEnvironment },
    maxBuffer: 4 * 1024 * 1024,
    timeout: timeoutMs,
    windowsHide: true,
    stdio: ["ignore", "pipe", "pipe"],
    },
  );
  if (result.error?.code === "ETIMEDOUT") {
    throw new ClineAdapterError("CLINE_TIMEOUT", "VS Code Cline URI handler did not respond before the dispatch timeout.", {
      retryable: true,
    });
  }
  if (result.error || result.status !== 0) {
    throw new ClineAdapterError("CLINE_UNAVAILABLE", "VS Code could not invoke the Cline task URI handler.");
  }
  return result;
}

export class ClineAdapter {
  constructor(config, {
    root = process.cwd(),
    sessionRoot = defaultSessionRoot(),
    clock = () => Date.now(),
    sleep = (ms) => new Promise((resolveSleep) => setTimeout(resolveSleep, ms)),
    verifyExtension = null,
    launchUri = null,
  } = {}) {
    this.config = config;
    this.root = realpathSync(root);
    this.sessionRoot = resolve(sessionRoot);
    this.clock = clock;
    this.sleep = sleep;
    this.codeCommand = config.cliCommand;
    this.verifyExtension = verifyExtension ?? (() => this.verifyInstalledExtension());
    this.launchUri = launchUri ?? ((uri, workspaceUri) => invokeCode(
      this.codeCommand,
      ["--open-url"],
      this.config.timeouts.dispatchMs,
      { CLINE_OPEN_URL: uri, CLINE_WORKSPACE_URI: workspaceUri },
    ));
  }

  verifyAvailable() {
    if (!this.config.enabled) {
      throw new ClineAdapterError("CLINE_UNAVAILABLE", "Cline adapter is disabled.");
    }
    if (!/^[A-Za-z0-9_.-]+$/.test(this.codeCommand ?? "") || !existsSync(this.sessionRoot) || lstatSync(this.sessionRoot).isSymbolicLink()) {
      throw new ClineAdapterError("CLINE_UNAVAILABLE", "VS Code Cline extension or its local session store is unavailable.");
    }
    this.verifyExtension();
  }

  verifyInstalledExtension() {
    const result = invokeCode(
      this.codeCommand,
      ["--list-extensions", "--show-versions"],
      this.config.timeouts.dispatchMs,
    );
    const installed = String(result.stdout ?? "").split(/\r?\n/).some((line) =>
      line.trim().toLowerCase() === `${this.config.extensionId}@${this.config.version}`.toLowerCase(),
    );
    if (!installed) {
      throw new ClineAdapterError("CLINE_UNAVAILABLE", `Required Cline extension ${this.config.extensionId}@${this.config.version} is not installed in this VS Code profile.`);
    }
  }

  async runReview(task, scope, {
    existingSessionId = null,
    recoverOnly = false,
    onSession = async () => {},
  } = {}) {
    const reviewIteration = scope.reviewIteration ?? task.reviewIteration ?? 1;
    const reviewId = createReviewIdentity(task.id, task.correlationId, reviewIteration);
    const marker = `CLINE_REVIEW_ID=${reviewId}`;
    const startedAt = new Date(this.clock()).toISOString();
    let sessionId = existingSessionId;
    if (!sessionId) sessionId = findSessionForReview(this.sessionRoot, marker, this.root);
    if (sessionId) {
      const recovered = readSessionRecord(this.sessionRoot, sessionId);
      if (!recovered || !recovered.record.prompt.includes(marker)) {
        throw new ClineAdapterError("CLINE_RECOVERY_FAILED", "Stored Cline session could not be recovered for this task.", {
          sessionId,
        });
      }
    } else if (recoverOnly) {
      throw new ClineAdapterError("CLINE_RECOVERY_FAILED", "No Cline session exists for the interrupted review; a duplicate task was not created.");
    } else {
      this.verifyAvailable();
      const prompt = buildReviewPrompt(task, { ...scope, projectRoot: this.root, reviewIteration });
      const uri = `vscode://${this.config.extensionId}/task?prompt=${encodeURIComponent(prompt)}`;
      const workspaceUri = pathToFileURL(`${this.root}${sep}`).href;
      this.launchUri(uri, workspaceUri);
    }

    const deadline = this.clock() + this.config.timeouts.resultMs;
    let observedSessionId = sessionId;
    let sessionNotified = false;
    while (this.clock() < deadline) {
      if (!observedSessionId) observedSessionId = findSessionForReview(this.sessionRoot, marker, this.root);
      if (observedSessionId) {
        const session = readSessionRecord(this.sessionRoot, observedSessionId);
        if (!session) {
          if (existingSessionId) {
            throw new ClineAdapterError("CLINE_RECOVERY_FAILED", "Stored Cline session disappeared during recovery.", {
              sessionId: observedSessionId,
            });
          }
        } else {
          const actualRoot = session.record.workspace_root ?? session.record.cwd;
          if (normalizePath(actualRoot) !== normalizePath(this.root)) {
            throw new ClineAdapterError("CLINE_WORKSPACE_MISMATCH", "Cline session workspace does not match the configured project root.", {
              sessionId: observedSessionId,
            });
          }
          if (!sessionNotified) {
            await onSession({
              sessionId: observedSessionId,
              reviewId,
              reviewIteration,
              correlationId: task.correlationId,
              startedAt,
              promptHash: createHash("sha256").update(buildReviewPrompt(task, { ...scope, projectRoot: this.root, reviewIteration })).digest("hex"),
              status: "SESSION_CREATED",
              readOnly: true,
            });
            sessionNotified = true;
          }
          const response = findAssistantText(session.messages);
          if (TERMINAL_STATUSES.has(session.record.status.toLowerCase()) && response) {
            const violations = inspectRestrictedActions(session.messages);
            return {
              reviewId,
              sessionId: observedSessionId,
              correlationId: task.correlationId,
              startedAt,
              finishedAt: new Date(this.clock()).toISOString(),
              durationMs: Math.max(0, this.clock() - Date.parse(startedAt)),
              response,
              result: normalizeReviewResult(response),
              violations,
              status: "REVIEW_RECEIVED",
            };
          }
          if (["failed", "error", "cancelled", "canceled"].includes(session.record.status.toLowerCase())) {
            throw new ClineAdapterError("CLINE_SESSION_FAILED", `Cline session ended with status ${session.record.status}.`, {
              sessionId: observedSessionId,
            });
          }
        }
      }
      await this.sleep(this.config.timeouts.pollMs);
    }
    throw new ClineAdapterError("CLINE_TIMEOUT", "Timed out waiting for the Cline review response.", {
      sessionId: observedSessionId,
      retryable: true,
    });
  }
}

export const clineAdapterInternals = {
  findSessionForReview,
  readSessionRecord,
};

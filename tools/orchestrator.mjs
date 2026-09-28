#!/usr/bin/env node

import {
  closeSync,
  existsSync,
  fsyncSync,
  lstatSync,
  linkSync,
  mkdirSync,
  openSync,
  readFileSync,
  readdirSync,
  realpathSync,
  renameSync,
  unlinkSync,
  writeFileSync,
} from "node:fs";
import { execFileSync, spawnSync } from "node:child_process";
import { createHash, randomUUID } from "node:crypto";
import { dirname, isAbsolute, join, relative, resolve, sep, win32 } from "node:path";
import { fileURLToPath } from "node:url";
import { buildReviewPrompt, ClineAdapter, ClineAdapterError, createReviewIdentity } from "./cline-adapter.mjs";
import { OpenCodeAdapter, OpenCodeAdapterError } from "./opencode-adapter.mjs";

const ROOT = realpathSync(resolve(dirname(fileURLToPath(import.meta.url)), ".."));
const ORCHESTRATOR_RELATIVE = ".agents/orchestrator";
const ORCHESTRATOR_ROOT = resolve(ROOT, ORCHESTRATOR_RELATIVE);
const CONFIG_PATH = resolve(ORCHESTRATOR_ROOT, "config.json");
const SCHEMA_ROOT = resolve(ORCHESTRATOR_ROOT, "schemas");
const STORAGE = Object.freeze({
  state: resolve(ORCHESTRATOR_ROOT, "state"),
  tasks: resolve(ORCHESTRATOR_ROOT, "tasks"),
  evidence: resolve(ORCHESTRATOR_ROOT, "evidence"),
  locks: resolve(ORCHESTRATOR_ROOT, "locks"),
});
const STATE_PATH = resolve(STORAGE.state, "state.json");
const JOURNAL_PATH = resolve(STORAGE.state, "transaction.json");
const MUTATION_LOCK_PATH = resolve(STORAGE.locks, ".mutation.lock");
const SCHEMA_PATHS = Object.freeze({
  task: resolve(SCHEMA_ROOT, "task.schema.json"),
  evidence: resolve(SCHEMA_ROOT, "evidence.schema.json"),
  state: resolve(SCHEMA_ROOT, "state.schema.json"),
});
const GOVERNANCE_PATHS = [
  "AGENTS.md",
  ".ajan-sahiplik.json",
  "docs/AJAN-KOORDINASYON.md",
];
const OWNERSHIP_TARGETS = [
  ".agents/orchestrator/config.json",
  ".agents/orchestrator/state",
  ".agents/orchestrator/tasks",
  ".agents/orchestrator/evidence",
  ".agents/orchestrator/locks",
  ".agents/orchestrator/schemas",
  "tools/orchestrator.mjs",
  "tools/opencode-adapter.mjs",
  "tools/orchestrator",
];
const INCOMPLETE_STATES = new Set([
  "DISPATCHING",
  "IMPLEMENTING",
  "QUALITY_GATE",
  "REVIEWING",
  "JUDGING",
]);
const SAFE_ID = /^[a-zA-Z0-9_-]{1,100}$/;
const EXIT = Object.freeze({
  OK: 0,
  TASK: 1,
  CONFIG: 2,
  LOCK: 3,
  RECOVERY: 4,
});

class OrchestratorError extends Error {
  constructor(message, exitCode = EXIT.TASK) {
    super(message);
    this.name = "OrchestratorError";
    this.exitCode = exitCode;
  }
}

function fail(message, exitCode = EXIT.TASK) {
  throw new OrchestratorError(message, exitCode);
}

function lstatOptional(path) {
  try {
    return lstatSync(path);
  } catch (error) {
    if (error.code === "ENOENT") return null;
    throw error;
  }
}

function isInside(parent, candidate) {
  const child = relative(parent, candidate);
  return child === "" || (!child.startsWith(`..${sep}`) && child !== ".." && !isAbsolute(child));
}

function assertNoSymlink(path) {
  const absolutePath = resolve(path);
  if (!isInside(ROOT, absolutePath)) fail(`Path escapes repository: ${path}`, EXIT.CONFIG);
  const relativePath = relative(ROOT, absolutePath);
  let current = ROOT;
  for (const segment of relativePath.split(sep).filter(Boolean)) {
    current = resolve(current, segment);
    const info = lstatOptional(current);
    if (info?.isSymbolicLink()) fail(`Symlink storage path is not allowed: ${relativePath}`, EXIT.CONFIG);
  }
}

function ensureDirectory(path) {
  assertNoSymlink(path);
  mkdirSync(path, { recursive: true });
  const real = realpathSync(path);
  if (!isInside(ORCHESTRATOR_ROOT, real)) fail(`Storage directory escapes orchestrator root: ${path}`, EXIT.CONFIG);
}

function ensureLayout() {
  ensureDirectory(ORCHESTRATOR_ROOT);
  for (const path of Object.values(STORAGE)) ensureDirectory(path);
  ensureDirectory(SCHEMA_ROOT);
}

function safeRepoRelativePath(input) {
  if (typeof input !== "string" || input.trim() === "") fail("File paths must be non-empty repository-relative paths.");
  const normalized = input.trim().replace(/\\/g, "/");
  if (
    normalized.startsWith("/") ||
    isAbsolute(normalized) ||
    win32.isAbsolute(input.trim()) ||
    /^[a-zA-Z]:/.test(normalized)
  ) {
    fail(`Absolute paths are not allowed: ${input}`);
  }
  const segments = normalized.split("/");
  if (segments.some((part) => part === ".." || part === "." || part === "")) {
    fail(`Path traversal or empty path segment is not allowed: ${input}`);
  }
  const lowerSegments = segments.map((part) => part.toLowerCase());
  if (
    lowerSegments.includes(".git") ||
    lowerSegments.some((part) => part === ".env" || part.startsWith(".env.")) ||
    lowerSegments.some((part) => /(?:^|[._-])(?:id_rsa|id_ed25519|private.?key)(?:$|[._-])/.test(part)) ||
    /\.(?:pem|key|p12|pfx|keystore)$/i.test(segments.at(-1))
  ) {
    fail(`Sensitive or protected path is not allowed: ${input}`);
  }
  const absolutePath = resolve(ROOT, ...segments);
  if (!isInside(ROOT, absolutePath)) fail(`Path escapes repository: ${input}`);
  let current = ROOT;
  for (const segment of segments) {
    current = resolve(current, segment);
    const info = lstatOptional(current);
    if (!info) break;
    if (info.isSymbolicLink()) fail(`Symlink repository path is not allowed: ${input}`);
    const real = realpathSync(current);
    if (!isInside(ROOT, real)) fail(`Repository path resolves outside the repository: ${input}`);
  }
  return segments.join("/");
}

function safeStorageFile(directory, filename) {
  if (!Object.values(STORAGE).includes(directory)) fail("Storage directory is not allowlisted.", EXIT.CONFIG);
  if (!/^[a-zA-Z0-9_-]{1,100}(?:\.json)?$/.test(filename)) {
    fail(`Invalid storage filename: ${filename}`, EXIT.CONFIG);
  }
  const filePath = resolve(directory, filename);
  if (!isInside(ORCHESTRATOR_ROOT, filePath)) fail("Storage file escapes orchestrator root.", EXIT.CONFIG);
  assertNoSymlink(dirname(filePath));
  const targetInfo = lstatOptional(filePath);
  if (targetInfo && (!targetInfo.isFile() || targetInfo.isSymbolicLink())) {
    fail(`Storage target is not a regular file: ${filename}`, EXIT.CONFIG);
  }
  const parent = realpathSync(directory);
  if (!isInside(ORCHESTRATOR_ROOT, parent)) fail("Storage directory resolves outside orchestrator root.", EXIT.CONFIG);
  return filePath;
}

function removeExactFile(path) {
  if (!existsSync(path)) return;
  assertNoSymlink(path);
  if (!lstatSync(path).isFile()) fail(`Refusing to remove non-file path: ${path}`, EXIT.CONFIG);
  unlinkSync(path);
}

function renameWithRetry(source, destination) {
  const delay = new Int32Array(new SharedArrayBuffer(Int32Array.BYTES_PER_ELEMENT));
  const waits = [10, 25, 50, 100, 200];
  for (let attempt = 0; ; attempt += 1) {
    try {
      renameSync(source, destination);
      return;
    } catch (error) {
      if (!["EPERM", "EACCES", "EBUSY"].includes(error.code) || attempt >= waits.length) throw error;
      Atomics.wait(delay, 0, 0, waits[attempt]);
    }
  }
}

function atomicWriteJson(path, value) {
  assertNoSymlink(dirname(path));
  const parent = realpathSync(dirname(path));
  if (!isInside(ORCHESTRATOR_ROOT, parent)) fail("Atomic write destination escapes orchestrator storage.", EXIT.CONFIG);
  const targetInfo = lstatOptional(path);
  if (targetInfo && (!targetInfo.isFile() || targetInfo.isSymbolicLink())) {
    fail("Atomic write target must be a regular file.", EXIT.CONFIG);
  }
  const temporaryPath = `${path}.${process.pid}.${randomUUID()}.tmp`;
  let descriptor;
  try {
    descriptor = openSync(temporaryPath, "wx", 0o600);
    writeFileSync(descriptor, `${JSON.stringify(value, null, 2)}\n`, "utf8");
    fsyncSync(descriptor);
    closeSync(descriptor);
    descriptor = undefined;
    renameWithRetry(temporaryPath, path);
    try {
      const directoryDescriptor = openSync(parent, "r");
      fsyncSync(directoryDescriptor);
      closeSync(directoryDescriptor);
    } catch {
      // Directory fsync is unavailable on some Windows filesystems.
    }
  } catch (error) {
    if (descriptor !== undefined) closeSync(descriptor);
    removeExactFile(temporaryPath);
    throw error;
  }
}

function atomicCreateJson(path, value) {
  assertNoSymlink(dirname(path));
  const parent = realpathSync(dirname(path));
  if (!isInside(ORCHESTRATOR_ROOT, parent)) fail("Atomic create destination escapes orchestrator storage.", EXIT.CONFIG);
  const temporaryPath = `${path}.${process.pid}.${randomUUID()}.tmp`;
  let descriptor;
  try {
    descriptor = openSync(temporaryPath, "wx", 0o600);
    writeFileSync(descriptor, `${JSON.stringify(value, null, 2)}\n`, "utf8");
    fsyncSync(descriptor);
    closeSync(descriptor);
    descriptor = undefined;
    linkSync(temporaryPath, path);
  } catch (error) {
    if (descriptor !== undefined) closeSync(descriptor);
    removeExactFile(temporaryPath);
    throw error;
  }
  removeExactFile(temporaryPath);
}

function parseJsonFile(path, label) {
  try {
    return JSON.parse(readFileSync(path, "utf8"));
  } catch (error) {
    fail(`${label} is missing or invalid JSON: ${error.message}`, EXIT.CONFIG);
  }
}

function processIsAlive(pid) {
  if (!Number.isInteger(pid) || pid < 1) return false;
  try {
    process.kill(pid, 0);
    return true;
  } catch (error) {
    if (error.code === "ESRCH") return false;
    return true;
  }
}

function validateAgainstSchema(value, schema, location = "$") {
  const typeMatches = (candidate, type) => {
    if (type === "null") return candidate === null;
    if (type === "array") return Array.isArray(candidate);
    if (type === "object") return candidate !== null && typeof candidate === "object" && !Array.isArray(candidate);
    if (type === "integer") return Number.isInteger(candidate);
    if (type === "number") return typeof candidate === "number" && Number.isFinite(candidate);
    return typeof candidate === type;
  };

  if (schema.type) {
    const types = Array.isArray(schema.type) ? schema.type : [schema.type];
    if (!types.some((type) => typeMatches(value, type))) fail(`${location} does not match schema type ${types.join("|")}.`);
  }
  if (schema.enum && !schema.enum.includes(value)) fail(`${location} is not an allowed enum value.`);
  if (typeof value === "string") {
    if (schema.minLength !== undefined && value.length < schema.minLength) fail(`${location} is too short.`);
    if (schema.maxLength !== undefined && value.length > schema.maxLength) fail(`${location} is too long.`);
    if (schema.pattern !== undefined && !new RegExp(schema.pattern).test(value)) {
      fail(`${location} does not match its required pattern.`);
    }
    if (schema.format === "date-time" && (!Number.isFinite(Date.parse(value)) || !value.includes("T"))) {
      fail(`${location} is not a valid date-time.`);
    }
  }
  if (Number.isInteger(value) && schema.minimum !== undefined && value < schema.minimum) {
    fail(`${location} is below its minimum.`);
  }
  if (Array.isArray(value) && schema.items) {
    value.forEach((item, index) => validateAgainstSchema(item, schema.items, `${location}[${index}]`));
  }
  if (value !== null && typeof value === "object" && !Array.isArray(value)) {
    for (const required of schema.required ?? []) {
      if (!Object.hasOwn(value, required)) fail(`${location}.${required} is required.`);
    }
    if (schema.additionalProperties === false) {
      for (const key of Object.keys(value)) {
        if (!Object.hasOwn(schema.properties ?? {}, key)) fail(`${location}.${key} is not allowed.`);
      }
    }
    for (const [key, childSchema] of Object.entries(schema.properties ?? {})) {
      if (Object.hasOwn(value, key)) validateAgainstSchema(value[key], childSchema, `${location}.${key}`);
    }
  }
  return value;
}

function loadConfig() {
  if (!existsSync(CONFIG_PATH)) fail("Orchestrator config.json is missing.", EXIT.CONFIG);
  assertNoSymlink(CONFIG_PATH);
  const config = parseJsonFile(CONFIG_PATH, "config.json");
  if (config.version !== 1 || typeof config.enabled !== "boolean" || !Number.isInteger(config.maxAttempts)) {
    fail("Orchestrator config has an unsupported version or invalid core settings.", EXIT.CONFIG);
  }
  if (
    config.maxAttempts < 1 ||
    config.maxAttempts > 3 ||
    !config.timeouts ||
    Object.values(config.timeouts).some((value) => !Number.isInteger(value) || value <= 0) ||
    config.security?.redactSecrets !== true ||
    config.security.allowForcePush !== false ||
    config.security.allowDestructiveGit !== false
  ) {
    fail("Orchestrator config violates retry, timeout, or security requirements.", EXIT.CONFIG);
  }
  const opencode = config.opencode;
  if (
    !opencode ||
    typeof opencode.enabled !== "boolean" ||
    typeof opencode.baseUrl !== "string" ||
    typeof opencode.projectId !== "string" ||
    typeof opencode.worktree !== "string" ||
    typeof opencode.providerId !== "string" ||
    typeof opencode.modelId !== "string" ||
    !Array.isArray(opencode.fallbackModelIds) ||
    typeof opencode.agent !== "string" ||
    typeof opencode.readOnlyAgent !== "string" ||
    !opencode.timeouts ||
    Object.values(opencode.timeouts).some((value) => !Number.isInteger(value) || value <= 0) ||
    !opencode.retry ||
    !Number.isInteger(opencode.retry.maxAttempts) ||
    opencode.retry.maxAttempts < 1 ||
    opencode.retry.maxAttempts > 3 ||
    !Number.isInteger(opencode.retry.backoffMs) ||
    !Number.isInteger(opencode.retry.maxBackoffMs) ||
    opencode.retry.backoffMs < 0 ||
    opencode.retry.maxBackoffMs < opencode.retry.backoffMs
  ) {
    fail("OpenCode adapter configuration is incomplete or invalid.", EXIT.CONFIG);
  }
  try {
    const url = new URL(opencode.baseUrl);
    if (!["http:", "https:"].includes(url.protocol) || url.username || url.password) {
      fail("OpenCode baseUrl must be an HTTP(S) URL without embedded credentials.", EXIT.CONFIG);
    }
  } catch (error) {
    if (error instanceof OrchestratorError) throw error;
    fail("OpenCode baseUrl is invalid.", EXIT.CONFIG);
  }
  for (const path of Object.values(SCHEMA_PATHS)) {
    if (!existsSync(path)) fail(`Required schema is missing: ${relative(ROOT, path)}`, EXIT.CONFIG);
    parseJsonFile(path, relative(ROOT, path));
  }
  const cline = config.cline;
  if (
    !cline ||
    typeof cline.enabled !== "boolean" ||
    !/^[a-z0-9-]+\.[a-z0-9-]+$/i.test(cline.extensionId ?? "") ||
    !/^\d+\.\d+\.\d+$/.test(cline.version ?? "") ||
    !/^[A-Za-z0-9_.-]+$/.test(cline.cliCommand ?? "") ||
    !cline.timeouts ||
    Object.values(cline.timeouts).some((value) => !Number.isInteger(value) || value <= 0) ||
    cline.maxReviewIterations !== 3 ||
    cline.permissions?.read !== true ||
    cline.permissions?.write !== false ||
    cline.permissions?.execute !== false ||
    cline.permissions?.commit !== false ||
    cline.permissions?.push !== false ||
    cline.permissions?.network !== false
  ) {
    fail("Cline adapter configuration must enforce the read-only reviewer contract.", EXIT.CONFIG);
  }
  if (!config.enabled) fail("Orchestrator is disabled by configuration.", EXIT.CONFIG);
  return config;
}

function loadSchema(kind) {
  assertNoSymlink(SCHEMA_PATHS[kind]);
  return parseJsonFile(SCHEMA_PATHS[kind], `${kind} schema`);
}

function validateRecord(kind, record) {
  let candidate = record;
  if (kind === "task" && record && typeof record === "object" && !Array.isArray(record)) {
    candidate = {
      ...record,
      acceptanceCriteria: record.acceptanceCriteria ?? "",
      opencode: record.opencode ?? null,
      cline: record.cline ?? null,
      reviewIteration: record.reviewIteration ?? 0,
    };
  }
  const validated = validateAgainstSchema(candidate, loadSchema(kind));
  if (kind === "task") {
    const config = loadConfig();
    if (!config.states.lifecycle.includes(record.state)) fail(`Task state is not configured: ${record.state}`);
  }
  if (kind === "evidence" && evidenceHash(record) !== record.hash) {
    fail(`Evidence integrity check failed for ${record.id}.`);
  }
  if (kind === "evidence" && record.status) {
    const responseStatuses = new Set([
      "SESSION_CREATED",
      "PROMPT_DISPATCHED",
      "RESPONSE_RECEIVED",
      "REVIEW_RECEIVED",
      "RETRYABLE_FAILURE",
      "DISPATCH_FAILED",
    ]);
    if (
      (["TIMEOUT", "OPENCODE_TIMEOUT", "CLINE_TIMEOUT"].includes(record.status) && record.exitCode !== null) ||
      (!["TIMEOUT", "OPENCODE_TIMEOUT", "CLINE_TIMEOUT", "ERROR", ...responseStatuses].includes(record.status) && !Number.isInteger(record.exitCode)) ||
      (responseStatuses.has(record.status) && ["SESSION_CREATED", "PROMPT_DISPATCHED", "RESPONSE_RECEIVED", "REVIEW_RECEIVED"].includes(record.status) && record.exitCode !== 0) ||
      (record.status.endsWith("_PASS") && record.exitCode !== 0) ||
      (record.status.endsWith("_FAIL") && record.exitCode === 0)
    ) {
      fail(`Evidence status and process exit code do not match for ${record.id}.`);
    }
  }
  return validated;
}

function redactSecrets(text) {
  if (typeof text !== "string") return "";
  return text
    .replace(/-----BEGIN [A-Z ]*PRIVATE KEY-----[\s\S]*?-----END [A-Z ]*PRIVATE KEY-----/g, "[REDACTED_PRIVATE_KEY]")
    .replace(/\bBearer\s+[A-Za-z0-9._~+/=-]+/gi, "Bearer [REDACTED]")
    .replace(/(authorization\s*:\s*)[^\r\n]+/gi, "$1[REDACTED]")
    .replace(/\beyJ[A-Za-z0-9_-]{5,}\.[A-Za-z0-9_-]{5,}\.[A-Za-z0-9_-]{5,}\b/g, "[REDACTED_JWT]")
    .replace(/\b(?:gh[pousr]_[A-Za-z0-9]{12,}|xox[baprs]-[A-Za-z0-9-]{12,}|AIza[A-Za-z0-9_-]{20,})\b/g, "[REDACTED_API_KEY]")
    .replace(/\bsk-[A-Za-z0-9_-]{8,}\b/g, "[REDACTED_API_KEY]")
    .replace(/((?:[A-Z0-9_]*(?:KEY|TOKEN|SECRET|PASSWORD|AUTH)[A-Z0-9_]*|api[_-]?key|token|secret|password|passwd|client[_-]?secret)\s*["']?\s*[:=]\s*)(?:"[^"]*"|'[^']*'|[^\s"',;]+)/gi, "$1[REDACTED]")
    .replace(/(--?(?:token|secret|password|passwd|api[-_]?key|authorization)\s+)(?:"[^"]*"|'[^']*'|\S+)/gi, "$1[REDACTED]")
    .replace(/\b(authorization\s+)(?:"[^"]*"|'[^']*'|\S+)/gi, "$1[REDACTED]")
    .replace(/(-----BEGIN [A-Z ]*PRIVATE KEY-----)/g, "[REDACTED_PRIVATE_KEY]");
}

function canonicalHash(value) {
  const stable = (item) => {
    if (Array.isArray(item)) return item.map(stable);
    if (item !== null && typeof item === "object") {
      return Object.fromEntries(Object.keys(item).sort().map((key) => [key, stable(item[key])]));
    }
    return item;
  };
  return createHash("sha256").update(JSON.stringify(stable(value))).digest("hex");
}

function evidenceHash(evidence) {
  return canonicalHash({ ...evidence, hash: null });
}

function redactAndValidateFiles(files) {
  if (!Array.isArray(files)) fail("filesChanged must be an array.");
  return files.map((file) => safeRepoRelativePath(file));
}

function buildEvidence({
  taskId,
  correlationId,
  type,
  command = "",
  workingDirectory,
  exitCode = 0,
  startedAt = new Date().toISOString(),
  finishedAt = new Date().toISOString(),
  stdout = "",
  stderr = "",
  filesChanged = [],
  gitStatus = "",
  source = "ORCHESTRATOR",
  status,
  durationMs,
  agent,
  sessionId,
  messageId,
  promptMessageId,
  providerId,
  modelId,
  projectId,
  worktree,
  attempt,
  retryAfterMs,
  response,
  errorCode,
  httpStatus,
  modelChangedFrom,
  reviewId,
  verdict,
  findings,
  summary,
  confidence,
  changedFiles,
  qualityGateEvidenceIds,
  buildEvidenceId,
  criticalIssues,
  majorIssues,
  minorIssues,
  permissionViolations,
}) {
  const evidence = {
    id: `ev_${randomUUID()}`,
    taskId,
    correlationId,
    type,
    command: redactSecrets(command),
    exitCode,
    startedAt,
    finishedAt,
    stdout: redactSecrets(stdout),
    stderr: redactSecrets(stderr),
    filesChanged: redactAndValidateFiles(filesChanged),
    gitStatus: redactSecrets(gitStatus),
    hash: null,
    source: redactSecrets(source),
  };
  if (status !== undefined) evidence.status = status;
  if (durationMs !== undefined) evidence.durationMs = durationMs;
  if (workingDirectory !== undefined) evidence.workingDirectory = redactSecrets(workingDirectory);
  if (agent !== undefined) evidence.agent = redactSecrets(agent);
  if (sessionId !== undefined && sessionId !== null) evidence.sessionId = redactSecrets(sessionId);
  if (messageId !== undefined && messageId !== null) evidence.messageId = redactSecrets(messageId);
  if (promptMessageId !== undefined && promptMessageId !== null) evidence.promptMessageId = redactSecrets(promptMessageId);
  if (providerId !== undefined) evidence.providerId = redactSecrets(providerId);
  if (modelId !== undefined) evidence.modelId = redactSecrets(modelId);
  if (projectId !== undefined) evidence.projectId = redactSecrets(projectId);
  if (worktree !== undefined) evidence.worktree = redactSecrets(worktree);
  if (attempt !== undefined) evidence.attempt = attempt;
  if (retryAfterMs !== undefined && retryAfterMs !== null) evidence.retryAfterMs = retryAfterMs;
  if (response !== undefined) evidence.response = redactSecrets(response);
  if (errorCode !== undefined) evidence.errorCode = redactSecrets(errorCode);
  if (httpStatus !== undefined && httpStatus !== null) evidence.httpStatus = httpStatus;
  if (modelChangedFrom !== undefined && modelChangedFrom !== null) evidence.modelChangedFrom = redactSecrets(modelChangedFrom);
  if (reviewId !== undefined) evidence.reviewId = redactSecrets(reviewId);
  if (verdict !== undefined) evidence.verdict = verdict;
  if (findings !== undefined) {
    evidence.findings = findings.map((finding) => ({
      severity: finding.severity,
      category: redactSecrets(finding.category),
      file: redactSecrets(finding.file),
      line: finding.line,
      issue: redactSecrets(finding.issue),
      evidence: redactSecrets(finding.evidence),
      recommendation: redactSecrets(finding.recommendation),
    }));
  }
  if (summary !== undefined) evidence.summary = redactSecrets(summary);
  if (confidence !== undefined) evidence.confidence = confidence;
  if (changedFiles !== undefined) evidence.changedFiles = redactAndValidateFiles(changedFiles);
  if (qualityGateEvidenceIds !== undefined) {
    evidence.qualityGateEvidenceIds = qualityGateEvidenceIds.map((id) => redactSecrets(id));
  }
  if (buildEvidenceId !== undefined) evidence.buildEvidenceId = redactSecrets(buildEvidenceId);
  if (criticalIssues !== undefined) evidence.criticalIssues = criticalIssues;
  if (majorIssues !== undefined) evidence.majorIssues = majorIssues;
  if (minorIssues !== undefined) evidence.minorIssues = minorIssues;
  if (permissionViolations !== undefined) {
    evidence.permissionViolations = Object.fromEntries(
      Object.entries(permissionViolations).map(([key, values]) => [key, values.map((value) => redactSecrets(value))]),
    );
  }
  evidence.hash = evidenceHash(evidence);
  return validateRecord("evidence", evidence);
}

function writeEvidence(evidence) {
  validateRecord("evidence", evidence);
  const path = safeStorageFile(STORAGE.evidence, `${evidence.id}.json`);
  atomicWriteJson(path, evidence);
  return path;
}

function parsePatternList(patterns) {
  return patterns.map((pattern) => new RegExp(pattern, "i"));
}

function assessRisk(title, description, files, config) {
  const subjects = [title, description, ...files];
  const matches = (patterns) => parsePatternList(patterns)
    .filter((pattern) => subjects.some((subject) => pattern.test(subject)));
  const reasons = [];
  const critical = matches(config.risk.criticalPatterns);
  const high = matches(config.risk.highPatterns);
  const medium = matches(config.risk.mediumPatterns);
  const low = matches(config.risk.lowPatterns);
  let risk = "MEDIUM";
  if (critical.length || files.length > 20) {
    risk = "CRITICAL";
    reasons.push(...critical.map((pattern) => `Critical signal: ${pattern.source}`));
    if (files.length > 20) reasons.push(`Mass-change signal: ${files.length} files.`);
  } else if (high.length) {
    risk = "HIGH";
    reasons.push(...high.map((pattern) => `High-impact signal: ${pattern.source}`));
  } else if (low.length && !medium.length) {
    risk = "LOW";
    reasons.push(...low.map((pattern) => `Low-risk signal: ${pattern.source}`));
  } else if (medium.length) {
    risk = "MEDIUM";
    reasons.push(...medium.map((pattern) => `Scoped-change signal: ${pattern.source}`));
  } else {
    reasons.push("No low-risk evidence matched; conservative MEDIUM default.");
  }
  return { risk, reasons, requiresHumanApproval: risk === "CRITICAL" };
}

function taskFilePath(id) {
  if (!SAFE_ID.test(id)) fail(`Invalid task ID: ${id}`);
  return safeStorageFile(STORAGE.tasks, `${id}.json`);
}

function normalizeIdempotencyKey(key) {
  if (key === null || key === undefined) return null;
  const normalized = String(key).trim();
  if (!normalized || normalized.length > 200) fail("idempotencyKey must contain 1–200 characters.");
  return `idem_${createHash("sha256").update(normalized).digest("hex")}`;
}

function createTaskRecord({
  title,
  description = "",
  acceptanceCriteria = "",
  files = [],
  dependencies = [],
  idempotencyKey = null,
  parentTaskId = null,
}, config) {
  const normalizedTitle = redactSecrets(String(title ?? "").trim());
  if (!normalizedTitle || normalizedTitle.length > 200) fail("Task title must contain 1–200 characters.");
  const normalizedFiles = files.map(safeRepoRelativePath);
  const normalizedDescription = redactSecrets(String(description));
  const riskAssessment = assessRisk(normalizedTitle, normalizedDescription, normalizedFiles, config);
  const normalizedParentId = parentTaskId === null ? null : String(parentTaskId);
  if (normalizedParentId !== null && !SAFE_ID.test(normalizedParentId)) fail("Invalid parentTaskId.");
  const now = new Date().toISOString();
  const task = {
    id: `tsk_${randomUUID()}`,
    title: normalizedTitle,
    description: normalizedDescription,
    acceptanceCriteria: redactSecrets(String(acceptanceCriteria)),
    createdAt: now,
    updatedAt: now,
    state: "CREATED",
    attempt: 1,
    maxAttempts: config.maxAttempts,
    retryableFailure: false,
    owner: "CHIEF",
    risk: riskAssessment.risk,
    riskReasons: riskAssessment.reasons,
    requiresHumanApproval: riskAssessment.requiresHumanApproval,
    files: normalizedFiles,
    dependencies: dependencies.map((dependency) => {
      const value = String(dependency);
      if (!SAFE_ID.test(value)) fail(`Invalid dependency task ID: ${value}`);
      return value;
    }),
    currentAgent: null,
    lastError: null,
    evidenceIds: [],
    reviewIds: [],
    parentTaskId: normalizedParentId,
    correlationId: `cor_${randomUUID()}`,
    idempotencyKey: normalizeIdempotencyKey(idempotencyKey),
    opencode: null,
    cline: null,
    reviewIteration: 0,
  };
  return validateRecord("task", task);
}

function transitionTaskCore(task, nextState, config, retryAuthorized) {
  if (!config.states.lifecycle.includes(nextState)) fail(`Unknown task state: ${nextState}`);
  if (nextState === "READY" && task.requiresHumanApproval) {
    fail("Critical-risk task requires human approval; approval is unavailable in Phase 1B.");
  }
  if (nextState === "PASSED") {
    const evidence = loadEvidence();
    const evidenceById = new Map(evidence.map((entry) => [entry.id, entry]));
    const review = [...task.evidenceIds]
      .reverse()
      .map((id) => evidenceById.get(id))
      .find((entry) =>
        entry &&
        entry.type === "AGENT_REVIEW" &&
        entry.reviewId === task.cline?.reviewId &&
        task.reviewIds.includes(entry.reviewId),
      );
    const violations = review?.permissionViolations;
    const noPermissionViolations = violations &&
      violations.execution.length === 0 &&
      violations.write.length === 0 &&
      violations.unknownTools.length === 0;
    const gateEvidence = review?.qualityGateEvidenceIds
      .map((id) => evidenceById.get(id))
      .filter(Boolean) ?? [];
    const buildEvidence = review
      ? evidenceById.get(review.buildEvidenceId)
      : null;
    if (
      task.state !== "JUDGING" ||
      !review ||
      review.status !== "REVIEW_RECEIVED" ||
      review.verdict !== "PASS" ||
      review.findings.length !== 0 ||
      !noPermissionViolations ||
      gateEvidence.length !== review.qualityGateEvidenceIds.length ||
      gateEvidence.some((entry) => entry.exitCode !== 0 || !entry.status?.endsWith("_PASS")) ||
      !buildEvidence ||
      buildEvidence.type !== "BUILD" ||
      buildEvidence.status !== "BUILD_PASS" ||
      buildEvidence.exitCode !== 0
    ) {
      fail("Task cannot pass without a clean Cline review and linked passing quality/build evidence.");
    }
  }
  if (
    task.state === "FIX_REQUIRED" &&
    nextState === "DISPATCHING" &&
    (
      !retryAuthorized ||
      task.retryableFailure !== true ||
      task.attempt > task.maxAttempts
    )
  ) {
    fail("Only retryable failures below maxAttempts may return to DISPATCHING.");
  }
  if (task.state === "FIX_REQUIRED" && nextState === "CIRCUIT_OPEN" && task.attempt < task.maxAttempts) {
    fail("Circuit breaker cannot open before maxAttempts is exhausted.");
  }
  const allowed = config.states.transitions[task.state] ?? [];
  if (!allowed.includes(nextState)) fail(`Invalid task transition: ${task.state} -> ${nextState}`);
  return { ...task, state: nextState, updatedAt: new Date().toISOString() };
}

function transitionTask(task, nextState, config) {
  return transitionTaskCore(task, nextState, config, false);
}

function applyFailure(task, failure, retryable, config) {
  const message = redactSecrets(String(failure)).slice(0, 2000);
  const exhausted = task.attempt >= task.maxAttempts;
  let transitioned = transitionTask(task, "FIX_REQUIRED", config);
  if (exhausted) transitioned = transitionTask(transitioned, "CIRCUIT_OPEN", config);
  return { ...transitioned, lastError: message, retryableFailure: retryable === true && !exhausted };
}

function retryTask(task, config) {
  if (task.state !== "FIX_REQUIRED" || task.attempt >= task.maxAttempts || task.retryableFailure !== true) {
    fail("Task is not retryable or has exhausted maxAttempts.");
  }
  const incremented = { ...task, attempt: task.attempt + 1 };
  return { ...transitionTaskCore(incremented, "DISPATCHING", config, true), retryableFailure: false };
}

function recoverTask(task, config) {
  if (!INCOMPLETE_STATES.has(task.state)) return null;
  const recovered = transitionTask(task, "RECOVERABLE", config);
  recovered.lastError = "Interrupted before a verified completion; manual review is required before redispatch.";
  recovered.retryableFailure = false;
  return recovered;
}

function newState() {
  return validateRecord("state", {
    version: 1,
    updatedAt: new Date().toISOString(),
    revision: 0,
    taskIds: [],
    circuitFailures: 0,
    circuitOpen: false,
    lastRecovery: null,
    recoveryIds: [],
  });
}

function persistOpenCodeRecord(taskId, type, record, updateTask = (task) => task, updateState = () => ({})) {
  const config = loadConfig();
  ensureLayout();
  return withMutationLock(() => {
    recoverPendingJournal();
    const state = readState(true);
    const task = loadTasks().find((entry) => entry.id === taskId);
    if (!task) fail(`Task not found: ${taskId}`);
    const evidence = buildEvidence({
      taskId: task.id,
      correlationId: task.correlationId,
      type,
      command: record.command ?? "OpenCode API",
      workingDirectory: config.opencode.worktree,
      exitCode: record.exitCode ?? null,
      startedAt: record.startedAt ?? new Date().toISOString(),
      finishedAt: record.finishedAt ?? new Date().toISOString(),
      stdout: record.stdout ?? "",
      stderr: [record.stderr, record.error].filter(Boolean).join("\n"),
      source: "opencode-adapter",
      status: record.status,
      durationMs: record.durationMs ?? 0,
      agent: record.agent ?? "OPENCODE",
      sessionId: record.sessionId,
      messageId: record.messageId,
      promptMessageId: record.promptMessageId,
      providerId: record.providerId,
      modelId: record.modelId,
      projectId: record.projectId,
      worktree: record.worktree ?? config.opencode.worktree,
      attempt: record.attempt,
      retryAfterMs: record.retryAfterMs,
      response: record.response,
      errorCode: record.errorCode,
      httpStatus: record.httpStatus,
      sessionStatus: record.sessionStatus,
      modelChangedFrom: record.modelChangedFrom,
    });
    const updated = validateRecord("task", {
      ...updateTask(task, config, evidence),
      updatedAt: new Date().toISOString(),
      evidenceIds: [...task.evidenceIds, evidence.id],
    });
    commitMutation({
      task: updated,
      evidence,
      state: nextState(state, {
        taskIds: [...new Set([...state.taskIds, task.id])],
        ...updateState(state, updated),
      }),
    });
    return { task: updated, evidence };
  });
}

function persistClineRecord(taskId, record, updateTask = (task) => task) {
  const config = loadConfig();
  ensureLayout();
  return withMutationLock(() => {
    recoverPendingJournal();
    const state = readState(true);
    const task = loadTasks().find((entry) => entry.id === taskId);
    if (!task) fail(`Task not found: ${taskId}`);
    const evidence = buildEvidence({
      taskId: task.id,
      correlationId: task.correlationId,
      type: "AGENT_REVIEW",
      command: record.command ?? "vscode Cline task URI",
      workingDirectory: ROOT,
      exitCode: record.exitCode !== undefined ? record.exitCode : 0,
      startedAt: record.startedAt,
      finishedAt: record.finishedAt ?? new Date().toISOString(),
      stdout: record.response ?? "",
      stderr: record.error ?? "",
      source: "cline-adapter",
      status: record.status,
      durationMs: record.durationMs ?? 0,
      agent: "CLINE",
      sessionId: record.sessionId,
      reviewId: record.reviewId,
      verdict: record.verdict,
      findings: record.findings,
      summary: record.summary,
      confidence: record.confidence,
      changedFiles: record.changedFiles,
      qualityGateEvidenceIds: record.qualityGateEvidenceIds,
      buildEvidenceId: record.buildEvidenceId,
      criticalIssues: record.criticalIssues,
      majorIssues: record.majorIssues,
      minorIssues: record.minorIssues,
      permissionViolations: record.permissionViolations,
      errorCode: record.errorCode,
    });
    const updated = validateRecord("task", {
      ...updateTask(task, config, evidence),
      updatedAt: new Date().toISOString(),
      evidenceIds: [...task.evidenceIds, evidence.id],
    });
    commitMutation({
      task: updated,
      evidence,
      state: nextState(state, {
        taskIds: [...new Set([...state.taskIds, task.id])],
      }),
    });
    return { task: updated, evidence };
  });
}

function checkOpenCodeOwnership(task) {
  const scriptPath = resolve(ROOT, "tools/cakisma-kontrol.mjs");
  if (!existsSync(scriptPath)) return { ok: false, status: null, output: "tools/cakisma-kontrol.mjs is missing." };
  const result = spawnSync(process.execPath, [scriptPath, "--agent", "opencode", ...task.files], {
    cwd: ROOT,
    encoding: "utf8",
    timeout: 30000,
    windowsHide: true,
  });
  return {
    ok: result.status === 0,
    status: result.status,
    output: redactSecrets(`${result.stdout ?? ""}${result.stderr ?? result.error?.message ?? ""}`).trim(),
  };
}

function markOpenCodeFailure(taskId, error, evidenceId) {
  const timestamp = new Date().toISOString();
  const detail = [
    error.code ?? "OPENCODE_ERROR",
    error.message,
    error.endpoint ? `endpoint=${error.endpoint}` : "",
    error.httpStatus ? `httpStatus=${error.httpStatus}` : "",
    evidenceId ? `evidenceId=${evidenceId}` : "",
    `timestamp=${timestamp}`,
  ].filter(Boolean).join("; ");
  return persistTaskUpdate(
    taskId,
    "OpenCode dispatch failure",
    (task, config) => applyFailure(
      task,
      detail,
      error.transient === true || error.code === "OPENCODE_TIMEOUT",
      config,
    ),
    (state, task) => ({
      circuitFailures: state.circuitFailures + 1,
      circuitOpen: state.circuitOpen || task.state === "CIRCUIT_OPEN",
    }),
  );
}

async function executeOpenCodeTask(taskId, readOnly) {
  const config = ensureInitialized();
  let task = loadTasks().find((entry) => entry.id === taskId);
  if (!task) fail(`Task not found: ${taskId}`);
  if (readOnly && task.files.length !== 0) {
    fail("Read-only OpenCode tasks must not declare writable files.");
  }
  if (!readOnly && task.files.length === 0) {
    fail("OpenCode implementation tasks must declare their assigned files.");
  }
  if (
    task.state === "FIX_REQUIRED" &&
    task.opencode?.sessionId &&
    (
      task.lastError?.includes("OPENCODE_TIMEOUT") ||
      task.lastError?.includes("OPENCODE_AGENT_ERROR")
    ) &&
    task.attempt < task.maxAttempts
  ) {
    task = persistTaskUpdate(taskId, "Authorize recovery of timed-out OpenCode session", (current) => ({
      ...current,
      retryableFailure: true,
    }));
    task = retryStoredTask(taskId);
  }
  if (task.state === "CREATED") {
    for (const state of ["PLANNED", "RISK_ASSESSED", "READY"]) {
      task = transitionStoredTask(taskId, state);
    }
  }
  if (!["READY", "DISPATCHING", "IMPLEMENTING"].includes(task.state)) {
    fail(`Task cannot be dispatched to OpenCode from state ${task.state}.`);
  }

  const ownership = checkOpenCodeOwnership(task);
  if (!ownership.ok) {
    const timestamp = new Date().toISOString();
    const failure = persistOpenCodeRecord(task.id, "OPENCODE_ATTEMPT", {
      command: "node tools/cakisma-kontrol.mjs --agent opencode",
      startedAt: timestamp,
      finishedAt: timestamp,
      exitCode: ownership.status ?? 1,
      status: "DISPATCH_FAILED",
      errorCode: "OPENCODE_OWNERSHIP_DENIED",
      error: ownership.output || "OpenCode ownership preflight failed.",
    });
    markOpenCodeFailure(
      task.id,
      new OrchestratorError(`OpenCode ownership denied dispatch: ${ownership.output || "preflight failed"}`, EXIT.LOCK),
      failure.evidence.id,
    );
    fail("OpenCode ownership preflight denied dispatch.", EXIT.LOCK);
  }

  let acquiredFileLocks = false;
  let acquiredTaskLock = false;
  let latestEvidenceId = null;
  try {
    if (task.files.length > 0) {
      acquireFileLocks({
        taskId: task.id,
        correlationId: task.correlationId,
        agent: "OPENCODE",
        files: task.files,
        ttlMs: config.opencode.timeouts.resultMs + config.opencode.timeouts.connectMs,
      });
      acquiredFileLocks = true;
    }
    acquireOpenCodeTaskLock({
      taskId: task.id,
      correlationId: task.correlationId,
      files: task.files,
      ttlMs: config.opencode.timeouts.resultMs + config.opencode.timeouts.connectMs,
    });
    acquiredTaskLock = true;
    console.log("[OPENCODE] ownership verified");
    console.log("[OPENCODE] lock acquired");

    if (task.state === "READY") {
      task = persistTaskUpdate(
        task.id,
        "OpenCode dispatch start",
        (current, loadedConfig) => ({
          ...transitionTask(current, "DISPATCHING", loadedConfig),
          owner: "OPENCODE",
          currentAgent: "OPENCODE",
        }),
      );
    }
    const adapter = new OpenCodeAdapter(config.opencode, { root: ROOT });
    console.log("[OPENCODE] verifying project and configured model");
    const result = await adapter.runTask(task, {
      readOnly,
      onSession: async (created) => {
        const saved = persistOpenCodeRecord(task.id, "OPENCODE_ATTEMPT", {
          ...created,
          command: "POST /session",
          exitCode: 0,
          status: "SESSION_CREATED",
        }, (current) => ({
          ...current,
          owner: "OPENCODE",
          currentAgent: "OPENCODE",
          opencode: created,
        }));
        latestEvidenceId = saved.evidence.id;
        console.log("[OPENCODE] session created; evidence persisted");
      },
      onAttempt: async (attempt) => {
        const responseReceived = attempt.status === "RESPONSE_RECEIVED";
        const type = responseReceived ? "AGENT_RESPONSE" : "OPENCODE_ATTEMPT";
        const saved = persistOpenCodeRecord(task.id, type, attempt, (current, loadedConfig) => {
          let updated = current;
          if (attempt.status === "PROMPT_DISPATCHED" && current.state === "DISPATCHING") {
            updated = transitionTask(current, "IMPLEMENTING", loadedConfig);
          } else if (responseReceived) {
            if (current.state === "DISPATCHING") {
              updated = transitionTask(current, "IMPLEMENTING", loadedConfig);
            }
            updated = {
              ...transitionTask(updated, "QUALITY_GATE", loadedConfig),
              opencode: current.opencode ? { ...current.opencode, messageId: attempt.messageId } : current.opencode,
            };
          }
          return updated;
        });
        latestEvidenceId = saved.evidence.id;
        if (attempt.status === "PROMPT_DISPATCHED") console.log("[OPENCODE] prompt dispatched");
        if (responseReceived) console.log("[OPENCODE] response received; evidence persisted");
      },
    });
    if (result.modelChangedFrom) {
      console.log(`[OPENCODE] configured model unavailable; explicitly selected ${result.modelId}`);
    }
    console.log("[OPENCODE] result retrieved");
    printJson({
      taskId: task.id,
      correlationId: task.correlationId,
      state: loadTasks().find((entry) => entry.id === task.id)?.state,
      sessionId: result.sessionId,
      messageId: result.messageId,
      modelId: result.modelId,
      projectId: result.projectId,
      worktree: result.worktree,
      evidenceId: latestEvidenceId,
      response: redactSecrets(result.response),
    });
  } catch (error) {
    const adapterError = error instanceof OpenCodeAdapterError
      ? error
      : error instanceof OrchestratorError
        ? error
        : new OrchestratorError(`OpenCode task failed: ${error?.message ?? String(error)}`, EXIT.TASK);
    const current = loadTasks().find((entry) => entry.id === task.id);
    if (current && ["DISPATCHING", "IMPLEMENTING"].includes(current.state)) {
      markOpenCodeFailure(task.id, adapterError, latestEvidenceId);
    }
    throw adapterError;
  } finally {
    if (acquiredTaskLock || acquiredFileLocks) {
      releaseFileLocks({ taskId: task.id, agent: "OPENCODE" });
    }
  }
}

function validateJournalRelations({ task, evidence, state }) {
  if (!evidence) fail("Transaction journal must include evidence.", EXIT.RECOVERY);
  if (task) {
    if (
      evidence.taskId !== task.id ||
      evidence.correlationId !== task.correlationId ||
      !task.evidenceIds.includes(evidence.id) ||
      !state.taskIds.includes(task.id)
    ) {
      fail("Transaction journal task, evidence, and state references do not match.", EXIT.RECOVERY);
    }
    return;
  }
  if (
    evidence.taskId !== "system" ||
    evidence.correlationId !== "system" ||
    evidence.type !== "RECOVERY" ||
    !state.recoveryIds.includes(evidence.id)
  ) {
    fail("Taskless transaction journal is not a valid system recovery record.", EXIT.RECOVERY);
  }
}

function readState(createIfMissing = false) {
  assertNoSymlink(JOURNAL_PATH);
  if (existsSync(JOURNAL_PATH)) {
    fail("A pending state transaction exists; run `recover` before reading or mutating state.", EXIT.RECOVERY);
  }
  if (!existsSync(STATE_PATH)) {
    if (!createIfMissing) return newState();
    const initial = newState();
    atomicWriteJson(STATE_PATH, initial);
    return initial;
  }
  assertNoSymlink(STATE_PATH);
  return validateRecord("state", parseJsonFile(STATE_PATH, "state.json"));
}

function nextState(state, changes) {
  return validateRecord("state", {
    ...state,
    ...changes,
    revision: state.revision + 1,
    updatedAt: new Date().toISOString(),
  });
}

function completeJournal(journal) {
  const expectedKeys = ["version", "task", "evidence", "state"];
  if (
    journal === null ||
    typeof journal !== "object" ||
    Array.isArray(journal) ||
    Object.keys(journal).length !== expectedKeys.length ||
    expectedKeys.some((key) => !Object.hasOwn(journal, key)) ||
    journal.version !== 1 ||
    !journal.state ||
    (journal.task !== null && typeof journal.task !== "object") ||
    typeof journal.evidence !== "object" ||
    journal.evidence === null
  ) {
    fail("Invalid orchestrator transaction journal.", EXIT.RECOVERY);
  }
  validateRecord("state", journal.state);
  if (journal.task !== null) validateRecord("task", journal.task);
  validateRecord("evidence", journal.evidence);
  validateJournalRelations(journal);
  writeEvidence(journal.evidence);
  if (journal.task) atomicWriteJson(taskFilePath(journal.task.id), journal.task);
  atomicWriteJson(STATE_PATH, journal.state);
  removeExactFile(JOURNAL_PATH);
}

function recoverPendingJournal() {
  assertNoSymlink(JOURNAL_PATH);
  if (!existsSync(JOURNAL_PATH)) return false;
  try {
    completeJournal(parseJsonFile(JOURNAL_PATH, "transaction journal"));
  } catch (error) {
    fail(`Pending transaction recovery failed: ${error.message}`, EXIT.RECOVERY);
  }
  return true;
}

function commitMutation({ task = null, evidence, state }) {
  assertNoSymlink(JOURNAL_PATH);
  if (existsSync(JOURNAL_PATH)) fail("Pending transaction must be recovered before another mutation.", EXIT.RECOVERY);
  if (task) validateRecord("task", task);
  validateRecord("evidence", evidence);
  validateRecord("state", state);
  const journal = { version: 1, task, evidence, state };
  atomicWriteJson(JOURNAL_PATH, journal);
  completeJournal(journal);
}

function loadTasks() {
  if (!existsSync(STORAGE.tasks)) return [];
  return readdirSync(STORAGE.tasks)
    .filter((name) => name.endsWith(".json"))
    .map((name) => {
      const path = safeStorageFile(STORAGE.tasks, name);
      return validateRecord("task", parseJsonFile(path, name));
    });
}

function loadEvidence() {
  if (!existsSync(STORAGE.evidence)) return [];
  return readdirSync(STORAGE.evidence)
    .filter((name) => name.endsWith(".json"))
    .map((name) => {
      const path = safeStorageFile(STORAGE.evidence, name);
      return validateRecord("evidence", parseJsonFile(path, name));
    });
}

function ensureInitialized() {
  ensureLayout();
  const config = loadConfig();
  assertNoSymlink(JOURNAL_PATH);
  if (existsSync(JOURNAL_PATH)) fail("A pending state transaction exists; run `recover` first.", EXIT.RECOVERY);
  return config;
}

function acquireMutationLock() {
  const config = loadConfig();
  const timeoutCeiling = Math.max(...Object.values(config.timeouts)) + 5 * 60 * 1000;
  const staleAfter = Math.max(config.locks.mutationTtlMs, timeoutCeiling);
  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      assertNoSymlink(MUTATION_LOCK_PATH);
      const lockId = `mutation_${randomUUID()}`;
      atomicCreateJson(MUTATION_LOCK_PATH, {
        lockId,
        pid: process.pid,
        acquiredAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + staleAfter).toISOString(),
      });
      return lockId;
    } catch (error) {
      if (error.code !== "EEXIST") fail(`Cannot acquire mutation lock: ${error.message}`, EXIT.LOCK);
      let existing;
      try {
        existing = parseJsonFile(MUTATION_LOCK_PATH, "mutation lock");
      } catch (readError) {
        fail(`Cannot inspect mutation lock: ${readError.message}`, EXIT.LOCK);
      }
      if (!Number.isInteger(existing.pid) || !Number.isFinite(Date.parse(existing.expiresAt))) {
        fail("Mutation lock is invalid; manual recovery is required.", EXIT.LOCK);
      }
      if (processIsAlive(existing.pid) || attempt > 0) {
        fail("Orchestrator mutation lock is held by another process.", EXIT.LOCK);
      }
      removeExactFile(MUTATION_LOCK_PATH);
    }
  }
  fail("Unable to acquire mutation lock.", EXIT.LOCK);
}

function cleanStaleTempFiles(onlyNames = null) {
  const pattern = /^[A-Za-z0-9_.-]+\.(\d+)\.[0-9a-f-]{36}\.tmp$/i;
  const removed = [];
  for (const directory of Object.values(STORAGE)) {
    if (!existsSync(directory)) continue;
    for (const name of readdirSync(directory)) {
      const match = name.match(pattern);
      if (!match || (onlyNames && !onlyNames.includes(name))) continue;
      if (processIsAlive(Number(match[1]))) continue;
      const path = resolve(directory, name);
      const info = lstatOptional(path);
      if (!info?.isFile() || info.isSymbolicLink()) continue;
      removeExactFile(path);
      removed.push(name);
    }
  }
  return removed;
}

function withMutationLock(action) {
  const lockId = acquireMutationLock();
  try {
    return action();
  } finally {
    if (existsSync(MUTATION_LOCK_PATH)) {
      const active = parseJsonFile(MUTATION_LOCK_PATH, "mutation lock");
      if (active.lockId !== lockId) fail("Mutation lock ownership changed unexpectedly.", EXIT.LOCK);
      removeExactFile(MUTATION_LOCK_PATH);
    }
  }
}

function idempotentTask(tasks, key) {
  if (!key) return null;
  return tasks.find((task) =>
    task.idempotencyKey === key && !["COMPLETED", "CIRCUIT_OPEN"].includes(task.state)) ?? null;
}

function createTask(options) {
  const config = loadConfig();
  ensureLayout();
  return withMutationLock(() => {
    recoverPendingJournal();
    const currentState = readState(true);
    const tasks = loadTasks();
    const existing = idempotentTask(tasks, normalizeIdempotencyKey(options.idempotencyKey));
    if (existing) return { task: existing, duplicate: true };

    const task = createTaskRecord(options, config);
    const evidence = buildEvidence({
      taskId: task.id,
      correlationId: task.correlationId,
      type: "COMMAND",
      command: "node tools/orchestrator.mjs task-create",
      stdout: `Created task ${task.id}`,
      gitStatus: readGitStatus(),
      source: "ORCHESTRATOR",
    });
    const taskWithEvidence = validateRecord("task", { ...task, evidenceIds: [evidence.id] });
    commitMutation({
      task: taskWithEvidence,
      evidence,
      state: nextState(currentState, {
        taskIds: [...new Set([...currentState.taskIds, task.id])],
      }),
    });
    return { task: taskWithEvidence, duplicate: false };
  });
}

function persistTaskUpdate(id, command, updateTask, updateState = () => ({})) {
  const config = loadConfig();
  ensureLayout();
  return withMutationLock(() => {
    recoverPendingJournal();
    const state = readState(true);
    const task = loadTasks().find((entry) => entry.id === id);
    if (!task) fail(`Task not found: ${id}`);
    const updated = updateTask(task, config);
    const evidence = buildEvidence({
      taskId: task.id,
      correlationId: task.correlationId,
      type: "COMMAND",
      command,
      stdout: `Updated ${task.id}: ${task.state} -> ${updated.state}`,
      gitStatus: readGitStatus(),
    });
    const taskWithEvidence = validateRecord("task", {
      ...updated,
      evidenceIds: [...updated.evidenceIds, evidence.id],
    });
    commitMutation({
      task: taskWithEvidence,
      evidence,
      state: nextState(state, {
        taskIds: [...new Set([...state.taskIds, task.id])],
        ...updateState(state, taskWithEvidence),
      }),
    });
    return taskWithEvidence;
  });
}

function getPackageScripts() {
  const packageJson = parseJsonFile(resolve(ROOT, "package.json"), "package.json");
  if (!packageJson.scripts || typeof packageJson.scripts !== "object") {
    fail("package.json has no scripts object.", EXIT.CONFIG);
  }
  return packageJson.scripts;
}

function getScriptCoverage(name, scripts, visited = new Set()) {
  if (visited.has(name)) return visited;
  const command = scripts[name];
  if (typeof command !== "string" || !command.trim()) fail(`Required npm script is missing: ${name}`, EXIT.CONFIG);
  visited.add(name);
  for (const match of command.matchAll(/\bnpm\s+run\s+([A-Za-z0-9:_-]+)/g)) {
    getScriptCoverage(match[1], scripts, visited);
  }
  return visited;
}

function qualityGatePlan(scripts) {
  const kaliteCoverage = getScriptCoverage("kalite", scripts);
  if (!kaliteCoverage.has("type-check") || !kaliteCoverage.has("lint")) {
    fail("The kalite script must execute type-check and lint.", EXIT.CONFIG);
  }
  getScriptCoverage("build", scripts);
  if (kaliteCoverage.has("build")) {
    return {
      kaliteIncludesBuild: true,
      stages: [
        { name: "TYPECHECK", script: "type-check", type: "TYPECHECK" },
        { name: "LINT", script: "lint", type: "LINT" },
        { name: "BUILD", script: "build", type: "BUILD" },
      ],
    };
  }
  return {
    kaliteIncludesBuild: false,
    stages: [
      { name: "KALITE", script: "kalite", type: "KALITE" },
      {
        name: "BUILD",
        script: "build",
        type: "BUILD",
      },
    ],
  };
}

function getPassingQualityGateEvidence(task) {
  const evidenceById = new Map(loadEvidence().map((entry) => [entry.id, entry]));
  const taskEvidence = task.evidenceIds
    .map((id) => evidenceById.get(id))
    .filter((entry) => entry?.taskId === task.id && entry.correlationId === task.correlationId);
  const expectedTypes = qualityGatePlan(getPackageScripts()).stages.map((stage) => stage.type);
  let buildIndex = -1;
  for (let index = taskEvidence.length - 1; index >= 0; index -= 1) {
    if (taskEvidence[index].type === "BUILD") {
      buildIndex = index;
      break;
    }
  }
  if (buildIndex < 0) fail("Cline review requires a recorded production build.");
  let previousBuildIndex = -1;
  for (let index = buildIndex - 1; index >= 0; index -= 1) {
    if (taskEvidence[index].type === "BUILD") {
      previousBuildIndex = index;
      break;
    }
  }
  const gateEvidence = taskEvidence
    .slice(previousBuildIndex + 1, buildIndex + 1)
    .filter((entry) => expectedTypes.includes(entry.type));
  if (
    gateEvidence.length !== expectedTypes.length ||
    gateEvidence.some((entry, index) =>
      entry.type !== expectedTypes[index] ||
      entry.exitCode !== 0 ||
      entry.status !== `${entry.type}_PASS`,
    )
  ) {
    fail("Cline review requires the latest complete quality gate and production build to pass.");
  }
  const buildEvidence = gateEvidence.at(-1);
  return {
    qualityGateEvidenceIds: gateEvidence.slice(0, -1).map((entry) => entry.id),
    buildEvidenceId: buildEvidence.id,
    allEvidenceIds: gateEvidence.map((entry) => entry.id),
  };
}

function getChangedTaskFiles(task) {
  const status = execFileSync(
    "git",
    ["-c", "core.quotepath=false", "status", "--short", "--untracked-files=all", "-z"],
    { cwd: ROOT, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] },
  );
  const allowed = new Set(task.files.map((file) => file.replace(/\\/g, "/")));
  const changed = new Set();
  const entries = status.split("\0").filter(Boolean);
  for (let index = 0; index < entries.length; index += 1) {
    const entry = entries[index];
    if (entry.length < 4) continue;
    const statusCode = entry.slice(0, 2);
    const path = entry.slice(3).replace(/\\/g, "/");
    if (allowed.has(path)) changed.add(path);
    if (/[RC]/.test(statusCode)) index += 1;
  }
  const files = [...changed].sort();
  if (files.length > 0) return files;

  // Reviews may legitimately run after the Chief has committed the
  // implementation. In that case the worktree no longer exposes the task
  // files through `git status`, but the task contract remains the source of
  // truth for the review scope.
  const committedScope = [...allowed].sort();
  if (committedScope.length > 0) return committedScope;
  fail("Cline review has no files within the task's authorized scope.");
}

function workingTreeFingerprint(directory) {
  const status = execFileSync(
    "git",
    ["-C", directory, "status", "--porcelain", "--untracked-files=all", "-z"],
    { cwd: ROOT, stdio: ["ignore", "pipe", "pipe"] },
  );
  const diff = execFileSync(
    "git",
    ["-C", directory, "diff", "--binary", "HEAD"],
    { cwd: ROOT, stdio: ["ignore", "pipe", "pipe"], maxBuffer: 32 * 1024 * 1024 },
  );
  const untrackedFiles = execFileSync(
    "git",
    ["-C", directory, "ls-files", "--others", "--exclude-standard", "-z"],
    { cwd: ROOT, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] },
  ).split("\0").filter(Boolean).sort();
  const untracked = untrackedFiles.map((file) => {
    const path = resolve(directory, file);
    if (!isInside(directory, path)) fail("Untracked build input resolves outside its worktree.", EXIT.CONFIG);
    const info = lstatSync(path);
    if (!info.isFile() || info.isSymbolicLink()) {
      fail(`Untracked build input must be a regular file: ${file}`, EXIT.CONFIG);
    }
    return {
      path: file,
      hash: createHash("sha256").update(readFileSync(path)).digest("hex"),
    };
  });
  return canonicalHash({
    status: status.toString("base64"),
    diff: createHash("sha256").update(diff).digest("hex"),
    untracked,
  });
}

async function executeClineReview(taskId, implementationSummary = "") {
  const config = ensureInitialized();
  if (!config.cline.enabled) fail("Cline review is disabled by configuration.", EXIT.CONFIG);
  let task = loadTasks().find((entry) => entry.id === taskId);
  if (!task) fail(`Task not found: ${taskId}`);
  if (task.state !== "REVIEWING") fail(`Task must be in REVIEWING state; found ${task.state}.`);
  if (task.cline?.status === "REVIEW_RECEIVED") {
    fail("The latest Cline review must be judged before another review can start.");
  }

  const quality = getPassingQualityGateEvidence(task);
  const changedFiles = getChangedTaskFiles(task);
  const canResume = ["DISPATCHING", "SESSION_CREATED", "CLINE_TIMEOUT", "CLINE_UNAVAILABLE"]
    .includes(task.cline?.status);
  const reviewIteration = canResume ? task.reviewIteration : task.reviewIteration + 1;
  if (reviewIteration < 1 || reviewIteration > config.cline.maxReviewIterations) {
    fail("Cline review iteration limit reached; create a new task for another independent review.");
  }
  const scope = {
    changedFiles,
    implementationSummary: implementationSummary.trim() || task.description,
    qualityGateEvidenceIds: quality.qualityGateEvidenceIds,
    buildEvidenceId: quality.buildEvidenceId,
    reviewIteration,
  };
  const reviewId = createReviewIdentity(task.id, task.correlationId, reviewIteration);
  const promptHash = createHash("sha256")
    .update(buildReviewPrompt(task, { ...scope, projectRoot: ROOT }))
    .digest("hex");
  if (!canResume) {
    task = persistTaskUpdate(
      taskId,
      `node tools/orchestrator.mjs cline-review --id ${taskId}`,
      (current) => ({
        ...current,
        reviewIteration,
        cline: {
          sessionId: null,
          reviewId,
          correlationId: current.correlationId,
          reviewIteration,
          startedAt: new Date().toISOString(),
          status: "DISPATCHING",
          readOnly: true,
          promptHash,
        },
      }),
    );
  }

  const adapter = new ClineAdapter(config.cline, { root: ROOT });
  try {
    const result = await adapter.runReview(task, scope, {
      existingSessionId: canResume ? task.cline.sessionId : null,
      onSession: async (session) => {
        persistClineRecord(taskId, {
          ...session,
          status: "SESSION_CREATED",
        }, (current) => ({
          ...current,
          cline: {
            ...current.cline,
            sessionId: session.sessionId,
            status: "SESSION_CREATED",
          },
        }));
      },
    });
    const permissionViolations = result.violations;
    const hasWriteViolation = permissionViolations.write.length > 0;
    const hasExecutionViolation =
      permissionViolations.execution.length > 0 || permissionViolations.unknownTools.length > 0;
    const status = hasWriteViolation
      ? "REVIEWER_WRITE_VIOLATION"
      : hasExecutionViolation
        ? "REVIEWER_EXECUTION_VIOLATION"
        : "REVIEW_RECEIVED";
    const persisted = persistClineRecord(taskId, {
      ...result,
      status,
      exitCode: status === "REVIEW_RECEIVED" ? 0 : 1,
      changedFiles,
      qualityGateEvidenceIds: quality.qualityGateEvidenceIds,
      buildEvidenceId: quality.buildEvidenceId,
      verdict: result.result.verdict,
      findings: result.result.findings,
      summary: result.result.summary,
      confidence: result.result.confidence,
      criticalIssues: result.result.criticalIssues,
      majorIssues: result.result.majorIssues,
      minorIssues: result.result.minorIssues,
      permissionViolations,
    }, (current) => ({
      ...current,
      reviewIds: [...new Set([...current.reviewIds, result.reviewId])],
      cline: {
        ...current.cline,
        sessionId: result.sessionId,
        reviewId: result.reviewId,
        correlationId: result.correlationId,
        reviewIteration,
        startedAt: result.startedAt,
        status,
        readOnly: true,
        promptHash,
      },
    }));
    printJson({
      task: persisted.task,
      review: persisted.evidence,
    });
    return status === "REVIEW_RECEIVED" ? EXIT.OK : EXIT.TASK;
  } catch (error) {
    if (!(error instanceof ClineAdapterError)) throw error;
    const status = [
      "CLINE_TIMEOUT",
      "CLINE_UNAVAILABLE",
      "CLINE_RECOVERY_FAILED",
      "CLINE_SESSION_FAILED",
      "REVIEW_PARSE_FAILED",
    ].includes(error.code) ? error.code : "CLINE_RECOVERY_FAILED";
    const persisted = persistClineRecord(taskId, {
      status,
      exitCode: status === "CLINE_TIMEOUT" ? null : 1,
      startedAt: task.cline?.startedAt ?? new Date().toISOString(),
      sessionId: error.sessionId,
      reviewId,
      errorCode: error.code,
      error: error.message,
    }, (current) => ({
      ...current,
      cline: {
        ...current.cline,
        sessionId: error.sessionId ?? current.cline?.sessionId ?? null,
        reviewId,
        correlationId: current.correlationId,
        reviewIteration,
        status,
        readOnly: true,
        promptHash,
      },
    }));
    console.error(`[FAIL] Cline review ${status}: ${error.message}`);
    printJson({ task: persisted.task, evidence: persisted.evidence });
    return status === "CLINE_UNAVAILABLE" ? EXIT.CONFIG : EXIT.TASK;
  }
}

function judgeStoredTask(taskId) {
  let task = loadTasks().find((entry) => entry.id === taskId);
  if (!task) fail(`Task not found: ${taskId}`);
  if (!["REVIEWING", "JUDGING"].includes(task.state)) {
    fail(`Task must be in REVIEWING or JUDGING state; found ${task.state}.`);
  }
  const evidenceById = new Map(loadEvidence().map((entry) => [entry.id, entry]));
  const review = [...task.evidenceIds]
    .reverse()
    .map((id) => evidenceById.get(id))
    .find((entry) =>
      entry?.taskId === task.id &&
      entry.type === "AGENT_REVIEW" &&
      entry.reviewId === task.cline?.reviewId &&
      task.reviewIds.includes(entry.reviewId),
    );
  if (!review) fail("Judgment requires a persisted Cline review linked to this task.");
  const quality = getPassingQualityGateEvidence(task);
  const sameQualityEvidence =
    quality.buildEvidenceId === review.buildEvidenceId &&
    quality.qualityGateEvidenceIds.length === review.qualityGateEvidenceIds.length &&
    quality.qualityGateEvidenceIds.every((id, index) => id === review.qualityGateEvidenceIds[index]);
  const violations = review.permissionViolations;
  const noPermissionViolations = violations &&
    violations.execution.length === 0 &&
    violations.write.length === 0 &&
    violations.unknownTools.length === 0;
  const accepted =
    review.status === "REVIEW_RECEIVED" &&
    review.verdict === "PASS" &&
    review.findings.length === 0 &&
    noPermissionViolations &&
    sameQualityEvidence;

  if (task.state === "REVIEWING") {
    task = transitionStoredTask(taskId, "JUDGING");
  }
  if (accepted) {
    task = transitionStoredTask(taskId, "PASSED");
    task = transitionStoredTask(taskId, "COMPLETED");
    console.log(`[PASS] evidence-backed judgment completed: ${task.id}`);
    printJson(task);
    return EXIT.OK;
  }
  const reason = [
    `Cline verdict=${review.verdict ?? "missing"}`,
    `findings=${review.findings?.length ?? "missing"}`,
    `status=${review.status}`,
    `evidence=${review.id}`,
  ].join("; ");
  task = persistTaskUpdate(
    taskId,
    `node tools/orchestrator.mjs judge --id ${taskId}`,
    (current, config) => ({
      ...transitionTask(current, "FIX_REQUIRED", config),
      lastError: redactSecrets(reason),
      retryableFailure: current.attempt < current.maxAttempts,
    }),
  );
  console.error(`[FAIL] review requires fixes: ${reason}`);
  printJson(task);
  return EXIT.TASK;
}

function validateBuildDirectory(directory, packageScripts) {
  let buildDirectory;
  try {
    buildDirectory = realpathSync(directory);
  } catch (error) {
    fail(`Build directory is unavailable: ${error.message}`, EXIT.CONFIG);
  }
  if (buildDirectory === ROOT) return buildDirectory;
  try {
    const topLevel = execFileSync("git", ["-C", buildDirectory, "rev-parse", "--show-toplevel"], {
      cwd: ROOT,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    }).trim();
    const commonDirectory = execFileSync("git", ["-C", buildDirectory, "rev-parse", "--git-common-dir"], {
      cwd: ROOT,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    }).trim();
    const expectedCommon = realpathSync(execFileSync("git", ["rev-parse", "--git-common-dir"], {
      cwd: ROOT,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    }).trim());
    const actualCommon = realpathSync(resolve(buildDirectory, commonDirectory));
    const buildHead = execFileSync("git", ["-C", buildDirectory, "rev-parse", "HEAD"], {
      cwd: ROOT,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    }).trim();
    const currentHead = execFileSync("git", ["rev-parse", "HEAD"], {
      cwd: ROOT,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    }).trim();
    const buildPackage = parseJsonFile(resolve(buildDirectory, "package.json"), "build worktree package.json");
    const worktreesMatch = workingTreeFingerprint(buildDirectory) === workingTreeFingerprint(ROOT);
    if (
      realpathSync(topLevel) !== buildDirectory ||
      actualCommon !== expectedCommon ||
      buildHead !== currentHead ||
      JSON.stringify(buildPackage.scripts) !== JSON.stringify(packageScripts) ||
      !worktreesMatch
    ) {
      fail("Alternate build directory must be a registered worktree at the current HEAD with matching scripts and exact working-tree inputs.", EXIT.CONFIG);
    }
    return buildDirectory;
  } catch (error) {
    if (error instanceof OrchestratorError) throw error;
    fail(`Cannot validate alternate build directory: ${error.message}`, EXIT.CONFIG);
  }
}

function isPortListening(port) {
  const probe = `
    const net = require("node:net");
    const socket = net.connect({ host: "127.0.0.1", port: ${port} });
    socket.setTimeout(750, () => { socket.destroy(); process.exit(1); });
    socket.on("connect", () => { socket.destroy(); process.exit(0); });
    socket.on("error", () => process.exit(1));
  `;
  const result = spawnSync(process.execPath, ["-e", probe], {
    cwd: ROOT,
    encoding: "utf8",
    timeout: 1500,
    windowsHide: true,
  });
  return result.status === 0;
}

function runNpmScript(script, cwd, timeoutMs) {
  const command = `npm run ${script}`;
  const startedAt = new Date().toISOString();
  const start = Date.now();
  const windows = process.platform === "win32";
  const processResult = spawnSync(
    windows ? process.env.ComSpec ?? "cmd.exe" : "npm",
    windows ? ["/d", "/s", "/c", command] : ["run", script],
    {
    cwd,
    encoding: "utf8",
    maxBuffer: 32 * 1024 * 1024,
    timeout: timeoutMs,
    windowsHide: true,
    },
  );
  const durationMs = Date.now() - start;
  const finishedAt = new Date().toISOString();
  const timedOut = processResult.error?.code === "ETIMEDOUT";
  const status = timedOut
    ? "TIMEOUT"
    : processResult.error || processResult.status === null
      ? "ERROR"
      : processResult.status === 0
        ? null
        : "FAIL";
  return {
    command,
    workingDirectory: cwd,
    startedAt,
    finishedAt,
    durationMs,
    exitCode: processResult.status,
    stdout: processResult.stdout ?? "",
    stderr: processResult.stderr ?? "",
    status,
    error: processResult.error?.message ?? (processResult.signal ? `Process terminated by ${processResult.signal}.` : null),
  };
}

function persistQualityGateEvidence(taskId, result, { final = false, gatePassed = false, failureSummary = "" } = {}) {
  const config = loadConfig();
  ensureLayout();
  return withMutationLock(() => {
    recoverPendingJournal();
    const state = readState(true);
    const task = loadTasks().find((entry) => entry.id === taskId);
    if (!task) fail(`Task not found: ${taskId}`);
    if (task.state !== "QUALITY_GATE") fail(`Task must be in QUALITY_GATE state; found ${task.state}.`);
    const evidenceStatus = result.status === "TIMEOUT"
      ? "TIMEOUT"
      : result.status === "ERROR"
        ? "ERROR"
        : result.exitCode === 0
          ? `${result.type}_PASS`
          : `${result.type}_FAIL`;
    const evidence = buildEvidence({
      taskId: task.id,
      correlationId: task.correlationId,
      type: result.type,
      command: result.command,
      workingDirectory: result.workingDirectory,
      exitCode: result.exitCode,
      startedAt: result.startedAt,
      finishedAt: result.finishedAt,
      stdout: result.stdout,
      stderr: [result.stderr, result.error].filter(Boolean).join("\n"),
      gitStatus: result.gitStatus ?? readGitStatus(),
      source: "quality-gate",
      status: evidenceStatus,
      durationMs: result.durationMs,
    });
    let updated = {
      ...task,
      updatedAt: new Date().toISOString(),
      evidenceIds: [...task.evidenceIds, evidence.id],
    };
    if (final && gatePassed) {
      updated = transitionTask(updated, "REVIEWING", config);
    } else if (final) {
      const failure = `${failureSummary}; evidenceId=${evidence.id}; timestamp=${result.finishedAt}`;
      updated = applyFailure(updated, failure, true, config);
    }
    const taskWithEvidence = validateRecord("task", updated);
    commitMutation({
      task: taskWithEvidence,
      evidence,
      state: nextState(state, {
        taskIds: [...new Set([...state.taskIds, task.id])],
        ...(final && !gatePassed
          ? {
              circuitFailures: state.circuitFailures + 1,
              circuitOpen: state.circuitOpen || taskWithEvidence.state === "CIRCUIT_OPEN",
            }
          : {}),
      }),
    });
    return { task: taskWithEvidence, evidence };
  });
}

function executeQualityGate(taskId, buildDirectory = ROOT) {
  const config = ensureInitialized();
  const scripts = getPackageScripts();
  const plan = qualityGatePlan(scripts);
  const resolvedBuildDirectory = validateBuildDirectory(buildDirectory, scripts);
  if (resolvedBuildDirectory === ROOT && isPortListening(3000)) {
    fail("Port 3000 is active; run the build in a separate registered worktree.", EXIT.LOCK);
  }
  const task = loadTasks().find((entry) => entry.id === taskId);
  if (!task) fail(`Task not found: ${taskId}`);
  if (task.state !== "QUALITY_GATE") fail(`Task must be in QUALITY_GATE state; found ${task.state}.`);

  const results = [];
  for (const stage of plan.stages) {
    const result = {
      ...runNpmScript(
        stage.script,
        stage.type === "BUILD" ? resolvedBuildDirectory : ROOT,
        config.timeouts.qualityGateMs,
      ),
      type: stage.type,
    };
    if (stage.type === "BUILD") {
      result.gitStatus = [
        `Build worktree:\n${readGitStatus(result.workingDirectory)}`,
        `Main worktree after build:\n${readGitStatus(ROOT)}`,
      ].join("\n");
    }
    const isFinalStage = stage === plan.stages.at(-1);
    const passed = results.every((entry) => entry.exitCode === 0 && entry.status === null) &&
      result.exitCode === 0 && result.status === null;
    const failureSummary = [...results, result]
      .filter((entry) => entry.exitCode !== 0 || entry.status !== null)
      .map((entry) =>
        `${entry.type}: status=${entry.status ?? "EXITED"}, exitCode=${entry.exitCode}, command=${entry.command}, timestamp=${entry.finishedAt}`,
      )
      .join("; ");
    const persisted = persistQualityGateEvidence(taskId, result, {
      final: isFinalStage,
      gatePassed: isFinalStage && passed,
      failureSummary,
    });
    result.evidenceId = persisted.evidence.id;
    results.push(result);
  }

  const passed = results.every((result) => result.exitCode === 0 && result.status === null);
  for (const result of results) {
    const passedStage = result.exitCode === 0 && result.status === null;
    if (result.type === "TYPECHECK" || result.type === "LINT") {
      console.log(`[${passedStage ? "PASS" : "FAIL"}] ${result.type}`);
    } else if (result.type === "KALITE") {
      console.log(`[${passedStage ? "PASS" : "FAIL"}] TYPECHECK + LINT (npm run kalite)`);
      console.log(`[${passedStage ? "PASS" : "FAIL"}] KALITE`);
    } else {
      console.log(`[${passedStage ? "PASS" : "FAIL"}] BUILD`);
    }
  }
  const finalTask = loadTasks().find((entry) => entry.id === taskId);
  printJson({ task: finalTask, results: results.map(({ stdout, stderr, error, ...result }) => result) });
  if (results.some((result) => result.status === "ERROR")) return EXIT.CONFIG;
  return passed ? EXIT.OK : EXIT.TASK;
}

function transitionStoredTask(id, next) {
  return persistTaskUpdate(
    id,
    `node tools/orchestrator.mjs task-transition --id ${id} --to ${next}`,
    (task, config) => transitionTask(task, next, config),
  );
}

function failStoredTask(id, message, retryable) {
  const normalizedMessage = String(message ?? "").trim();
  if (!normalizedMessage) fail("task-fail requires a non-empty --message.");
  return persistTaskUpdate(
    id,
    `node tools/orchestrator.mjs task-fail --id ${id}`,
    (task, config) => applyFailure(task, normalizedMessage, retryable, config),
    (state, task) => ({
      circuitFailures: state.circuitFailures + 1,
      circuitOpen: state.circuitOpen || task.state === "CIRCUIT_OPEN",
    }),
  );
}

function retryStoredTask(id) {
  return persistTaskUpdate(
    id,
    `node tools/orchestrator.mjs task-retry --id ${id}`,
    (task, config) => retryTask(task, config),
  );
}

function readGitStatus(cwd = ROOT) {
  try {
    const output = execFileSync("git", ["status", "--short"], {
      cwd,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
      timeout: 10000,
    });
    return redactSecrets(output)
      .split(/\r?\n/)
      .filter((line) => !/(?:^|[\s/])\.env(?:\.|[\s/]|$)|\.log(?:\s|$)|(?:id_rsa|id_ed25519|private.?key)/i.test(line))
      .join("\n");
  } catch (error) {
    return redactSecrets(error.stderr?.toString() ?? error.message);
  }
}

function lockPathForFile(file) {
  const digest = createHash("sha256").update(file.toLowerCase()).digest("hex");
  return safeStorageFile(STORAGE.locks, `file_${digest}.json`);
}

function acquireOpenCodeTaskLock({ taskId, correlationId, files, ttlMs }) {
  const path = safeStorageFile(STORAGE.locks, `task_${taskId}.json`);
  const config = loadConfig();
  const ttl = Math.min(Math.max(1, Number(ttlMs) || config.locks.defaultTtlMs), config.locks.maxTtlMs);
  const now = Date.now();
  ensureLayout();
  return withMutationLock(() => {
    recoverPendingJournal();
    if (existsSync(path)) {
      const existing = parseJsonFile(path, `OpenCode task lock ${taskId}`);
      if (processIsAlive(existing.processId) || Date.parse(existing.expiresAt) > now) {
        fail(`OpenCode task is already locked: ${taskId}`, EXIT.LOCK);
      }
      removeExactFile(path);
    }
    const lock = {
      lockId: `lock_${randomUUID()}`,
      taskId,
      correlationId,
      agent: "OPENCODE",
      files,
      processId: process.pid,
      acquiredAt: new Date(now).toISOString(),
      expiresAt: new Date(now + ttl).toISOString(),
    };
    atomicCreateJson(path, lock);
    return path;
  });
}

function validateWriter(agent) {
  const config = loadConfig();
  if (!config.agents[agent]) fail(`Unknown agent role: ${agent}`);
  if (agent === "CLINE" || config.agents[agent].permissions.write !== true) {
    fail(`${agent} is not permitted to acquire a writer lock.`, EXIT.LOCK);
  }
}

function acquireFileLocksUnsafe({ taskId, correlationId, agent, files, ttlMs }, now = Date.now()) {
  validateWriter(agent);
  const config = loadConfig();
  const normalizedFiles = [...new Set(files.map(safeRepoRelativePath))].sort();
  if (normalizedFiles.length === 0) fail("At least one file is required for a writer lock.", EXIT.LOCK);
  const ttl = Math.min(Math.max(1, Number(ttlMs) || config.locks.defaultTtlMs), config.locks.maxTtlMs);
  const created = [];
  try {
    for (const file of normalizedFiles) {
      const path = lockPathForFile(file);
      if (existsSync(path)) {
        const existing = parseJsonFile(path, "file lock");
        if (Date.parse(existing.expiresAt) > now) fail(`File is already locked: ${file}`, EXIT.LOCK);
        removeExactFile(path);
      }
      const lock = validateAgainstSchema({
        lockId: `lock_${randomUUID()}`,
        taskId,
        correlationId,
        agent,
        files: normalizedFiles,
        acquiredAt: new Date(now).toISOString(),
        expiresAt: new Date(now + ttl).toISOString(),
      }, {
        type: "object",
        required: ["lockId", "taskId", "correlationId", "agent", "files", "acquiredAt", "expiresAt"],
        properties: {
          lockId: { type: "string" },
          taskId: { type: "string" },
          correlationId: { type: "string" },
          agent: { type: "string", enum: ["CHIEF", "OPENCODE"] },
          files: { type: "array", items: { type: "string" } },
          acquiredAt: { type: "string", format: "date-time" },
          expiresAt: { type: "string", format: "date-time" },
        },
      });
      atomicCreateJson(path, lock);
      created.push(path);
    }
    return created;
  } catch (error) {
    for (const path of created) removeExactFile(path);
    throw error;
  }
}

function acquireFileLocks(options, now = Date.now()) {
  ensureLayout();
  return withMutationLock(() => {
    recoverPendingJournal();
    return acquireFileLocksUnsafe(options, now);
  });
}

function releaseFileLocks({ taskId, agent }) {
  if (!["CHIEF", "OPENCODE"].includes(agent)) fail(`${agent} cannot release writer locks.`, EXIT.LOCK);
  ensureLayout();
  return withMutationLock(() => {
    recoverPendingJournal();
    const released = [];
    for (const name of readdirSync(STORAGE.locks).filter((entry) => entry.endsWith(".json"))) {
      const path = safeStorageFile(STORAGE.locks, name);
      const lock = parseJsonFile(path, name);
      if (lock.taskId !== taskId || (agent !== "CHIEF" && lock.agent !== agent)) continue;
      removeExactFile(path);
      released.push(name);
    }
    return released;
  });
}

function renewFileLocks({ taskId, agent, ttlMs }) {
  validateWriter(agent);
  const config = loadConfig();
  ensureLayout();
  return withMutationLock(() => {
    recoverPendingJournal();
    const ttl = Math.min(Math.max(1, Number(ttlMs) || config.locks.defaultTtlMs), config.locks.maxTtlMs);
    const renewed = [];
    const now = Date.now();
    for (const name of readdirSync(STORAGE.locks).filter((entry) => entry.endsWith(".json"))) {
      const path = safeStorageFile(STORAGE.locks, name);
      const lock = parseJsonFile(path, name);
      if (lock.taskId !== taskId || lock.agent !== agent) continue;
      if (!Number.isFinite(Date.parse(lock.expiresAt)) || Date.parse(lock.expiresAt) <= now) {
        fail(`Expired lock cannot be renewed: ${name}`, EXIT.LOCK);
      }
      const updated = { ...lock, expiresAt: new Date(now + ttl).toISOString() };
      atomicWriteJson(path, updated);
      renewed.push(name);
    }
    if (renewed.length === 0) fail(`No active locks found for task ${taskId}.`, EXIT.LOCK);
    return renewed;
  });
}

function readLocks() {
  if (!existsSync(STORAGE.locks)) return [];
  return readdirSync(STORAGE.locks)
    .filter((name) => name.endsWith(".json"))
    .map((name) => parseJsonFile(safeStorageFile(STORAGE.locks, name), name));
}

function cleanExpiredLocks(onlyNames = null, now = Date.now()) {
  if (!existsSync(STORAGE.locks)) return [];
  const candidates = readdirSync(STORAGE.locks).filter((name) => name.endsWith(".json"));
  const selected = onlyNames ? candidates.filter((name) => onlyNames.includes(name)) : candidates;
  const removed = [];
  for (const name of selected) {
    const path = safeStorageFile(STORAGE.locks, name);
    const lock = parseJsonFile(path, name);
    if (!Number.isFinite(Date.parse(lock.expiresAt))) fail(`Invalid lock expiry: ${name}`, EXIT.RECOVERY);
    if (Date.parse(lock.expiresAt) <= now) {
      removeExactFile(path);
      removed.push(name);
    }
  }
  return removed;
}

function evaluateGitCommand(args, agent, config) {
  const [binary, subcommand, ...flags] = args;
  if (binary !== "git" || !subcommand) return { allowed: false, reason: "Only explicit git commands are evaluated." };
  const destructive =
    (subcommand === "reset" && flags.includes("--hard")) ||
    (subcommand === "clean" && flags.some((flag) => flag === "--force" || /^-[^-]*f/i.test(flag))) ||
    (subcommand === "push" && flags.some((flag) => ["--force", "--force-with-lease", "-f"].includes(flag))) ||
    (subcommand === "checkout" && flags.includes("--")) ||
    subcommand === "restore";
  if (destructive) return { allowed: false, reason: "Destructive Git operation is prohibited." };
  if (["commit", "push"].includes(subcommand)) {
    const authorized = config.agents[agent]?.permissions?.[subcommand] === true;
    return {
      allowed: false,
      reason: authorized
        ? `${agent} has configured ${subcommand} authority, but Git mutations are not implemented in Phase 1B.`
        : `${agent} is not authorized to ${subcommand}.`,
    };
  }
  const sameArgs = (expected) =>
    flags.length === expected.length && flags.every((flag, index) => flag === expected[index]);
  const argumentsAllowed =
    (subcommand === "status" &&
      (sameArgs([]) || sameArgs(["--short"]) || sameArgs(["--porcelain"]))) ||
    (subcommand === "diff" &&
      [
        ["--check"],
        ["--stat"],
        ["--name-only"],
        ["--cached", "--name-only"],
        ["--cached", "--check"],
      ].some(sameArgs)) ||
    (subcommand === "rev-parse" &&
      (sameArgs(["--show-toplevel"]) || sameArgs(["--is-inside-work-tree"]))) ||
    (subcommand === "show" &&
      (sameArgs([]) || sameArgs(["--stat"]) || sameArgs(["--name-only"])));
  const allowed = config.git.allowedReadOnlyCommands.includes(subcommand) && argumentsAllowed;
  return { allowed, reason: allowed ? "Read-only Git command." : "Git command is not allowlisted." };
}

function recover() {
  const config = loadConfig();
  ensureLayout();
  return withMutationLock(() => {
    recoverPendingJournal();
    let state = readState(true);
    const removedLocks = cleanExpiredLocks();
    const removedTempFiles = cleanStaleTempFiles();
    const tasks = loadTasks();
    const recovered = [];
    for (const task of tasks) {
      const next = recoverTask(task, config);
      if (!next) continue;
      const evidence = buildEvidence({
        taskId: task.id,
        correlationId: task.correlationId,
        type: "RECOVERY",
        command: "node tools/orchestrator.mjs recover",
        stdout: `Marked interrupted task ${task.id} as RECOVERABLE`,
        gitStatus: readGitStatus(),
      });
      const nextWithEvidence = validateRecord("task", {
        ...next,
        evidenceIds: [...next.evidenceIds, evidence.id],
      });
      state = nextState(state, {
        taskIds: [...new Set([...state.taskIds, task.id])],
      });
      commitMutation({ task: nextWithEvidence, evidence, state });
      recovered.push(next.id);
    }
    const recoveryEvidence = buildEvidence({
      taskId: "system",
      correlationId: "system",
      type: "RECOVERY",
      command: "node tools/orchestrator.mjs recover",
      stdout: JSON.stringify({ recovered, removedLocks, removedTempFiles }),
      gitStatus: readGitStatus(),
      source: "ORCHESTRATOR",
    });
    const refreshed = loadTasks();
    state = nextState(state, {
      taskIds: [...new Set(refreshed.map((task) => task.id))],
      lastRecovery: recoveryEvidence.finishedAt,
      recoveryIds: [...state.recoveryIds, recoveryEvidence.id],
    });
    commitMutation({ evidence: recoveryEvidence, state });
    return { recovered, removedLocks, removedTempFiles, evidenceId: recoveryEvidence.id };
  });
}

function checkOwnership() {
  const scriptPath = resolve(ROOT, "tools/cakisma-kontrol.mjs");
  if (!existsSync(scriptPath)) return { ok: false, output: "tools/cakisma-kontrol.mjs is missing." };
  const result = spawnSync(process.execPath, [scriptPath, "--agent", "copilot", ...OWNERSHIP_TARGETS], {
    cwd: ROOT,
    encoding: "utf8",
    timeout: 30000,
    windowsHide: true,
  });
  return {
    ok: result.status === 0,
    output: redactSecrets(`${result.stdout ?? ""}${result.stderr ?? ""}`).trim(),
  };
}

function checkDirectoryWritable(path) {
  const probe = resolve(path, `.doctor_${randomUUID()}.tmp`);
  try {
    const descriptor = openSync(probe, "wx", 0o600);
    writeFileSync(descriptor, "probe", "utf8");
    fsyncSync(descriptor);
    closeSync(descriptor);
    removeExactFile(probe);
    return true;
  } catch (error) {
    removeExactFile(probe);
    return `not writable: ${error.message}`;
  }
}

function runSelfTests(config, chiefOwnershipOk) {
  const results = [];
  const check = (name, action) => {
    try {
      action();
      results.push({ name, ok: true });
    } catch (error) {
      results.push({ name, ok: false, error: redactSecrets(error.message) });
    }
  };

  let sample;
  check("task record and unique ID", () => {
    sample = createTaskRecord({ title: "Self-test task" }, config);
    const other = createTaskRecord({ title: "Self-test task" }, config);
    if (sample.id === other.id) fail("Task IDs collided.");
  });
  check("quality gate plan avoids duplicate commands", () => {
    const scripts = getPackageScripts();
    const plan = qualityGatePlan(scripts);
    if (
      plan.stages[0].script !== "kalite" ||
      plan.stages[1].type !== "BUILD" ||
      plan.kaliteIncludesBuild
    ) {
      fail("Quality gate plan does not respect existing npm script dependencies.");
    }
    const nestedBuildPlan = qualityGatePlan({
      "type-check": "tsc --noEmit",
      lint: "next lint",
      kalite: "npm run type-check && npm run lint && npm run build",
      build: "next build",
    });
    const nestedScripts = nestedBuildPlan.stages.map((stage) => stage.script);
    if (
      nestedBuildPlan.stages.map((stage) => stage.type).join(",") !== "TYPECHECK,LINT,BUILD" ||
      new Set(nestedScripts).size !== nestedScripts.length
    ) {
      fail("A build nested under kalite was not decomposed into unique isolated commands.");
    }
  });
  check("quality gate evidence records timeout and redacts secrets", () => {
    const timeoutEvidence = buildEvidence({
      taskId: sample.id,
      correlationId: sample.correlationId,
      type: "BUILD",
      command: "npm run build",
      exitCode: null,
      stdout: "Bearer sensitive-test-token",
      status: "TIMEOUT",
      durationMs: 600000,
      workingDirectory: ROOT,
      source: "quality-gate",
    });
    if (
      timeoutEvidence.exitCode !== null ||
      timeoutEvidence.status !== "TIMEOUT" ||
      timeoutEvidence.stdout.includes("sensitive-test-token")
    ) {
      fail("Build timeout evidence was inaccurate or retained a test secret.");
    }
    const clineTimeoutEvidence = buildEvidence({
      taskId: sample.id,
      correlationId: sample.correlationId,
      type: "AGENT_REVIEW",
      command: "vscode Cline task URI",
      exitCode: null,
      status: "CLINE_TIMEOUT",
      source: "cline-adapter",
    });
    if (clineTimeoutEvidence.exitCode !== null || clineTimeoutEvidence.status !== "CLINE_TIMEOUT") {
      fail("Cline timeout evidence was inaccurate.");
    }
    let clineTimeoutFalsePassRejected = false;
    try {
      buildEvidence({
        taskId: sample.id,
        correlationId: sample.correlationId,
        type: "AGENT_REVIEW",
        command: "vscode Cline task URI",
        exitCode: 0,
        status: "CLINE_TIMEOUT",
        source: "cline-adapter",
      });
    } catch {
      clineTimeoutFalsePassRejected = true;
    }
    if (!clineTimeoutFalsePassRejected) fail("A Cline timeout with exit code 0 was accepted.");
    let falsePassRejected = false;
    try {
      buildEvidence({
        taskId: sample.id,
        correlationId: sample.correlationId,
        type: "BUILD",
        command: "npm run build",
        exitCode: 1,
        status: "BUILD_PASS",
        source: "quality-gate",
      });
    } catch {
      falsePassRejected = true;
    }
    if (!falsePassRejected) fail("A nonzero build exit was accepted as a pass.");
  });
  check("correlation ID", () => {
    if (!sample?.correlationId.startsWith("cor_")) fail("Correlation ID was not generated.");
  });
  check("valid state transition", () => {
    const next = transitionTask(sample, "PLANNED", config);
    if (next.state !== "PLANNED") fail("Valid transition did not update state.");
  });
  check("invalid state transition rejected", () => {
    let rejected = false;
    try {
      transitionTask(sample, "COMPLETED", config);
    } catch {
      rejected = true;
    }
    if (!rejected) fail("Invalid transition was accepted.");
  });
  check("task cannot pass without linked Cline review evidence", () => {
    const unreviewed = {
      ...sample,
      state: "JUDGING",
      evidenceIds: [],
      reviewIds: [],
      cline: null,
    };
    let rejected = false;
    try {
      transitionTask(unreviewed, "PASSED", config);
    } catch {
      rejected = true;
    }
    if (!rejected) fail("A task without persisted review evidence reached PASSED.");
  });
  check("passing judgment requires linked quality, build, and clean Cline evidence", () => {
    const reviewId = createReviewIdentity(sample.id, sample.correlationId);
    const qualityEvidence = buildEvidence({
      taskId: sample.id,
      correlationId: sample.correlationId,
      type: "KALITE",
      command: "npm run kalite",
      status: "KALITE_PASS",
      exitCode: 0,
    });
    const buildResult = buildEvidence({
      taskId: sample.id,
      correlationId: sample.correlationId,
      type: "BUILD",
      command: "npm run build",
      status: "BUILD_PASS",
      exitCode: 0,
    });
    const reviewEvidence = buildEvidence({
      taskId: sample.id,
      correlationId: sample.correlationId,
      type: "AGENT_REVIEW",
      command: "vscode Cline task URI",
      status: "REVIEW_RECEIVED",
      exitCode: 0,
      reviewId,
      verdict: "PASS",
      findings: [],
      summary: "No findings.",
      confidence: "HIGH",
      changedFiles: ["tools/orchestrator.mjs"],
      qualityGateEvidenceIds: [qualityEvidence.id],
      buildEvidenceId: buildResult.id,
      permissionViolations: { execution: [], write: [], unknownTools: [] },
    });
    const evidence = [qualityEvidence, buildResult, reviewEvidence];
    const paths = [];
    try {
      for (const item of evidence) paths.push(writeEvidence(item));
      const task = {
        ...sample,
        state: "JUDGING",
        evidenceIds: evidence.map((item) => item.id),
        reviewIds: [reviewId],
        cline: { reviewId, status: "REVIEW_RECEIVED" },
      };
      if (transitionTask(task, "PASSED", config).state !== "PASSED") {
        fail("A complete evidence-backed review did not pass judgment.");
      }
    } finally {
      for (const path of paths) removeExactFile(path);
    }
  });
  check("evidence persisted atomically", () => {
    ensureLayout();
    const evidence = buildEvidence({
      taskId: sample.id,
      correlationId: sample.correlationId,
      type: "TEST",
      command: "self-test",
      stdout: "evidence write verified",
    });
    const path = writeEvidence(evidence);
    try {
      if (!existsSync(path) || parseJsonFile(path, "self-test evidence").id !== evidence.id) {
        fail("Evidence was not persisted.");
      }
      let tamperingRejected = false;
      try {
        validateRecord("evidence", { ...evidence, stdout: "tampered after hashing" });
      } catch {
        tamperingRejected = true;
      }
      if (!tamperingRejected) fail("Tampered evidence passed its integrity check.");
    } finally {
      removeExactFile(path);
    }
  });
  check("journal cross-reference validation", () => {
    const evidence = buildEvidence({
      taskId: sample.id,
      correlationId: sample.correlationId,
      type: "COMMAND",
      command: "self-test",
    });
    const task = { ...sample, evidenceIds: [evidence.id] };
    const state = nextState(newState(), { taskIds: [task.id] });
    validateJournalRelations({ task, evidence, state });
    let mismatchRejected = false;
    try {
      validateJournalRelations({
        task,
        evidence: { ...evidence, taskId: "tsk_unrelated" },
        state,
      });
    } catch {
      mismatchRejected = true;
    }
    if (!mismatchRejected) fail("A mismatched journal task/evidence reference was accepted.");
    let missingTaskIndexRejected = false;
    try {
      validateJournalRelations({ task, evidence, state: newState() });
    } catch {
      missingTaskIndexRejected = true;
    }
    if (!missingTaskIndexRejected) fail("A journal task missing from state.taskIds was accepted.");
    const systemEvidence = buildEvidence({
      taskId: "system",
      correlationId: "system",
      type: "RECOVERY",
      command: "self-test",
    });
    validateJournalRelations({
      task: null,
      evidence: systemEvidence,
      state: nextState(newState(), { recoveryIds: [systemEvidence.id] }),
    });
    let nullableHashRejected = false;
    try {
      validateAgainstSchema({ ...evidence, hash: null }, loadSchema("evidence"));
    } catch {
      nullableHashRejected = true;
    }
    if (!nullableHashRejected) fail("The evidence schema accepted a null integrity hash.");
    let invalidHashRejected = false;
    try {
      validateAgainstSchema({ ...evidence, hash: "z".repeat(64) }, loadSchema("evidence"));
    } catch {
      invalidHashRejected = true;
    }
    if (!invalidHashRejected) fail("The evidence schema accepted a non-hex integrity hash.");
  });
  check("central secret redaction", () => {
    const redacted = redactSecrets('secret=abc token=xyz Authorization: Bearer abc sk-abcdefgh1234 eyJabcdefgh.abcdefgh.abcdefgh');
    if (/\babc\b|\bxyz\b|sk-abcdefgh|eyJabcdefgh/.test(redacted)) fail("A secret-like test value was not redacted.");
  });
  check("environment key redaction", () => {
    const redacted = redactSecrets("SUPABASE_SERVICE_ROLE_KEY='two words'");
    if (redacted.includes("two words")) fail("A quoted environment secret value was not redacted.");
  });
  check("flag-style secret redaction", () => {
    const redacted = redactSecrets("--token abc123 --api-key 'quoted secret' Authorization bearer-value");
    if (/abc123|quoted secret|bearer-value/.test(redacted)) {
      fail("A separated or quoted secret argument was not redacted.");
    }
  });
  check("expired lock recovery", () => {
    ensureLayout();
    const filename = `selftest_${randomUUID()}.json`;
    const path = safeStorageFile(STORAGE.locks, filename);
    atomicCreateJson(path, {
      lockId: "lock_selftest",
      taskId: sample.id,
      correlationId: sample.correlationId,
      agent: "OPENCODE",
      files: ["tools/orchestrator.mjs"],
      acquiredAt: new Date(0).toISOString(),
      expiresAt: new Date(1).toISOString(),
    });
    const removed = cleanExpiredLocks([filename], Date.now());
    if (removed.length !== 1 || existsSync(path)) fail("Expired lock was not recovered.");
  });
  check("idempotency lookup", () => {
    const key = normalizeIdempotencyKey("same-key");
    const existing = { ...sample, idempotencyKey: key };
    if (idempotentTask([existing], key)?.id !== existing.id) fail("Existing idempotent task was not reused.");
    if (idempotentTask([{ ...existing, state: "COMPLETED" }], key) !== null) {
      fail("Completed tasks must not block idempotency keys.");
    }
    if (idempotentTask([{ ...existing, state: "CIRCUIT_OPEN" }], key) !== null) {
      fail("Circuit-open tasks must not block idempotency keys.");
    }
  });
  check("retry limit and circuit breaker", () => {
    const first = applyFailure({ ...sample, state: "IMPLEMENTING", attempt: 1 }, "retryable", true, config);
    if (first.state !== "FIX_REQUIRED") fail("First retryable failure did not request a fix.");
    let directTransitionRejected = false;
    try {
      transitionTask(first, "DISPATCHING", config);
    } catch {
      directTransitionRejected = true;
    }
    if (!directTransitionRejected) fail("Direct transition bypassed the retry counter.");
    const secondAttempt = retryTask(first, config);
    const second = applyFailure({ ...secondAttempt, state: "IMPLEMENTING" }, "retryable", true, config);
    const thirdAttempt = retryTask(second, config);
    const third = applyFailure({ ...thirdAttempt, state: "IMPLEMENTING" }, "retryable", true, config);
    if (third.state !== "CIRCUIT_OPEN" || third.attempt !== config.maxAttempts) fail("Circuit breaker did not stop after maxAttempts.");
    const nonRetryable = applyFailure({ ...sample, state: "IMPLEMENTING" }, "permanent", false, config);
    if (nonRetryable.state !== "FIX_REQUIRED" || nonRetryable.retryableFailure) {
      fail("Non-retryable failure was not stopped without another attempt.");
    }
    let retryRejected = false;
    try {
      retryTask(nonRetryable, config);
    } catch {
      retryRejected = true;
    }
    if (!retryRejected) fail("Non-retryable failure was retried.");
    let nonRetryableTransitionRejected = false;
    try {
      transitionTask(nonRetryable, "DISPATCHING", config);
    } catch {
      nonRetryableTransitionRejected = true;
    }
    if (!nonRetryableTransitionRejected) fail("Manual transition bypassed retry eligibility.");
  });
  check("deterministic risk assessment", () => {
    if (assessRisk("Update documentation", "", ["docs/guide.md"], config).risk !== "LOW") {
      fail("Documentation was not classified as low risk.");
    }
    const critical = assessRisk("Review database migration", "", [], config);
    if (critical.risk !== "CRITICAL" || !critical.requiresHumanApproval) {
      fail("Critical risk did not require human approval.");
    }
    const criticalTask = createTaskRecord({ title: "Review database migration" }, config);
    let approvalBlocked = false;
    try {
      transitionTask({ ...criticalTask, state: "RISK_ASSESSED" }, "READY", config);
    } catch {
      approvalBlocked = true;
    }
    if (!approvalBlocked) fail("Critical-risk task reached READY without human approval.");
  });
  check("file lock prevents concurrent writers", () => {
    ensureLayout();
    const files = ["docs/orchestrator-self-test.md"];
    const created = acquireFileLocks({
      taskId: sample.id,
      correlationId: sample.correlationId,
      agent: "OPENCODE",
      files,
      ttlMs: 60000,
    });
    try {
      let rejected = false;
      try {
        acquireFileLocks({
          taskId: `tsk_${randomUUID()}`,
          correlationId: `cor_${randomUUID()}`,
          agent: "OPENCODE",
          files,
          ttlMs: 60000,
        });
      } catch {
        rejected = true;
      }
      if (!rejected) fail("Concurrent writer lock was not rejected.");
    } finally {
      for (const path of created) removeExactFile(path);
    }
  });
  check("live mutation lock is not expired by time alone", () => {
    ensureLayout();
    atomicCreateJson(MUTATION_LOCK_PATH, {
      lockId: "mutation_selftest",
      pid: process.pid,
      acquiredAt: new Date(0).toISOString(),
      expiresAt: new Date(1).toISOString(),
    });
    try {
      let rejected = false;
      try {
        acquireMutationLock();
      } catch (error) {
        rejected = error.exitCode === EXIT.LOCK;
      }
      if (!rejected) fail("A live mutation lock was removed because its lease elapsed.");
    } finally {
      removeExactFile(MUTATION_LOCK_PATH);
    }
  });
  check("stale atomic temporary cleanup", () => {
    ensureLayout();
    const filename = `selftest.${2147483647}.${randomUUID()}.tmp`;
    const path = resolve(STORAGE.locks, filename);
    const descriptor = openSync(path, "wx", 0o600);
    try {
      writeFileSync(descriptor, "interrupted temporary");
    } finally {
      closeSync(descriptor);
    }
    const removed = cleanStaleTempFiles([filename]);
    if (!removed.includes(filename) || existsSync(path)) fail("Stale atomic temporary was not cleaned.");
  });
  check("incomplete work becomes recoverable", () => {
    const interrupted = recoverTask({ ...sample, state: "IMPLEMENTING" }, config);
    if (interrupted?.state !== "RECOVERABLE" || !interrupted.lastError) {
      fail("Interrupted task was not marked recoverable.");
    }
    let redispatchRejected = false;
    try {
      transitionTask(interrupted, "DISPATCHING", config);
    } catch {
      redispatchRejected = true;
    }
    if (!redispatchRejected) fail("Recovered work bypassed the manual review boundary.");
  });
  check("path traversal rejection", () => {
    let rejected = false;
    try {
      safeRepoRelativePath("../.env");
    } catch {
      rejected = true;
    }
    if (!rejected) fail("Path traversal was accepted.");
  });
  check("destructive Git policy", () => {
    const prohibited = [
      ["git", "reset", "--hard"],
      ["git", "clean", "-fd"],
      ["git", "push", "--force"],
      ["git", "push", "--force-with-lease"],
      ["git", "push", "-f"],
      ["git", "checkout", "--", "."],
      ["git", "restore", "."],
    ];
    if (prohibited.some((command) => evaluateGitCommand(command, "CHIEF", config).allowed)) {
      fail("A destructive Git operation was accepted.");
    }
    if (evaluateGitCommand(["git", "diff", "--output=outside.txt"], "CHIEF", config).allowed) {
      fail("A file-writing Git output flag was accepted.");
    }
    if (!evaluateGitCommand(["git", "status", "--short"], "CHIEF", config).allowed) {
      fail("A safe read-only Git command was rejected.");
    }
  });
  check("Cline writer rejected", () => {
    let rejected = false;
    try {
      validateWriter("CLINE");
    } catch {
      rejected = true;
    }
    if (!rejected) fail("Cline was allowed to acquire a writer lock.");
  });
  check("OpenCode commit and push rejected", () => {
    for (const command of ["commit", "push"]) {
      if (evaluateGitCommand(["git", command], "OPENCODE", config).allowed) {
        fail(`OpenCode was allowed to ${command}.`);
      }
    }
  });
  check("Chief commit/push capability configured", () => {
    if (config.agents.CHIEF.permissions.commit !== true || config.agents.CHIEF.permissions.push !== true) {
      fail("Chief authority is not configured.");
    }
  });
  check("Chief ownership accepted", () => {
    if (!chiefOwnershipOk) fail("Chief ownership preflight did not pass.");
  });
  return results;
}

async function runDoctor() {
  const output = [];
  const report = (name, result) => {
    const ok = result === true;
    output.push({ name, ok, detail: typeof result === "string" ? result : "" });
    console.log(`[${ok ? "PASS" : "FAIL"}] ${name}${typeof result === "string" ? ` — ${result}` : ""}`);
  };
  const warn = (name, detail) => {
    console.log(`[WARN] ${name}${detail ? ` — ${detail}` : ""}`);
  };
  let config;
  try {
    report("repository root", existsSync(resolve(ROOT, ".git")) || existsSync(resolve(ROOT, ".git", "config")));
    const gitRoot = execFileSync("git", ["rev-parse", "--show-toplevel"], {
      cwd: ROOT,
      encoding: "utf8",
    }).trim().replace(/\\/g, "/").toLowerCase();
    report("git repository", gitRoot === ROOT.replace(/\\/g, "/").toLowerCase());
  } catch (error) {
    report("git repository", `unavailable: ${error.message}`);
  }
  try {
    config = loadConfig();
    report("config", true);
    report("schemas", Object.values(SCHEMA_PATHS).every((path) => existsSync(path)));
  } catch (error) {
    report("config/schemas", error.message);
  }
  const nodeMajor = Number(process.versions.node.split(".")[0]);
  const nodeMinor = Number(process.versions.node.split(".")[1]);
  report("Node version", nodeMajor > 20 || (nodeMajor === 20 && nodeMinor >= 11) ? true : `requires >=20.11; found ${process.version}`);
  try {
    execFileSync("git", ["--version"], { cwd: ROOT, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
    report("git availability", true);
  } catch (error) {
    report("git availability", `unavailable: ${error.message}`);
  }
  for (const path of GOVERNANCE_PATHS) report(`governance ${path}`, existsSync(resolve(ROOT, path)));
  const ownership = checkOwnership();
  report("ownership preflight", ownership.ok ? true : ownership.output || "preflight failed");
  try {
    ensureLayout();
    for (const [name, path] of Object.entries(STORAGE)) report(`${name} directory writable`, checkDirectoryWritable(path));
  } catch (error) {
    report("storage directories", error.message);
  }
  if (config) {
    for (const result of runSelfTests(config, ownership.ok)) {
      report(`self-test ${result.name}`, result.ok ? true : result.error);
    }
    if (config.opencode.enabled) {
      const adapter = new OpenCodeAdapter(config.opencode, { root: ROOT });
      try {
        await adapter.loadApiContract();
        report(`OpenCode server reachable (${adapter.version})`, true);
        report("OpenCode API documentation reachable and contract validated", true);
        try {
          const inspection = await adapter.inspect();
          report("OpenCode configured project exists", inspection.project.id === config.opencode.projectId);
          report("OpenCode project worktree matches", true);
          report(`OpenCode configured model available (${inspection.model.providerId}/${inspection.model.modelId})`, true);
        } catch (error) {
          if (adapter.lastProject) {
            report("OpenCode configured project exists", adapter.lastProject.id === config.opencode.projectId);
            report("OpenCode project worktree matches", true);
          } else if (error.code === "OPENCODE_PROJECT_MISMATCH") {
            report("OpenCode configured project exists", error.message);
            report("OpenCode project worktree matches", error.message);
          } else {
            warn("OpenCode project and worktree checks", error.message);
          }
          if (error.code === "OPENCODE_MODEL_UNAVAILABLE") {
            report("OpenCode configured model available", error.message);
          } else if (error.code !== "OPENCODE_PROJECT_MISMATCH") {
            warn("OpenCode model availability check", error.message);
          }
        }
      } catch (error) {
        if (adapter.version) {
          report(`OpenCode server reachable (${adapter.version})`, true);
          report("OpenCode API documentation reachable and contract validated", error.message);
        } else {
          warn("OpenCode server reachable", error.message);
          warn("OpenCode API documentation reachable", "not checked because the server health request failed");
        }
        warn("OpenCode project/worktree/model checks", "not checked because the API contract could not be loaded");
      }
    }
    if (config.cline.enabled) {
      try {
        const cline = new ClineAdapter(config.cline, { root: ROOT });
        cline.verifyAvailable();
        report(`Cline extension ${config.cline.extensionId}@${config.cline.version} installed`, true);
        report("Cline local session store available", true);
      } catch (error) {
        report("Cline extension and local session store", error.message);
      }
    }
  }
  if (output.every((item) => item.ok)) return EXIT.OK;
  return output.some((item) => item.name.startsWith("self-test") && !item.ok) ? EXIT.TASK : EXIT.CONFIG;
}

function runDryRun() {
  const config = loadConfig();
  console.log("READ-ONLY DRY RUN — no files written and no external agent invoked");
  console.log("Roles: CHIEF (orchestrate) → OPENCODE (implement/fix) → CLINE (read-only review) → CHIEF (judge)");
  console.log("Pipeline: CREATE → PLAN → RISK → LOCK → IMPLEMENT → QUALITY_GATE → REVIEW → JUDGE → COMPLETE");
  console.log("OPENCODE ADAPTER");
  console.log(`SERVER: ${config.opencode.baseUrl}`);
  console.log(`PROJECT: ${config.opencode.projectId}`);
  console.log(`WORKTREE: ${config.opencode.worktree}`);
  console.log(`MODEL: ${config.opencode.providerId}/${config.opencode.modelId}`);
  console.log("SESSION CREATE: configured; no request sent");
  console.log("DISPATCH: configured; no prompt sent");
  console.log("RESULT RETRIEVAL: configured; no polling performed");
  console.log("QUALITY GATE: real local process evidence required");
  console.log("CLINE REVIEW: cline-review persists the read-only review; judge gates completion on review and quality evidence");
  console.log(`Configured max attempts: ${config.maxAttempts}; retries are bounded; critical risk requires human approval.`);
  return EXIT.OK;
}

function printJson(value) {
  console.log(JSON.stringify(value, null, 2));
}

function parseFlags(args, allowed) {
  const values = {};
  const positional = [];
  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (!arg.startsWith("--")) {
      positional.push(arg);
      continue;
    }
    const name = arg.slice(2);
    if (!allowed.includes(name)) fail(`Unknown option: ${arg}`);
    const value = args[index + 1];
    if (!value || value.startsWith("--")) fail(`Missing value for ${arg}`);
    values[name] = value;
    index += 1;
  }
  return { values, positional };
}

async function runCli(args) {
  const [command, ...rest] = args;
  if (!command || command === "--help" || command === "help") {
    console.log("Usage: node tools/orchestrator.mjs <doctor|init|task-create|task-show|task-list|task-transition|task-fail|task-retry|opencode-run|quality-gate|cline-review|judge|state|dry-run|recover|locks|evidence>");
    return EXIT.OK;
  }
  if (command === "doctor") return await runDoctor();
  if (command === "dry-run") return runDryRun();
  if (command === "quality-gate") {
    const { values, positional } = parseFlags(rest, ["id", "build-cwd"]);
    const id = values.id ?? positional[0];
    if (!id) fail("quality-gate requires --id.");
    return executeQualityGate(id, values["build-cwd"] ?? ROOT);
  }
  if (command === "cline-review") {
    const { values, positional } = parseFlags(rest, ["id", "summary"]);
    const id = values.id ?? positional[0];
    if (!id) fail("cline-review requires --id.");
    return await executeClineReview(id, values.summary ?? "");
  }
  if (command === "judge") {
    const { values, positional } = parseFlags(rest, ["id"]);
    const id = values.id ?? positional[0];
    if (!id) fail("judge requires --id.");
    return judgeStoredTask(id);
  }
  if (command === "opencode-run") {
    const { values, positional } = parseFlags(rest, ["id", "read-only"]);
    const id = values.id ?? positional[0];
    if (!id || (values["read-only"] !== undefined && !["true", "false"].includes(values["read-only"]))) {
      fail("opencode-run requires --id and optional --read-only true|false.");
    }
    await executeOpenCodeTask(id, values["read-only"] === "true");
    return EXIT.OK;
  }
  if (command === "init") {
    loadConfig();
    ensureLayout();
    withMutationLock(() => {
      recoverPendingJournal();
      readState(true);
    });
    console.log("[PASS] orchestrator initialized");
    return EXIT.OK;
  }
  if (command === "task-create") {
    const { values } = parseFlags(rest, ["title", "description", "acceptance-criteria", "files", "idempotency-key", "parent-task-id", "dependencies"]);
    if (!values.title) fail("task-create requires --title.");
    const result = createTask({
      title: values.title,
      description: values.description ?? "",
      acceptanceCriteria: values["acceptance-criteria"] ?? "",
      files: values.files ? values.files.split(",").map((item) => item.trim()).filter(Boolean) : [],
      idempotencyKey: values["idempotency-key"] ?? null,
      parentTaskId: values["parent-task-id"] ?? null,
      dependencies: values.dependencies ? values.dependencies.split(",").map((item) => item.trim()).filter(Boolean) : [],
    });
    console.log(`${result.duplicate ? "[PASS] existing idempotent task" : "[PASS] task created"}: ${result.task.id}`);
    printJson(result.task);
    return EXIT.OK;
  }
  if (command === "task-transition") {
    const { values, positional } = parseFlags(rest, ["id", "to"]);
    const id = values.id ?? positional[0];
    const to = values.to ?? positional[1];
    if (!id || !to) fail("task-transition requires --id and --to.");
    const task = transitionStoredTask(id, to);
    console.log(`[PASS] task transitioned: ${task.id} -> ${task.state}`);
    printJson(task);
    return EXIT.OK;
  }
  if (command === "task-fail") {
    const { values, positional } = parseFlags(rest, ["id", "message", "retryable"]);
    const id = values.id ?? positional[0];
    if (!id || !values.message || !["true", "false"].includes(values.retryable)) {
      fail("task-fail requires --id, --message, and --retryable true|false.");
    }
    const task = failStoredTask(id, values.message, values.retryable === "true");
    console.log(`[PASS] task failure recorded: ${task.id} -> ${task.state}`);
    printJson(task);
    return EXIT.OK;
  }
  if (command === "task-retry") {
    const { values, positional } = parseFlags(rest, ["id"]);
    const id = values.id ?? positional[0];
    if (!id) fail("task-retry requires --id.");
    const task = retryStoredTask(id);
    console.log(`[PASS] retry scheduled in state machine: ${task.id} -> ${task.state}`);
    printJson(task);
    return EXIT.OK;
  }
  if (command === "task-list") {
    ensureInitialized();
    printJson(loadTasks().sort((a, b) => a.createdAt.localeCompare(b.createdAt)));
    return EXIT.OK;
  }
  if (command === "task-show") {
    const { values, positional } = parseFlags(rest, ["id"]);
    ensureInitialized();
    const tasks = loadTasks();
    const id = values.id ?? positional[0];
    const ordered = tasks.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
    const task = id ? ordered.find((entry) => entry.id === id) : ordered.at(-1);
    if (!task) fail("No matching task exists.");
    printJson(task);
    return EXIT.OK;
  }
  if (command === "state") {
    ensureInitialized();
    printJson(readState());
    return EXIT.OK;
  }
  if (command === "locks") {
    ensureLayout();
    printJson(readLocks());
    return EXIT.OK;
  }
  if (command === "evidence") {
    const { values } = parseFlags(rest, ["id"]);
    ensureLayout();
    const evidence = loadEvidence();
    const selected = values.id ? evidence.filter((item) => item.id === values.id) : evidence;
    if (values.id && selected.length === 0) fail("No matching evidence exists.");
    printJson(selected);
    return EXIT.OK;
  }
  if (command === "recover") {
    let result;
    try {
      result = recover();
    } catch (error) {
      if (error instanceof OrchestratorError && [EXIT.CONFIG, EXIT.LOCK].includes(error.exitCode)) throw error;
      fail(`Recovery failed: ${error.message}`, EXIT.RECOVERY);
    }
    console.log("[PASS] recovery completed");
    printJson(result);
    return EXIT.OK;
  }
  fail(`Unknown command: ${command}`);
}

try {
  if (process.argv[1] && realpathSync(process.argv[1]) === fileURLToPath(import.meta.url)) {
    process.exitCode = await runCli(process.argv.slice(2));
  }
} catch (error) {
  if (error instanceof OrchestratorError) {
    console.error(`[FAIL] ${redactSecrets(error.message)}`);
    process.exitCode = error.exitCode;
  } else {
    console.error(`[FAIL] Unexpected error: ${redactSecrets(error?.stack ?? error?.message ?? String(error))}`);
    process.exitCode = EXIT.CONFIG;
  }
}

export {
  acquireFileLocks,
  applyFailure,
  assessRisk,
  buildEvidence,
  createTask,
  evaluateGitCommand,
  failStoredTask,
  recover,
  recoverTask,
  redactSecrets,
  releaseFileLocks,
  renewFileLocks,
  retryTask,
  retryStoredTask,
  safeRepoRelativePath,
  transitionTask,
  transitionStoredTask,
  writeEvidence,
};

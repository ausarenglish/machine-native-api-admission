import { readFile, readdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";
import Ajv2020 from "ajv/dist/2020.js";
import addFormats from "ajv-formats";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const schemaDir = path.join(root, "schemas");
const exampleDir = path.join(root, "examples");
const schemaPrefix = "https://spec.example.org/mnaa/0.1/schemas/";

const readJson = async (file) => JSON.parse(await readFile(file, "utf8"));
const schemaFiles = (await readdir(schemaDir)).filter((name) => name.endsWith(".json")).sort();
const exampleFiles = (await readdir(exampleDir)).filter((name) => name.endsWith(".json")).sort();

const ajv = new Ajv2020({ allErrors: true, strict: true });
addFormats(ajv);

const schemas = new Map();
for (const name of schemaFiles) {
  const schema = await readJson(path.join(schemaDir, name));
  ajv.addSchema(schema);
  schemas.set(schema.$id, schema);
}

const failures = [];
const statuses = [];
const readiness = [];
let validatedBodies = 0;

function fail(location, message) {
  failures.push(`${location}: ${message}`);
}

function visit(value, location) {
  if (Array.isArray(value)) {
    value.forEach((item, index) => visit(item, `${location}[${index}]`));
    return;
  }
  if (!value || typeof value !== "object") return;

  if (typeof value.$schema === "string" && value.$schema.startsWith(schemaPrefix)) {
    const validate = ajv.getSchema(value.$schema);
    if (!validate) {
      fail(location, `unknown repository schema ${value.$schema}`);
    } else {
      validatedBodies += 1;
      if (!validate(value)) {
        fail(location, ajv.errorsText(validate.errors, { separator: "; " }));
      }
    }
  }

  if (value.$schema?.endsWith("/admission-status.schema.json")) statuses.push({ value, location });
  if (value.$schema?.endsWith("/readiness-response.schema.json")) readiness.push({ value, location });

  for (const [key, item] of Object.entries(value)) visit(item, `${location}.${key}`);
}

for (const name of exampleFiles) {
  const text = await readFile(path.join(exampleDir, name), "utf8");
  if (/-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/.test(text)) fail(name, "contains private key material");
  if (/"(?:access_token|refresh_token|client_secret|resume_token)"\s*:/.test(text)) fail(name, "contains a secret-bearing JSON member");
  if (/"Authorization"\s*:\s*"(?:Bearer|DPoP)\s+[A-Za-z0-9._~-]{12,}"/.test(text)) fail(name, "contains a bearer or DPoP credential");
  const document = JSON.parse(text);
  visit(document, name);
}

const expectedDecisionState = new Map([
  ["ALLOW", "approved"],
  ["STEP_UP", "action_required"],
  ["DENY", "denied"]
]);

for (const { value, location } of statuses) {
  const expected = expectedDecisionState.get(value.decision);
  if (expected && !["expired", "revoked", "cancelled"].includes(value.state) && value.state !== expected) {
    fail(location, `${value.decision} cannot have active state ${value.state}`);
  }
  if (value.decision === "HUMAN_REVIEW_REQUIRED" && !["action_required", "pending", "expired", "revoked", "cancelled"].includes(value.state)) {
    fail(location, `HUMAN_REVIEW_REQUIRED cannot have state ${value.state}`);
  }
  if (["pending", "action_required"].includes(value.state) && !value.poll_after) fail(location, "non-terminal state lacks poll_after");
  if (value.state !== "approved" && value.provisioning.length > 0 && !["expired", "revoked"].includes(value.state)) {
    fail(location, "active non-approved state exposes provisioning");
  }
}

const revisions = new Map();
for (const item of statuses) {
  const list = revisions.get(item.value.admission_id) ?? [];
  list.push(item);
  revisions.set(item.value.admission_id, list);
}
for (const [admissionId, items] of revisions) {
  for (let index = 1; index < items.length; index += 1) {
    if (items[index].value.revision <= items[index - 1].value.revision) {
      fail(items[index].location, `revision for ${admissionId} did not increase`);
    }
    for (const key of ["request_id", "resource", "environment", "capability"]) {
      if (items[index].value[key] !== items[0].value[key]) fail(items[index].location, `${key} changed across revisions`);
    }
  }
}

for (const { value, location } of readiness) {
  const allPass = value.checks.every((check) => ["pass", "not_applicable"].includes(check.status));
  if (value.ready !== allPass) fail(location, `ready=${value.ready} disagrees with component checks`);
}

const decisions = new Set(statuses.map(({ value }) => value.decision));
for (const decision of ["ALLOW", "STEP_UP", "HUMAN_REVIEW_REQUIRED", "DENY"]) {
  if (!decisions.has(decision)) fail("examples", `missing ${decision} outcome`);
}
for (const state of ["pending", "action_required", "approved", "denied", "revoked"]) {
  if (!statuses.some(({ value }) => value.state === state)) fail("examples", `missing ${state} lifecycle state`);
}
if (!readiness.some(({ value }) => value.ready === true)) fail("examples", "missing positive readiness result");
if (!readiness.some(({ value }) => value.ready === false)) fail("examples", "missing negative readiness result");

if (failures.length) {
  console.error(`Validation failed with ${failures.length} error(s):`);
  for (const failure of failures) console.error(`- ${failure}`);
  process.exitCode = 1;
} else {
  console.log(`Validated ${schemaFiles.length} schemas, ${exampleFiles.length} example files, and ${validatedBodies} contract bodies.`);
  console.log(`Checked ${statuses.length} status revisions and ${readiness.length} readiness results; required decisions and lifecycle scenarios are covered.`);
}

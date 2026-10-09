# Security and trust model

## Security objective

MNAA must not turn machine-readable onboarding into machine-approved trust. It lets a provider expose policy gates consistently while retaining the same or stronger authentication, evidence verification, consent, human review, authorization, and runtime enforcement it would apply through a portal.

## Trust model

- The client and every client-supplied field are untrusted.
- TLS authenticates the endpoint, not the truth of claims in a request.
- Client authentication establishes the calling client instance, not its owner, legal organization, represented party, or delegated authority.
- A signature establishes control of a key. Trust requires issuer authorization, subject/audience/purpose binding, validity, status, freshness, and local policy.
- Provider discovery is authoritative only after resource-identifier and origin validation. Signed metadata is useful only when its issuer is trusted.
- Admission policy is enforced by the admission service and provisioner. Runtime access is enforced by the authorization and resource servers. Readiness is a provider observation, not a substitute for runtime checks.
- Human approval is accepted only from a provider-authenticated account that has the required role for the exact request. A client cannot self-assert that approval occurred.

## Authentication, consent, admission, and permission

These controls are deliberately non-substitutable:

| Control | Establishes | Does not establish |
| --- | --- | --- |
| Authentication | identity/key/session of the presenter | provider eligibility, user consent, or runtime permission |
| Resource-owner consent / delegated authorization | bounded authority from the owner | provider program admission or operational enablement |
| Provider admission | provider willingness to provision one capability | possession of a token or permission for every operation |
| Credential/token possession | ability to present a credential | current validity, sufficient scope, active admission, or successful operation |
| Readiness | provider's current composite check | a guarantee of future success |

The resource server must fail closed when it cannot establish required admission state. Caching is permitted only within the provider's stated revocation-propagation objective.

## Evidence handling

Providers must distinguish self-asserted claims from verified evidence in storage, policy inputs, audit, and responses. Evidence verification includes:

- trusted issuer/verifier selection independent of request-supplied keys;
- cryptographic validation where the format requires it;
- audience, nonce, subject, requester, client-key, capability, resource, and environment binding as applicable;
- issue/expiry time, maximum age, revocation/status, and replay checks;
- assurance method and verifier independence appropriate to the risk; and
- semantic validation of claims, not merely schema or signature validation.

An evidence URL creates SSRF risk. Verifiers should prefer preconfigured issuer endpoints, block private/link-local destinations unless explicitly needed, constrain redirects and response size/type, and isolate retrieval. A digest must bind any referenced content. Inline presentations must have strict size limits.

Evidence can reveal organizational, identity, device, and financial information. Request the minimum needed, accept selective disclosure where trustworthy, encrypt at rest, restrict operator access, define deletion/retention, and redact audit logs. Do not put raw credentials or identity documents in status resources.

## Human actions and consent integrity

Human-action links are phishing and consent-confusion targets. Each interaction must show the provider, requester, client, capability, requested scopes or consequence, account/tenant, expiry, and whether the person is approving for themselves or an organization. Bind the browser session and approval challenge to the exact admission and actor role. Use short-lived, single-use challenges and protect against CSRF, clickjacking, open redirects, session swapping, and approval replay.

`HUMAN_REVIEW_REQUIRED` must remain a real gate. An agent can navigate a user to the interaction but cannot click through, accept legal terms, claim identity, or approve on the user's behalf unless a separate, applicable authority explicitly permits that exact act—and providers should treat high-impact consent as non-delegable by default.

Provider-review notes, fraud signals, and internal thresholds must not be returned to clients. Public reasons should be actionable without helping evasion.

## Credentials and provisioning

Discovery, admission responses, examples, telemetry, and audit logs must contain no client secrets, access tokens, refresh tokens, private keys, resume tokens, or one-time registration tokens. `credential_reference` is an opaque handle into a provider-approved secret delivery channel and is not itself proof of access.

Provisioners must apply least privilege and reject any mismatch between the admission and requested resource, environment, capability, scopes/authorization details, grant type, redirect URI, requester, or key binding. One-time initial access tokens should be audience-bound, short-lived, single-use, and bound to the admitted client key. Prefer asymmetric client authentication and sender-constrained access tokens for higher-risk capabilities.

Clients should use an OS keychain, HSM, workload-identity broker, or dedicated secret manager. Never pass secrets through model context, prompts, tool descriptions, URLs, issue trackers, or shell history. Rotation and deletion use the underlying credential system.

## Replay, races, and confused deputies

- Idempotency records are scoped to authenticated client, target resource, and body digest.
- Evidence, action challenges, and admission grants require nonce/jti replay protection when their formats support it.
- The service increments revisions atomically; late action results cannot overwrite a newer denial, expiry, cancellation, or revocation.
- Provisioning is transactional or compensating: a revoked/failed admission cannot leave an active client or entitlement behind.
- Every token and evidence presentation is audience- and resource-bound. A provider must not accept a token obtained for another API, tenant, environment, or MCP server.
- A client acting for multiple people/organizations keeps their admission, consent, token, and credential state separate.

## Abuse resistance

Machine-readable registration can amplify spam, account farms, enumeration, evidence-verification cost, reviewer overload, and credential minting. Providers should authenticate before expensive work, rate-limit by multiple signals, cap concurrent pending requests, deduplicate requests, budget evidence fetches, apply proof-of-work or fees only where justified, and monitor issuer/reviewer collusion.

Error differences can enumerate organizations, accounts, policy lists, or reviewers. Return stable coarse codes, disclose detail only to authorized requesters, and avoid timing differences where practical. Discovery may omit sensitive conditional rules.

Agents may optimize adversarially against published requirements. Satisfying the published minimum never forces `ALLOW`; provider policy can add a justified step-up, review, or denial. Policy changes should preserve auditability and avoid discriminatory proxy signals.

## Revocation and failure behavior

Revocation is a lifecycle state plus enforcement work, not just a JSON update. The provider must disable or constrain applicable registration, credentials, tokens, account flags, and resource-server entitlements. Token revocation (RFC 7009), dynamic registration management (RFC 7592), and Shared Signals can carry parts of that work; their semantics remain unchanged.

Readiness fails closed when admission is revoked, provisioning is incomplete, required consent is missing, credential state cannot be established, or an authoritative dependency is unavailable for a high-risk capability. Low-risk deployments may document a bounded degraded mode, but cannot report `ready: true` based solely on possession of a credential.

Clients use the same idempotency key after ambiguous write failures, obey polling and rate limits, and stop on unknown decision/state enum values. A vanished status URI is an operational error requiring provider recovery; it is not permission.

## Audit requirements

Audit records should cover request/admission/action identifiers, authenticated actor, capability/resource/environment, evidence type and issuer identifiers, verification outcome, policy version, decision/reason, state revision, human actor role, provisioning identifiers, readiness outcome, revocation, and timestamps.

Use hashes or opaque identifiers for sensitive artifacts. Audit access and retention must be controlled. Logs must never contain raw secrets or private keys, and should avoid raw personal evidence.

## Supply-chain and implementation concerns

Schema validation does not make input safe. Implementations need parser limits, duplicate-key handling, canonical comparison rules, dependency pinning, secure update processes, and fuzzing. Action schemas and extension fields can become code-execution vectors if a generic agent treats them as instructions; clients must allowlist understood action types and render untrusted text as data.

The examples use reserved domains and obviously fake handles. They are not test credentials. The repository validator is development tooling, not a security verifier or reference implementation.

## Reporting vulnerabilities

This repository is a proposal and has no production endpoint. Report specification vulnerabilities privately to the repository maintainers once a public security contact exists. Until then, avoid publishing an exploit against a named implementation without following that implementation's disclosure policy.

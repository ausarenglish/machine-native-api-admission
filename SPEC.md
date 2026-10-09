# Machine-Native API Admission 0.1

**Status:** Public-review draft<br>
**Short name:** MNAA (provisional)<br>
**Date:** 2026-10-09

## 1. Conventions

The key words **MUST**, **MUST NOT**, **REQUIRED**, **SHALL**, **SHALL NOT**, **SHOULD**, **SHOULD NOT**, **RECOMMENDED**, **NOT RECOMMENDED**, **MAY**, and **OPTIONAL** are to be interpreted as described by BCP 14 when, and only when, they appear in all capitals.

All protocol endpoints in this draft use HTTPS and JSON. JSON objects are governed by the schemas in [`schemas/`](schemas/). Times are RFC 3339 `date-time` strings in UTC. Media type registration is future work; version 0.1 uses `application/json`.

## 2. Scope

MNAA standardizes the provider-facing control plane by which a requester seeks admission for one principal to one capability at one protected resource, satisfies evidence or human gates, receives a provisioning handoff, checks actual readiness, and observes expiration or revocation.

MNAA does not standardize:

- authentication of people, organizations, workloads, or clients;
- user consent or the authority a represented person delegates;
- OAuth grants, scopes, tokens, client registration, or token validation;
- evidence formats, identity proofing methods, or trust-anchor governance;
- provider policy, risk classification, legal terms, or human-review procedure;
- a capability ontology, agent runtime, tool protocol, workflow engine, or secret store.

A deployment can use MNAA without OAuth. When it does use OAuth, Sections 8 and 10 define the handoff and separation of concerns.

## 3. Terms and actors

**Capability** — a stable provider-defined operation class such as `listing.create`. It is not necessarily an OAuth scope; the discovery document maps it to authorization requirements.

**Requester** — the administrative entity seeking provider admission, commonly an organization or developer.

**Client instance** — software that executes the flow. An agent can be one client instance or can direct one. Its authenticated identity is not proof of the requester's claims.

**Represented party** — a person or organization on whose behalf the capability will be used. This party can be absent for workload-only use.

**Resource owner** — the OAuth role that can grant access to a protected resource. It can, but need not, be the represented party.

**Admission service** — the provider component that evaluates requests and owns the admission lifecycle.

**Evidence issuer/verifier** — an authority that issues evidence, or the component that validates it and reports an assessment.

**Authorization server (AS)** — the OAuth component that issues access tokens after an applicable grant.

**Resource server (RS)** — the component that enforces authorization and admission when the capability is invoked.

**Provisioner** — the provider component that registers a client, creates an account binding, enables a feature, or otherwise prepares access. It may be the admission service or AS.

**Human approver/reviewer** — respectively, a person with authority for the requester/represented party, or a provider operator with authority to apply provider policy.

**Readiness service** — the authoritative component that evaluates whether the specific capability can be used now.

### 3.1 Four distinct questions

Implementations MUST keep these questions distinct:

1. **Authentication:** who or what presented this request?
2. **Delegated authorization/consent:** what may the client do on behalf of the resource owner?
3. **Provider admission:** will the provider onboard and enable this requester/client/capability under provider policy?
4. **Runtime permission:** may this concrete operation proceed now?

Success at one layer MUST NOT be interpreted as success at another. In particular, successful authentication, an `ALLOW` decision, a client identifier, or possession of an access token MUST NOT by itself imply readiness or runtime permission.

## 4. Trust boundaries and enforcement

The client is untrusted input. The admission service MUST authenticate it by a deployment-selected mechanism, validate all submitted data, and independently verify evidence before relying on it. Self-asserted claims MUST NOT be presented as verified evidence.

The admission service owns admission decisions and lifecycle. The AS owns grants and token issuance. The RS is the final policy enforcement point for API use and MUST check token validity, audience, authorization, and current admission state, directly or through an authoritative provider control. The provisioner MUST enforce the bounds of the admission grant when creating or updating access. The readiness service MUST query authoritative state rather than trust client claims.

No client-supplied issuer URL, verification key, redirect URI, action URL, or credential reference becomes trusted merely because it is syntactically valid.

## 5. Discovery

### 5.1 Location

An OAuth protected resource SHOULD advertise `capability_admission_uri` as an extension member of its RFC 9728 Protected Resource Metadata document. Consumers that do not understand it ignore it as required by RFC 9728.

A non-OAuth API, or a client beginning with the resource origin, MAY retrieve the same document from a path-aware well-known URI constructed like RFC 9728 using the suffix `capability-admission`. Registration of that suffix is not part of this draft; deployments using it before registration are experimental.

The discovery response MUST conform to [`schemas/discovery.schema.json`](schemas/discovery.schema.json). Its `resource` MUST exactly match the resource identifier the client intended to access. A client MUST reject mismatches.

### 5.2 Capability declarations

Each capability declaration includes:

- a provider-stable `id`;
- a human-readable `description`;
- the supported `environments`;
- declared evidence requirements, including whether each is always required or can be requested conditionally;
- `authorization`, mapping the capability to an existing mechanism such as OAuth scopes and grant types; and
- a `readiness_check` identifier understood by the provider.

Discovery requirements are planning hints, not a promise of admission and not a complete disclosure of provider policy. A provider MAY request additional evidence through `STEP_UP` when justified by policy or request context. It MUST identify the additional requirement precisely enough to act on.

Clients MUST NOT infer that an undisclosed policy check was skipped. Providers SHOULD avoid publishing sensitive fraud thresholds.

## 6. Admission request

The client creates a request with `POST` to `admission_requests_endpoint`. It MUST send an `Idempotency-Key` header and an [`admission-request`](schemas/admission-request.schema.json) body.

The body binds:

- `request_id`: a globally unique, client-generated URI or UUID URN;
- `resource`, `environment`, and exactly one `capability`;
- `requester` and authenticated `client_instance` identifiers;
- OPTIONAL `represented_party` identity, without implying consent;
- the intended `authorization` mechanism and requested scopes/details;
- `claims`: explicitly self-asserted facts; and
- `evidence`: presentations or references with provenance and freshness metadata.

The admission service MUST bind the authenticated caller to `client_instance.id` and MUST reject a mismatch. It MUST NOT treat `requester`, `represented_party`, claims, or evidence metadata as verified until the relevant verification succeeds.

### 6.1 Identifiers and comparison

`request_id` is client-generated and MUST NOT be reused for a materially different request. `admission_id` is provider-generated, globally unique within the issuer, opaque to clients, and immutable for the lifecycle. `action_id` is unique within an admission and remains stable across revisions. `evidence_id` identifies one presented artifact or assertion; changing the artifact requires a new identifier. `client_id` retains the semantics of its underlying registration protocol and is never used as an admission identifier.

URI identifiers, capability identifiers, environment identifiers, admission IDs, action IDs, evidence IDs, issuer IDs, and key bindings are compared as case-sensitive strings unless their defining standard explicitly requires another comparison. Clients and servers MUST NOT normalize, decode/re-encode, or infer hierarchy before comparison. Display names are never identifiers.

### 6.2 Idempotency

For at least 24 hours, or the advertised `idempotency_ttl`, whichever is longer, the admission service MUST bind an `Idempotency-Key` to the authenticated client, target resource, and exact request body. Repeating the tuple MUST return the same admission resource without re-running non-idempotent effects. Reusing the key with a different body or target MUST return `409 idempotency_conflict`.

This requirement does not force a policy decision to remain stale. A repeated creation returns the same admission resource, whose current status can change.

### 6.3 Evidence classes

`claims` are self-asserted even when transported over an authenticated channel.

Each evidence item declares a `type`, `format`, subject, issuer, issuance and expiration times when available, and either an inline `presentation` or a dereferenceable `reference`. The client declaration is provenance input, not a verification result. The provider records its result in `evidence_assessments` with `verification` equal to `verified`, `failed`, `unverified`, `stale`, or `not_applicable`.

An admission service MUST apply local trust policy to the issuer, verifier, proof method, audience, subject binding, capability binding, freshness, status/revocation, and replay properties. A valid signature proves only control of a signing key; it does not establish that the signer is trusted or that the claims satisfy policy.

Sensitive evidence SHOULD be transmitted by an audience-bound presentation or one-time reference. Discovery and status documents MUST NOT expose secrets.

## 7. Decisions and lifecycle

### 7.1 Evaluation outcomes

Every completed policy evaluation produces exactly one `decision`:

- `ALLOW` — the admission service currently permits provisioning for the bounded request.
- `STEP_UP` — the request may become allowable after one or more machine-satisfiable or authority-compatible actions.
- `HUMAN_REVIEW_REQUIRED` — a human action or provider human judgment is required. Automation MUST NOT fabricate or bypass it.
- `DENY` — the request is not permitted under current policy. Reasons state whether and when a materially changed request can be made.

These are evaluation outcomes, not lifecycle states. `PENDING` and `REVOKED` are intentionally not decisions.

Enforcement is explicit:

| Outcome | Immediate enforcer behavior |
| --- | --- |
| `ALLOW` | Admission service marks the bounded request approved; the provisioner may act only within those bounds. The AS and RS still enforce authorization and runtime policy. |
| `STEP_UP` | Admission service withholds provisioning until it verifies the required action/evidence and re-evaluates. |
| `HUMAN_REVIEW_REQUIRED` | Admission service withholds provisioning; the human-interaction system authenticates the named actor and the admission service/provider reviewer re-evaluates after the human action. |
| `DENY` | Admission service ends the request as denied; provisioner MUST create no access and existing access is unaffected unless a separate revocation decision says otherwise. |

### 7.2 Lifecycle states

An admission resource has one authoritative `state`:

- `pending` — accepted and being evaluated or awaiting provider work; no client action is presently required;
- `action_required` — at least one open action is assigned to the client, requester, represented party, or other named approver;
- `approved` — latest decision is `ALLOW`, provisioning is authorized, and the admission has not expired or been revoked;
- `denied` — latest decision is `DENY`;
- `expired` — its validity or action deadline elapsed;
- `revoked` — a previously approved admission has been withdrawn;
- `cancelled` — the requester/provider ended the workflow without a denial decision.

Valid decision/state combinations are:

| Decision | Resulting state |
| --- | --- |
| `ALLOW` | `approved` |
| `STEP_UP` | `action_required` |
| `HUMAN_REVIEW_REQUIRED` | `action_required` when a named human must act; `pending` after that action while provider review continues |
| `DENY` | `denied` |

`expired`, `revoked`, and `cancelled` preserve the most recent decision, if any, as historical information. Their state is authoritative. A revoked resource MUST NOT be treated as approved even if its last decision is `ALLOW`.

### 7.3 State transitions

```text
             +------------------+
POST ------> | pending          |
             +--+---+--------+--+
                |   |        |
         STEP_UP|   |ALLOW   |DENY
                v   v        v
   +-----------------+  +----------+
   | action_required |  | denied   |
   +---+----------+--+  +----------+
       |          |
 submit/approve   | deadline/cancel
       v          v
   +---------+  +-------------------+
   | pending |  | expired/cancelled |
   +----+----+  +-------------------+
        | ALLOW
        v
   +----------+     policy/security/consent change
   | approved | ------------------------------------> revoked
   +----+-----+
        | validity end
        v
     expired
```

A provider MAY transition directly from initial evaluation to any decision-compatible state. It MUST increment `revision` on every observable change. State transitions MUST be monotonic with respect to an individual revision; historical revisions MUST NOT be rewritten.

## 8. Actions, asynchronous completion, and resumption

An action contains a stable `action_id`, `type`, assigned `actor`, status, expiry, a safe description, and instructions. The actor values distinguish `client_instance`, `requester_administrator`, `represented_party`, and `provider_reviewer`.

A client MAY execute an action automatically only when:

1. `actor` is `client_instance`;
2. the action is within its pre-existing authority;
3. completing it does not purport to create human consent, accept legal terms for another party, or satisfy a human identity check; and
4. the action type and input contract are understood.

For any human action, the response MUST identify the capability, provider, requesting client, assigned human role, consequence, expiry, and an HTTPS `interaction_uri` on a provider or explicitly trusted authority origin. A client MUST display those facts before navigation and MUST NOT follow an action URI whose origin violates local trust policy.

Action results are submitted idempotently to `POST {status_uri}/actions/{action_id}` using [`action-submission.schema.json`](schemas/action-submission.schema.json) and an `Idempotency-Key`. The service MUST reject results for a different admission, action, actor binding, or expired challenge.

The client tracks asynchronous work by `GET status_uri`. A non-terminal status response MUST provide `poll_after` in seconds. Clients MUST NOT poll before that interval, SHOULD use conditional requests with `ETag`, MUST apply bounded exponential backoff after transport errors, and MUST honor `Retry-After`. `404` for a previously valid status URI is a protocol error, not proof of denial or revocation.

The `resume_token` is an opaque, audience-bound continuation handle, not a credential or admission grant. If present, clients MUST store it confidentially and return it only to the named status/action endpoint. A client that loses it re-authenticates; loss MUST NOT change the admission decision.

## 9. Status responses and errors

Status responses conform to [`admission-status.schema.json`](schemas/admission-status.schema.json). They contain stable identifiers, revision, state, current or last decision, reason codes, actions, evidence assessments, validity, and provisioning instructions when approved.

Reason codes are stable machine values; `detail` is explanatory and MUST NOT be parsed for behavior. A `DENY` response MUST state `retryable` and SHOULD include `retry_after` or the kind of material change required when retryable. It MUST NOT expose fraud rules, reviewer private notes, or personal data not required by the caller.

Protocol errors use an RFC 9457-style problem document conforming to [`problem.schema.json`](schemas/problem.schema.json). Admission policy outcomes use status resources, not HTTP error codes. Typical creation responses are `201` for a new resource and `200` for an idempotent replay. `202` MAY be used for accepted asynchronous action submission. Authentication and authorization failures at MNAA endpoints use `401` and `403`; malformed input uses `400` or `422`; rate limiting uses `429` with `Retry-After`.

Clients retry `408`, `425`, `429`, and `5xx` only when the method is idempotent or carries the same idempotency key. They MUST NOT automatically retry `DENY`, `401`, `403`, `409 idempotency_conflict`, or invalid evidence without a material change.

## 10. Provisioning and authorization handoff

An approved response includes one or more `provisioning` entries. Each names an existing protocol, endpoint/issuer, registration mode, required scopes or authorization details, and the admission-bound mechanism accepted by the provisioner.

For OAuth, version 0.1 supports these modes:

- `pre_registered`: the existing `client_id` is referenced;
- `client_id_metadata_document`: the `client_id` is an HTTPS metadata-document URL, when supported by the AS;
- `dynamic_client_registration`: the client uses RFC 7591, optionally with a one-time initial access token delivered by a confidential `credential_reference`; or
- `manual`: a precise human action is required because the provider has no machine registration path.

MNAA does not redefine any of these modes. An admission-bound initial access token is authorization to call a registration endpoint; it is not an API access token. DCR's registration response, OAuth's authorization endpoint, and OAuth's token endpoint retain their standard semantics.

Credential material MUST NOT appear in discovery, logs, reason text, or examples. A `credential_reference` identifies material held in a provider-approved secret channel or broker. Dereferencing, storage, rotation, and deletion are deployment concerns and MUST meet the underlying protocol's requirements. Bearer admission grants SHOULD be avoided; where unavoidable they MUST be short-lived, single-use, audience-bound, capability-bound, and delivered only to the authenticated client.

User consent remains an OAuth authorization interaction (or another declared authorization mechanism) and is not satisfied by `ALLOW`. Conversely, resource-owner consent does not force the provider to admit the client.

The provisioner MUST constrain created access to the admitted resource, environment, capability, requester, client binding, and validity. It MUST reject scope, redirect URI, grant type, or resource escalation. The AS SHOULD issue sender-constrained tokens where supported and appropriate.

## 11. Readiness

After provisioning and any delegated authorization, the client MUST call `readiness_endpoint` with a [`readiness-request`](schemas/readiness-request.schema.json). It sends identifiers and non-secret references, never raw credentials.

The readiness service returns [`readiness-response.schema.json`](schemas/readiness-response.schema.json) with `ready` and checks for at least:

- active admission for the exact capability/resource/environment;
- provisioning completion;
- authorization or consent required by the capability;
- current credential/token status or the ability to obtain a token;
- provider account/capability enablement; and
- any current policy suspension, expiration, or revocation.

`ready: true` is a time-bounded observation, not a guarantee that a later operation will succeed. The RS remains authoritative for runtime enforcement. A false result MUST name actionable failed checks without leaking secrets. The client MUST NOT call the capability merely because it possesses a credential when readiness is false.

## 12. Expiration, revocation, and recovery

Approved admission MUST have an `expires_at` or explicitly declare provider-managed indefinite validity. Discovery MAY advertise maximum validity. Providers SHOULD prefer bounded validity for sensitive capabilities.

On revocation, the admission service sets `state: revoked`, increments `revision`, records a safe reason and `revoked_at`, and triggers the provider's underlying controls. Depending on the mechanism those can include RFC 7009 token revocation, RFC 7592 client management, credential disablement, account feature removal, or a Shared Signals event. MNAA does not claim that changing its status alone revokes a token.

The AS, provisioner, and RS MUST enforce revocation within the provider's documented propagation objective. If immediate distributed enforcement is not available, readiness MUST fail closed for the revoked capability and the security documentation MUST state the exposure window.

Recovery guidance is returned as actions or reasons. A client can refresh expired evidence, repeat authorization after consent expiration, rotate a compromised key through the underlying mechanism, or create a new admission request after a retryable denial. It MUST NOT silently substitute a different requester, represented party, resource, environment, or capability into an existing admission.

## 13. Privacy and data minimization

Providers MUST request only evidence necessary for the capability and SHOULD accept selective-disclosure or reference-based evidence where available. They MUST publish retention purpose or a link to it. Clients SHOULD disclose the minimum claims and MUST obtain appropriate authority before submitting another person's data.

Status responses SHOULD be audience-restricted and cache-controlled as private/no-store when they contain personal or security-sensitive data. Logs use identifiers, types, hashes, and outcomes; they MUST NOT contain access tokens, refresh tokens, client secrets, resume tokens, raw identity documents, or private keys.

## 14. Versioning and extensibility

`spec_version` is `0.1` for this draft. Additive fields are permitted; recipients MUST ignore unknown fields unless a schema or negotiated extension marks them critical. Enum values are closed in v0.1: an unknown decision, lifecycle state, actor, or action status MUST fail closed.

Capability identifiers and reason codes are provider namespaces. Evidence types SHOULD be collision-resistant URIs when intended for cross-provider use. Schema identifiers are stable within a published version.

Breaking changes require a new specification version and schema identifiers. The discovery document advertises supported versions. There is no downgrade negotiation: the client selects a mutually understood version or stops.

## 15. IANA and registry considerations

This draft makes no registration request. Before standards-track adoption, reviewers should decide whether to register a Protected Resource Metadata field, a well-known suffix, and media types. Until then, implementations are experimental and SHOULD use explicit bilateral configuration rather than assume global registration.

## 16. Normative implementation surface

The normative JSON contracts are:

1. discovery;
2. admission request;
3. action submission;
4. admission status;
5. readiness request and response; and
6. problem details.

No other wire object is required. Providers can internally use AuthZEN, policy engines, queues, review systems, registries, OAuth servers, vaults, and event systems without exposing those internals.

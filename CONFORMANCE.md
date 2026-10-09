# Conformance

Conformance is observable at the protocol boundary. An implementation may use any internal policy engine, queue, review system, OAuth server, secret store, or database.

## Roles and profiles

An implementation claims one or more roles:

- **Discovery Provider** — publishes a valid discovery document.
- **Admission Service** — accepts idempotent requests/actions and exposes lifecycle state.
- **Admission Client** — consumes discovery, submits requests/evidence, handles human gates, and resumes safely.
- **Provisioner** — enforces an approved admission while handing off to an existing mechanism.
- **Readiness Service** — computes and returns current composite readiness.
- **Enforcement Integration** — ensures revoked/expired admission prevents capability use.

A “MNAA 0.1 Provider” claim requires Discovery Provider, Admission Service, Provisioner, Readiness Service, and Enforcement Integration. A “MNAA 0.1 Client” claim requires Admission Client.

## Automated repository validation

`npm test` performs development-time checks:

1. all schemas compile as JSON Schema 2020-12;
2. every example body with a repository schema URI validates;
3. example admission IDs, request IDs, resources, capabilities, and revisions remain consistent;
4. decision/state combinations follow the specification;
5. required scenarios are present; and
6. examples contain no obvious private keys, bearer tokens, client secrets, or live hosts.

This validator is not a protocol conformance suite and does not validate signatures, OAuth, trust, HTTP authentication, or provider policy.

## Positive tests

| ID | Role | Stimulus | Required observation |
| --- | --- | --- | --- |
| D-01 | Discovery Provider | GET the advertised admission URI | `200`; document validates; exact resource match; supported `spec_version`; all endpoint URLs use HTTPS. |
| D-02 | Client | Discovery contains an unknown additive member | Client ignores it and continues. |
| A-01 | Admission Service | Valid low-risk request with trusted, fresh evidence and new idempotency key | `201`; stable admission/status URI; `ALLOW` + `approved`; bounded provisioning entry. |
| A-02 | Admission Service | Byte-equivalent request repeated with same authenticated client and idempotency key | Same admission resource; no duplicate client, review, or credential side effect. |
| A-03 | Admission Service | Medium-risk request missing conditionally required evidence | `STEP_UP` + `action_required`; precise evidence action; no provisioning authority yet. |
| A-04 | Client | Machine action assigned to `client_instance`, understood, and within prior authority | Client may complete it and submits the bound result idempotently. |
| A-05 | Admission Service | Valid action result for current revision/challenge | Action becomes complete; revision increments; request is re-evaluated. |
| H-01 | Admission Service | Policy requires an account administrator | `HUMAN_REVIEW_REQUIRED`; action names actor, consequence, provider interaction URI, and expiry. |
| H-02 | Client | Human action returned | Client presents exact provider/client/capability/consequence and does not claim completion itself. |
| P-01 | Client/Service | Human approval complete but provider review unfinished | State becomes/remains `pending`; latest decision can remain `HUMAN_REVIEW_REQUIRED`; `poll_after` supplied. |
| P-02 | Client | Polling an unchanged resource | Honors `poll_after`, conditional request/ETag, `Retry-After`, and backoff. |
| O-01 | Admission Service | Policy prohibits request context | `DENY` + `denied`; stable safe reason; retryability explicit; no provisioning entry. |
| V-01 | Provisioner | Approved DCR handoff requests only admitted metadata/scopes | DCR proceeds under RFC 7591; any initial access token is confidential, short-lived, and constrained. |
| V-02 | Provisioner | Approved OAuth user flow | OAuth obtains resource-owner permission separately; admission does not synthesize consent. |
| R-01 | Readiness Service | Active admission, provisioning complete, required authorization active, credential usable | `ready: true`; all required checks pass; result is time-bounded. |
| R-02 | Readiness Service | Admission revoked after credentials were issued | `ready: false`; admission check fails; credential possession does not override. |
| X-01 | Enforcement Integration | Call after admission revocation | Capability is denied within documented propagation objective even if an access token is otherwise unexpired. |

## Negative tests

| ID | Role | Stimulus | Required observation |
| --- | --- | --- | --- |
| N-01 | Client | Discovery `resource` differs from intended resource | Reject metadata; do not submit evidence or credentials. |
| N-02 | Service | Authenticated caller does not bind to `client_instance.id` | Reject with authentication/authorization problem; create no admission. |
| N-03 | Service | Same idempotency key, changed body or resource | `409 idempotency_conflict`; no side effect. |
| N-04 | Service | Self-asserted claim labeled as organization ownership | It remains unverified and cannot satisfy a verified-evidence requirement. |
| N-05 | Service | Correctly signed evidence from an untrusted issuer | Assessment is failed/unverified; not accepted solely for signature validity. |
| N-06 | Service | Evidence has wrong audience, subject/client binding, capability, environment, nonce, or is stale/revoked/replayed | Reject evidence; return safe reason or a new bound action as policy permits. |
| N-07 | Client | Action has unknown type/actor or untrusted interaction origin | Fail closed; do not execute or navigate automatically. |
| N-08 | Service | Late action result after denial, expiry, cancellation, revocation, or challenge replacement | Reject without changing current state. |
| N-09 | Client | `HUMAN_REVIEW_REQUIRED` action assigned to a person | Do not automate approval, consent, legal acceptance, or identity proof. |
| N-10 | Provisioner | Client asks for extra scope, redirect URI, grant type, resource, environment, requester, or key | Reject escalation; preserve admission bounds. |
| N-11 | Client | Possesses client ID/token but readiness is false or unavailable | Do not declare capability ready. |
| N-12 | Client | Unknown decision or lifecycle enum | Fail closed; surface incompatibility. |
| N-13 | Service | Status lookup unauthenticated or by wrong tenant | Return `401`/`403` without existence disclosure. |
| N-14 | Service | Referenced evidence URL points to private/link-local host under disallowed policy | Do not fetch; record safe verification failure. |
| N-15 | Service | Revocation requested during provisioning race | Atomic/compensating control leaves no usable entitlement; state ends `revoked`. |

## Scenario coverage in this repository

- [`examples/01-catalog-automatic.json`](examples/01-catalog-automatic.json): D-01, A-01, A-02, V-01, R-01.
- [`examples/02-listing-step-up.json`](examples/02-listing-step-up.json): A-03 through A-05 and V-02.
- [`examples/03-transfer-human-review.json`](examples/03-transfer-human-review.json): H-01, H-02, P-01, P-02.
- [`examples/04-transfer-denied.json`](examples/04-transfer-denied.json): O-01.
- [`examples/05-revocation-readiness-failure.json`](examples/05-revocation-readiness-failure.json): R-02 and X-01.

## Implementation report template

A public implementation report should state:

- implementation/version and claimed roles;
- discovery URI and supported spec versions;
- supported evidence formats and how trust anchors are configured;
- supported provisioning/authorization mechanisms;
- credential-delivery and secret-storage model;
- polling limits and admission validity;
- revocation propagation objective;
- passed/failed/not-applicable test IDs with evidence; and
- all extensions and draft-standard dependencies, including pinned versions.

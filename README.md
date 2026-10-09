# Machine-Native API Admission

> Draft proposal, version 0.1. The name is provisional.

Machine-Native API Admission (MNAA) is a small interoperability profile for the provider-controlled process that happens **before and around** API authorization:

`capability discovery -> provider admission -> authorization/provisioning -> readiness`

OAuth answers how a client obtains and uses delegated authority. It does not standardize how a previously unknown client discovers a provider's onboarding rules, submits organizational or workload evidence, waits for provider review, receives a constrained provisioning handoff, or proves that a capability is actually ready. Today those steps are often a developer portal, a form, an email thread, and a manually copied credential.

MNAA makes that control-plane workflow machine-readable while preserving human participation at real consent, identity, security, policy, and legal gates. It is designed as a profile over existing standards, not as a new authentication system, agent framework, credential format, or authorization protocol.

## What this proposal standardizes

- discovery of capability-specific admission requirements;
- an idempotent admission request and evidence envelope;
- four evaluation outcomes: `ALLOW`, `STEP_UP`, `HUMAN_REVIEW_REQUIRED`, and `DENY`;
- a lifecycle distinct from those decisions, including pending, approved, expired, revoked, and cancelled states;
- precise machine and human actions, resumable polling, and actionable errors;
- a provisioning handoff to OAuth or another provider-selected mechanism;
- an explicit readiness check that prevents “has a credential” from meaning “can use the capability”; and
- evidence provenance, freshness, verification results, and separation of self-asserted claims from externally verifiable evidence.

It deliberately delegates authentication, user consent, token issuance, client registration, credential storage, identity proofing, workload identity, and resource-server enforcement to established mechanisms. See [PRIOR_ART.md](PRIOR_ART.md).

## Relationship to CAPP

In the earlier CAPP architecture discussion, capability discovery and capability use were separated by a control-plane boundary. MNAA makes that boundary concrete. It begins once an agent has selected a provider capability and ends only when the provider reports that the requested capability is ready (or the request is denied, expired, cancelled, or revoked). CAPP can orchestrate the flow; MNAA does not prescribe the agent runtime, planning model, tool protocol, or policy engine.

## Concrete example

The repository models a fictional marketplace:

| Capability | Provider policy | Flow |
| --- | --- | --- |
| `catalog.read` | Low risk | Verified workload evidence produces `ALLOW`; OAuth Dynamic Client Registration (DCR) and client credentials complete provisioning. |
| `listing.create` | Medium risk | Initial `STEP_UP` requests fresh organization evidence; an OAuth authorization-code flow separately captures the seller's delegated permission. |
| `money.transfer` | High risk | `HUMAN_REVIEW_REQUIRED`; the designated account administrator approves, provider review remains pending, then policy can allow or deny. |

The examples also show a prohibited-jurisdiction denial, pending review and resumption, post-approval revocation, and readiness failure. They are fictional and make no real transactions.

The eBay developer experience motivates the problem: eBay documents developer-program enrollment, application naming, contact confirmation, separate keysets, user consent, compliance steps, and review for some production access. eBay also exposes OAuth token flows. This proposal does **not** claim eBay supports MNAA, DCR, or these fictional capabilities. See [PRIOR_ART.md](PRIOR_ART.md#provider-motivation-ebay).

## Repository map

- [SPEC.md](SPEC.md) — normative v0.1 protocol draft.
- [PRIOR_ART.md](PRIOR_ART.md) — standards comparison and gap analysis.
- [SECURITY.md](SECURITY.md) — trust model and abuse analysis.
- [CONFORMANCE.md](CONFORMANCE.md) — observable requirements and tests.
- [OPEN_QUESTIONS.md](OPEN_QUESTIONS.md) — decisions intentionally left for review.
- [`schemas/`](schemas/) — JSON Schema 2020-12 contracts.
- [`examples/`](examples/) — complete HTTP exchange transcripts represented as JSON.
- [`scripts/validate.mjs`](scripts/validate.mjs) — schema/example validator, not a protocol implementation.

## Validate locally

Requires Node.js 20 or newer.

```sh
npm ci
npm test
```

The validator checks every embedded contract body against its declared schema and runs cross-message invariants for identifiers, lifecycle/decision combinations, secret-free examples, and the documented scenario coverage.

## Status and scope

This is a discussion draft, not an IETF, OpenID Foundation, MCP, or provider standard. The `urn:example:` identifiers, hosts, tokens, organizations, people, and policy reasons are illustrative. No admission server, authorization server, credential issuer, policy engine, or production readiness service is implemented here.

The draft is intentionally small. It does not define a universal capability ontology, proof format, trust registry, policy language, human identity system, or general workflow engine.

## Contributing

Review is most useful when it tests the boundary: can an existing OAuth/MCP/identity mechanism be composed instead of adding a field here, and is every remaining field necessary for interoperable admission or provisioning? Please open an issue with a concrete flow or conformance case.

Licensed under MIT. Contributions are expected to be compatible with that license.

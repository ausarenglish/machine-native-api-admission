# Prior art and gap analysis

Research cut-off: **2026-10-09**. This document prefers primary specifications and provider documentation. “RFC” means an adopted IETF publication; “Final” means the named standards body's final specification; “draft” means work in progress and can change.

## Finding

The gap is real but narrow. Existing standards already supply nearly every security primitive and most protocol legs. They do not supply a common provider-admission lifecycle that starts with capability-specific onboarding requirements and ends with verified readiness.

MNAA should therefore be a **profile and orchestration contract over existing standards**. Its novelty claim is limited to a common envelope and state model for the seams among provider policy evaluation, evidence collection, human gates, registration/provisioning, authorization, and readiness.

## Comparison

| Work | Status at cut-off | What it solves | What it does not solve for this problem |
| --- | --- | --- | --- |
| [OAuth 2.0 (RFC 6749)](https://www.rfc-editor.org/rfc/rfc6749.html), [Bearer Tokens (RFC 6750)](https://www.rfc-editor.org/rfc/rfc6750.html), and [OAuth Security BCP (RFC 9700)](https://www.rfc-editor.org/rfc/rfc9700.html) | RFC / adopted | Delegated authorization, token issuance/use, and current security guidance. | Provider onboarding, organizational eligibility, evidence collection, manual review, account enablement, or end-to-end readiness. |
| [Authorization Server Metadata (RFC 8414)](https://www.rfc-editor.org/rfc/rfc8414.html) and [Protected Resource Metadata (RFC 9728)](https://www.rfc-editor.org/rfc/rfc9728.html) | RFC / adopted | Discovery of authorization endpoints and protected-resource relationships/capabilities. RFC 9728 permits extension metadata and signed metadata. | Capability-specific admission workflows or their lifecycle. MNAA composes here by advertising one admission document. |
| [Dynamic Client Registration (RFC 7591)](https://www.rfc-editor.org/rfc/rfc7591.html) and [Dynamic Client Management (RFC 7592)](https://www.rfc-editor.org/rfc/rfc7592.html) | RFC / adopted | Client metadata submission, optional software statements/initial access tokens, client identifier/credential issuance, and registration management. | RFC 7591 explicitly leaves issuance of initial access tokens and software statements, and much trust policy, out of scope. It does not discover provider evidence requirements or model review. MNAA can produce the constrained handoff into DCR. |
| [OAuth Client ID Metadata Document](https://datatracker.ietf.org/doc/html/draft-ietf-oauth-client-id-metadata-document-01) | IETF WG draft `-01` / work in progress | Uses an HTTPS metadata-document URL as `client_id`, avoiding per-AS preregistration in compatible deployments. | The document is client-published metadata, not provider admission. It does not establish that claims are trusted, that a capability is enabled, or that human/legal review is complete. |
| [OAuth Attestation-Based Client Authentication](https://datatracker.ietf.org/doc/html/draft-ietf-oauth-attestation-based-client-auth-09) | IETF WG draft `-09` / work in progress | Key-bound client-instance attestation and an OAuth client-authentication method. | Attestation is evidence about a client instance, not an admission workflow or delegated user permission. MNAA can carry/reference it as one evidence format if provider policy accepts it. |
| [Resource Indicators (RFC 8707)](https://www.rfc-editor.org/rfc/rfc8707.html), [RAR (RFC 9396)](https://www.rfc-editor.org/rfc/rfc9396.html), [PAR (RFC 9126)](https://www.rfc-editor.org/rfc/rfc9126.html), [Token Exchange (RFC 8693)](https://www.rfc-editor.org/rfc/rfc8693.html) | RFC / adopted | Audience restriction, structured authorization details, protected authorization requests, and token delegation/impersonation exchanges. | They describe requested authority and secure authorization exchanges, not whether a provider will admit/provision an unknown requester. RAR is useful when a capability needs transaction-shaped authorization after admission. |
| [Device Authorization Grant (RFC 8628)](https://www.rfc-editor.org/rfc/rfc8628.html) and [OpenID CIBA Core 1.0](https://openid.net/specs/openid-client-initiated-backchannel-authentication-core-1_0-final.html) | RFC / OpenID Final | Human authorization/authentication on a separate device, polling, and decoupled completion patterns. | They do not model general provider review, organization evidence, legal onboarding, or capability provisioning. MNAA borrows the separation and polling pattern rather than redefining those grants. |
| [DPoP (RFC 9449)](https://www.rfc-editor.org/rfc/rfc9449.html) and [OAuth mTLS (RFC 8705)](https://www.rfc-editor.org/rfc/rfc8705.html) | RFC / adopted | Sender-constrained tokens and client authentication. | They reduce credential replay; they do not confer admission or consent. |
| [OpenID Connect Core 1.0](https://openid.net/specs/openid-connect-core-1_0-final.html) and [OpenID Connect for Identity Assurance 1.0](https://openid.net/specs/openid-connect-4-identity-assurance-1_0-final.html) | OpenID Final | End-user authentication and verified-claims/assurance information. Identity Assurance explicitly separates authentication assurance from verification of claims. | Provider-specific client/capability admission. Verified identity can be evidence, but the provider still chooses whether it satisfies policy. |
| [OpenID Federation 1.0](https://openid.net/specs/openid-federation-1_0-final.html) | OpenID Final, approved February 2026 | Multilateral trust chains, entity metadata, trust marks, and policy processing from configured trust anchors. | A universal trust root or admission outcome. A federation can establish why an evidence issuer or client metadata is trusted; MNAA consumes that result. |
| [W3C Verifiable Credentials Data Model 2.0](https://www.w3.org/TR/vc-data-model-2.0/) | W3C Recommendation | A general model for issuer-holder-verifier credentials, presentations, status, and selective disclosure ecosystems. | Which issuer, credential, freshness, or claims a provider accepts; admission lifecycle and provisioning. MNAA does not invent a credential format. |
| [SPIFFE](https://spiffe.io/docs/latest/spiffe-specs/) | Stable community specifications (individual components have stated stability) | Workload identities, trust domains, SVIDs, and a Workload API. | Cross-provider commercial/legal admission or authority to act for a person. An SVID can authenticate a workload and serve as evidence. |
| [AuthZEN Authorization API 1.0](https://openid.net/specs/authorization-api-1_0.html) | OpenID Final, approved January 2026 | A PDP/PEP interface for boolean access decisions; context can carry implementation-defined reasons or obligations. | Client-facing onboarding, asynchronous human/evidence workflow, credential provisioning, or readiness. A provider can use AuthZEN internally to make individual policy decisions. MNAA retains four workflow outcomes because `STEP_UP` and human review are not runtime allow decisions. |
| [Shared Signals Framework, CAEP, and RISC](https://openid.net/wg/sharedsignals/specifications/) | OpenID Final, approved August 2025 | Secure event streams and continuous access/risk signals for cooperating parties. | Admission request/provisioning. They are good candidates for propagating later risk or revocation signals; MNAA still defines the admission state visible to its requester. |
| [MCP Authorization, revision 2026-07-28](https://modelcontextprotocol.io/specification/2026-07-28/basic/authorization) | Published MCP specification | OAuth-based authorization for HTTP transports, RFC 9728 discovery, authorization-server discovery, client registration selection, resource indicators, token audience validation, and scope step-up. | Admission to a provider program, verified organizational eligibility, legal/security review, provisioning outside OAuth, or proof that a tool is operational after token acquisition. MNAA can be advertised beside an MCP protected resource; MCP remains the transport authorization mechanism. |

### Drafts are inputs, not foundations

Version 0.1 does not normatively depend on OAuth 2.1, Client ID Metadata Documents, attestation-based client authentication, or other Internet-Drafts. Discovery can advertise those options, but conformance can be achieved with adopted OAuth 2.0 RFCs or with a non-OAuth provisioning mechanism. Implementers must pin and reassess draft versions.

## What can already be composed

A provider can build most of the path today:

1. Publish the resource and AS relationship with RFC 9728 and RFC 8414.
2. Identify/register the client through preregistration, RFC 7591, or (experimentally) a Client ID Metadata Document.
3. Authenticate a workload with mTLS, private-key JWT, SPIFFE, or an attestation-based mechanism.
4. Obtain user authority with an authorization-code flow, device flow, CIBA, or another suitable grant; express structured authority with RAR when needed.
5. Sender-constrain tokens with mTLS or DPoP and bind them to the resource with RFC 8707.
6. Carry organization/person claims with OIDC Identity Assurance, federation trust marks, verifiable credentials, or provider-specific attestations.
7. Revoke tokens with [RFC 7009](https://www.rfc-editor.org/rfc/rfc7009.html), manage DCR registrations with RFC 7592, and distribute continuous-risk signals with Shared Signals.

The provider still has to invent how steps 2–6 are requested, correlated, resumed, reviewed, and declared complete for a particular capability. That is the remaining gap.

## Precise gap statement

No reviewed source above standardizes all of the following as one interoperable, client-facing contract:

- capability-level discovery of provider admission requirements;
- a request that binds the requester, client instance, represented party, target capability, environment, requested authorization, claims, and evidence;
- explicit `ALLOW`, evidence `STEP_UP`, true human review, and actionable `DENY` outcomes;
- an asynchronous lifecycle that distinguishes evaluation outcomes from pending, expiry, cancellation, and revocation;
- a bounded handoff into existing registration, credential, authorization, and consent mechanisms; and
- an authoritative readiness result covering admission, provisioning, authorization, credentials, and current provider enablement.

This is principally an interoperability and automation gap, not a missing cryptographic primitive.

## Provider motivation: eBay

eBay is an example of the human-operated seam, not an asserted adopter.

The current [eBay selling-application guide](https://developer.ebay.com/api-docs/sell/static/dev-app.html) documents joining the developer program, accepting an agreement, registering an application title, confirming contact details, creating separate Sandbox/Production keysets, securing identifiers/secrets, testing, and an application growth check that can take multiple business days. The [restricted-API documentation](https://developer.ebay.com/api-docs/static/gs_use-the-application-growth.html) says production use of restricted APIs requires a growth check. Production keysets can also be disabled pending a marketplace-account-deletion compliance choice in the [get-started guide](https://www.developer.ebay.com/develop/guides/sell/get-started-with-ebay-apis).

Separately, eBay's [token-type documentation](https://developer.ebay.com/api-docs/static/oauth-token-types.html) distinguishes application tokens from user tokens and requires user consent for access to user-owned data. Its [OAuth credential guide](https://developer.ebay.com/api-docs/static/oauth-credentials.html) documents portal-issued client IDs/secrets and the need to protect them.

Those are exactly the layers this proposal keeps distinct: provider admission, provisioning of an application keyset, and OAuth permission from a represented user. The fictional marketplace examples are not eBay API mappings, and nothing in eBay's documentation reviewed here says that eBay supports MNAA, RFC 7591 DCR, or Client ID Metadata Documents.

## Proprietary and ecosystem implementations

Provider developer portals, cloud IAM enrollment, app verification programs, connector catalogs, and enterprise approval systems commonly implement pieces of admission. Their policies and APIs vary, and many are deliberately provider-specific. MCP is an open ecosystem specification rather than an IETF/W3C standard; its authorization profile demonstrates that dynamic tool discovery and OAuth can compose, while also exposing the remaining onboarding seam.

MNAA does not attempt to normalize providers' risk policy. It standardizes the observable questions, state, actions, and handoff so that different policies remain executable by a common client.

# Open questions

These questions are consequential enough to leave visible for public review. None prevents implementing the version 0.1 examples bilaterally.

## 1. Standards home and naming

Should this remain a standalone profile, become an OAuth/MCP extension, or move to a broader API standards venue? OAuth is the dominant provisioning handoff but admission also applies to API keys, contracts, and non-OAuth APIs. The provisional “Machine-Native API Admission” name may overemphasize agents when ordinary automation benefits equally.

**Implication:** the venue determines registry policy, terminology, and whether `capability_admission_uri` belongs in OAuth Protected Resource Metadata.

## 2. Discovery registration

Version 0.1 describes both an RFC 9728 extension member and an experimental path-aware well-known document. Is one sufficient? Should discovery instead use an HTTP `Link` relation?

**Implication:** dual discovery helps non-OAuth APIs but adds surface and requires collision-safe registration.

## 3. Capability identifiers

Provider-local strings are simple and match current API practice. Globally meaningful URI identifiers would compose across brokers but risk becoming a premature universal ontology.

**Version 0.1 choice:** provider-local IDs scoped by the exact `resource`; URI evidence types for cross-provider semantics.

## 4. Decision vocabulary

Are `STEP_UP` and `HUMAN_REVIEW_REQUIRED` sufficiently distinct across ecosystems? `STEP_UP` currently means a satisfiable additional requirement, possibly involving an external verifier, while human review means a human judgment or approval is inherently required.

**Implication:** ambiguity will cause agents either to bother people unnecessarily or attempt to automate genuine consent gates. Conformance tests fail closed on unknown decisions.

## 5. Status delivery

Polling is the only mandatory asynchronous mechanism. Should a future version profile webhooks, WebSub, Shared Signals, SSE, or MCP Tasks?

**Implication:** callbacks lower latency but add receiver authentication, SSRF, replay, endpoint lifecycle, and delivery semantics. The draft keeps them out until real implementations justify one.

## 6. Admission grant representation

Should approval produce a standard signed, key-bound admission receipt, or remain a provider-internal state referenced by `admission_id`? A portable receipt could cross an admission service/AS boundary but creates another security token and verification profile.

**Version 0.1 choice:** opaque references and existing DCR/OAuth mechanisms. No new token format.

## 7. Evidence profile negotiation

The envelope can carry references to existing formats, but different proof systems have different audience, nonce, status, selective-disclosure, and holder-binding semantics. Should later profiles define format-specific requirements for OIDC verified claims, VCs, SPIFFE, client attestations, and federation trust marks?

**Implication:** profiles improve interoperability but can accidentally flatten different assurance meanings. Provider trust policy remains decisive.

## 8. Readiness authority and freshness

Should readiness be a provider endpoint, a safe capability probe at the resource server, or both? How should a provider advertise the maximum acceptable age of a positive result?

**Version 0.1 choice:** provider readiness endpoint plus `checked_at`/`valid_until`; runtime enforcement remains authoritative.

## 9. Revocation propagation objective

Should the protocol require a numerical maximum from admission revocation to resource-server enforcement? Distributed caches and offline credentials make universal timing hard.

**Implication:** without a declared objective, `revoked` can create false confidence. A future field could advertise separate objectives for status, token issuance, and runtime enforcement.

## 10. Policy transparency and appeal

How much denial detail can be standardized without exposing fraud controls or enabling policy gaming? Should appeal be a first-class action type?

**Version 0.1 choice:** stable reason code, safe detail, retryability, and optional remediation; appeals are provider-specific human actions.

## 11. Authorization-details binding

OAuth scopes are insufficient for some high-value operations. A future profile could bind an admission to RFC 9396 Rich Authorization Details templates.

**Implication:** useful for payments and resource-specific grants, but MNAA must not become a transaction authorization protocol. The example keeps `money.transfer` at admission-level human review and performs no transaction.

## 12. Privacy-preserving eligibility

Can zero-knowledge or selective-disclosure presentations prove policy predicates (jurisdiction, certification, age of organization) without disclosing source data, while retaining revocation and audit requirements?

**Implication:** a valuable future evidence profile, not a reason to invent a proof system in this base specification.

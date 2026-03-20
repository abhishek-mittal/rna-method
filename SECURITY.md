# Security Policy

## Supported Versions

| Version | Supported |
|---|---|
| 1.x (current) | ✅ Security fixes |
| < 1.0 | ❌ No longer supported |

---

## Reporting a Vulnerability

**Do NOT open a public GitHub Issue for security vulnerabilities.**

Instead, report vulnerabilities privately:

1. **GitHub Private Advisory (preferred):** Use [GitHub's private security advisory](https://github.com/abhishek-mittal/rna-method/security/advisories/new) to submit a vulnerability report confidentially.

2. **Email:** Send a detailed report to `security@rna-method.dev` with subject line `[RNA-SECURITY] <brief description>`.

Include in your report:
- A description of the vulnerability and its impact
- Steps to reproduce (proof of concept if possible)
- Affected versions
- Any proposed mitigations

---

## What Counts as a Security Issue?

RNA Method is a schema-driven file-generation system (no runtime server in production). Relevant security concerns include:

- **Path traversal** in adapters or tools — any place where user-provided schema values are used to construct file paths
- **Arbitrary command execution** — any case where schema values reach `exec`, `spawn`, or `eval`
- **Secret/credential leakage** — any place where adapter output could inadvertently write secrets into generated files
- **Malicious schema injection** — crafted `rna-schema.json` that causes adapter tools to write files outside the intended output directory

---

## Response Timeline

| Action | Timeline |
|---|---|
| Acknowledgment | Within 48 hours |
| Initial assessment | Within 7 days |
| Fix or mitigation published | Within 30 days (critical: 7 days) |
| CVE request (if applicable) | After fix is shipped |

---

## Disclosure Policy

We follow **coordinated disclosure**:

1. Reporter submits privately
2. Maintainer confirms and assigns severity
3. Fix is developed privately
4. Fix is released + advisory is published
5. Reporter is credited (unless they prefer anonymity)

We will not take legal action against researchers acting in good faith under this policy.

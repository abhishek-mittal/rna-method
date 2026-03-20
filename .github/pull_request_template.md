## What changed

<!-- Bullet list of specific changes. Reference files and line numbers where useful. -->

- 

## Why

<!-- 1–3 sentences explaining the motivation. Link to any related issue: Closes #123 -->



## Testing evidence

<!-- Required. At minimum run the validator and paste the output. -->

```bash
node tools/validate-registry.js --json
```

**Output:**

```
paste here
```

<!-- For adapter changes, also run the adapter against the minimal-collective template and paste the diff of the generated config. -->

---

## Pre-merge checklist

- [ ] PR originates from a **personal fork** (not a direct branch on the upstream repo).
- [ ] `node tools/validate-registry.js` exits `0`.
- [ ] Schema JSON is valid (the `rna-validate` workflow is green).
- [ ] No new `npm` dependencies added without prior discussion.
- [ ] Commit messages follow the [Conventional Commits](https://www.conventionalcommits.org/) format.
- [ ] Docs updated if a public API changed.
- [ ] `CHANGELOG.md` entry added under the correct version (maintainers may do this at merge).

---

**Issue:** <!-- Link: Closes #, Fixes #, or Relates to # -->

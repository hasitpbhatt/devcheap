---
name: Contributing
about: Guidelines for contributing to DevCheap
---

Thank you for your interest in contributing to **DevCheap**! 🎉

We welcome contributions from the community to help make this resource even better. Please take a moment to review these guidelines before submitting your contribution.

---

## 📋 Table of Contents

- [🤝 Code of Conduct](#-code-of-conduct)
- [🚀 How to Contribute](#-how-to-contribute)
  - [Adding Deals](#adding-deals)
  - [Reporting Issues](#reporting-issues)
  - [Suggesting Improvements](#suggesting-improvements)
- [📝 Content Guidelines](#-content-guidelines)
- [🔍 Review Process](#-review-process)
- [🎉 Recognition](#-recognition)

---

## 🤝 Code of Conduct

This project follows the [Contributor Covenant Code of Conduct](https://www.contributor-covenant.org/version/2/1/code_of_conduct/). By participating, you are expected to uphold this code. Please report unacceptable behavior to [GitHub Issues](https://github.com/hasitpbhatt/devcheap/issues).

---

## 🚀 How to Contribute

We enforce a strict **Issue-First** workflow. Before writing any code or modifying the database, please make sure there is an open issue discussing the change.

### 1. Find or Open an Issue
* **Search existing issues** first to avoid duplicates.
* **If adding a new deal/feature:** Open a new Feature/Deals Suggestion issue first to get maintainer alignment on whether it fits the scope of the project.
* **If fixing a bug:** Open a Bug Report issue detailing what is broken and how to reproduce it.

### 2. Prepare Your Development Environment
1. Fork this repository and clone your fork locally.
2. Create a feature branch named after your task (e.g., `git checkout -b feat/add-vercel-deal` or `git checkout -b fix/header-alignment`).
3. Make your modifications (e.g. adding a new deal to `data/deals.json`).

### 3. Local Testing & Verification
Before committing, you must verify your changes:
* **Validate JSON syntax:** Ensure `data/deals.json` is valid JSON and conforms to the schema. You can run `jq empty data/deals.json` or open it in a validator.
* **Validate Links:** Double-check that all URLs added are active, direct, secure (HTTPS), and point to the official site. **Do not submit affiliate, spam, or tracking redirect links.**
* **Local Preview:** Run a local server (e.g. `python -m http.server 8000`) and verify that the page renders correctly and search/filters work as expected.

### 4. Code & Commit Style
Keep your Git history professional and easy to navigate:
* **Semantic Commits:** Use prefix tags in your commit messages:
  - `feat:` for new deals or new features (e.g., `feat: add vercel hosting deal`)
  - `fix:` for bug fixes (e.g., `fix: resolve mobile layout breakage`)
  - `docs:` for documentation updates (e.g., `docs: update setup instructions`)
  - `chore:` for internal maintenance, CI workflows, etc.
* **Keep History Clean:** Avoid intermediate "temp" or "fix syntax" commits. Use `git commit --amend` or squash/rebase your branch commits before pushing.

### 5. Open the Pull Request
Once pushed, open a Pull Request (PR) from your feature branch to the `main` branch of this repository.

Your PR **must** include the following details in its description:
1. **Linked Issue:** State which issue this PR resolves using GitHub keywords (e.g., `Closes #42` or `Fixes #108`). **PRs without linked issues will be automatically closed.**
2. **Summary of Changes:** A clear, bulleted list explaining what was added, modified, or removed.
3. **Verification Steps:** Explain how you verified the changes (e.g., "Tested locally on Chrome and Safari, verified JSON syntax using jq").
4. **Deal Validity Proof (for new deals):** Provide a screenshot or link demonstrating that the discount, free tier, or coupon is active and valid.

---

## 📝 Content Guidelines

### Deal Submission Checklist:
* `id`: Must be a unique, lowercase string (e.g. `supabase`).
* `name`: The official brand/service name.
* `category`: Must match one of the predefined catalog categories: `Hosting`, `Database`, `APIs`, `AI & LLM`, `Auth`, or `Tools`.
* `deal`: Clear description of the value (e.g., `$100 Free Credit` or `20% Off Lifetime`).
* `code`: Explicit coupon code, or `Automatic (Link)` if it applies automatically.
* `url`: Direct signup link (no tracker-hijacked URLs).
* `desc`: Clean, neutral 1-2 sentence description explaining what the tool is (no marketing fluff or hype).
* `tags`: Lowercase, comma-separated tags for index search.

✅ **Do:**
- Keep descriptions objective and informative.
- Add relevant tags for searchability.
- Test links before submitting.

❌ **Don't:**
- Submit duplicate deals.
- Submit promotional affiliate links.
- Write overly long, hyped descriptions.

---

## 🔍 Review Process

1. **Automated Checks:** GitHub Actions runs syntax and structure checks on every commit. If the validation fails, please fix the errors in your branch.
2. **Maintainer Review:** A project maintainer will review your PR.
3. **Feedback & Revision:** Address any requested changes on the same branch; your PR will update automatically.
4. **Merge:** Once approved, your feature branch will be merged into `main` and live on the site.

---

## 🎉 Recognition

All contributors are recognized and appreciated! Your contributions will be:
- Listed in the project's contributor graph 📊
- Mentioned in release notes 📝

---

## 📞 Questions?

Have questions about contributing?
- Open a [GitHub Discussion](https://github.com/hasitpbhatt/devcheap/discussions)
- Contact the maintainer: [@hasitpbhatt](https://github.com/hasitpbhatt)

---

**Thank you for contributing to DevCheap!** 🙏


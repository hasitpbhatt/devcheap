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
  - [Adding Resources](#adding-resources)
  - [Adding Prompts](#adding-prompts)
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

### Adding Resources

1. **Create a new Markdown file** in `/resources/` with a clear filename (e.g., `03-vector-databases.md`)
2. **Add a title and brief description** at the top of the file
3. **Update `/resources/index.json`** with metadata:
   ```json
   {
     "id": "r3",
     "title": "Vector Databases for LLM Applications",
     "desc": "Overview of vector databases like Pinecone, Weaviate, and Milvus for semantic search.",
     "tags": "vector,databases,search,llm",
     "url": "/resources/03-vector-databases.md"
   }
   ```
4. **Keep it concise** - one concept per resource
5. **Include links to tools, tutorials, or documentation**

### Adding Prompts

1. **Create or update a prompt template** in `/prompts/prompt-templates.md`
2. **Update `/prompts/index.json`** with:
   ```json
   {
     "id": "p3",
     "title": "Generate API Documentation",
     "desc": "Create comprehensive API documentation from code comments.",
     "prompt": "You are a technical writer. Generate API documentation from the following code..."
   }
   ```
3. **Use clear, reusable patterns**
4. **Include example inputs and outputs**

### Reporting Issues

Found a bug or have a suggestion? Please:

1. **Search existing issues** to avoid duplicates
2. **Open a new issue** with:
   - Clear title and description
   - Steps to reproduce (if applicable)
   - Expected vs. actual behavior
   - Screenshots (if helpful)

### Suggesting Improvements

Have ideas to improve the project?

1. **Open a discussion** in [GitHub Discussions](https://github.com/hasitpbhatt/devcheap/discussions)
2. **Describe your idea** with:
   - The problem you're solving
   - Your proposed solution
   - Benefits to the community

---

## 📝 Content Guidelines

✅ **Do:**
- Keep entries concise and focused
- Use clear, descriptive titles
- Include one main concept per resource/prompt
- Add relevant tags for searchability
- Test links before submitting
- Use proper Markdown formatting

❌ **Don't:**
- Submit promotional content
- Include broken links
- Write overly long entries
- Duplicate existing content
- Use offensive or inappropriate language

---

## 🔍 Review Process

1. **Automated Checks:** GitHub Actions runs basic validation
2. **Maintainer Review:** A project maintainer reviews your contribution
3. **Feedback:** You may receive suggestions for improvements
4. **Merge:** Once approved, your contribution is merged!

**Typical review time:** 1-7 days

---

## 🎉 Recognition

All contributors are recognized and appreciated! Your contributions will be:

- Listed in the project's contributor graph 📊
- Mentioned in release notes 📝
- Featured in the project's README (if significant) 🌟

---

## 📞 Questions?

Have questions about contributing?

- Open a [GitHub Discussion](https://github.com/hasitpbhatt/devcheap/discussions)
- Contact the maintainer: [@hasitpbhatt](https://github.com/hasitpbhatt)

---

**Thank you for contributing to DevCheap!** 🙏

Your efforts help developers build faster and smarter with LLMs.


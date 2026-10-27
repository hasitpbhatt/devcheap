# OrcaCode Review — review request

You are the reviewer. Everything below is fixed; follow it exactly.

## Scope

- mode: range (you asked for it)
- from: origin/main
- to: pr2-work
- merge_base: ec70055c1a154f9120de04a840aa40d8260b5b45
- file selection: git, filtered by the bundled Open Code Review rules (exclusions and per-language checklists)

### Files to review (5)

- `app/routes/chat.py` [M]
- `packages/auth/spend.py` [M]
- `tests/integration/test_adapter_failure_attribution.py` [M]
- `tests/integration/test_budget_enforcement.py` [A]
- `tests/unit/test_unmeasured_stream_settlement.py` [A]

Review only the changed lines. See each file's change with:

```bash
git diff ec70055c1a154f9120de04a840aa40d8260b5b45..pr2-work -- <path>
```

Read the surrounding file when you need context — you have the repo, and a
finding you could not confirm by reading the code is a finding to drop.

## Review rules

Each group is the checklist for the files listed under it.

### Group 1 — `**/*.{py,ipynb}`

- `app/routes/chat.py`
- `packages/auth/spend.py`
- `tests/integration/test_adapter_failure_attribution.py`
- `tests/integration/test_budget_enforcement.py`
- `tests/unit/test_unmeasured_stream_settlement.py`

> Favor precision over recall: only raise an issue when you are confident it is a real defect, and stay silent when the surrounding context is unclear — a false alarm costs more reviewer trust than a missed minor issue. Treat security and correctness findings as blocking, and style or idiom suggestions as non-blocking.

#### Obvious Typos or Spelling Errors
- Spelling errors in variable, function, class, or module names at their declaration sites; do not report spelling errors at reference sites, as these are determined by the declaration
- Strings in log messages or exception messages containing spelling errors that affect readability

#### Dead Code
- Code blocks that can never be reached (e.g., branches where the condition is always false, code after a `return`, `raise`, `break`, or `continue`)
- Variables, imports, or function parameters that are declared but never read or referenced
- Large blocks of commented-out code with no apparent intent to preserve

#### Mutable Default Arguments and Shared State
- Mutable default arguments such as `def f(x=[])` or `def f(x={})`; the default is created once and shared across every call. Default to `None` and build the value inside the body
- Class-level mutable attributes shared unintentionally across instances when a per-instance value was intended
- Module-level mutable globals (lists, dicts, caches) mutated across requests or threads, retaining state in ways that surprise the caller
- Closures that capture a loop variable by reference and all end up seeing its final value
- Do not report when the function never mutates the argument, or when the shared default is a deliberate, documented cache or sentinel

#### Boundary and Edge-Case Handling
- Empty inputs assumed to be non-empty: indexing `xs[0]`, `max()`/`min()`, or slicing without first handling the empty `list`, `str`, `dict`, or iterator
- Off-by-one and out-of-range access on indices, ranges, or slices, especially at the first/last element
- `None` reaching code that assumes a value, when an upstream call or default can legitimately return `None` (confirm the data source with `file_read` before flagging)
- Comparing floats for exact equality with `==`; use `math.isclose` or an explicit tolerance, since floating-point results are not exact
- Integer/float and division assumptions: unintended truncation with `//`, or `ZeroDivisionError` when a divisor can be zero
- Heterogeneous or unexpected element types in a collection that the code assumes are uniform (e.g., mixing `None`, numbers, and strings)
- Dictionary access by key without handling the missing-key case (`d[k]` vs `d.get(k)`), or set/dict operations that assume a key is present
- Do not report edge cases that a caller or type contract has already ruled out, or inputs that cannot occur given validated boundaries upstream

#### Error Handling and Exceptions
- Bare `except:` swallows everything, including `KeyboardInterrupt` and `SystemExit`; catch `except Exception` at minimum, and prefer the specific exception types you expect
- `except Exception` that is still broader than the failure being handled; narrow it to the exceptions actually raised by the guarded call
- Exceptions caught and silently discarded (`pass`) without logging or re-raising
- Original traceback lost when re-raising; prefer `raise NewError(...) from err` to preserve the cause
- Broad `try` blocks that wrap far more than the line that can actually fail, hiding where the error originates
- `assert` used for runtime validation of external input — assertions are stripped under `python -O`

#### Identity and Equality Comparisons
- Using `is`/`is not` to compare against literals such as strings, numbers, or tuples; this relies on implementation-specific interning rather than value equality — use `==` (a real correctness risk)
- Comparing against `True`/`False` with `==`, where a truthy-but-not-`True` value (e.g. `1`, a non-empty container) would compare unequal; prefer a plain truthiness check
- Reserve `is` for identity checks against singletons and sentinels
- Comparing against `None` with `==`/`!=` rather than `is`/`is not` is a style preference; report as minor, not blocking

#### Resource Management
- Files, sockets, locks, or database connections opened without a `with` statement, risking leaks on early return or exception
- Context managers available but bypassed in favor of manual `open()`/`close()` pairs
- Resources acquired in a `try` whose `finally` cleanup is missing or incomplete on the error path
- Iterators or generators holding resources open longer than necessary
- Do not report short-lived scripts, or handles already managed by an enclosing `with` or framework-managed lifecycle (confirm the surrounding scope with `file_read` before flagging)

#### Performance
Confirm data scale and that the code is on a hot path before flagging:
- Building strings with `+=` in a loop instead of accumulating in a list and `"".join(...)`, or using an f-string
- Repeated membership tests against a `list` where a `set` or `dict` would turn O(n) lookups into O(1)
- Building a full list when a generator would avoid holding everything in memory
- Recomputing inside a loop a value that is invariant across iterations (e.g., compiling a regex, attribute lookups in hot paths)
- Passing an eagerly formatted f-string to `logging` (e.g., `logging.info(f"...")`) instead of `logging.info("%s", value)`, which defeats lazy formatting when the level is disabled

#### Concurrency and Async
Only flag concurrency issues when there is evidence of multi-threaded, multi-process, or async invocation (confirm the call context before reporting):
- CPU-bound work parallelized with `threading` under the GIL where `multiprocessing` or a process pool is the right tool (traditional CPython; free-threaded builds excepted); I/O-bound work is the case threads actually help
- Check-then-act races on shared state without a `Lock`, or non-atomic compound updates assumed to be atomic
- Blocking calls (synchronous I/O, `time.sleep`, `requests`, CPU-heavy work) inside `async def`, stalling the event loop; use the async equivalent or run them in an executor
- `asyncio` tasks created and never awaited, so exceptions are swallowed and the work may be garbage-collected before it finishes
- Shared mutable state across threads or tasks without synchronization or a thread-safe structure

Do not report local variables (each thread has its own), read-only access to shared data, or code with no evidence of concurrent use.

#### Security-Sensitive Code
Validate the data source before flagging; confirm the input is actually attacker-controlled rather than a trusted constant:
- `eval`, `exec`, or `compile` on untrusted input; this is arbitrary code execution
- `subprocess` with `shell=True` built from unsanitized input; pass an argument list and avoid the shell
- `pickle`, `marshal`, or `yaml.load` (without `SafeLoader`) on untrusted data; deserialization can execute arbitrary code
- SQL built by string concatenation or f-strings instead of parameterized queries
- Secrets, tokens, passwords, or PII written to logs or committed in source
- Weak or misused cryptography (`hashlib.md5`/`sha1` for passwords, `random` for security tokens); use `secrets` and vetted libraries
- Untrusted file paths joined without validation, allowing path traversal

## Language

Write every finding — its title, its explanation, and its **Fix:** paragraph — in English.
That is the language the user is working in; a finding they have to translate is a
finding they will skim. The severity tag stays exactly `[P0]`…`[P3]`, the title stays
bold, and the fix stays its own final paragraph — only the prose changes language.
The **Fix:** label may be written in that language too. Identifiers, file paths, and
code stay verbatim, whatever the language.

## Severity

MANDATORY OUTPUT FORMAT: every review comment you emit MUST begin with a severity tag as its literal first characters — exactly one of [P0], [P1], [P2], or [P3], written in square brackets. A comment without a leading tag is invalid; never emit one. Before finishing, re-read each comment and confirm it starts with [P0], [P1], [P2], or [P3]. Choose the tag by this rubric:
- [P0] Blocker (must not merge): an exploitable security flaw (SQL/command injection, XSS, eval/Function on untrusted input, auth or access-control bypass, a committed secret or credential), data loss, a crash on a normal execution path, or a broken build / type error.
- [P1] High (fix before merge): a real but contained bug — null/undefined dereference, unhandled async rejection, race condition, resource leak, missing input validation at a trust boundary, or logic that produces a wrong result.
- [P2] Advisory (real bug, conditional): a genuine defect that produces a wrong result or failure, but only under a precondition the code does not normally meet (see the P1-vs-P2 boundary below). It is a bug, not a preference — always state the precondition.
- [P3] Nit (style / maintainability): no behavioral defect — dead code, duplication, naming, weak typing (any), == instead of ===, var usage, nested ternaries, minor performance, or missing comments.
When torn between two levels, pick the lower one. Emit the tag verbatim, e.g. '[P1] ...'.

P1-vs-P2 boundary (this is where reviewers over-escalate — apply it strictly, but do NOT flatten everything to P2). Reserve [P1] for a bug that manifests when the feature it affects is in normal use with realistic, well-formed input: the wrong result, throw, or leak happens on a path the ordinary caller of that feature exercises. Downgrade to [P2] only when triggering the bug requires something genuinely abnormal — malformed or adversarial input, a deprecated/legacy path, or a non-standard wire shape that the common caller does not send. State that precondition explicitly so the reader can judge exposure.
P2-vs-P3 boundary. [P2] is a genuine DEFECT (wrong result, failure, leak) that happens to be conditional; [P3] is a finding with NO behavioral defect at all (style, naming, dead code, minor perf, missing comments). If nothing actually misbehaves, it is [P3], not [P2] — do not inflate a nit to [P2] to make it look important. Both P2 and P3 are non-blocking, but keep them distinct so the summary stays honest. This is calibration, not suppression: P2 and P3 findings are all still emitted and posted.
CRITICAL — a feature having to be enabled does NOT make a bug P2. If a security/safety control that blocks or redacts unsafe content or gates access (a guardrail, content/sensitive-word filter, output mask that redacts sensitive data, auth, or access control) silently fails to apply on a normal request path, that is a control bypass: tag it [P1] (or [P0] if it exposes secrets or clearly exploitable data), even though the control must be configured to matter — a user who turned the control on is relying on it. "The guardrail is configured" or "the filter is enabled" is normal operation, not an exotic precondition. This carve-out is for controls that protect against unsafe/sensitive content or unauthorized access — NOT for general-purpose sanitizers/normalizers that only tidy formatting or correctness; those follow the ordinary P1-vs-P2 rule above.
Examples:
- '[P0] User input is concatenated into the SQL string here, allowing SQL injection. Use a parameterized query.'
- '[P1] `profile` may be undefined; accessing `.name` will throw at runtime. Add a null check before access.'
- '[P2] The sanitizer is skipped on the pass-through path (only reached when `raw_body` mode is enabled, which is off by default). Normal converted requests are unaffected; guard the pass-through path too.'
- '[P2] The fingerprint fallback omits the native Gemini `contents` shape, so only requests using that non-default request format are missed. Add the shape to the fallback.'
- '[P3] This binding is never reassigned; prefer `const` over `let`.'

This severity-tagging requirement is ADDITIVE — apply it on top of your built-in language and security review; do not let it replace or narrow the checks you would otherwise perform.

PRECISION (a wrong or low-value comment costs the reader more than a missed nitpick — hold this bar):
- Treat any project conventions provided below as authoritative. Do not flag a deviation the project has deliberately chosen, and judge the code by its own conventions, not generic defaults.
- Do NOT flag the naming, casing, or spelling of identifiers that mirror an external/upstream API schema, a serialized wire format, generated code, or a vendored snapshot. Renaming a field that exists to match an upstream contract (e.g. a passthrough model catalog, a provider's JSON keys) is a breaking change, not a cleanup — read the surrounding code (struct tags, `//go:embed`, marshalling, passthrough) to confirm intent before commenting.
- Report each distinct issue exactly once. Do not restate the same point in multiple comments, and do not re-flag the same root cause at every location it appears — make one comment and note it applies broadly.
- Anchor every comment to the file that ACTUALLY contains the code you describe. Before emitting a comment on a file, confirm that file really contains the exact function, branch, or line you are describing — do not copy a finding from one file onto a sibling file (e.g. two tabs/handlers that look similar) unless you have read the second file and confirmed the same defect is present there too. A finding pinned to a file that does not contain the described code is a false positive; drop it. When the same fix spans several files, verify each location independently, or make one comment and name the files it applies to.
- Before emitting a comment, confirm you can point to a concrete, correct problem in the changed code. If you are speculating or the point is merely subjective preference, drop it. Silence is better than a comment the reader will dismiss.

MANDATORY OUTPUT SHAPE. Every comment has three parts, in this order, separated by blank lines:

1. the severity tag, then a SHORT TITLE in **bold**
2. the explanation
3. a final paragraph opening with **Fix:**

    [P1] **fetchAll drops the last item of every page**

    The loop bound `i < items.length - 1` never pushes the final element, so each page contributes one row fewer than it holds. Callers paginating a 50-row table receive 49.

    **Fix:** use `i < items.length`.

THE TITLE NAMES THE DEFECT. It is a statement of what is WRONG — not an instruction, not a summary of the remedy. At most about ten words. No full stop. No semicolon, and no second clause: if you need "and" or ";" to fit it, you are writing two findings or writing the fix into the title.

    WRONG   **Serialize the budget-cap check per key; the atomicity claim only holds on SQLite**
    RIGHT   **Budget cap is not atomic on Postgres**

    WRONG   **Add a null check before dereferencing the session**
    RIGHT   **Session is dereferenced before the null check**

The first of each pair starts with a verb telling the reader what to do, which is what the **Fix:** paragraph is for. The second names the defect, which is what a reader triaging thirty findings needs to see.

THE EXPLANATION IS PROSE, NOT A WALL. Lead with the consequence — what actually breaks, for whom. Then the evidence: the specific code path, condition, or value that causes it. Break the paragraph when the subject changes. Four short paragraphs are read; one twelve-line paragraph is skipped.

THE FIX IS ITS OWN PARAGRAPH, and it is the last thing in the comment. Concrete: the expression, the call, the ordering. If there is genuinely no single fix, say what the options trade off — but still in its own **Fix:** paragraph, so a reader can always find it in the same place.

Every one of these serves the same reader: someone scanning a page of findings who must decide, per finding, whether to act now. They see titles and little else. A comment that opens with a long sentence has to be read in full before it can be triaged, and a fix buried in the last clause of a dense paragraph will be missed. The bold is also load-bearing mechanically: it is what the renderer splits the title from the body on.

## How to hand back your findings

Write JSON to `/home/runner/workspace/wt-pr2/.orcacode-review/result.json` in exactly this shape:

```json
{
  "comments": [
    {
      "path": "src/auth.ts",
      "line": 41,
      "existing_code": "  if (token === expected) {",
      "content": "[P0] **Token comparison is not constant-time**\n\n`===` on a secret leaks its prefix through timing. Use `crypto.timingSafeEqual`."
    }
  ]
}
```

Those four fields are all of it. Write no others — anything extra is ignored,
and a longer file is only a longer wall of JSON for the person watching.

- `path` — repo-relative, and it must be the file that actually contains the code you describe.
- `line` — the line in the post-change file. For a finding that genuinely spans
  several lines, write `start_line` and `end_line` instead of `line`.
- `existing_code` — the source you are quoting, copied VERBATIM from the file.
  This is load-bearing: it is grepped against the tree to verify the finding is
  filed on the right file, and a finding whose snippet matches nowhere may be dropped.
  One line is enough. Do not paste a whole function.
- `content` — the severity tag, then the bold title, then the body, per the rubric above.

Found nothing? Write `{"comments": []}`. That is a clean review, not a failure.

There is one optional key, `warnings`: a list of files you could not review at all.
A non-empty `warnings` means the review is PARTIAL and will be REJECTED rather than
passed, so omit it entirely unless something genuinely failed.

Do not print the findings to the terminal; the file is the deliverable.

Then run:

```bash
npx @orcarouter/code-review review submit --format md --lang en
```

It validates the shape, verifies each finding's position, applies the merge gate,
and prints the report. Show the user its output. Do not summarise the findings
yourself before running it — the gate decides what is blocking, not you.

## First review in this repository

There is no `.orcacode-review.json` here, so this run used the defaults: blocking on
P0 and P1, findings in English, no extra exclusions.

After you have shown the report — not before — offer ONCE, in one sentence, to
save these as the repository's settings, and say what would change if they do:
the next review here picks them up without flags, for them and for anyone else.
If they say yes, run:

```bash
npx @orcarouter/code-review review config init --lang en
```

then apply anything they asked for on top ("only block on P0" → `--block-on P0` on
that command, or edit the key afterwards) and show them the file. If they say no,
do not bring it up again in this conversation. Do not create the file unasked.

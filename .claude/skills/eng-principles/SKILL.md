---
name: eng-principles
description: >
  Apply project engineering principles when designing, building, or reviewing
  code — KISS, YAGNI, SRP, DRY, and related hard rules. Use when making
  design decisions, adding features, or reviewing code quality.
---

# Engineering Principles

Apply these principles actively — not as a reading list, but as constraints that shape every decision.

## When to Apply

Invoke this skill when:

- Designing an approach before writing code
- Choosing between implementation alternatives
- Adding new abstractions, utilities, or helpers
- Reviewing or refactoring existing code
- Making data format or architecture decisions

## Core Principles

| Principle | Rule |
|-----------|------|
| **Simplicity (KISS)** | Prefer the simplest thing that works. Complexity is technical debt. |
| **YAGNI** | Build what's needed now. Don't add features or abstractions for hypothetical future needs. |
| **Single Responsibility** | A module/function/class should have one reason to change (one actor). |
| **Separation of Concerns** | Don't mix UI, business logic, data access, config. Boundaries make systems evolvable. |
| **Abstraction with Intent** | Abstract *why*, not *how*. Bad abstractions are worse than duplication. |
| **DRY (with judgment)** | Eliminate *true* duplication, not accidental similarity. Premature DRY creates tight coupling. |
| **Loose Coupling, High Cohesion** | Things that change together live together; things that change independently shouldn't know much about each other. |
| **Make Change Cheap** | Optimize for iteration, not initial elegance. Make code easy to modify. |
| **Explicit Over Implicit** | Readability beats cleverness. Code is read far more than it's written. |
| **Fail Fast, Fail Loud** | Errors should surface immediately and clearly. Silent failure is a bug factory. |
| **Test What Matters** | Tests are about confidence, not coverage. Test behavior, not implementation. |

**Meta-principle: optimize for humans, not machines.** Everything else flows from that.

## NEVER (Hard Rules)

| Rule | Detail |
|------|--------|
| NEVER use `!important` in CSS | It signals broken specificity or cascade order. Fix the root cause: refactor selectors, reorder stylesheets, review component architecture. |
| NEVER build for hypothetical future needs | YAGNI. Future requirements will change anyway — build what's needed now. |
| NEVER create helpers or abstractions for one-time use | Three similar lines of code is better than a premature abstraction. |
| NEVER mix data and presentation | Data format = WHAT. Rendering = HOW. Keep them strictly separate. |
| NEVER add error handling for scenarios that can't happen | Only validate at system boundaries (user input, external APIs). Trust internal code. |

## Red Flags

These thoughts mean STOP — you're rationalizing complexity:

| Thought | Reality |
|---------|---------|
| "I'll add this for future extensibility" | YAGNI — build what's needed now |
| "Let me abstract this to avoid duplication" | Is it true duplication or accidental similarity? Premature DRY creates coupling. |
| "I'll add `!important` to fix this quickly" | Stop — fix the underlying specificity problem instead |
| "This helper will be useful later" | Don't build for hypothetical future needs |
| "I need to handle this edge case just in case" | Only validate at system boundaries |
| "This is clever" | Clever = implicit. Explicit beats clever every time. |
| "Let me add a feature flag for this" | No backwards-compat shims. Just change the code. |

# Self-Improving Agent Skill

Capture learnings, errors, and feature requests to support continuous improvement across sessions.

## Core Purpose

Maintain three markdown logs in `.learnings/` at the project root:
- **LEARNINGS.md** — corrections, insights, knowledge gaps, best practices
- **ERRORS.md** — command failures and integration issues
- **FEATURE_REQUESTS.md** — user-requested capabilities

## When to Log

- Operations fail unexpectedly
- User corrects the agent
- APIs or external tools malfunction
- Knowledge proves outdated
- Better approaches emerge for recurring tasks

## Entry Format

```
### [ID] Title
- **Date:** YYYY-MM-DD
- **Priority:** high|medium|low
- **Status:** open|resolved|promoted
- **Area:** <domain>
- **Related files:** <paths>
- **Tags:** <tags>
- **Pattern-Key:** <recurring-pattern-identifier>

**Description:** What happened

**Resolution:** What fixed it or what was learned

**Promotion candidate:** yes|no — reason
```

IDs follow the pattern `LRN-YYYYMMDD-001` for learnings, `ERR-YYYYMMDD-A3F` for errors.

## Promotion Strategy

Promote high-value entries from `.learnings/` to permanent project memory when:
- Issue is broadly applicable across multiple files
- Pattern recurs 3+ times within 30 days

Promotion targets:
- **CLAUDE.md** — project facts and conventions
- **AGENTS.md** — workflows and automation patterns

## Skill Extraction

Extract a reusable skill when a solution:
- Solves a problem class, not just one instance
- Would save significant time if recalled in future sessions
- Is non-obvious and unlikely to be rediscovered quickly

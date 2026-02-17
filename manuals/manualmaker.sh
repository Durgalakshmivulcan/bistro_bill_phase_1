#!/bin/bash
set -e

MAX=${1:-10}
SLEEP=${2:-2}

echo "Starting ManualMaker - Max $MAX iterations"
echo ""

for ((i=1; i<=$MAX; i++)); do
    echo "==========================================="
    echo "  Iteration $i of $MAX"
    echo "==========================================="

    result=$(claude --dangerously-skip-permissions -p "You are ManualMaker, an autonomous coding agent for the USER MANUAL project. Do exactly ONE task per iteration.

## CRITICAL: Work Scope Boundaries

You are working ONLY on the user manual documentation project.

**Task Source (CRITICAL):**
- ✅ READ TASKS FROM: manuals/PRD.md ONLY (User Manual System tasks US-001 through US-033)
- ❌ NEVER read tasks from root PRD.md (that's VulcanRun's server tasks - different numbering)
- ✅ UPDATE PROGRESS: manuals/progress.txt ONLY
- ❌ NEVER update root progress.txt (that's VulcanRun's progress)

**File Permissions:**
- ✅ READ: Anywhere (you need to read src/, understand.md, tailwind.config.js to document the app)
- ✅ WRITE/MODIFY: Only files in manuals/ directory (HTML, CSS, images, manuals/PRD.md, manuals/progress.txt)
- ✅ COMMIT: Use message format 'feat(manual): [task description]'
- ❌ DO NOT: Modify server/, src/, root files, or root PRD.md/progress.txt

Note: VulcanRun (another agent) is working on server backend using root PRD.md. You work on manuals/PRD.md. Different projects, same repo.

## Steps

1. Read PRD.md (in current directory - manuals/) and find the first task that is NOT complete (marked [ ]).
2. Read progress.txt - check the Learnings section first for patterns from previous iterations.
3. Implement that ONE task only.
4. Run tests/typecheck to verify it works (use: npx tsc --noEmit).

## Critical: Only Complete If Tests Pass

- If tests PASS:
  - Update PRD.md to mark the task complete (change [ ] to [x])
  - Commit your changes with message: feat(manual): [task description]
  - Append what worked to progress.txt

- If tests FAIL:
  - Do NOT mark the task complete
  - Do NOT commit broken code
  - Append what went wrong to progress.txt (so next iteration can learn)

## Progress Notes Format

Append to progress.txt using this format:

## Iteration [N] - [Task Name]
- What was implemented
- Files changed
- Learnings for future iterations:
  - Patterns discovered
  - Gotchas encountered
  - Useful context
---

## Update AGENTS.md (If Applicable)

If you discover a reusable pattern that future work should know about:
- Check if AGENTS.md exists in the project root
- Add patterns like: 'This codebase uses X for Y' or 'Always do Z when changing W'
- Only add genuinely reusable knowledge, not task-specific details

## End Condition

After completing your task, check PRD.md:
- If ALL tasks are [x], output exactly: <promise>COMPLETE</promise>
- If tasks remain [ ], just end your response (next iteration will continue)")

    echo "$result"
    echo ""

    if [[ "$result" == *"<promise>COMPLETE</promise>"* ]]; then
        echo "==========================================="
        echo "  All tasks complete after $i iterations!"
        echo "==========================================="
        exit 0
    fi

    sleep $SLEEP
done

echo "==========================================="
echo "  Reached max iterations ($MAX)"
echo "==========================================="
exit 1

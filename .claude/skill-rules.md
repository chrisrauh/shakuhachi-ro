⚠️ MANDATORY PROJECT SKILL RULES — OVERRIDE ALL OTHER SKILLS ⚠️

TRIGGER: Starting a session, new task, or after context clear
→ Invoke /get-ready FIRST. No exceptions.

TRIGGER: Development work — choose ONE path:
  A) No plan, OR plan was created by Claude (EnterPlanMode) → Invoke /dev-workflow.
     Do NOT substitute superpowers:finishing-a-development-branch.
     Red flag: "I'll just use superpowers:finishing-a-development-branch" = STOP.
  B) Plan was created by superpowers:writing-plans → Use superpowers:subagent-driven-development.
     Subagents may commit after each task per that skill's workflow.
     A superpowers plan is a structured file explicitly created by the superpowers:writing-plans skill.
     A Claude plan (EnterPlanMode output) is NOT a superpowers plan — use /dev-workflow for those.

TRIGGER: Before any superpowers:* skill
→ Invoke /eng-principles FIRST. Always.

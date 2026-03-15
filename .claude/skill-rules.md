⚠️ MANDATORY PROJECT SKILL RULES — OVERRIDE ALL OTHER SKILLS ⚠️

TRIGGER: Starting a session, new task, or after context clear
→ Invoke /get-ready FIRST. No exceptions.

TRIGGER: Development work — choose ONE path:
  A) No written implementation plan exists → Invoke /dev-workflow.
     Do NOT substitute superpowers:finishing-a-development-branch.
     Red flag: "I'll just use superpowers:finishing-a-development-branch" = STOP.
  B) Written implementation plan exists → Use superpowers:subagent-driven-development.
     Subagents may commit after each task per that skill's workflow.

TRIGGER: Before any superpowers:* skill
→ Invoke /eng-principles FIRST. Always.

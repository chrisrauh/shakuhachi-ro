---
name: get-ready
description: Review project guidelines, architecture, and current tasks to prepare for work
---

# Get Ready for Work

This skill prepares you to work on the shakuhachi-ro project by reviewing key documentation in the correct order.

## Review Checklist

Follow this sequence to get context:

### 1. Review Guidelines (CLAUDE.md)
Read `/Users/crauh/dev/shakuhachi-ro/CLAUDE.md` to understand:
- Software engineering principles
- Dev workflow and git practices
- Testing requirements and patterns
- Chrome DevTools MCP usage
- Build process for web components
- Test fixtures and visual regression testing

### 2. Review Architecture

Read the architecture documents to understand the system:

**Renderer Library**: `/Users/crauh/dev/shakuhachi-ro/docs/ARCHITECTURE-RENDERER.MD`
- How the shakuhachi notation renderer works
- ScoreData format and rendering pipeline
- Web component implementation

**Platform**: `/Users/crauh/dev/shakuhachi-ro/docs/ARCHITECTURE-PLATFORM.MD`
- How shakuhachi.ro platform works
- Key pages (browse, detail, edit)
- Data flow and authentication
- Notation format support (ABC, JSON, MusicXML)

### 3. Review Current Tasks (TODO.md)
Read `/Users/crauh/dev/shakuhachi-ro/TODO.md` to see:
- Current priorities
- Pending tasks organized by category
- Task status and blockers

## After Review

Once you've reviewed these documents:
1. Summarize what you learned (briefly)
2. Ask the user which task they'd like to work on
3. If unclear, suggest the highest priority task from TODO.md

**Remember**: This review ensures you have full context before starting work. Take time to understand the project's patterns and principles.

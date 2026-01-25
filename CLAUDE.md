# Claude Code Instructions

> **For technical architecture and design patterns, see [ARCHITECTURE.md](./ARCHITECTURE.md). For active tasks to execute, see [TODO.md](./TODO.md).**

## General Principles

- Always follow the KISS principle (Keep It Simple, Stupid)

## Active Tasks

Active tasks for completing the project are tracked in **[TODO.md](./TODO.md)**. Execute tasks from TODO.md in order to complete the project.

## Feature Development Workflow

When asked to implement a feature, follow this workflow:

1. **Create a feature branch** - Create a new branch for the feature before starting work
2. **Implement the feature** - Complete the implementation and commit changes
3. **Create a pull request** - Use the `/pr` command or create a PR manually
4. **Review the PR** - Review the changes in the PR yourself
5. **Ask user to review** - Present the PR to the user and ask them to review
6. **Merge if approved** - If the user approves, merge the PR and clean up the branch

## Working Protocol (Per Implementation Step)

When implementing each step within a feature:

1. **Suggest** your specific implementation approach for the step
2. **Wait** for user validation/feedback
3. **Execute** only after approval (or discuss modifications)
4. **Validate** in browser/tests to ensure it works correctly

## Development Commands

- `npm run dev` - Start development server with hot reload
- `npm run build` - Compile TypeScript and build project
- `npm run lint` - Run ESLint checks
- Test frequently in browser after each implementation step

## Development Environment

- Using **Vite** for development server and building
- **TypeScript** for type safety
- **ESLint** for code quality
- Browser-based testing and validation

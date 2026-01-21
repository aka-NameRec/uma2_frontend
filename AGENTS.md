# UMA2 — Codex project instructions

## Language & communication
- Chat with the user: Russian.
- Code: comments, docstrings, user-facing string literals, and git commit messages MUST be in English.

## ConPort (project memory) — mandatory
If MCP server "conport" is available:
- At the start of each new task/session: load relevant project context from ConPort (decisions, progress, architecture, glossary, open tasks).
- Do not assume missing facts. If ConPort lacks data, read `docs/` and the codebase.
- After finishing work: write back important updates to ConPort:
  - decisions (why we did X),
  - progress (what changed / what’s done),
  - tasks (next steps),
  - architecture notes (interfaces/contracts, constraints).

## Git workflow — mandatory
- NEVER create commits on branches: main, master, develop, staging.
  If currently on one of these, warn the user and suggest creating a new branch.
- ALWAYS ask the user to approve the commit message text before committing.
- Commit message MUST start with SCM task id extracted from branch name:
  branch name format: <purpose>/<task_id>-<description>
  task_id may contain: latin letters, digits, '-'
- Commit message format:
  task_id. (commit_type) commit_message.
  Examples: feat, fix, refactor, chore, docs, test.

## Architecture & layering — mandatory
- Service layer MUST contain business logic only.
- Service layer MUST NOT use ORM directly and MUST NOT use external protocols (HTTP, etc).
- DB access MUST be behind a Repository (or similar) abstraction.
- If you detect a potential backward compatibility break, report it to the user,
  but do NOT decide compatibility strategy on your own.

## DRY — mandatory
- Do not duplicate code.
- If duplication is suspected or detected, explicitly tell the user and propose refactoring options.

## Error handling — mandatory
Functions must NEVER silently swallow errors.

A function MUST either:
1) succeed and return a valid result, OR
2) raise an exception with actionable context.

Forbidden:
- returning None on error
- returning empty collections ([], {}) instead of raising
- returning magic values (-1, "", etc)
- logging an error and continuing as if nothing happened
- swallowing exceptions

Allowed:
- Optional[T] only for legitimate "no value" (NOT an error)
- custom exceptions with context
- exception chaining: `raise ... from e`

## Code quality workflow
- Verify information before stating it. Do not speculate without evidence.
- Preserve existing code/behavior unless explicitly requested to change it.
- Make minimal, focused edits; avoid unrelated cleanup.
- Avoid "apologies" and avoid "I understand" feedback.
- Do not propose whitespace-only changes.
- Do not invent additional changes beyond the request.
- When referencing files, use real file paths in the repo (not placeholders like x.md).
- Prefer providing edits for a file in a single coherent patch/chunk.

# Code Quality Guidelines

## Verify Information
Always verify information before presenting it. Do not make assumptions or speculate without clear evidence.

## File-by-File Changes
Make changes file by file and give me a chance to spot mistakes.

## No Apologies
Never use apologies.

## No Understanding Feedback
Avoid giving feedback about understanding in comments or documentation.

## No Whitespace Suggestions
Don't suggest whitespace changes.

## No Summaries
Don't summarize changes made.

## No Inventions
Don't invent changes other than what's explicitly requested.

## No Unnecessary Confirmations
Don't ask for confirmation of information already provided in the context.

## Preserve Existing Code
Don't remove unrelated code or functionalities. Pay attention to preserving existing structures.

## Single Chunk Edits
Provide all edits in a single chunk instead of multiple-step instructions or explanations for the same file.

## No Implementation Checks
Don't ask the user to verify implementations that are visible in the provided context.

## No Unnecessary Updates
Don't suggest updates or changes to files when there are no actual modifications needed.

## Provide Real File Links
Always provide links to the real files, not x.md.

## No Current Implementation
Don't show or discuss the current implementation unless specifically requested.

# TypeScript Best Practices

## Type System
- Prefer interfaces over types for object definitions
- Use type for unions, intersections, and mapped types
- Avoid using `any`, prefer `unknown` for unknown types
- Use strict TypeScript configuration
- Leverage TypeScript's built-in utility types
- Use generics for reusable type patterns

## Naming Conventions
- Use PascalCase for type names and interfaces
- Use camelCase for variables and functions
- Use UPPER_CASE for constants
- Use descriptive names with auxiliary verbs (e.g., isLoading, hasError)
- Prefix interfaces for React props with 'Props' (e.g., ButtonProps)

## Code Organization
- Keep type definitions close to where they're used
- Export types and interfaces from dedicated type files when shared
- Use barrel exports (index.ts) for organizing exports
- Place shared types in a `types` directory
- Co-locate component props with their components

## Functions
- Use explicit return types for public functions
- Use arrow functions for callbacks and methods
- Implement proper error handling with custom error types
- Use function overloads for complex type scenarios
- Prefer async/await over Promises

## Best Practices
- Enable strict mode in tsconfig.json
- Use readonly for immutable properties
- Leverage discriminated unions for type safety
- Use type guards for runtime type checking
- Implement proper null checking
- Avoid type assertions unless necessary

## Error Handling
- Create custom error types for domain-specific errors
- Use Result types for operations that can fail
- Implement proper error boundaries
- Use try-catch blocks with typed catch clauses
- Handle Promise rejections properly

## Patterns
- Use the Builder pattern for complex object creation
- Implement the Repository pattern for data access
- Use the Factory pattern for object creation
- Leverage dependency injection
- Use the Module pattern for encapsulation 

# Vue.js Best Practices

## Component Structure
- Use Composition API over Options API
- Keep components small and focused
- Use proper TypeScript integration
- Implement proper props validation
- Use proper emit declarations
- Keep template logic minimal

## Composition API
- Use proper ref and reactive
- Implement proper lifecycle hooks
- Use composables for reusable logic
- Keep setup function clean
- Use proper computed properties
- Implement proper watchers

## State Management
- Use Pinia for state management
- Keep stores modular
- Use proper state composition
- Implement proper actions
- Use proper getters
- Handle async state properly

## Performance
- Use proper component lazy loading
- Implement proper caching
- Use proper computed properties
- Avoid unnecessary watchers
- Use proper v-show vs v-if
- Implement proper key management

## Routing
- Use Vue Router properly
- Implement proper navigation guards
- Use proper route meta fields
- Handle route params properly
- Implement proper lazy loading
- Use proper navigation methods

## Forms
- Use v-model properly
- Implement proper validation
- Handle form submission properly
- Show proper loading states
- Use proper error handling
- Implement proper form reset

## TypeScript Integration
- Use proper component type definitions
- Implement proper prop types
- Use proper emit declarations
- Handle proper type inference
- Use proper composable types
- Implement proper store types

## Testing
- Write proper unit tests
- Implement proper component tests
- Use Vue Test Utils properly
- Test composables properly
- Implement proper mocking
- Test async operations

## Best Practices
- Follow Vue style guide
- Use proper naming conventions
- Keep components organized
- Implement proper error handling
- Use proper event handling
- Document complex logic

## Build and Tooling
- Use Vite for development
- Configure proper build setup
- Use proper environment variables
- Implement proper code splitting
- Use proper asset handling
- Configure proper optimization

# Clean Code Guidelines

## Constants Over Magic Numbers
- Replace hard-coded values with named constants
- Use descriptive constant names that explain the value's purpose
- Keep constants at the top of the file or in a dedicated constants file

## Meaningful Names
- Variables, functions, and classes should reveal their purpose
- Names should explain why something exists and how it's used
- Avoid abbreviations unless they're universally understood

## Smart Comments
- Don't comment on what the code does - make the code self-documenting
- Use comments to explain why something is done a certain way
- Document APIs, complex algorithms, and non-obvious side effects

## Single Responsibility
- Each function should do exactly one thing
- Functions should be small and focused
- If a function needs a comment to explain what it does, it should be split

## DRY (Don't Repeat Yourself)
- Extract repeated code into reusable functions
- Share common logic through proper abstraction
- Maintain single sources of truth

## Clean Structure
- Keep related code together
- Organize code in a logical hierarchy
- Use consistent file and folder naming conventions

## Encapsulation
- Hide implementation details
- Expose clear interfaces
- Move nested conditionals into well-named functions

## Code Quality Maintenance
- Refactor continuously
- Fix technical debt early
- Leave code cleaner than you found it

## Testing
- Write tests before fixing bugs
- Keep tests readable and maintainable
- Test edge cases and error conditions

## Version Control
- Write clear commit messages
- Make small, focused commits
- Use meaningful branch names 

# Architecture

## Purpose
Foundry is a desktop application for planning and tracking software delivery lifecycle work. It uses AI agents to perform engineering tasks such as code changes, test generation, review, and progress reporting, with every action visible in a dashboard.

## Product Goals
- Provide a single workspace for SDLC tracking across discover, plan, build, test, review, and ship.
- Orchestrate AI agents as first-class contributors with clear ownership and audit trails.
- Keep humans in control with approvals, review gates, and traceable outputs.
- Support local-first workflows while integrating with remote repositories and issue trackers.

## Technology Stack
- Desktop shell: Electron
- Language: TypeScript throughout the app
- UI: React with Vite
- State management: lightweight client state plus a domain store for project and run data
- Persistence: local SQLite or embedded file-based storage, with optional sync to remote services

## High-Level Structure
- Main process: owns the app lifecycle, menus, window creation, OS integrations, and privileged file access.
- Preload layer: exposes a narrow typed API to the renderer through `contextBridge`.
- Renderer: dashboard UI that displays SDLC status, project timelines, agent runs, logs, and approvals.
- Domain services: task orchestration, agent execution, storage, and sync logic.

## Core Domains
### Project
Represents a software initiative and stores metadata such as name, description, repository links, owner, current SDLC phase, and milestones.

### Task
Represents a unit of work with status, priority, dependencies, assignee, and related artifacts.

### Agent
Represents an AI worker with a capability set such as planning, coding, testing, refactoring, review, or documentation.

### Run
Represents one execution of an agent against a task or project. Stores prompt, inputs, outputs, logs, timestamps, and errors.

### Audit Event
Represents an immutable record of a user action or agent action so the system can explain what happened and why.

## UI Layout
The dashboard should be organized around three zones:
- Overview panel: project health, current phase, open blockers, recent runs, and next actions.
- Workboard: SDLC stages, tasks, dependencies, and agent assignments.
- Activity stream: agent logs, approvals, code outputs, warnings, and completed work.

## Agent Execution Model
1. A user creates or selects a project task.
2. The system chooses an agent based on task type and required capability.
3. The agent receives scoped context from the project, repo, and task state.
4. The agent produces an artifact such as a patch, test file, review note, or plan update.
5. The system records the run, surfaces diffs or outputs, and requests approval when needed.
6. Approved changes can be applied back to the workspace or synced to external systems.

## Data Flow
- Renderer requests data through typed IPC calls.
- Main process routes privileged operations to local services.
- Domain services persist state and publish updates back to the UI.
- Agent runs emit events that update task state, audit records, and activity logs.

## Persistence
Primary local storage should include:
- Projects and tasks
- Agent definitions and capabilities
- Run history and logs
- Approval decisions
- Audit events

A relational local store works well because the UI will need filtering, timelines, and history views.

## Security and Safety
- Keep the renderer sandboxed.
- Expose only required IPC methods through preload.
- Require explicit approval before any destructive file changes or external sync.
- Log every privileged action with enough context for later review.

## Extensibility
The architecture should allow new agent types, additional SDLC phases, and integrations with GitHub, GitLab, Jira, and CI systems without changing the dashboard contract.

## Build and Packaging
- Use Electron Builder or a similar packager for desktop distribution.
- Separate main, preload, and renderer builds.
- Keep shared types in a common package or folder so UI and domain code stay aligned.

## Open Questions
- Should the first release be local-only or support authenticated cloud sync?
- Which storage engine should be used first: SQLite, JSON files, or another embedded database?
- Should agent execution happen locally, through remote APIs, or both?
- Which repository integrations are required for the initial release?

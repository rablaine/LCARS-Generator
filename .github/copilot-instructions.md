# Copilot Instructions for LCARS Generator

## Git Workflow

- **Never commit directly to `main`.**
- Always create a feature branch for changes (e.g., `feature/add-html-export`, `fix/elbow-gap-rendering`).
- When merging to `main`, use `--no-ff` to preserve the feature branch history:
  ```
  git checkout main
  git merge --no-ff feature/branch-name
  ```
- Write clear, descriptive commit messages. Use imperative mood (e.g., "Add grid toggle" not "Added grid toggle").
- Keep commits focused — one logical change per commit.

## Project Context

- This is a **general-purpose LCARS layout editor** — not tied to any specific hardware or output format.
- Frontend is vanilla HTML/CSS/JS with Canvas API. No frameworks, no build step.
- Backend is Node.js + Express + sql.js (pure JS SQLite).
- The app is deployed as a Docker container to Azure Container Apps via GitHub Actions CI/CD.
- All frontend files live in `public/`.

## Code Style

- No TypeScript, no bundler, no transpiler — keep it simple.
- Use `const` by default, `let` when reassignment is needed, never `var`.
- Prefer descriptive function and variable names.
- Keep files focused — each JS file has a clear responsibility (see README for structure).

## Testing Changes

- Run locally with `node server.js` and open `http://localhost:3000`.
- Verify canvas rendering, element interactions, and export output after changes.

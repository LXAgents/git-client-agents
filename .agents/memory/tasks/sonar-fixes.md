---
name: sonar-fixes
description: Task record for the SonarCloud findings on the dashboard (1.2.1).
status: done
---

# SonarCloud fixes

## Goal / Objective / Detail

- **Goal:** clear the 8 SonarCloud findings the owner reported on 2026-10-31.
- **Objective:**
  - A checked session read from sessionStorage.
  - `npm ci --ignore-scripts` in the Dockerfile and CI.
  - A real `<button>` as the modal backdrop.
  - A top-level `@starting-style` for the `enter` utility.
  - A linear trailing-slash trim for the API URL.
- **Detail:**
  - `.sonarcloud.properties` marks the test files as tests for automatic analysis.
  - No dependency has install scripts, so `--ignore-scripts` changes nothing in the build.

## Tasks

| # | Title | Scope | Repository | Branch | Files / areas | PR |
|---|---|---|---|---|---|---|
| 1 | Task record | This record | git-client-agents | `plan/sonar-fixes` | `.agents/` | |
| 2 | Sonar fixes | Session check, Modal, CSS, install scripts, regex | git-client-agents | `fix/sonar-fixes` | `src/`, `Dockerfile`, `.github/` | |
| 3 | Release | 1.2.1 changelog and version | git-client-agents | `release/1.2.1` | `wiki/logs/`, `package.json` | |

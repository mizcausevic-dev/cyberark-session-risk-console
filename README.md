# cyberark-session-risk-console

Board-readable CyberArk privileged session risk console for recording coverage, MFA freshness, command anomaly controls, safe ownership, termination readiness, stale accounts, unreviewed sessions, and privileged blast radius.

[![ci](https://github.com/mizcausevic-dev/cyberark-session-risk-console/actions/workflows/ci.yml/badge.svg)](https://github.com/mizcausevic-dev/cyberark-session-risk-console/actions/workflows/ci.yml)
[![pages](https://github.com/mizcausevic-dev/cyberark-session-risk-console/actions/workflows/pages.yml/badge.svg)](https://github.com/mizcausevic-dev/cyberark-session-risk-console/actions/workflows/pages.yml)
[![License: AGPL v3](https://img.shields.io/badge/License-AGPL%20v3-blue.svg)](LICENSE)

## Why this exists

Privileged access breaks trust when session evidence is missing or stale:

- Are high-risk sessions recorded?
- Are MFA and command anomaly controls current?
- Does each safe have a clear owner?
- Are terminated-user and stale privileged accounts removed?
- Which access lane needs review before the next board-risk packet?

This repo converts synthetic CyberArk session metadata into a board-readable privileged-session control console.

## Local run

```bash
npm install
npm run verify
npm run demo
```

## CLI

```bash
npx cyberark-session-risk-console fixtures/cyberark-session-sample.json --format markdown
npx cyberark-session-risk-console fixtures/cyberark-session-sample.json --format json
```

## Kinetic Gain fit

This adds a privileged-session governance lane to the Kinetic Gain portfolio: CyberArk PAM evidence, board-risk posture, session review, termination readiness, and access-exposure routing.

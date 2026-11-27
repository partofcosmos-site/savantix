# Savantix — Academic Telemetry, Attendance & Study Workbench

**Live App:** https://savantix.pages.dev

Savantix is an offline-first, cross-device study workbench and attendance regulator designed for students. Every account is isolated to its own private cloud sync partition, and Demo Mode runs 100% locally with zero personal data.

## Core Capabilities
- **Precision Dual-Theme Interface**: Defaults to Precision Dark Graphite (`#090a0c`) with a 1-click / `Alt+T` Daylight toggle and zero flash on load.
- **Attendance Tracker & Skip Decision Engine**: Live effective vs. raw percentage, safe-skip buffer at 75% and 60% thresholds, consecutive recovery math, auto-calculated calendar working days, bulk date import, `.ics` calendar export, and `.json` backup/restore.
- **Dashboard & 1-Line Quick Log**: Daily target progress bar, natural-language study log parser (`45m physics optics 15q 85%`), 52-week heatmap, and streak resilience engine.
- **Pomodoro & Flowmodoro Engine**: Drift-free focus timer, dynamic earned breaks, ambient audio synthesizer, and 1-click partial focus logging.
- **Analytics & Velocity Intelligence**: 7-day vs. prior 7-day study momentum strip, speed-accuracy calibration (SACM), subject equilibrium, and CSV/JSON export.
- **Goals, Journal & AI Gateway**: Milestone tracking, 7-day Markdown journal export, and an in-app KaTeX STEM solver backed by Cloudflare Workers AI.
- **Cross-Device Tombstone Sync**: Durable Cloudflare KV sync (`/api/sync`) with deletion tombstones so edits and deletions stay consistent across phone and desktop.

## Development
```bash
npm install
npm run dev
npm run build
```

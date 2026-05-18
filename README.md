# bitburner-hacks

[![CI](https://github.com/jbee43/bitburner-hacks/actions/workflows/ci.yml/badge.svg)](https://github.com/jbee43/bitburner-hacks/actions/workflows/ci.yml)
[![Security](https://github.com/jbee43/bitburner-hacks/actions/workflows/security.yml/badge.svg)](https://github.com/jbee43/bitburner-hacks/actions/workflows/security.yml)

TypeScript automation for [Bitburner](https://github.com/bitburner-official/bitburner-src), compiled and hot-reloaded via [Viteburner](https://github.com/Tanimodori/viteburner)

## Setup

```bash
npm install
npm run dev
```

Connect the game at **Options > Remote API > port 12525**

## Development

| Command             | Description                                   |
| ------------------- | --------------------------------------------- |
| `npm run dev`       | Start Viteburner dev server (port 12525)      |
| `npm run typecheck` | Run TypeScript type checking (`tsc --noEmit`) |
| `npm run lint`      | Run ESLint + Prettier checks                  |
| `npm run lint:fix`  | Auto-fix lint/formatting issues               |

### CI/CD

GitHub Actions run on every push and PR to `main` (see `.github/workflows/ci.yml`):

1. `npm ci` (install dependencies)
2. `npm audit --omit=dev` (security audit)
3. `npm run typecheck` (type checking)
4. `npm run lint` (lint + formatting)

Recommended game settings:

-   Theme Browser: **Dark+** or **Default-lite**
-   Style Editor: move **Consolas** to 1st, save

## Usage

In the game terminal:

```
alias init="run init.js"
init
```

`init.js` reads `config.txt` and launches every enabled module, toggle any system on/off there

## Architecture

```
init.ts ──> reads config.txt
         ├─ loop.scan           network topology
         ├─ loop.overview       real-time HUD overlay
         ├─ loop.nuker          port-crack + nuke servers
         ├─ loop.hacking        hack/grow/weaken orchestration
         ├─ loop.servers        buy & upgrade purchased servers
         ├─ loop.hacknet        nodes/servers + hash spending
         ├─ loop.singularity    work, education, crime, home upgrades
         │   ├─ .backdoor       backdoors + faction joins
         │   └─ .darkweb        Tor + programs
         ├─ loop.gang           recruit, ascend, equip, assign
         ├─ loop.corporation    divisions, offices, warehouses
         ├─ loop.bladeburner    ops/contracts, skills, city selection
         ├─ loop.sleeves        assign sleeves + buy augmentations
         ├─ loop.grafting       graft augmentations
         └─ loop.contracts      auto-solve coding contracts
```

### Core

| Script        | Purpose                                                           |
| ------------- | ----------------------------------------------------------------- |
| `init.ts`     | Entry point, launches all enabled loop scripts                    |
| `config.txt`  | Central config (intervals, toggles, wallet limits, hash spending) |
| `helper.ts`   | Zero-RAM utility class (wallet, config, hosts, formatting)        |
| `log.ts`      | Colored logging with context, timestamps, debug/error/warn/info   |
| `constant.ts` | Shared constants (filenames, programs, world daemon)              |

### Loop Modules

Each runs independently on its own interval, enable/disable via `config.txt`

| Module                      | Description                                                      |
| --------------------------- | ---------------------------------------------------------------- |
| `loop.scan`                 | Maintains network topology in `hosts.txt` and `targets.txt`      |
| `loop.overview`             | Real-time HUD overlay with progress bars and animated indicators |
| `loop.nuker`                | Port-cracks and nukes servers for admin access                   |
| `loop.hacking`              | Orchestrates hack/grow/weaken daemons on time-weighted targets   |
| `loop.servers`              | Buys and upgrades purchased servers                              |
| `loop.hacknet`              | Manages hacknet nodes/servers + hash spending strategies         |
| `loop.singularity`          | Work, education, crime, home upgrades (Singularity API)          |
| `loop.singularity.backdoor` | Installs backdoors on faction servers, joins factions            |
| `loop.singularity.darkweb`  | Buys Tor + darkweb programs in priority order                    |
| `loop.gang`                 | Recruits, ascends, equips, and assigns gang members              |
| `loop.corporation`          | Manages divisions, offices, upgrades, warehouses                 |
| `loop.bladeburner`          | Runs operations/contracts, manages skills and city selection     |
| `loop.sleeves`              | Assigns sleeves to work/training and purchases augmentations     |
| `loop.grafting`             | Grafts augmentations from Chop Shop                              |
| `loop.contracts`            | Auto-solves coding contracts across the network                  |

### Coding Contract Solvers

28 solver entries across 23 files in `src/contracts/`:

-   Algorithmic Stock Trader (I--IV)
-   Array Jumping Game (I--II)
-   Compression (I: RLE, II: LZ Decompression, III: LZ Compression)
-   Encryption (I: Caesar, II: Vigenere)
-   Find All Valid Math Expressions
-   Find Largest Prime Factor
-   Generate IP Addresses
-   HammingCodes (Integer to Binary, Binary to Integer)
-   Merge Overlapping Intervals
-   Minimum Path Sum in a Triangle
-   Proper 2-Coloring of a Graph
-   Sanitize Parentheses in Expression
-   Shortest Path in a Grid
-   Spiralize Matrix
-   Square Root
-   Subarray with Maximum Sum
-   Total Ways to Sum (I--II)
-   Unique Paths in a Grid (I--II)

### Utilities

| Script            | Purpose                                         |
| ----------------- | ----------------------------------------------- |
| `cleanup.ts`      | Bulk file deletion across servers (interactive) |
| `achievements.ts` | Unlock all achievements via DOM                 |
| `show.hosts.ts`   | Display network tree with server stats          |

### Interfaces

-   `Config.ts` (full typed config schema)
-   `Host.ts` (extended Server with depth/links/ramFree)
-   `Faction.ts` (Faction data like name, required hacking, optional company)

## Config Reference

All behavior is controlled by `src/config.txt` (JSON), key sections:

| Section       | Key Fields                                                                  |
| ------------- | --------------------------------------------------------------------------- |
| _(root)_      | `slowMo`, `walletFreeze` (global throttle and spending freeze)              |
| `logs`        | `context`, `debug`, `date`, `terminal` (log formatting and output)          |
| `overview`    | Toggle each HUD section: hacknet, scripts, corp, gang, bladeburner, etc.    |
| `hacking`     | `targetMoneyPercent` (0 = XP mode), `targetCount`, `stanek`, `homeRamSpare` |
| `hacknet`     | `useRam`, wallet limits, `hashSpend.*` (14 spending strategies)             |
| `gang`        | `faction`, `nationality` (for names), `clash`, `ascend`, `recruit`          |
| `corporation` | `name`, `fundsMax`/`fundsPercent`, `upgradeWarehouse`                       |
| `singularity` | `combat`, `focus`, `killWorldDaemon`, `nextBitnode`, `augment`              |
| `sleeves`     | `assign`, `augment`, `shockMax`, `syncMin`                                  |
| `servers`     | Wallet limits for purchased server upgrades                                 |
| `bladeburner` | `inciteViolence` toggle                                                     |
| `grafting`    | Augmentation type toggles: `hack`, `combat`, `crime`, `companyRep`, etc.    |

Every loop section has `init` (enable/disable) and `intervalMs` (loop speed)

Wallet-gated sections have `walletMax` (-1 = unlimited) and `walletPercent`

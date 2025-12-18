# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Stoned Rabbits: Idle Empire** is a dual-platform idle/incremental game:
- **Web Version (MVP):** Live at https://stoned-rabbits-game.web.app/ - HTML5/JavaScript game deployed via Firebase Hosting
- **Unity Version (In Development):** Native Android build with enhanced graphics and features

This is a BMAD-managed project following Agile methodology with specialized AI agents for different roles.

## Quick Start

### Testing the Web Version
```bash
# Test web app in browser
cd "C:\Users\tjdot\stonned idle empire\web-app"
node verify_ui.js

# Deploy to Firebase Hosting
cd "C:\Users\tjdot\stonned idle empire\web-app"
firebase deploy --only hosting
```

### Working with Unity
```bash
# Unity project location
cd "C:\Users\tjdot\stonned idle empire\unity-project"

# Open in Unity Editor
# Unity 2022 LTS required
# Target: Android, API Level 24+
```

## Repository Structure

```
stonned idle empire/
├── CLAUDE.md                                    # This file
├── Stoned_Rabbits_Idle_Empire_Whitepaper.pdf   # Original design doc
├── .claude/commands/bmad/                       # BMAD agent slash commands
├── bmad/
│   ├── agents/                                  # Agent persona definitions
│   ├── workflows/                               # Workflow templates (see below)
│   └── docs/
│       ├── gdd.md                              # Game Design Document (CRITICAL)
│       ├── game-architecture.md                # Technical architecture
│       ├── development-workflow.md             # Test-first workflow
│       ├── mvp-phase1.md                       # Unity setup instructions
│       └── gemini-*.md                         # Sprint directives
├── web-app/
│   ├── public/
│   │   ├── index.html                          # Main game UI
│   │   ├── game.js                             # Core game logic
│   │   ├── cloud-save.js                       # Firebase authentication
│   │   ├── nft-api.js                          # NFT integration hooks
│   │   └── styles.css                          # Game styling
│   ├── firebase.json                           # Firebase Hosting config
│   ├── package.json                            # Playwright dependency
│   └── verify_ui.js                            # Browser testing script
└── unity-project/
    └── Assets/_Game/
        ├── Scripts/
        │   ├── Core/                           # Managers (singleton pattern)
        │   ├── Data/                           # ScriptableObject definitions
        │   ├── Systems/                        # Game logic (production, save)
        │   ├── UI/                             # View controllers
        │   └── Utils/                          # BigNumber, helpers
        ├── Prefabs/                            # UI/Building/Rabbit prefabs
        ├── Scenes/                             # Main, Boot
        └── Data/                               # ScriptableObject instances
```

## BMAD Agent System

Load specialized agents via slash commands in `.claude/commands/bmad/`:

| Agent | Command | Role |
|-------|---------|------|
| Samus Shepard | `/bmad/game-designer` | Creative vision, GDD management |
| Ada Unity | `/bmad/game-architect` | Technical architecture, code review |
| Marcus CodeRunner | `/bmad/game-dev` | Implementation, coding |
| Sprint Shepherd | `/bmad/scrum-master` | Sprint planning, story management |

### Agent Workflows

When working with a BMAD agent, trigger workflows with `*workflow-name`:

**Game Designer:**
- `*brainstorm-game` - Brainstorm concepts
- `*create-game-brief` - Create game brief
- `*create-gdd` - Create/update GDD
- `*narrative` - Narrative design

**Game Architect:**
- `*game-architecture` - Define technical architecture
- `*code-review` - Review code quality

**Scrum Master:**
- `*sprint-planning` - Plan next sprint
- `*create-stories` - Create user stories from GDD
- `*retrospective` - Sprint retrospective

## Architecture Patterns (CRITICAL)

### Web Version (JavaScript)

**Data-Driven Design:**
```javascript
// Buildings defined as data objects
const BUILDINGS = [
  { id: 'farm', name: 'Rabbit Farm', baseCost: 10, baseProduction: 1, growthRate: 1.07 },
  { id: 'extractor', name: 'Energy Extractor', baseCost: 500, baseProduction: 8, unlockLevel: 10 }
];
```

**Production Formula:**
```javascript
Production = BaseRate × (1.15^Level) × RabbitMultiplier × PrestigeMultiplier
Cost(n) = BaseCost × (1.07^n)
```

**Save System:**
- Local: `localStorage` with JSON serialization
- Cloud: Firebase Firestore with Google OAuth
- Offline progression: Timestamp-based calculation `(now - lastSave) × productionRate`

### Unity Version (C#)

**Manager Pattern (Singletons):**
```csharp
// Core systems accessible globally
GameManager.Instance
CurrencyManager.Instance     // Magic Dust transactions
ProductionManager.Instance   // Tick-based production
RabbitManager.Instance       // Collection/assignment
SaveManager.Instance         // Encrypted save/load
```

**Data-Driven Design (ScriptableObjects):**
```csharp
// All game data defined in Assets/_Game/Data/
RabbitData.cs      // Rarity, multipliers, visuals
BuildingData.cs    // Cost curves, production rates
UpgradeData.cs     // Effects, requirements
```

**Observer Pattern (UI Events):**
```csharp
// UI subscribes to manager events (avoid FindObjectOfType in Update)
CurrencyManager.Instance.OnDustChanged += UpdateDisplay;
```

**BigNumber System:**
- Custom `BigNumber` struct using `double` (supports up to 1e308)
- Automatic formatting: 1.5K, 2.3M, 1.0e15
- Operator overloading for natural math syntax

**Naming Conventions:**
- Classes: `PascalCase` (RabbitController)
- Variables: `camelCase` (currentDust)
- Private fields: `_underscoreCamelCase` (_productionRate)
- Constants: `SCREAMING_SNAKE_CASE` (MAX_RABBITS)

## Core Game Systems

### Rarity System
| Rarity | Multiplier | Drop Rate | Color |
|--------|-----------|-----------|-------|
| Common | ×1.00 | 60% | Gray |
| Rare | ×1.10 | 25% | Blue |
| Epic | ×1.25 | 10% | Purple |
| Legendary | ×1.50 | 4% | Gold |
| Mythic | ×2.00 | 1% | Red |

### Prestige System ("Ascend the Burrow")
```javascript
BurrowTokens = floor(log10(TotalLifetimeDust))
PrestigeMultiplier = 1 + (BurrowTokens × 0.1)
```

**Talent Tree:**
- Costs 1-3 tokens per talent
- Max 3-5 levels per talent
- Categories: Production, Speed, Rabbit bonuses
- Effects: +5% production, -10% cooldowns, +rare drop chance

### Mini-Games
1. **Lucky Wheel** - Spin for dust/boosts (15min cooldown)
2. **Coin Flip** - Double production for 10min (30min cooldown)
3. **Rumble Battle** - PvE combat for rewards (1hr cooldown)
4. **Expedition** - Send rabbits on missions (2hr cooldown)

## Development Workflow (TEST-FIRST)

**Critical Rule:** ALWAYS test in browser before declaring work complete.

### Story Completion Checklist
Before marking ANY story as done:

1. **Self-Test:**
   - [ ] Feature works as described
   - [ ] No console errors
   - [ ] Doesn't break existing features
   - [ ] Save/load still works
   - [ ] Mobile responsive

2. **Deploy & Browser Test:**
   ```bash
   cd "C:\Users\tjdot\stonned idle empire\web-app"
   firebase deploy --only hosting
   # Test at https://stoned-rabbits-game.web.app/
   ```

3. **Verify in Browser:**
   ```bash
   node verify_ui.js
   # Screenshot saved to local_verify_ui.png
   ```

4. **Report Results:**
   - Screenshot or description
   - Any issues encountered
   - Confirmation all checklist items pass

### Firebase Commands
```bash
# List projects
firebase projects:list

# Switch project
firebase use stoned-rabbits-game

# Deploy hosting
firebase deploy --only hosting

# View logs
firebase hosting:channel:list
```

## Key Formulas Reference

```javascript
// Building costs
Cost(level) = BaseCost × (1.07 ^ level)

// Building production
Production(level) = BaseProduction × (1.15 ^ level)

// Total production
TotalProduction = Σ(BuildingProduction × RabbitMult × PrestigeMult)

// Offline earnings
OfflineEarnings = min(ProductionRate × TimeAway, MaxOfflineTime × ProductionRate)
MaxOfflineTime = 4 hours (upgradeable with talents)

// Prestige tokens
Tokens = floor(log10(LifetimeDust))
// Example: 1e10 total dust = 10 tokens

// Talent multiplier
TalentEffect = 1 + (talentLevel × talentBonus)
```

## Performance Considerations

**Unity:**
- Target 60 FPS on mid-range Android (Snapdragon 665+)
- Object pooling for particles (dust collection effects)
- Tick-based production (1 update/second, not every frame)
- Battery-friendly: Consider 30 FPS cap when idle

**Web:**
- Lazy load images
- Debounce save operations (save every 5 seconds, not per click)
- Use CSS transforms for animations (GPU accelerated)
- Progressive Web App (PWA) support via manifest.json

## Common Tasks

### Add New Building (Web)
1. Add building data to `BUILDINGS` array in `game.js`
2. Set `unlockLevel` requirement
3. Define `baseCost`, `baseProduction`, `growthRate`
4. Test unlock triggers correctly
5. Deploy and verify in browser

### Add New Building (Unity)
1. Create `BuildingData` ScriptableObject in `Assets/_Game/Data/`
2. Configure cost curve, production, visuals
3. Add unlock condition in `ProductionManager.cs`
4. Create prefab in `Assets/_Game/Prefabs/Buildings/`
5. Test in Unity Play mode

### Add New Rabbit Rarity
1. Update `RARITIES` in `game.js` (web) or `RabbitData.cs` (Unity)
2. Adjust drop rates (must sum to 100%)
3. Define multiplier and visual treatment
4. Update crate opening logic
5. Test drop rates over 100+ crates

## Documentation Priority

When making design decisions, consult in order:
1. `bmad/docs/gdd.md` - Game Design Document (source of truth)
2. `bmad/docs/game-architecture.md` - Technical patterns
3. `bmad/docs/development-workflow.md` - Process rules
4. `Stoned_Rabbits_Idle_Empire_Whitepaper.pdf` - Original vision

## Integration Points

**Firebase:**
- Hosting: `web-app/public/` directory
- Authentication: Google OAuth via `cloud-save.js`
- Firestore: Cloud save storage (future: leaderboards)

**Unity Ads:**
- SDK integration: `Assets/Plugins/UnityAds/`
- Rewarded video: 2x boost, extra spins
- Placement IDs configured in Unity Dashboard

**NFT Integration (Future):**
- `nft-api.js` contains hooks for Stonned Rabitts collection
- Read-only contract calls (no wallet signatures)
- Cosmetic benefits for NFT holders

## Version Control

**Commit Message Format:**
```
[EPIC-X] Brief description

- Detailed change 1
- Detailed change 2

Tested: Yes/No
```

**Branch Strategy:**
- `main` - Production (web app deploys from here)
- `unity-dev` - Unity development
- `feature/*` - Individual features
- `hotfix/*` - Emergency fixes

## Launch Roadmap (8 Weeks)

| Week | Epic | Deliverable |
|------|------|-------------|
| 1 | Core Production | Magic Dust, Buildings, Basic UI |
| 2 | Rabbit System | Collection, Crates, Assignment |
| 3 | Mini-Games A | Lucky Wheel, Coin Flip |
| 4 | Mini-Games B | Rumble, Expeditions |
| 5 | Prestige | Ascend the Burrow, Talent Tree |
| 6 | Integration | Ads, IAP, Tutorial |
| 7 | Polish | Analytics, Cloud Save, Beta |
| 8 | Launch | Store Listing, Soft Launch |

## Testing Devices

**Web:** Test on:
- Chrome Desktop (primary)
- Chrome Mobile Android (required)
- Safari iOS (nice-to-have)

**Unity:** Test on:
- Pixel 4a (target: mid-range)
- Samsung A52 (target: mid-range)
- Older device (Snapdragon 665 minimum)

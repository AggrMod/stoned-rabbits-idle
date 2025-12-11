# Stoned Rabbits: Idle Empire - Project Instructions

## Project Overview

This is a BMAD-managed game development project for "Stoned Rabbits: Idle Empire" - an idle/incremental game for Android built with Unity.

## BMAD Agents

Load agents via Claude Code slash commands in `.claude/commands/bmad/`:

- `/bmad/game-designer` - Creative vision and GDD management (Samus Shepard)
- `/bmad/game-architect` - Technical architecture and systems (Ada Unity)
- `/bmad/game-dev` - Implementation and coding (Marcus CodeRunner)
- `/bmad/scrum-master` - Sprint planning and story management (Sprint Shepherd)

## Key Documents

| Document | Location | Purpose |
|----------|----------|---------|
| Whitepaper | `./Stoned_Rabbits_Idle_Empire_Whitepaper.pdf` | Original design document |
| GDD | `./bmad/docs/gdd.md` | Game Design Document |
| Architecture | `./bmad/docs/architecture.md` | Technical architecture |
| Backlog | `./bmad/docs/backlog.md` | Product backlog |
| Current Sprint | `./bmad/docs/current-sprint.md` | Active sprint |

## Workflow Commands

When working with a BMAD agent, use `*workflow-name` to trigger workflows:

### Game Designer Workflows
- `*brainstorm-game` - Brainstorm game concepts
- `*create-game-brief` - Create game brief
- `*create-gdd` - Create/update GDD
- `*narrative` - Narrative design

### Game Architect Workflows
- `*game-architecture` - Define technical architecture
- `*code-review` - Review code

### Scrum Master Workflows
- `*sprint-planning` - Plan next sprint
- `*create-stories` - Create user stories from GDD
- `*retrospective` - Sprint retrospective

## Project Structure

```
stonned idle empire/
├── CLAUDE.md                    # This file
├── Stoned_Rabbits_Idle_Empire_Whitepaper.pdf
├── .claude/
│   └── commands/
│       └── bmad/               # BMAD agent commands
├── bmad/
│   ├── agents/                 # Agent definitions
│   ├── workflows/              # Workflow templates
│   ├── docs/                   # Project documentation
│   │   ├── gdd.md             # Game Design Document
│   │   ├── architecture.md    # Technical Architecture
│   │   ├── backlog.md         # Product Backlog
│   │   └── stories/           # User stories
│   └── templates/              # Document templates
└── unity-project/              # Unity project (when created)
```

## Development Roadmap

| Week | Focus | Epic |
|------|-------|------|
| 1 | Core Production | Magic Dust, Buildings, Basic UI |
| 2 | Rabbit System | Collection, Crates, Assignment |
| 3 | Mini-Games A | Spin the Wheel, Coin Flip |
| 4 | Mini-Games B | Rumble Battles, Expeditions |
| 5 | Prestige | Ascend the Burrow, Talent Tree |
| 6 | Integration | Ads, IAP, Tutorial |
| 7 | Polish | Analytics, Cloud Save, Beta |
| 8 | Launch | Store Listing, Release |

## Key Formulas

```
Production = BaseRate × BuildingLevel × RabbitMultiplier × GlobalMultiplier
Cost(n) = BaseCost × (1.07^n)
Production(n) = BaseProduction × (1.15^n)
BurrowTokens = floor(log10(TotalDustGenerated))
```

## Rarity System

| Rarity | Multiplier | Drop Rate |
|--------|-----------|-----------|
| Common | ×1.00 | 60% |
| Rare | ×1.10 | 25% |
| Epic | ×1.25 | 10% |
| Legendary | ×1.50 | 4% |
| Mythic | ×2.00 | 1% |

## Best Practices

1. Always read the GDD before making design decisions
2. Update documentation when mechanics change
3. Use the Scrum Master to break work into stories
4. Test on mid-range Android devices
5. Keep monetization player-friendly (no pay-to-win)

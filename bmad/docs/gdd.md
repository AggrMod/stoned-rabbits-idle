# Stoned Rabbits: Idle Empire - Game Design Document

**Author:** TJ Thompson
**Game Type:** Idle / Incremental / Resource Management
**Target Platform(s):** Android (Google Play Store)
**Engine:** Unity

---

## Executive Summary

### Core Concept

In "Stoned Rabbits: Idle Empire", the player manages an ever-growing empire run by mischievous rabbits. These rabbits generate Magic Dust, the universal resource used for upgrades, buildings, and overall progression.

The player expands the rabbit settlement, unlocks new buildings, collects and upgrades rabbit workers, and uses mini-games to accelerate progress. The game is lighthearted, humorous, and fast-paced, while providing long-tail engagement expected from idle titles.

### Target Audience

- **Primary:** Casual mobile gamers who enjoy idle/incremental games
- **Secondary:** Fans of cute animal-themed games
- **Age Range:** 13+ (family-friendly content)
- **Session Length:** 2-10 minute active sessions with offline progression

### Unique Selling Points (USPs)

1. **Rabbit Worker System** - Collect and upgrade unique rabbits with different rarities and abilities
2. **Multiple Mini-Games** - Spin the Wheel, Rumble Battles, Coin Flip, Expeditions for variety
3. **Deep Prestige System** - "Ascend the Burrow" with Burrow Tokens and talent trees
4. **Humorous Tone** - Lighthearted, slightly "stoned" humor without explicit references
5. **Future NFT Integration** - Cosmetic hooks for potential blockchain ecosystem (post-launch)

---

## Goals and Context

### Project Goals

1. Launch on Google Play Store within 6-8 weeks
2. Achieve 100k downloads in first 3 months
3. Maintain D7 retention above 15%
4. Generate sustainable ad revenue with rewarded video focus
5. Build foundation for seasonal content and live ops

### Background and Rationale

The idle/incremental genre has proven highly successful on mobile with games like Cookie Clicker, Adventure Capitalist, and Idle Heroes. "Stoned Rabbits" differentiates through its worker collection system and mini-game variety while maintaining the satisfying core loop of exponential growth.

---

## Core Gameplay

### Game Pillars

1. **Satisfying Progression** - Constant sense of growth and achievement
2. **Collection & Customization** - Build your unique rabbit team
3. **Strategic Optimization** - Assign rabbits to maximize production
4. **Engaging Variety** - Mini-games break up the core loop

### Core Gameplay Loop

```
1. Rabbits generate Magic Dust passively over time
2. Player collects Magic Dust (manually or auto-collect)
3. Player spends Magic Dust on building upgrades
4. Upgraded buildings increase Magic Dust production
5. Loop repeats with ever-increasing production and costs
```

### Win/Loss Conditions

- **No explicit win/loss** - This is an endless progression game
- **Success measured by:** Prestige level, total lifetime Magic Dust, rabbit collection completion
- **Milestone rewards** at key thresholds keep players engaged

---

## Game Mechanics

### Primary Mechanics

#### Magic Dust Production
- Main soft currency generated passively
- Production formula: `Production = BaseRate × BuildingLevel × RabbitMultiplier × GlobalMultiplier`
- Visual feedback: floating dust particles, collection animations

#### Building System
Each building:
- Produces Magic Dust at a base rate
- Gains multipliers with each level upgrade
- Has unlock requirements tied to progression

**Building Tiers:**

#### Tier 1: MVP (Launch)
| Building | Function | Unlock | Base Cost | Base Prod |
|----------|----------|--------|-----------|-----------|
| Rabbit Farm | Basic early-game Dust production | Start | 10 | 1 |
| Energy Extractor | Medium production, higher multipliers | Level 10 | 500 | 8 |
| Lucky Wheel Station | Generates Spin Tickets | Level 15 | 1,000 | 5 |
| Loot Vault | Stores offline rewards | Level 20 | 5,000 | 10 |
| Dust Compressor | Scales strongly with prestige | Level 25 | 25,000 | 50 |
| Rumble Arena | Unlocks Rumble Battles | Level 30 | 100,000 | 100 |

#### Tier 2: Post-Launch Update (Planned)
| Building | Function | Unlock |
|----------|----------|--------|
| Crystal Cavern | Gem generation (premium currency trickle) | Level 50 |
| Rabbit Academy | Faster rabbit XP/evolution | Level 60 |
| Time Warp Tower | Increases offline earnings cap | Level 75 |
| Mystic Garden | Rare ingredient drops for crafting | Level 100 |

#### Tier 3: Major Expansion (Planned)
| Building | Function | Unlock |
|----------|----------|--------|
| Dimensional Portal | Access to alternate "worlds" | Level 150 |
| Legendary Forge | Craft unique rabbits | Level 200 |
| Burrow Bank | Burrow Token interest/staking | Level 250 |
| Infinity Engine | True endgame scaling | Level 300 |

> **Note:** Tier 2 and Tier 3 buildings are documented for roadmap planning. MVP ships with Tier 1 only. Architecture must support easy addition of new buildings.

### Controls and Input

- **Tap to collect** - Manual dust collection from buildings
- **Tap to upgrade** - One-tap building upgrades with hold for bulk
- **Swipe/scroll** - Navigate between screens
- **Drag and drop** - Assign rabbits to buildings

---

## Idle/Incremental Specific Elements

### Core Click/Interaction

**Primary Mechanic:**
- Tap buildings to collect accumulated Magic Dust
- Click value scales with building level and assigned rabbits
- Auto-collect unlocked progressively
- Visual satisfaction: dust particles, number popups, sound effects

### Upgrade Trees

**Building Upgrades:**
- Cost formula: `Cost(n) = BaseCost × (1.07^n)`
- Each level provides ~15% production increase
- Milestone levels (25, 50, 100, etc.) unlock special bonuses

**Rabbit Upgrades:**
- Evolution through Rabbit Shards (10 shards = next tier)
- Talent unlocks at higher evolution tiers

### Automation Systems

**Passive Mechanics:**
- Base production always runs (even when not tapping)
- Auto-collector upgrades reduce need for manual tapping
- Manager rabbits can automate entire buildings
- Offline progression: Calculate elapsed time on return, grant Magic Dust

### Prestige and Reset Mechanics

**"Ascend the Burrow" System:**
- Unlock at 1e10 total Magic Dust generated
- Reset: Building levels, Magic Dust, temporary boosts
- Retain: Burrow Tokens, cosmetics, gems, achievements

**Burrow Tokens:**
- Formula: `BurrowTokens = floor(log10(TotalDustGenerated))`
- Spent in talent tree for permanent bonuses:
  - Global production multipliers
  - Faster rabbit generation
  - Extra expedition slots
  - Improved rarity chances
  - Upgrade cost discounts

### Number Balancing

**Economy Design:**
- Exponential growth curves (base 1.07 cost, 1.15 production)
- Notation: Standard (K, M, B, T) transitioning to scientific at high values
- Soft caps every ~50 levels requiring optimization
- Time gates: 4-hour free wheel spin, expedition cooldowns
- Wall breakers: Prestige, mini-game rewards, rewarded ads

### Meta-Progression

**Long-term Engagement:**
- Achievement system with gem rewards
- Rabbit collection (catch 'em all)
- Seasonal content (Easter, Halloween, Winter rabbits)
- Challenge runs (speed prestige, no-ads challenge)
- Endgame: Infinite scaling with diminishing returns

---

## Rabbits (Workers) System

### Rabbit Attributes

Each rabbit has:
- **Rarity:** Common, Rare, Epic, Legendary, Mythic
- **Production Multiplier:** Based on rarity
- **Talent Tags:** Mining, Engineering, Luck, Battle, Expedition
- **Visual Identity:** Unique appearance per rabbit

### Rarity Multipliers

| Rarity | Multiplier | Drop Rate |
|--------|-----------|-----------|
| Common | ×1.00 | 60% |
| Rare | ×1.10 | 25% |
| Epic | ×1.25 | 10% |
| Legendary | ×1.50 | 4% |
| Mythic | ×2.00 | 1% |

### Rabbit Collection

- Start with one Common rabbit
- New crate available every 5-10 minutes (or via rewards)
- Crate tiers affect rarity chances
- Duplicates convert to Rabbit Shards for evolution

### Rabbit Evolution

- 10 shards of same rabbit = evolution to next tier
- Evolution increases multiplier and may unlock talents
- Visual changes at each evolution tier

---

## Mini-Games

### Spin the Wheel

- **Frequency:** Free every 4 hours, additional via Spin Tickets or ads
- **Rewards:**
  - Temporary multipliers (2× for 10 min, 5× for 3 min)
  - Free rabbit crates
  - Gems
  - Large Magic Dust chunks
  - Rare "Lucky Jackpot" outcomes

### Rumble Battles

- **Mechanic:** Light auto-battle mini-game
- **Setup:** Select up to 3 rabbits for battle
- **Stats:** Attack, Defense, Health (derived from rarity + talents)
- **Outcome:** Auto-resolved based on stats and randomness
- **Rewards:** Temporary boosts, Rumble points, battle rabbit shards
- **No penalty for losing** (casual-friendly)

### Coin Flip Boost

- **Mechanic:** 50/50 gamble
- **Win:** 2× global production for 10 minutes
- **Lose:** No reward, cooldown applies
- **Extra flips via rewarded ads**

### Expeditions

- **Duration:** 1-12 hour missions
- **Setup:** Assign rabbits with Expedition talent
- **Rewards:** Magic Dust, Gems, Shards, Tickets, Cosmetics
- **Ideal for:** Offline play and long sessions

---

## User Interface

### Main Screens

1. **Home/Farm Screen**
   - Central game view
   - Shows buildings, production rates
   - Quick collect button
   - Currency display

2. **Rabbits Screen**
   - Collection grid
   - Rabbit details (rarity, multipliers, talents)
   - Assignment interface

3. **Upgrades Screen**
   - Building upgrade options
   - Unlock milestones

4. **Mini-Games Hub**
   - Access to all 4 mini-games
   - Ticket/cooldown status

5. **Prestige Screen**
   - Ascend the Burrow button
   - Potential Burrow Token preview
   - Talent tree

6. **Shop**
   - IAP offerings
   - Gem packs, rabbit bundles
   - Play Store compliant presentation

7. **Settings**
   - Audio, language, credits
   - Privacy policy, terms

### Navigation

- Bottom nav bar: Home, Rabbits, Mini-Games, Prestige, Shop
- Top bar: Currency display, Missions, Events, Notifications

---

## Art and Audio

### Art Style

- 2D soft, colorful art with cartoon feel
- Rabbits: Cute, mischievous expressions
- Buildings: Clear silhouettes, visible upgrade stages
- UI: Rounded cards, clean typography

### Tone and Humor

- Lighthearted, chaotic, playful humor
- No explicit drug references
- Example: "Your rabbits are working very hard... or at least they think they are."

### Audio

**Music:**
- Calm, looping background tracks
- Seasonal themes for events

**Sound Effects:**
- Collecting: Soft pops/chimes
- Upgrades: Satisfying "whoosh"
- Wheel: Ticking + win chime
- Battles: Cartoon combat sounds
- UI: Subtle clicks

---

## Monetization

### Rewarded Video Ads (Primary)

- Temporary production boosts
- Extra Spins or Rumble entries
- Free rabbit crates
- Premium currency (Gems)

### Interstitial Ads (Optional)

- Non-intrusive natural breaks
- Frequency tuned to avoid frustration

### In-App Purchases

| Price | Package |
|-------|---------|
| €0.99 | Starter Pack (gems + basic crate) |
| €3.99 | Rare Rabbit Pack |
| €9.99 | Epic Rabbit Bundle |
| €19.99 | Legendary Builder Bundle |
| €5.99 | Seasonal Rabbit Pass |

### Cosmetics

- Rabbit skins (no gameplay advantage)
- Building themes
- UI themes

---

## Development Epics

### Epic 1: Core Production (Week 1)
- Magic Dust system
- Building controller
- Basic UI

### Epic 2: Rabbit System (Week 2)
- Rabbit data (ScriptableObjects)
- Collection and crates
- Assignment mechanics

### Epic 3: Mini-Games A (Week 3)
- Spin the Wheel
- Coin Flip Boost

### Epic 4: Mini-Games B (Week 4)
- Rumble Battles
- Expeditions

### Epic 5: Prestige (Week 5)
- Ascend the Burrow
- Talent tree
- Shop skeleton

### Epic 6: Integration (Week 6)
- Unity Ads
- IAP
- Tutorial

### Epic 7: Polish (Week 7)
- Analytics
- Cloud save
- Beta testing

### Epic 8: Launch (Week 8)
- Final polish
- Play Store listing
- Release

---

## Success Metrics

### Technical Metrics

- Load time < 3 seconds
- Stable 60 FPS on mid-range devices
- Crash rate < 1%
- Battery usage optimized for idle play

### Gameplay Metrics

- D1 Retention: 40%+
- D7 Retention: 15%+
- D30 Retention: 5%+
- Average session: 5+ minutes
- Sessions per day: 3+
- Prestige rate: First prestige within 24 hours

---

## Out of Scope (MVP)

- PvP multiplayer
- Social features (friends, guilds)
- Leaderboards (post-launch feature)
- NFT integration (future consideration)
- iOS version (Android first)

---

## Assumptions and Dependencies

- Unity 2022 LTS
- Unity Ads SDK
- Google Play Billing Library
- Google Play Games Services (cloud save)
- Analytics: Firebase or similar
- Big number library for 1e100+ values

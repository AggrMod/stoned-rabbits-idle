# Gemini Task Oversight Checklist

**Purpose:** Claude reviews Gemini's implementation work to ensure alignment with BMAD epics and GDD.

---

## Current Sprint Focus

Review Gemini's work against these criteria:

### Epic Alignment Check

For each piece of work Gemini produces, verify:

- [ ] **Matches an Epic** - Work ties to Epic 1-8 in backlog
- [ ] **Matches a Story** - Implements a specific story (e.g., CORE-001)
- [ ] **Follows GDD** - Mechanics match `bmad/docs/gdd.md` specifications
- [ ] **No Scope Creep** - Doesn't add features not in backlog

---

## Epic 1: Core Production - Review Points

When Gemini works on core production, verify:

| Requirement | GDD Spec | Check |
|-------------|----------|-------|
| Production Formula | `Production = BaseRate × BuildingLevel × RabbitMultiplier × GlobalMultiplier` | [ ] |
| Cost Formula | `Cost(n) = BaseCost × (1.07^n)` | [ ] |
| Production Growth | `Production(n) = BaseProduction × (1.15^n)` | [ ] |
| Big Numbers | Handles 1e10+ values | [ ] |
| Offline Calculation | Grants dust based on elapsed time | [ ] |

**Buildings to implement:**
- [ ] Rabbit Farm (start unlocked)
- [ ] Energy Extractor (level 10)
- [ ] Dust Compressor (level 25)
- [ ] Lucky Wheel Station (level 15)
- [ ] Rumble Arena (level 30)
- [ ] Loot Vault (level 20)

---

## Epic 2: Rabbit System - Review Points

| Requirement | GDD Spec | Check |
|-------------|----------|-------|
| Common multiplier | ×1.00, 60% drop | [ ] |
| Rare multiplier | ×1.10, 25% drop | [ ] |
| Epic multiplier | ×1.25, 10% drop | [ ] |
| Legendary multiplier | ×1.50, 4% drop | [ ] |
| Mythic multiplier | ×2.00, 1% drop | [ ] |
| Evolution | 10 shards = next tier | [ ] |
| Assignment | Rabbits boost building production | [ ] |

---

## Epic 3-4: Mini-Games - Review Points

### Spin the Wheel
- [ ] Free spin every 4 hours
- [ ] Spin Tickets for extra spins
- [ ] Rewards: multipliers, crates, gems, dust, jackpot

### Coin Flip
- [ ] 50/50 mechanic
- [ ] Win: 2× production for 10 minutes
- [ ] Lose: cooldown, no penalty

### Rumble Battles
- [ ] Select up to 3 rabbits
- [ ] Auto-battle with Attack/Defense/Health
- [ ] No penalty for losing

### Expeditions
- [ ] 1-12 hour duration options
- [ ] Expedition talent bonus
- [ ] Rewards: dust, gems, shards, tickets, cosmetics

---

## Epic 5: Prestige - Review Points

| Requirement | GDD Spec | Check |
|-------------|----------|-------|
| Trigger | 1e10 total Magic Dust | [ ] |
| Token Formula | `floor(log10(TotalDustGenerated))` | [ ] |
| Reset | Building levels, Magic Dust, temp boosts | [ ] |
| Keep | Burrow Tokens, cosmetics, gems, achievements | [ ] |
| Talent Tree | Permanent bonuses from tokens | [ ] |

---

## Code Quality Checks

For any code Gemini writes:

- [ ] **Modular** - Uses base classes/interfaces where appropriate
- [ ] **ScriptableObjects** - Rabbit and Building data use SOs
- [ ] **Save System** - Data persists correctly
- [ ] **Performance** - No unnecessary allocations in update loops
- [ ] **Mobile-Ready** - Touch input, appropriate UI scaling

---

## Red Flags to Watch For

Alert if Gemini:

1. **Changes formulas** without discussing (economy balance is critical)
2. **Adds features** not in the backlog (scope creep)
3. **Skips stories** to work on later epics (dependency issues)
4. **Ignores rarity rates** (monetization impact)
5. **Hard-codes values** that should be configurable
6. **Misses offline calculation** (core idle game feature)

---

## Review Template

When reviewing Gemini's work, use this format:

```
## Review: [Feature/File Name]

**Epic:** [1-8]
**Story:** [CORE-001, RABBIT-002, etc.]

### Alignment Check
- [ ] Matches GDD specification
- [ ] Follows established formulas
- [ ] No scope creep

### Issues Found
- [List any problems]

### Recommendations
- [Suggested fixes]

### Verdict
- [ ] APPROVED - Ready to merge
- [ ] NEEDS CHANGES - Issues listed above
- [ ] BLOCKED - Missing dependencies
```

---

## Quick Reference: Key Numbers

Keep these handy when reviewing:

| Metric | Value |
|--------|-------|
| Cost growth rate | 1.07× per level |
| Production growth rate | 1.15× per level |
| Prestige threshold | 1e10 dust |
| Free wheel spin | Every 4 hours |
| Crate timer | 5-10 minutes |
| Evolution shards needed | 10 |
| Coin flip boost | 2× for 10 min |
| Max expedition time | 12 hours |

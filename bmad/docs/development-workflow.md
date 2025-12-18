# Development Workflow: Test-First Approach

**Critical Rule:** Every story must be tested before moving to the next one. No industrial-size holes!

---

## Story Completion Checklist

Before marking ANY story as complete:

### 1. Self-Test Checklist
- [ ] Feature works as described in story
- [ ] No console errors
- [ ] Doesn't break existing features
- [ ] Save/load still works
- [ ] Reset button still works
- [ ] Mobile responsive (if UI)

### 2. Deploy & Verify
- [ ] Deploy to Firebase: `firebase deploy --only hosting`
- [ ] Test on live URL in browser
- [ ] Test in incognito (fresh state)
- [ ] Test with existing save (migration)

### 3. Report to Claude for Review
Send to Claude:
- What was implemented
- Screenshot or description of result
- Any issues encountered

---

## Revised Epic Flow

### Epic 1: Core Production (COMPLETE)
Already done in web MVP:
- [x] Magic Dust counter
- [x] Rabbit Farm building
- [x] Upgrade system
- [x] Offline progression
- [x] Save/Load
- [x] Reset button

### Epic 2: Second Building (Next)
**Goal:** Add Energy Extractor to prove multi-building works

| Story | Description | Test Criteria |
|-------|-------------|---------------|
| 2.1 | Add building data structure for multiple buildings | Buildings array renders correctly |
| 2.2 | Add Energy Extractor (unlocks at level 10) | Locked until Rabbit Farm level 10 |
| 2.3 | Show locked buildings with unlock requirement | "Unlock at Level 10" visible |
| 2.4 | Combined production rate display | Total /sec shows both buildings |

**Test after EACH story before proceeding!**

### Epic 3: Visual Polish
**Goal:** Make it look more like a real game

| Story | Description | Test Criteria |
|-------|-------------|---------------|
| 3.1 | Add more rabbit NFT images | Multiple rabbits display |
| 3.2 | Building card redesign | Cleaner, more game-like cards |
| 3.3 | Animations on collect/upgrade | Visual feedback on actions |
| 3.4 | Sound effects (optional) | Satisfying clicks and chimes |

### Epic 4: Mini-Game (Spin the Wheel)
**Goal:** First mini-game to break up core loop

| Story | Description | Test Criteria |
|-------|-------------|---------------|
| 4.1 | Add mini-games tab/section | Navigation works |
| 4.2 | Basic wheel UI | Wheel displays with segments |
| 4.3 | Spin animation | Wheel spins smoothly |
| 4.4 | Reward distribution | Rewards apply correctly |
| 4.5 | Cooldown timer (4 hours) | Can't spam spin |

### Epic 5: Rabbit Collection
**Goal:** Collectible rabbits system

| Story | Description | Test Criteria |
|-------|-------------|---------------|
| 5.1 | Rabbit data structure | Can define rabbit types |
| 5.2 | Collection UI | Shows owned rabbits |
| 5.3 | Crate opening | Grants random rabbit |
| 5.4 | Rarity system | Drop rates match GDD |
| 5.5 | Assign rabbit to building | Multiplier applies |

### Epic 6: Prestige System
**Goal:** Long-term progression loop

| Story | Description | Test Criteria |
|-------|-------------|---------------|
| 6.1 | Prestige trigger (1e10 dust) | Button appears at threshold |
| 6.2 | Burrow Token calculation | Formula matches GDD |
| 6.3 | Reset behavior | Correct items reset/persist |
| 6.4 | Talent tree UI | Can spend tokens |
| 6.5 | Permanent bonuses | Multipliers apply after prestige |

---

## Communication Protocol

### Gemini → Claude Flow

After each story:
```
Story Completed: [Story ID]
What was done: [Description]
Test Results: [Pass/Fail + details]
Issues: [Any problems]
Ready for: [Next story ID]
```

### Claude Review Response

```
Story [ID] Review: APPROVED / NEEDS CHANGES

Issues Found: [List any]
Required Fixes: [What to fix]
Proceed To: [Next story] OR [Fix first]
```

---

## Red Flags - STOP and Ask

If any of these happen, STOP and report to Claude:

1. **Breaking Change** - Existing feature stops working
2. **Formula Change** - Any modification to growth rates
3. **Save Migration** - Old saves won't load
4. **Scope Creep** - Adding features not in story
5. **Stuck > 30 min** - Can't figure something out

---

## Current Status

**Last Commit:** `340f5f6` - MVP Phase 1 complete
**Live URL:** https://stoned-rabbits-game.web.app
**Version:** 0.1.1

**Next Up:** Epic 2, Story 2.1 - Multi-building data structure

# Gemini Sprint Directive: Epic 2 - Multi-Building System

**Date:** December 11, 2025
**Reviewed by:** Claude (Oversight)
**Starting Point:** MVP Phase 1 complete, git commit `340f5f6`

---

## CRITICAL: Test-First Workflow

Before starting ANY story, review `development-workflow.md`. The key rule:

> **Every story must be tested before moving to the next one. No industrial-size holes!**

---

## Locked Formulas (DO NOT CHANGE)

```javascript
// Cost calculation
cost = baseCost * Math.pow(1.15, level)

// Production calculation
production = baseProduction * Math.pow(1.12, level)

// Prestige tokens (future)
burrowTokens = Math.floor(Math.log10(totalDustGenerated))
```

---

## Epic 2: Multi-Building System

### Story 2.1: Building Data Structure
**Goal:** Refactor to support multiple buildings

**Implementation:**
```javascript
// Replace single building object with buildings array
const GameState = {
    magicDust: new BigNumber(0),
    totalEarned: new BigNumber(0),
    prestigeCount: 0,
    lastSaveTime: Date.now(),

    buildings: [
        {
            id: 'rabbit-farm',
            name: 'Rabbit Farm',
            level: 1,
            baseCost: 15,
            baseProduction: 1,
            costGrowthFactor: 1.15,
            productionGrowthFactor: 1.12,
            accumulatedDust: 0,
            unlocked: true,
            unlockRequirement: null
        }
    ]
};
```

**Test Criteria:**
- [ ] Game loads without errors
- [ ] Existing Rabbit Farm still works exactly as before
- [ ] Save/load still works with new structure
- [ ] Reset button clears all buildings
- [ ] No console errors

**After completing, report:**
```
Story Completed: 2.1
What was done: [Description]
Test Results: [Pass/Fail + details]
Issues: [Any problems]
Ready for: 2.2
```

---

### Story 2.2: Energy Extractor Building
**Goal:** Add second building that unlocks at Rabbit Farm level 10

**Implementation:**
Add to buildings array:
```javascript
{
    id: 'energy-extractor',
    name: 'Energy Extractor',
    level: 0,  // 0 = not yet purchased
    baseCost: 1000,
    baseProduction: 5,
    costGrowthFactor: 1.15,
    productionGrowthFactor: 1.12,
    accumulatedDust: 0,
    unlocked: false,
    unlockRequirement: { buildingId: 'rabbit-farm', level: 10 }
}
```

**Test Criteria:**
- [ ] Energy Extractor appears in UI but is locked
- [ ] Shows "Unlock at Rabbit Farm Level 10"
- [ ] Unlocks when Rabbit Farm reaches level 10
- [ ] Can purchase and upgrade once unlocked
- [ ] Production adds to total rate

---

### Story 2.3: Locked Building UI
**Goal:** Show locked buildings with requirements

**Implementation:**
- Add CSS class `.building-locked` with grayed out style
- Show lock icon and requirement text
- Disable buttons on locked buildings

**Test Criteria:**
- [ ] Locked buildings are visually distinct
- [ ] Unlock requirement is clearly visible
- [ ] Buttons are disabled/hidden on locked buildings
- [ ] Transitions smoothly to unlocked state

---

### Story 2.4: Combined Production Display
**Goal:** Header shows total production from all buildings

**Implementation:**
```javascript
function getTotalProductionRate() {
    return GameState.buildings
        .filter(b => b.unlocked && b.level > 0)
        .reduce((total, b) => {
            const rate = b.baseProduction * Math.pow(b.productionGrowthFactor, b.level);
            return total + rate;
        }, 0);
}
```

**Test Criteria:**
- [ ] Header shows combined /sec from all buildings
- [ ] Updates when any building produces
- [ ] Accurate sum of all building rates

---

## Red Flags - STOP and Report

If ANY of these happen, STOP immediately and report to Claude:

1. **Breaking Change** - Existing Rabbit Farm stops working
2. **Formula Change** - Growth rates modified from 1.15/1.12
3. **Save Migration Fail** - Old saves won't load
4. **Scope Creep** - Adding features not in this sprint
5. **Stuck > 30 min** - Can't figure something out

---

## Communication Protocol

After EACH story completion:

```
Story Completed: [ID]
What was done: [Description]
Test Results:
  - Self-test: [Pass/Fail]
  - Deploy test: [Pass/Fail]
  - Incognito test: [Pass/Fail]
Issues: [Any problems]
Ready for: [Next story]
```

Claude will review and respond:
```
Story [ID] Review: APPROVED / NEEDS CHANGES
Issues Found: [List]
Required Fixes: [What to fix]
Proceed To: [Next story] OR [Fix first]
```

---

## Deploy Commands

```bash
cd web-app
firebase deploy --only hosting
```

Live URL: https://stoned-rabbits-game.web.app

---

## Current Files

- `web-app/public/index.html` - Main HTML
- `web-app/public/styles.css` - Styles
- `web-app/public/game.js` - Game logic (THIS IS WHERE YOU WORK)
- `web-app/public/rabbit-captain.jpg` - NFT image

---

## Begin

Start with **Story 2.1** now. Do not proceed to 2.2 until 2.1 is tested and approved.

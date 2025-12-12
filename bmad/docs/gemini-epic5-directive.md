# Gemini Sprint Directive: Epic 5 - Prestige System

## Status Update

### Completed Epics (All Tested & Verified)
- **Epic 1:** Core Production System (dust, buildings, save/load, offline)
- **Epic 2:** Rabbit System (crates, assignment, multipliers, starter rabbit)
- **Epic 3:** Mini-Games Part A (Lucky Wheel 4hr CD, Coin Flip 1hr CD, 2x boosts)
- **Epic 4:** Building Unlock System (Energy Extractor unlocks at Farm L10)

### Bug Fixes Applied (Dec 12, 2025)
1. **Balance Formulas Fixed:** Changed from wrong values to GDD spec
   - `costGrowthFactor: 1.15 -> 1.07` (costs grow slower)
   - `productionGrowthFactor: 1.12 -> 1.15` (production grows faster)
2. **Save/Load Fix:** `loadGame()` no longer overwrites growth factors from saved data
3. **Reset Function:** Now fully resets all state including timers, dust, levels

### Live Game URL
https://stoned-rabbits-game.web.app/

---

## Epic 5: Prestige System ("Ascend the Burrow")

### Overview
The prestige system lets players reset progress in exchange for **Burrow Tokens** - a permanent currency that provides multiplicative bonuses. This is the core long-term engagement loop.

### Key Formulas (from GDD)
```javascript
// Burrow Tokens earned on prestige
BurrowTokens = floor(log10(TotalDustGenerated))

// Example: 1e10 total dust = 10 Burrow Tokens
// Example: 1e15 total dust = 15 Burrow Tokens

// Global multiplier from tokens
TokenMultiplier = 1 + (BurrowTokens * 0.10)  // Each token = +10% production
```

---

### Story 5.1: Prestige Data Structure
**Goal:** Add prestige-related state and calculations.

**Implementation:**
1. Add to `GameState`:
```javascript
GameState.burrowTokens = 0;        // Permanent currency
GameState.lifetimeDust = 0;        // Never resets, used for prestige calc
GameState.prestigeCount = 0;       // Already exists, just note it
```

2. Create prestige calculation function:
```javascript
function calculatePrestigeReward() {
    const lifetime = GameState.lifetimeDust;
    if (lifetime < 1e10) return 0;  // Minimum threshold
    return Math.floor(Math.log10(lifetime));
}
```

3. Update `saveGame`/`loadGame` to persist new fields.

4. **Important:** Track `lifetimeDust` separately from `totalEarned` - lifetime never resets!

**Test Criteria:**
- [ ] `lifetimeDust` accumulates and never resets
- [ ] Prestige reward calculates correctly (1e10 = 10 tokens)
- [ ] Data persists through save/load

---

### Story 5.2: Prestige Preview UI
**Goal:** Show players what they'll earn before prestiging.

**Implementation:**
1. Add prestige section to footer or new modal
2. Show:
   - Current Burrow Tokens: `{burrowTokens}`
   - Lifetime Dust: `{lifetimeDust}` (formatted with BigNumber)
   - Tokens on Prestige: `+{calculatePrestigeReward()}`
   - New Total: `{burrowTokens + reward}`

3. "Ascend the Burrow" button (disabled if reward < 1)

4. CSS styling: Make it look prestigious! Gold/purple theme.

**Test Criteria:**
- [ ] Preview shows correct token calculation
- [ ] Button disabled when not enough dust
- [ ] UI updates in real-time as dust accumulates

---

### Story 5.3: Prestige Reset Logic
**Goal:** Reset progress while keeping permanents.

**Implementation:**
1. Create `performPrestige()` function:
```javascript
function performPrestige() {
    const reward = calculatePrestigeReward();
    if (reward < 1) return;

    // Confirm dialog
    if (!confirm(`Ascend the Burrow?\n\nYou will earn ${reward} Burrow Tokens!\n\nThis resets your buildings and dust.`)) {
        return;
    }

    // Award tokens
    GameState.burrowTokens += reward;
    GameState.prestigeCount++;

    // Reset progress (but NOT these):
    // - burrowTokens (keep)
    // - lifetimeDust (keep tracking)
    // - prestigeCount (keep)
    // - rabbits (keep? TBD - maybe keep)

    // Reset these:
    GameState.magicDust = new BigNumber(0);
    GameState.totalEarned = new BigNumber(0);
    GameState.buildings.forEach(b => {
        if (b.id === 'rabbit-farm') {
            b.level = 1;
            b.unlocked = true;
        } else {
            b.level = 0;
            b.unlocked = false;
        }
        b.accumulatedDust = 0;
    });
    GameState.activeBoosts = [];
    GameState.assignedRabbits = {};
    // Keep rabbits? Yes for now - they're collectibles

    // Re-render
    saveGame();
    location.reload(); // Cleanest way to reset UI
}
```

**Test Criteria:**
- [ ] Tokens awarded correctly
- [ ] Progress resets to initial state
- [ ] Tokens persist after reset
- [ ] Rabbits preserved (collection stays)

---

### Story 5.4: Token Multiplier Effect
**Goal:** Make Burrow Tokens actually boost production.

**Implementation:**
1. Update `getGlobalMultiplier()`:
```javascript
function getGlobalMultiplier() {
    let multiplier = 1;

    // Active boosts (2x from coin flip, etc.)
    GameState.activeBoosts.forEach(boost => {
        multiplier *= boost.multiplier;
    });

    // Burrow Token bonus: +10% per token
    const tokenBonus = 1 + (GameState.burrowTokens * 0.10);
    multiplier *= tokenBonus;

    return multiplier;
}
```

2. Display token multiplier in UI somewhere (header or prestige panel)

**Test Criteria:**
- [ ] 10 tokens = 2x multiplier (1 + 10*0.10)
- [ ] Production visibly increases after prestige
- [ ] Multiplier shown in UI

---

### Story 5.5: Prestige UI Polish
**Goal:** Make prestiging feel rewarding.

**Implementation:**
1. Add prestige button to footer (next to Reset)
2. Create prestige modal with:
   - Fancy animation on open
   - Current stats display
   - "Before/After" comparison
   - Big glowy "ASCEND" button

3. On prestige success:
   - Particle explosion animation
   - "Ascension Complete!" message
   - Show new token total

4. Update header to show Burrow Token count if > 0

**Test Criteria:**
- [ ] Prestige feels rewarding, not punishing
- [ ] Clear communication of what you keep vs lose
- [ ] Token count visible after first prestige

---

## File Locations

All code is in: `web-app/public/`
- `game.js` - All game logic
- `styles.css` - All styling
- `index.html` - HTML structure

Deploy with: `cd web-app && firebase deploy --only hosting`

---

## Development Guidelines

1. **Test in browser** after each story - use Chrome DevTools
2. **Don't break existing features** - mini-games, rabbits, buildings all work
3. **Use existing patterns** - look at how boosts work for global multiplier
4. **Format big numbers** - use `BigNumber.format()` for display
5. **Save frequently** - call `saveGame()` after state changes

---

## Begin

Start with **Story 5.1** - get the data structure right first, then build UI on top of it.

Good luck! The game is solid - prestige is the last major feature before polish.

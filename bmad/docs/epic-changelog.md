# Epic Changelog - Bug Fixes & Improvements

## Dec 12, 2025 - Balance Formula & Save System Fixes

### Critical Bug Fix: Balance Formulas Backwards
**Problem:** Game was 2.4x more expensive than designed. Players couldn't progress at intended rate.
**Root Cause:** Growth factors were swapped from GDD spec:
- Code had: `costGrowthFactor: 1.15, productionGrowthFactor: 1.12`
- GDD spec: `costGrowthFactor: 1.07, productionGrowthFactor: 1.15`
**Fix:** Updated both buildings in `GameState.buildings`:
```javascript
costGrowthFactor: 1.07,  // GDD spec: costs grow slowly
productionGrowthFactor: 1.15,  // GDD spec: production grows faster
```
**Impact:** Total cost to Level 10 dropped from 350 to 218 dust (correct per GDD)
**Files Changed:** `game.js` lines 98-111

### Critical Bug Fix: Save/Load Overwriting Growth Factors
**Problem:** Old saves had wrong growth factors baked in. Even after code fix, loading a save restored bad values.
**Root Cause:** `loadGame()` used spread operator `{ ...current, ...saved }` which overwrote code defaults.
**Fix:** Changed to explicit property loading:
```javascript
if (saved) {
    return {
        ...current,
        level: saved.level,
        accumulatedDust: saved.accumulatedDust || 0,
        unlocked: saved.unlocked
        // costGrowthFactor and productionGrowthFactor stay from code!
    };
}
```
**Files Changed:** `game.js` lines 254-268

### UI Fix: Wheel Icon Size
**Problem:** User requested wheel icon 20% bigger in mini-games sidebar.
**Fix:** Changed wheel scale from 1.15 to 1.38 (1.15 * 1.2)
```css
#wheel-card .card-img-icon {
    transform: scale(1.38);
}
```
**Files Changed:** `styles.css` lines 174-177

---

## Epic 1-4 Post-Implementation Fixes

### Bug Fixes (Browser Testing Phase)

#### Bug Fix 1: Level 0 Buildings Producing Dust
**Problem:** Buildings at Level 0 (not yet purchased) were showing production rate and accumulating dust.
**Root Cause:** `getProductionRate()` calculated `baseProduction * 1.12^0 = baseProduction` even for level 0.
**Fix:** Added early return in `getProductionRate()`:
```javascript
if (building.level === 0) {
    return new BigNumber(0);
}
```
**Files Changed:** `game.js` line 136

#### Bug Fix 2: Boost Timer Stuck at 00:00
**Problem:** Expired boosts would show "2x Boost (00:00)" indefinitely instead of disappearing.
**Root Cause:** `checkBoosts()` ran AFTER `produceDust()` which calls `updateUI()`, so expired boosts were displayed before removal.
**Fix:** Moved `checkBoosts()` to run FIRST in game loop:
```javascript
// Before: produceDust, checkUnlocks, ..., checkBoosts
// After: checkBoosts, produceDust, checkUnlocks, ...
```
**Files Changed:** `game.js` line 920

#### Bug Fix 3: Accumulated Dust Persisting for Level 0 Buildings
**Problem:** Old save data had accumulated dust for buildings that were level 0.
**Fix:** Added cleanup in `loadGame()`:
```javascript
GameState.buildings.forEach(b => {
    if (b.level === 0) {
        b.accumulatedDust = 0;
    }
});
```
**Files Changed:** `game.js` lines 269-273

### UI Improvements

#### Improvement 1: Boost Timer Format
**Problem:** Boost timer showed `MM:SS` while mini-game cooldowns showed `HH:MM:SS`.
**Fix:** Updated boost timer to use consistent `HH:MM:SS` format matching mini-game timers.
**Files Changed:** `game.js` lines 487-492

#### Improvement 2: Click Outside Modal to Close
**Problem:** Users had to click X button to close modals.
**Fix:** Added event listener to close modals when clicking the overlay:
```javascript
document.querySelectorAll('.modal').forEach(modal => {
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.classList.add('hidden');
        }
    });
});
```
**Files Changed:** `game.js` lines 983-991

## Testing Notes

### Browser Testing via MCP
All testing performed using Browser MCP with live Firebase deployment at:
- https://stoned-rabbits-game.web.app

### Verification Steps
1. Hard refresh (Ctrl+Shift+R) to clear cache
2. Check Level 0 buildings show "0/sec" and "0" accumulated
3. Verify boost timer disappears when expired
4. Confirm click-outside-to-close works for all modals
5. Verify boost timer shows `HH:MM:SS` format when active

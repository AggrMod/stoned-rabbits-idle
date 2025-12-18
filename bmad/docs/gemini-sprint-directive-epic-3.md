# Gemini Sprint Directive: Epic 3 - Mini-Games A
**Goal:** Implement "Spin the Wheel" and "Coin Flip" to drive engagement and provide production boosts.

## Epic 3: Mini-Games A

### Story 3.1: Mini-Games UI Hub
**Goal:** Create a "Mini-Games" section in the UI (footer or new button) that opens a modal selection screen.
**Implementation:**
- Add "Mini-Games" button to footer.
- Create a Modal with tabs or list: "Lucky Wheel" and "Coin Flip".
- Default states: "Ready" or "Cooldown timer".
**Test Criteria:**
- [ ] Button opens modal.
- [ ] Both games listed.
- [ ] Close button works.

### Story 3.2: Spin the Wheel Logic
**Goal:** Implement the daily/4-hour free spin.
**Logic:**
- `lastSpinTime` stored in `GameState`.
- Cooldown: 4 hours (14400000 ms).
- Rewards: 
    - 40%: Small Dust (5 mins worth)
    - 30%: Medium Dust (15 mins worth)
    - 20%: 2x Speed (10 mins)
    - 9%: 5x Speed (5 mins)
    - 1%: Jackpot (100 mins worth)
**Implementation:**
- Visual: CSS rotation animation.
- Logic: `Math.random()`.
**Test Criteria:**
- [ ] Can spin when ready.
- [ ] Cannot spin during cooldown.
- [ ] Rewards correctly apply (add dust or start boost).
- [ ] Cooldown persists across save/reload.

### Story 3.3: Global Production Boost System
**Goal:** Hook for temporary multipliers.
**Implementation:**
- `GameState.activeBoosts` array: `[{ id: 'wheel_2x', value: 2, endTime: 12345678 }]`.
- Update `getTotalProductionRate()` to apply these multipliers.
- Visual: Show "🔥 2x Boost Active! (04:59)" in header.
**Test Criteria:**
- [ ] Boost increases displayed production rate.
- [ ] Boost expires correctly.
- [ ] Multiple boosts stack (additively or multiplicatively? GDD says multipliers, assume multiplicative `rate * 2 * 5` for now).

### Story 3.4: Coin Flip
**Goal:** High risk/reward boost.
**Logic:**
- 50% Win: 2x Prod for 10 mins.
- 50% Loss: Nothing + 1 hour cooldown.
**Test Criteria:**
- [ ] 50/50 odds verified.
- [ ] Win applies boost (uses system from 3.3).
- [ ] Loss triggers cooldown.

---

## Red Flags
- **Infinite Spins:** Ensure save/load prevents exploiting refresh.
- **Boost Stacking:** Don't let 2x stack to 1000x accidentally. Cap/limit if needed.

## Begin
Start with **Story 3.1**.

# Gemini Sprint Directive: Epic 4 - Rabbit Manager System

## Epic 4: Rabbit Manager System

### Story 4.1: Rabbit Data Structure
**Goal:** Define `RABBIT_DATA` and update `GameState` to store collected rabbits and assignments.
**Implementation:**
- `RABBIT_DATA`: Constant object defining rarities, multipliers, and names.
  - Common: 1.00x
  - Rare: 1.10x
  - Epic: 1.25x
  - Legendary: 1.50x
  - Mythic: 2.00x
- `GameState.rabbits`: Array of collected rabbit objects `{ id, rarity, name, assignedTo }`.
- `GameState.assignedRabbits`: Map/Object `{ buildingIndex: rabbitId }`? Or better, store assignment on the building or the rabbit?
  - Directive says: `GameState.assignedRabbits = { buildingId: rabbitId }`. Let's stick to that for O(1) lookup during production calc.
- Update `saveGame`/`loadGame` to handle new data.
**Test Criteria:**
- [ ] Data structure initialized empty.
- [ ] Can save/load rabbit data.

### Story 4.2: Rabbit Collection UI
**Goal:** View your army of stoned rabbits.
**Implementation:**
- New "Rabbits" button in footer (or header?). Footer seems best.
- Modal: `rabbit-collection-modal`.
- Grid layout of owned rabbits.
- Display Rarity (Color coded) and Multiplier.
- "Unassigned" vs "Assigned: [Building Name]" status.
**Test Criteria:**
- [ ] Button opens modal.
- [ ] Grid renders correct data from `GameState.rabbits`.
- [ ] Rarity styling (Common=Gray/White, Rare=Blue, Epic=Purple, Leg=Orange, Mythic=Red/Rainbow).

### Story 4.3: Rabbit Crate System
**Goal:** The Gacha mechanic.
**Implementation:**
- "Open Crate" button in Collection UI (or Shop later?). Let's put it in Collection for now.
- Cost: 1000 Dust (Initial cost, maybe scale it?). Or free for MVP test? Let's say **1000 Dust**.
- Logic: `Math.random()` with weighted table:
  - 0-60: Common
  - 60-85: Rare
  - 85-95: Epic
  - 95-99: Legendary
  - 99-100: Mythic
- Generate unique ID (UUID or timestamp+random).
- Add to `GameState.rabbits`.
- Visual: Pop-up showing the new rabbit.
**Test Criteria:**
- [ ] Can only open if have funds.
- [ ] Deducts dust.
- [ ] Generates rabbit based on correct probabilities.
- [ ] Saves new rabbit.

### Story 4.4: Assign Rabbit to Building
**Goal:** Apply the multiplier.
**Implementation:**
- In Collection UI: "Assign" button on rabbit card.
- Opens "Select Building" sub-modal or dropdown.
- Selecting building updates `GameState.assignedRabbits`.
- **CRITICAL:** Update `getProductionRate()` to check `GameState.assignedRabbits[building.id]`.
  - Look up rabbit ID -> Get Rabbit Rarity -> Get Multiplier.
  - Formula: `Base * GlobalBoost * RabbitMultiplier`.
- Visual: Show assigned rabbit icon on the Building card in main UI.
**Test Criteria:**
- [ ] Production rate increases immediately upon assignment.
- [ ] Unassigning reverts rate.
- [ ] Assignment persists save/load.

### Story 4.5: Starter Rabbit
**Goal:** Onboarding.
**Implementation:**
- In `init()`: If `GameState.rabbits.length === 0`, generate one Common "Starter Rabbit".
- Show notification: "You found a stray rabbit!".
**Test Criteria:**
- [ ] New save starts with 1 rabbit.
- [ ] Existing save (if 0 rabbits) gets one.

## Begin
Start with **Story 4.1**.

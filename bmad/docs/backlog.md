# Stoned Rabbits: Idle Empire - Product Backlog

## Status Legend
- [x] Complete
- [~] In Progress
- [ ] Not Started

---

## Epic 1: Core Production System ✅ COMPLETE

### Stories

- [x] **CORE-001**: As a player, I can see Magic Dust accumulating in real-time so I feel progress
- [x] **CORE-002**: As a player, I can tap buildings to collect accumulated Magic Dust
- [x] **CORE-003**: As a player, I can upgrade buildings to increase production
- [x] **CORE-004**: As a player, I can see my total Magic Dust and production rate
- [x] **CORE-005**: As a player, I return to the game and receive offline earnings

### Technical Tasks

- [x] Implement BigNumber library for exponential values
- [x] Create Building base class with production logic
- [x] Implement save/load system (localStorage)
- [x] Create UI for main farm screen
- [x] Milestone bonus system (2x at 10/25/50/100/200/400)
- [x] Cost formula: baseCost × 1.07^level
- [x] Production formula: baseProduction × 1.15^level

---

## Epic 2: Rabbit System ✅ COMPLETE

### Stories

- [x] **RABBIT-001**: As a player, I can view my rabbit collection
- [x] **RABBIT-002**: As a player, I can open crates to get new rabbits
- [x] **RABBIT-003**: As a player, I can see rabbit rarity and stats
- [x] **RABBIT-004**: As a player, rabbits provide global production multiplier
- [ ] **RABBIT-005**: As a player, I can evolve rabbits using shards (DEFERRED)
- [ ] **RABBIT-006**: As a player, duplicate rabbits give me shards (DEFERRED)

### Technical Tasks

- [x] Create Rabbit data structure with rarity/multiplier
- [x] Implement crate opening with weighted rarity
- [x] Build rabbit collection UI grid
- [ ] Assignment manager for building-rabbit linking (Epic 6)

---

## Epic 3: Mini-Games Part A ✅ COMPLETE

### Stories

- [x] **WHEEL-001**: As a player, I can spin the wheel for free every 4 hours
- [x] **WHEEL-002**: As a player, wheel gives various rewards
- [x] **FLIP-001**: As a player, I can flip a coin for a 50/50 chance at a boost
- [x] **FLIP-002**: As a player, losing the flip puts it on cooldown

### Technical Tasks

- [x] Create wheel spin animation and logic
- [x] Implement reward distribution system
- [x] Create cooldown timer system
- [x] Build mini-games hub UI

---

## Epic 4: Mini-Games Part B (DEFERRED)

*Rumble Battles and Expeditions deferred to post-launch*

---

## Epic 5: Prestige System ✅ COMPLETE

### Stories

- [x] **PRESTIGE-001**: As a player, I can see when prestige is available (1e10 dust)
- [x] **PRESTIGE-002**: As a player, I can preview my Burrow Token gain
- [x] **PRESTIGE-003**: As a player, I can "Ascend the Burrow" to prestige
- [x] **PRESTIGE-004**: As a player, tokens provide 5% production bonus each
- [x] **PRESTIGE-005**: As a player, I can reset ascend progress if needed

### Technical Tasks

- [x] Implement prestige trigger and reset logic
- [x] Create Burrow Token calculation (log10 based)
- [x] Token multiplier: 1 + (tokens × 0.05)
- [x] Create prestige confirmation UI with reset option

---

## Epic 6: Multi-Building & Rabbit Assignment 🆕

### Overview
Expand from 1 building to 4 buildings, allow rabbit assignment per building.

### 🎨 Art Requirements: 4 IMAGES
1. Stoned Farm building illustration
2. Bake Shop building illustration
3. Weed Patch building illustration
4. Infused Field building illustration

### Stories

- [ ] **BUILD-001**: Add 4 building types with different costs/production
- [ ] **BUILD-002**: Buildings unlock at specific prestige levels
- [ ] **BUILD-003**: Each building has its own upgrade path
- [ ] **ASSIGN-001**: Assign rabbits to specific buildings
- [ ] **ASSIGN-002**: Rabbit multiplier only applies to assigned building
- [ ] **ASSIGN-003**: Visual indicator shows which rabbit is assigned where

### Technical Tasks

- [ ] Create building config with 4 types
- [ ] Implement unlock system (prestige milestones)
- [ ] Add rabbit-to-building assignment logic
- [ ] Update UI to show multiple buildings
- [ ] Individual production displays per building

### Building Data
| Building | Unlock | Base Cost | Base Production |
|----------|--------|-----------|-----------------|
| Stoned Farm | Start | 50 | 1/sec |
| Bake Shop | Prestige 1 | 500 | 8/sec |
| Weed Patch | Prestige 3 | 5000 | 50/sec |
| Infused Field | Prestige 5 | 50000 | 300/sec |

---

## Epic 7: Visual Polish 🆕

### Overview
CSS-first approach - minimal images, max visual impact.

### 🎨 Art Requirements: 6-8 IMAGES
1. Game logo/title
2. Background scene (farm with sky)
3. 5 rabbit base illustrations (Bandit, Viking, Tricky, Captain, etc.)

*Trait icons use emoji/CSS - no images needed*

### Stories

- [ ] **VISUAL-001**: Vibrant color scheme (green/orange/blue)
- [ ] **VISUAL-002**: Card-based UI for buildings and rabbits
- [ ] **VISUAL-003**: Animated background with CSS gradients
- [ ] **VISUAL-004**: Tab navigation (Farm/Rabbits/Games/Prestige)
- [ ] **VISUAL-005**: Rabbit cards show rarity border colors

### Technical Tasks

- [ ] Create CSS color palette matching mockups
- [ ] Build card component system
- [ ] Implement tab navigation
- [ ] Add CSS animations for production/collect
- [ ] Gradient backgrounds (no image needed)
- [ ] Rarity glow effects (CSS only)

### CSS-First Approach
| Element | Approach |
|---------|----------|
| Background | CSS gradient (green to blue) |
| Building cards | CSS with 1 illustration each |
| Rabbit cards | CSS border + 1 illustration |
| Buttons | CSS gradients, no images |
| Icons | Emoji or CSS shapes |
| Trait icons | Emoji (🎩👓🚬🌿) |
| Particles | CSS animations |

---

## Epic 8: Shop & Gems 🆕

### Overview
Add premium currency and shop system.

### 🎨 Art Requirements: 2 IMAGES
1. Gem icon
2. Crate/chest illustration

### Stories

- [ ] **SHOP-001**: Gems as premium currency
- [ ] **SHOP-002**: Can buy crates with gems
- [ ] **SHOP-003**: Can buy boosts with gems
- [ ] **SHOP-004**: Gem display in header

### Technical Tasks

- [ ] Add gems to GameState
- [ ] Create shop UI modal
- [ ] Implement gem purchases for crates/boosts
- [ ] Save gems with game state

---

## Epic 9: Launch Prep

### Stories

- [ ] **LAUNCH-001**: Firebase Hosting deployment
- [ ] **LAUNCH-002**: Analytics integration
- [ ] **LAUNCH-003**: Performance optimization

### Technical Tasks

- [ ] Minify/bundle JS
- [ ] Optimize images (WebP)
- [ ] Add loading screen
- [ ] Test on mobile browsers

---

## 🎨 Art Asset Summary

### Total Images Needed: ~12-15

| Epic | Images | Description |
|------|--------|-------------|
| 6 | 4 | Building illustrations |
| 7 | 6-8 | Logo + background + 5 rabbits |
| 8 | 2 | Gem + crate icons |

### CSS Handles (No Images Needed)
- Backgrounds (gradients)
- Buttons (gradients)
- Card borders/glows
- Trait icons (emoji)
- Animations
- Rarity colors

---

## Priority Order (Updated)

1. **Done (MVP Logic)**
   - Core Production (Epic 1) ✅
   - Rabbit Collection (Epic 2) ✅
   - Mini-Games (Epic 3) ✅
   - Prestige System (Epic 5) ✅

2. **Next Up**
   - Multi-Building (Epic 6) - 4 images needed
   - Visual Polish (Epic 7) - 6-8 images needed

3. **After Visual**
   - Shop/Gems (Epic 8) - 2 images needed
   - Launch (Epic 9)

4. **Post-Launch**
   - Rumble Battles (Epic 4)
   - Expeditions
   - Cloud Save

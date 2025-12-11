# Stoned Rabbits: Idle Empire - Product Backlog

## Epic 1: Core Production System

### Stories

- [ ] **CORE-001**: As a player, I can see Magic Dust accumulating in real-time so I feel progress
- [ ] **CORE-002**: As a player, I can tap buildings to collect accumulated Magic Dust
- [ ] **CORE-003**: As a player, I can upgrade buildings to increase production
- [ ] **CORE-004**: As a player, I can see my total Magic Dust and production rate
- [ ] **CORE-005**: As a player, I return to the game and receive offline earnings

### Technical Tasks

- [ ] Implement BigNumber library for exponential values
- [ ] Create Building base class with production logic
- [ ] Implement save/load system with encryption
- [ ] Create UI for main farm screen

---

## Epic 2: Rabbit System

### Stories

- [ ] **RABBIT-001**: As a player, I can view my rabbit collection
- [ ] **RABBIT-002**: As a player, I can open crates to get new rabbits
- [ ] **RABBIT-003**: As a player, I can see rabbit rarity and stats
- [ ] **RABBIT-004**: As a player, I can assign rabbits to buildings to boost production
- [ ] **RABBIT-005**: As a player, I can evolve rabbits using shards
- [ ] **RABBIT-006**: As a player, duplicate rabbits give me shards

### Technical Tasks

- [ ] Create Rabbit ScriptableObject data structure
- [ ] Implement crate opening with weighted rarity
- [ ] Create assignment manager for building-rabbit linking
- [ ] Build rabbit collection UI grid

---

## Epic 3: Mini-Games Part A

### Stories

- [ ] **WHEEL-001**: As a player, I can spin the wheel for free every 4 hours
- [ ] **WHEEL-002**: As a player, I can use Spin Tickets for extra spins
- [ ] **WHEEL-003**: As a player, I can watch an ad for a free spin
- [ ] **WHEEL-004**: As a player, I can win various rewards from the wheel
- [ ] **FLIP-001**: As a player, I can flip a coin for a 50/50 chance at a boost
- [ ] **FLIP-002**: As a player, losing the flip puts it on cooldown

### Technical Tasks

- [ ] Create wheel spin animation and logic
- [ ] Implement reward distribution system
- [ ] Create cooldown timer system
- [ ] Build mini-games hub UI

---

## Epic 4: Mini-Games Part B

### Stories

- [ ] **RUMBLE-001**: As a player, I can select 3 rabbits for battle
- [ ] **RUMBLE-002**: As a player, I can watch auto-battles play out
- [ ] **RUMBLE-003**: As a player, I earn rewards for winning battles
- [ ] **RUMBLE-004**: As a player, I don't lose anything when I lose
- [ ] **EXPEDITION-001**: As a player, I can send rabbits on 1-12 hour expeditions
- [ ] **EXPEDITION-002**: As a player, I can collect expedition rewards when complete
- [ ] **EXPEDITION-003**: As a player, Expedition-talent rabbits give better rewards

### Technical Tasks

- [ ] Create battle simulation system
- [ ] Implement battle animation/visualization
- [ ] Create expedition timer and reward calculation
- [ ] Build expedition UI with slot management

---

## Epic 5: Prestige System

### Stories

- [ ] **PRESTIGE-001**: As a player, I can see when prestige is available (1e10 dust)
- [ ] **PRESTIGE-002**: As a player, I can preview my Burrow Token gain
- [ ] **PRESTIGE-003**: As a player, I can "Ascend the Burrow" to prestige
- [ ] **PRESTIGE-004**: As a player, I keep my tokens, gems, and cosmetics after prestige
- [ ] **TALENT-001**: As a player, I can spend Burrow Tokens on talent upgrades
- [ ] **TALENT-002**: As a player, talents provide permanent production bonuses

### Technical Tasks

- [ ] Implement prestige trigger and reset logic
- [ ] Create Burrow Token calculation
- [ ] Build talent tree data structure
- [ ] Create prestige confirmation UI

---

## Epic 6: Integration

### Stories

- [ ] **ADS-001**: As a player, I can watch rewarded ads for bonuses
- [ ] **ADS-002**: As a player, I see non-intrusive interstitial ads
- [ ] **IAP-001**: As a player, I can purchase gem packs
- [ ] **IAP-002**: As a player, I can buy rabbit bundles
- [ ] **TUTORIAL-001**: As a new player, I'm guided through basic mechanics

### Technical Tasks

- [ ] Integrate Unity Ads SDK
- [ ] Implement Google Play Billing
- [ ] Create tutorial sequence
- [ ] Build shop UI

---

## Epic 7: Polish

### Stories

- [ ] **ANALYTICS-001**: Track player retention metrics
- [ ] **ANALYTICS-002**: Track monetization events
- [ ] **CLOUD-001**: As a player, my progress saves to the cloud
- [ ] **BETA-001**: Conduct closed beta testing
- [ ] **BALANCE-001**: Balance economy based on beta feedback

### Technical Tasks

- [ ] Integrate Firebase Analytics
- [ ] Implement Google Play Games Services save
- [ ] Set up beta testing track
- [ ] Create analytics dashboard

---

## Epic 8: Launch

### Stories

- [ ] **STORE-001**: Create Play Store listing assets
- [ ] **STORE-002**: Write compelling store description
- [ ] **LAUNCH-001**: Submit for review
- [ ] **LAUNCH-002**: Prepare day-1 patch if needed

### Technical Tasks

- [ ] Create screenshots and feature graphics
- [ ] Record promo video
- [ ] Set up crash reporting
- [ ] Prepare release notes

---

## Priority Order

1. **Must Have (MVP)**
   - Core Production (Epic 1)
   - Rabbit Collection (basic from Epic 2)
   - Prestige System (Epic 5)
   - One Mini-Game (Spin the Wheel)

2. **Should Have**
   - Full Rabbit System (Epic 2)
   - All Mini-Games (Epics 3-4)
   - Monetization (Epic 6)

3. **Could Have**
   - Tutorial
   - Cloud Save
   - Analytics

4. **Won't Have (MVP)**
   - Leaderboards
   - Social features
   - NFT integration

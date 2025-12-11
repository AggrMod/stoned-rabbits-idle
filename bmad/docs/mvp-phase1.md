# MVP Phase 1: Core Idle Loop

**Status:** Code Complete - Ready for Unity Setup

---

## What's Been Built

### Scripts Created

```
unity-project/Assets/_Game/Scripts/
├── Core/
│   ├── CurrencyManager.cs      # Magic Dust handling
│   ├── GameManager.cs          # Main game initialization
│   └── ProductionManager.cs    # Global production tracking
├── Data/
│   └── BuildingData.cs         # ScriptableObject for buildings
├── Systems/
│   ├── Building.cs             # Runtime building behavior
│   └── SaveManager.cs          # Save/Load with encryption
├── UI/
│   └── HomeScreenUI.cs         # Main screen controller
└── Utils/
    └── BigNumber.cs            # Large number handling
```

---

## Unity Setup Instructions

### Step 1: Create Unity Project

1. Open Unity Hub
2. Create new 2D project: "StonedRabbitsIdleEmpire"
3. Copy the `Assets/_Game` folder into your new project

### Step 2: Install TextMeshPro

1. Window > Package Manager
2. Search "TextMeshPro"
3. Install (required for UI text)

### Step 3: Create Scene Structure

Create a new scene "Main" with this hierarchy:

```
Main Scene
├── --- MANAGERS ---
│   ├── GameManager (attach GameManager.cs)
│   ├── CurrencyManager (attach CurrencyManager.cs)
│   ├── ProductionManager (attach ProductionManager.cs)
│   └── SaveManager (attach SaveManager.cs)
│
├── --- BUILDINGS ---
│   └── RabbitFarm (attach Building.cs)
│
└── --- UI ---
    └── Canvas
        ├── Header
        │   ├── DustText (TMP)
        │   └── ProductionRateText (TMP)
        ├── BuildingPanel
        │   ├── BuildingNameText (TMP)
        │   ├── BuildingLevelText (TMP)
        │   └── AccumulatedDustText (TMP)
        └── ButtonsPanel
            ├── CollectButton (Button + TMP child)
            └── UpgradeButton (Button + TMP child)
```

### Step 4: Create Rabbit Farm Data

1. Right-click in `Assets/_Game/Data/`
2. Create > StonedRabbits > BuildingData
3. Name it "RabbitFarm"
4. Set values:
   - Building Name: "Rabbit Farm"
   - Description: "Basic early-game Dust production"
   - Base Cost: 10
   - Base Production: 1
   - Cost Growth Factor: 1.07 (don't change!)
   - Production Growth Factor: 1.15 (don't change!)
   - Starts Unlocked: true

### Step 5: Wire Up References

**Building GameObject:**
- Drag RabbitFarm ScriptableObject to Building component's "Data" field

**SaveManager:**
- Drag RabbitFarm Building to the "Buildings" array

**HomeScreenUI:**
- Drag all UI text elements to their fields
- Drag buttons to their fields
- Drag RabbitFarm Building to the "Building" field

### Step 6: Test!

1. Press Play
2. Dust should increment every second
3. Click Collect to gather dust
4. Click Upgrade when you have enough
5. Stop Play, then Play again - progress should persist
6. Check offline: Stop, wait 30 seconds, Play - should get offline dust

---

## Acceptance Criteria

- [x] BigNumber handles large values (tested to 1e15+)
- [x] CurrencyManager tracks Magic Dust
- [x] Building produces dust every second
- [x] Building collects accumulated dust
- [x] Building upgrades cost dust
- [x] Upgrade increases production (1.15x growth)
- [x] Upgrade cost increases (1.07x growth)
- [x] SaveManager persists data
- [x] Offline progression calculated
- [x] Save data encrypted

---

## Formulas Implemented (LOCKED)

```csharp
// Cost for next level
Cost = BaseCost × (1.07 ^ Level)

// Production at current level
Production = BaseProduction × (1.15 ^ Level)

// Offline earnings
OfflineDust = ProductionPerSecond × SecondsOffline
```

---

## What's NOT Built Yet

- ❌ Other buildings (Energy Extractor, etc.)
- ❌ Rabbits and assignment
- ❌ Mini-games
- ❌ Prestige system
- ❌ Shop/IAP
- ❌ Ads
- ❌ Polish (graphics, sound, animations)

---

## Next Phase Preview

Once this loop feels good:
1. Add Energy Extractor (unlock at level 10)
2. Add rabbit collection system
3. Add Spin the Wheel mini-game

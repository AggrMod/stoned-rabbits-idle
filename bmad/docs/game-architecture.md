# Stoned Rabbits: Idle Empire - Game Architecture

## 1. Executive Summary
This document outlines the technical architecture for "Stoned Rabbits: Idle Empire", a Unity-based idle/incremental mobile game. The architecture focuses on data-driven design using ScriptableObjects for scalability (Rabbit/Building definitions), an event-driven UI system to decouple logic from presentation, and a robust offline progression system essential for the genre. Key technical goals are performance on mobile devices and easy extensibility for weekly content updates.

## 2. Technology Stack
- **Engine**: Unity 2022 LTS (Stable)
- **Language**: C#
- **Platform**: Android (Primary), potentially iOS later.
- **Serialization**: `Newtonsoft.Json` for cloud/local saves.
- **Ads**: Unity Ads SDK.
- **Analytics**: Firebase SDK.
- **Version Control**: Git (GitHub/GitLab).

## 3. Project Structure
```text
Assets/
├── _Game/
│   ├── Audio/          # Music, SFX
│   ├── Art/
│   │   ├── Sprites/
│   │   ├── UI/
│   │   └── Animations/
│   ├── Data/           # ScriptableObject Instances (Rabbits, Buildings)
│   ├── Prefabs/
│   │   ├── UI/
│   │   ├── Buildings/
│   │   └── Rabbits/
│   ├── Scenes/         # Main, Boot, Test
│   ├── Scripts/
│   │   ├── Core/       # Managers (GameManager, CurrencyManager)
│   │   ├── Data/       # ScriptableObject Definitions
│   │   ├── Systems/    # Logic (Production, Save/Load)
│   │   ├── UI/         # View Controllers
│   │   └── Utils/      # Helpers
│   └── Tests/
├── Plugins/            # Third-party SDKs
└── Settings/
```

## 4. Architectural Patterns

### 4.1 Data-Driven Design (ScriptableObjects)
All static game data will be defined via ScriptableObjects.
- `RabbitData`: Rarity, Multipliers, Visuals.
- `BuildingData`: Base Cost, Production Rate, Growth Coefficients.
- `UpgradeData`: Cost, Effect.

### 4.2 Manager/Service Pattern (Core Systems)
Core systems will function as singletons or services, accessible via a central `GameManager` or Service Locator.
- `CurrencyManager`: Handles Magic Dust transactions and events.
- `ProductionManager`: Calculates ticks, modifiers, and offline progress.
- `RabbitManager`: Manages collection and assignment.
- `SaveManager`: Handles serialization and persistence.

### 4.3 Observer Pattern (UI)
UI components will subscribe to C# Actions/Events exposed by Managers.
- **Avoid**: `FindObjectOfType` in `Update()` or tight coupling between UI and logic.
- **Pattern**: `CurrencyManager.OnCurrencyChanged += UpdateDisplay;`

### 4.4 Offline Progression (BigInt)
- Use a `BigDouble` or custom struct for numbers exceeding standard types (1e100+).
- Timestamp-based calculation: `(CurrentTime - LastLoginTime) * ProductionRate`.

## 5. Implementation Patterns

### 5.1 Naming Conventions
- **Classes**: PascalCase (`RabbitController`)
- **Variables**: camelCase (`currentDust`)
- **Private Fields**: `_underscoreCamelCase` (`_productionRate`)
- **Constants**: SCREAMING_SNAKE_CASE (`MAX_RABBITS`)

### 5.2 Coding Standards
- Use `SerializeField` and `private` for inspector variables.
- No logic in `Update()` unless necessary (use Coroutines or Tick system for production).
- centralized "Tick" system (e.g., every 1s) for passive generation updates to save performance.

## 6. Epic Mapping

### Epic 1: Core Production
- **Systems**: `CurrencyManager`, `BuildingController`.
- **UI**: Main HUD.
- **Data**: `BuildingData` definition.

### Epic 2: Rabbit System
- **Systems**: `RabbitManager`.
- **Data**: `RabbitData`, `RabbitInventory`.
- **UI**: Rabbit Collection Grid.

### Epic 3: Mini-Games
- **Systems**: `MiniGameController` (Base class for games).
- **UI**: Wheel UI, Results Screen.

## 7. Performance Considerations
- **Battery Life**: Limit frame rate to 30/60 when idle? Use OnDemand rendering if possible (hard for idle games with animations).
- **Object Pooling**: Essential for particles (Magic Dust collection effects).
- **Memory**: Unload unused assets (though 2D idle is usually light).

## 8. Integration Points
- **AdManager**: Wraps Unity Ads, exposes `ShowRewardedAd(Action onSuccess)`.
- **IAPManager**: Wraps Unity IAP.

## 9. Next Steps (Implementation)
1. Initialize Unity Project with Folder Structure.
2. Create `BigNumber` utility.
3. Implement `CurrencyManager` (Magic Dust).
4. Create `Building` ScriptableObject workflow.

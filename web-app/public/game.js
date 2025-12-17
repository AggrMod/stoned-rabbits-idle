/**
 * Stoned Rabbits: Idle Empire - Web MVP
 * Core idle game loop with save/load and offline progression
 */

// ============================================
// BIG NUMBER UTILITY
// ============================================
class BigNumber {
    constructor(value = 0) {
        this.value = typeof value === 'number' ? value : parseFloat(value) || 0;
    }

    add(other) {
        const otherValue = other instanceof BigNumber ? other.value : other;
        return new BigNumber(this.value + otherValue);
    }

    subtract(other) {
        const otherValue = other instanceof BigNumber ? other.value : other;
        return new BigNumber(this.value - otherValue);
    }

    multiply(other) {
        const otherValue = other instanceof BigNumber ? other.value : other;
        return new BigNumber(this.value * otherValue);
    }

    greaterThanOrEqual(other) {
        const otherValue = other instanceof BigNumber ? other.value : other;
        return this.value >= otherValue;
    }

    lessThan(other) {
        const otherValue = other instanceof BigNumber ? other.value : other;
        return this.value < otherValue;
    }

    format() {
        const v = this.value;
        if (v < 1000) return Math.floor(v).toString();
        if (v < 1e6) return (v / 1e3).toFixed(1) + 'K';
        if (v < 1e9) return (v / 1e6).toFixed(1) + 'M';
        if (v < 1e12) return (v / 1e9).toFixed(1) + 'B';
        if (v < 1e15) return (v / 1e12).toFixed(1) + 'T';

        const exp = Math.floor(Math.log10(v));
        const mantissa = v / Math.pow(10, exp);
        return mantissa.toFixed(2) + 'e' + exp;
    }

    toNumber() {
        return this.value;
    }
}

// ============================================
// DATA DEFINITIONS
// ============================================

// TALENT TREE DEFINITIONS
const TALENT_TREE = {
    // Production Talents
    dustMaster: {
        id: 'dustMaster', name: 'Dust Master', maxLevel: 5, cost: 1,
        description: '+5% production per level',
        effect: (level) => 1 + (level * 0.05)
    },
    goldenCarrot: {
        id: 'goldenCarrot', name: 'Golden Carrot', maxLevel: 3, cost: 2,
        description: '+10% offline earnings per level',
        effect: (level) => 1 + (level * 0.10)
    },
    luckyClover: {
        id: 'luckyClover', name: 'Lucky Clover', maxLevel: 3, cost: 2,
        description: '+5% mini-game rewards per level',
        effect: (level) => 1 + (level * 0.05)
    },
    // Speed Talents
    speedyPaws: {
        id: 'speedyPaws', name: 'Speedy Paws', maxLevel: 5, cost: 1,
        description: '-10% cooldown time per level',
        effect: (level) => 1 - (level * 0.10)
    },
    expeditionExpert: {
        id: 'expeditionExpert', name: 'Expedition Expert', maxLevel: 3, cost: 2,
        description: '+15% expedition rewards per level',
        effect: (level) => 1 + (level * 0.15)
    },
    // Rabbit Talents
    rabbitWhisperer: {
        id: 'rabbitWhisperer', name: 'Rabbit Whisperer', maxLevel: 3, cost: 3,
        description: '+0.1 rabbit multiplier bonus per level',
        effect: (level) => level * 0.1
    },
    crateHunter: {
        id: 'crateHunter', name: 'Crate Hunter', maxLevel: 3, cost: 2,
        description: '+2% rare drop chance per level',
        effect: (level) => level * 0.02
    },
    // Battle Talents
    battleHardened: {
        id: 'battleHardened', name: 'Battle Hardened', maxLevel: 3, cost: 2,
        description: '+10% rumble win chance per level',
        effect: (level) => level * 0.10
    }
};

const RABBIT_DATA = {
    rarities: {
        common: { name: 'Common', multiplier: 1.00, color: '#888888' },
        rare: { name: 'Rare', multiplier: 1.10, color: '#3498db' },
        epic: { name: 'Epic', multiplier: 1.25, color: '#9b59b6' },
        legendary: { name: 'Legendary', multiplier: 1.50, color: '#f39c12' },
        mythic: { name: 'Mythic', multiplier: 2.00, color: '#e74c3c' }
    },
    types: [
        { id: 'carrot-muncher', name: 'Carrot Muncher' },
        { id: 'dust-sniffer', name: 'Dust Sniffer' },
        { id: 'lucky-paws', name: 'Lucky Paws' },
        { id: 'speed-hopper', name: 'Speed Hopper' },
        { id: 'battle-bunny', name: 'Battle Bunny' }
    ]
};

// ============================================
// GAME STATE
// ============================================
const GameState = {
    magicDust: new BigNumber(0),
    totalEarned: new BigNumber(0),
    lifetimeDust: new BigNumber(0), // Never resets, used for prestige calc
    burrowTokens: 0,                // Permanent currency
    prestigeCount: 0,
    lastSaveTime: Date.now(),
    lastSpinTime: 0, // Timestamp of last spin
    lastFlipTime: 0, // Timestamp of last coin flip
    lastRumbleTime: 0, // Timestamp of last rumble battle
    expeditionStartTime: 0, // When expedition started (0 = not on expedition)
    expeditionDuration: 0, // Duration in ms
    expeditionRabbitId: null, // Rabbit sent on expedition
    activeBoosts: [], // Array of { id, multiplier, endTime }
    rabbits: [],      // Array of { id, typeId, rarity, level }
    assignedRabbits: {}, // { buildingId: rabbitId }
    talents: {}, // { talentId: level }
    spentTokens: 0, // Tokens spent on talents

    buildings: [
        {
            id: 'rabbit-farm',
            name: 'Rabbit Farm',
            level: 1,
            baseCost: 50,
            baseProduction: 1,
            costGrowthFactor: 1.07,
            productionGrowthFactor: 1.15,
            accumulatedDust: 0,
            unlocked: true,
            unlockRequirement: null
        },
        {
            id: 'weed-patch',
            name: 'Weed Patch',
            level: 0,
            baseCost: 1000,
            baseProduction: 10,
            costGrowthFactor: 1.08,
            productionGrowthFactor: 1.15,
            accumulatedDust: 0,
            unlocked: false,
            unlockRequirement: { buildingId: 'rabbit-farm', level: 15 }
        },
        {
            id: 'bake-shop',
            name: 'Bake Shop',
            level: 0,
            baseCost: 15000,
            baseProduction: 80,
            costGrowthFactor: 1.09,
            productionGrowthFactor: 1.15,
            accumulatedDust: 0,
            unlocked: false,
            unlockRequirement: { buildingId: 'weed-patch', level: 15 }
        },
        {
            id: 'infused-field',
            name: 'Infused Field',
            level: 0,
            baseCost: 200000,
            baseProduction: 500,
            costGrowthFactor: 1.10,
            productionGrowthFactor: 1.16,
            accumulatedDust: 0,
            unlocked: false,
            unlockRequirement: { buildingId: 'bake-shop', level: 15 }
        },
        {
            id: 'energy-extractor',
            name: 'Energy Extractor',
            level: 0,
            baseCost: 2500000,
            baseProduction: 3000,
            costGrowthFactor: 1.12,
            productionGrowthFactor: 1.18,
            accumulatedDust: 0,
            unlocked: false,
            unlockRequirement: { buildingId: 'infused-field', level: 20 }
        },
        // ========== TIER 2 BUILDINGS ==========
        {
            id: 'crystal-cavern',
            name: 'Crystal Cavern',
            level: 0,
            baseCost: 25000000,
            baseProduction: 15000,
            costGrowthFactor: 1.14,
            productionGrowthFactor: 1.20,
            accumulatedDust: 0,
            unlocked: false,
            unlockRequirement: { buildingId: 'energy-extractor', level: 50 },
            tier: 2,
            special: 'gems',
            gemRate: 0.001
        },
        {
            id: 'rabbit-academy',
            name: 'Rabbit Academy',
            level: 0,
            baseCost: 100000000,
            baseProduction: 50000,
            costGrowthFactor: 1.15,
            productionGrowthFactor: 1.22,
            accumulatedDust: 0,
            unlocked: false,
            unlockRequirement: { buildingId: 'crystal-cavern', level: 60 },
            tier: 2,
            special: 'xp',
            xpRate: 0.1
        },
        {
            id: 'time-warp-tower',
            name: 'Time Warp Tower',
            level: 0,
            baseCost: 500000000,
            baseProduction: 200000,
            costGrowthFactor: 1.16,
            productionGrowthFactor: 1.24,
            accumulatedDust: 0,
            unlocked: false,
            unlockRequirement: { buildingId: 'rabbit-academy', level: 75 },
            tier: 2,
            special: 'offline',
            offlineBonus: 0.05
        },
        {
            id: 'mystic-garden',
            name: 'Mystic Garden',
            level: 0,
            baseCost: 2500000000,
            baseProduction: 1000000,
            costGrowthFactor: 1.18,
            productionGrowthFactor: 1.26,
            accumulatedDust: 0,
            unlocked: false,
            unlockRequirement: { buildingId: 'time-warp-tower', level: 100 },
            tier: 2,
            special: 'ingredients',
            dropChance: 0.001
        },
        // ========== TIER 3 BUILDINGS (Endgame) ==========
        {
            id: 'dimensional-portal',
            name: 'Dimensional Portal',
            level: 0,
            baseCost: 50000000000,
            baseProduction: 10000000,
            costGrowthFactor: 1.20,
            productionGrowthFactor: 1.28,
            accumulatedDust: 0,
            unlocked: false,
            unlockRequirement: { buildingId: 'mystic-garden', level: 150 },
            tier: 3,
            special: 'worlds',
            worldBonus: 0.25 // +25% all production per world unlocked
        },
        {
            id: 'legendary-forge',
            name: 'Legendary Forge',
            level: 0,
            baseCost: 500000000000,
            baseProduction: 100000000,
            costGrowthFactor: 1.22,
            productionGrowthFactor: 1.30,
            accumulatedDust: 0,
            unlocked: false,
            unlockRequirement: { buildingId: 'dimensional-portal', level: 200 },
            tier: 3,
            special: 'crafting',
            craftChance: 0.0001 // Chance to auto-craft legendary rabbit
        },
        {
            id: 'burrow-bank',
            name: 'Burrow Bank',
            level: 0,
            baseCost: 5000000000000,
            baseProduction: 1000000000,
            costGrowthFactor: 1.24,
            productionGrowthFactor: 1.32,
            accumulatedDust: 0,
            unlocked: false,
            unlockRequirement: { buildingId: 'legendary-forge', level: 250 },
            tier: 3,
            special: 'staking',
            interestRate: 0.001 // +0.1% token interest per level per hour
        },
        {
            id: 'infinity-engine',
            name: 'Infinity Engine',
            level: 0,
            baseCost: 100000000000000,
            baseProduction: 50000000000,
            costGrowthFactor: 1.25,
            productionGrowthFactor: 1.35,
            accumulatedDust: 0,
            unlocked: false,
            unlockRequirement: { buildingId: 'burrow-bank', level: 300 },
            tier: 3,
            special: 'infinity',
            infinityMultiplier: 0.01 // +1% multiplicative bonus per level
        }
    ],

    // Tier 2 currencies
    gems: 0,
    rabbitXP: 0,
    ingredients: [],
    
    // Tier 3 currencies/progress
    worldsUnlocked: 0,
    legendaryRabbitsCrafted: 0,
    stakedTokens: 0,
    infinityLevel: 0
};

// ============================================
// GAME CALCULATIONS
// ============================================
function getUpgradeCost(building) {
    return new BigNumber(building.baseCost * Math.pow(building.costGrowthFactor, building.level));
}

function getGlobalMultiplier() {
    let multiplier = 1;
    GameState.activeBoosts.forEach(boost => {
        multiplier *= boost.multiplier;
    });

    // Burrow Token bonus: +10% per token (Directive 5.4)
    const tokenBonus = 1 + (GameState.burrowTokens * 0.10);
    multiplier *= tokenBonus;

    // Dust Master talent bonus
    const dustMasterLevel = GameState.talents['dustMaster'] || 0;
    if (dustMasterLevel > 0) {
        multiplier *= TALENT_TREE.dustMaster.effect(dustMasterLevel);
    }

    return multiplier;
}

// Milestone levels that give 2x bonus each
const MILESTONES = [10, 25, 50, 100, 200, 400];

function getMilestoneMultiplier(level) {
    let mult = 1;
    for (const milestone of MILESTONES) {
        if (level >= milestone) {
            mult *= 2;
        }
    }
    return mult;
}

function getNextMilestone(level) {
    for (const milestone of MILESTONES) {
        if (level < milestone) return milestone;
    }
    return null; // All milestones reached
}

function getProductionRate(building) {
    // Level 0 means not purchased yet - no production
    if (building.level === 0) {
        return new BigNumber(0);
    }
    const base = building.baseProduction * Math.pow(building.productionGrowthFactor, building.level);
    const globalMult = getGlobalMultiplier();
    const milestoneMult = getMilestoneMultiplier(building.level);

    // Rabbit multiplier
    let rabbitMult = 1;
    const assignedRabbitId = GameState.assignedRabbits[building.id];
    if (assignedRabbitId) {
        const rabbit = GameState.rabbits.find(r => r.id === assignedRabbitId);
        if (rabbit) {
            rabbitMult = RABBIT_DATA.rarities[rabbit.rarity].multiplier;
        }
    }

    // Tier 3 bonuses (endgame)
    const worldMult = typeof getWorldBonus === 'function' ? getWorldBonus() : 1;
    const infinityMult = typeof getInfinityMultiplier === 'function' ? getInfinityMultiplier() : 1;

    return new BigNumber(base * globalMult * milestoneMult * rabbitMult * worldMult * infinityMult);
}

function canAffordUpgrade(building) {
    return GameState.magicDust.greaterThanOrEqual(getUpgradeCost(building));
}

function calculatePrestigeReward() {
    const lifetime = GameState.lifetimeDust.toNumber();
    if (lifetime < 1e10) return 0;  // Minimum threshold
    return Math.floor(Math.log10(lifetime));
}

// ============================================
// GAME ACTIONS
// ============================================
function collectDust(buildingIndex) {
    // Handle specific building or default to first (Rabbit Farm)
    const index = typeof buildingIndex === 'number' ? buildingIndex : 0;
    const building = GameState.buildings[index];

    const amount = building.accumulatedDust;
    if (amount <= 0) return;

    GameState.magicDust = GameState.magicDust.add(amount);
    GameState.totalEarned = GameState.totalEarned.add(amount);
    GameState.lifetimeDust = GameState.lifetimeDust.add(amount);
    building.accumulatedDust = 0;

    // Visual feedback
    spawnDustParticle();
    showNumberPop('+' + new BigNumber(amount).format());

    updateUI();
    saveGame();
}

function upgradeBuilding(buildingIndex) {
    const index = typeof buildingIndex === 'number' ? buildingIndex : 0;
    const building = GameState.buildings[index];

    const cost = getUpgradeCost(building);
    if (!GameState.magicDust.greaterThanOrEqual(cost)) return;

    GameState.magicDust = GameState.magicDust.subtract(cost);
    building.level++;

    // Check for milestone celebration
    if (MILESTONES.includes(building.level)) {
        const mult = getMilestoneMultiplier(building.level);
        showNumberPop(`⭐ MILESTONE! ${mult}x BONUS! ⭐`);
        // Re-render to update milestone display
        renderBuildings();
    } else {
        showNumberPop('Level Up! 🎉');
    }

    updateUI();
    saveGame();
}

function produceDust() {
    GameState.buildings.forEach(building => {
        if (building.unlocked && building.level > 0) {
            const production = getProductionRate(building).toNumber();
            building.accumulatedDust += production;
        }
    });
    updateUI();
}

// ============================================
// SAVE / LOAD
// ============================================
const SAVE_KEY = 'stonedRabbits_saveData';

function saveGame() {
    const saveData = {
        magicDust: GameState.magicDust.toNumber(),
        totalEarned: GameState.totalEarned.toNumber(),
        lifetimeDust: GameState.lifetimeDust.toNumber(),
        burrowTokens: GameState.burrowTokens,
        prestigeCount: GameState.prestigeCount,
        buildings: GameState.buildings,
        buildings: GameState.buildings,
        lastSpinTime: GameState.lastSpinTime,
        lastFlipTime: GameState.lastFlipTime,
        lastRumbleTime: GameState.lastRumbleTime,
        expeditionStartTime: GameState.expeditionStartTime,
        expeditionDuration: GameState.expeditionDuration,
        expeditionRabbitId: GameState.expeditionRabbitId,
        activeBoosts: GameState.activeBoosts,
        rabbits: GameState.rabbits,
        assignedRabbits: GameState.assignedRabbits,
        talents: GameState.talents,
        spentTokens: GameState.spentTokens,
        // Tier 2 currencies
        gems: GameState.gems || 0,
        rabbitXP: GameState.rabbitXP || 0,
        ingredients: GameState.ingredients || [],
        // Tier 3 currencies
        worldsUnlocked: GameState.worldsUnlocked || 0,
        legendaryRabbitsCrafted: GameState.legendaryRabbitsCrafted || 0,
        stakedTokens: GameState.stakedTokens || 0,
        infinityLevel: GameState.infinityLevel || 0,
        craftingXP: GameState.craftingXP || 0,
        lastSaveTime: Date.now()
    };

    try {
        localStorage.setItem(SAVE_KEY, JSON.stringify(saveData));
    } catch (e) {
        console.error('Save failed:', e);
    }
}

function loadGame() {
    try {
        const saved = localStorage.getItem(SAVE_KEY);
        if (!saved) return false;

        const data = JSON.parse(saved);

        GameState.magicDust = new BigNumber(data.magicDust || 0);
        GameState.totalEarned = new BigNumber(data.totalEarned || 0);
        // Migration: If lifetimeDust is 0 but totalEarned exists, seed from totalEarned
        const savedLifetime = data.lifetimeDust || 0;
        const savedTotal = data.totalEarned || 0;
        GameState.lifetimeDust = new BigNumber(savedLifetime > 0 ? savedLifetime : savedTotal);
        GameState.burrowTokens = data.burrowTokens || 0;
        GameState.prestigeCount = data.prestigeCount || 0;
        GameState.prestigeCount = data.prestigeCount || 0;
        GameState.lastSpinTime = data.lastSpinTime || 0;
        GameState.lastFlipTime = data.lastFlipTime || 0;
        GameState.lastRumbleTime = data.lastRumbleTime || 0;
        GameState.expeditionStartTime = data.expeditionStartTime || 0;
        GameState.expeditionDuration = data.expeditionDuration || 0;
        GameState.expeditionRabbitId = data.expeditionRabbitId || null;
        GameState.activeBoosts = data.activeBoosts || [];
        GameState.rabbits = data.rabbits || [];
        GameState.assignedRabbits = data.assignedRabbits || {};
        GameState.talents = data.talents || {};
        GameState.spentTokens = data.spentTokens || 0;
        
        // Tier 2 currencies
        GameState.gems = data.gems || 0;
        GameState.rabbitXP = data.rabbitXP || 0;
        GameState.ingredients = data.ingredients || [];

        // Tier 3 currencies
        GameState.worldsUnlocked = data.worldsUnlocked || 0;
        GameState.legendaryRabbitsCrafted = data.legendaryRabbitsCrafted || 0;
        GameState.stakedTokens = data.stakedTokens || 0;
        GameState.infinityLevel = data.infinityLevel || 0;
        GameState.craftingXP = data.craftingXP || 0;

        // Handle migration from single building object to array
        if (data.buildings) {
            // Merge saved data with current structure
            // IMPORTANT: Keep growth factors from code, only load player progress
            GameState.buildings = GameState.buildings.map(current => {
                const saved = data.buildings.find(b => b.id === current.id);
                if (saved) {
                    return {
                        ...current,
                        level: saved.level,
                        accumulatedDust: saved.accumulatedDust || 0,
                        unlocked: saved.unlocked
                        // costGrowthFactor and productionGrowthFactor stay from code!
                    };
                }
                return current;
            });
        } else if (data.buildingLevel) {
            // Migration: Set Rabbit Farm data from old save
            GameState.buildings[0].level = data.buildingLevel || 1;
            GameState.buildings[0].accumulatedDust = data.accumulatedDust || 0;
            console.log('🐰 Migrated legacy save data');
        }

        GameState.lastSaveTime = data.lastSaveTime || Date.now();

        // Clean up: Level 0 buildings should have no accumulated dust
        GameState.buildings.forEach(b => {
            if (b.level === 0) {
                b.accumulatedDust = 0;
            }
        });

        return true;
    } catch (e) {
        console.error('Load failed:', e);
        return false;
    }
}

function calculateOfflineProgress() {
    const now = Date.now();
    const lastSave = GameState.lastSaveTime;
    const offlineSeconds = Math.floor((now - lastSave) / 1000);

    // Cap at 24 hours (86400 seconds)
    const cappedSeconds = Math.min(offlineSeconds, 86400);

    if (cappedSeconds > 10) { // Only show if > 10 seconds
        // Calculate total production from all unlocked buildings
        let totalRate = 0;
        GameState.buildings.forEach(b => {
            if (b.unlocked) {
                totalRate += getProductionRate(b).toNumber();
            }
        });

        // Apply Time Warp Tower bonus (if available)
        const timeWarpBonus = typeof getTimeWarpBonus === 'function' ? getTimeWarpBonus() : 1;
        const offlineEarnings = totalRate * cappedSeconds * timeWarpBonus;

        return {
            seconds: cappedSeconds,
            earnings: offlineEarnings,
            timeWarpBonus: timeWarpBonus
        };
    }

    return null;
}

function claimOfflineEarnings(earnings) {
    GameState.magicDust = GameState.magicDust.add(earnings);
    GameState.totalEarned = GameState.totalEarned.add(earnings);
    GameState.lifetimeDust = GameState.lifetimeDust.add(earnings);
    hideOfflineModal();
    updateUI();
    saveGame();
}

function resetGame() {
    if (!confirm('Are you sure you want to reset ALL progress? This cannot be undone!')) {
        return;
    }

    // Reset ALL game state for testing
    GameState.magicDust = new BigNumber(0);
    GameState.totalEarned = new BigNumber(0);
    GameState.prestigeCount = 0;
    GameState.lastSpinTime = 0;
    GameState.lastFlipTime = 0;
    GameState.activeBoosts = [];
    GameState.rabbits = [];
    GameState.assignedRabbits = {};

    // Reset buildings
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

    // Clear save data
    localStorage.removeItem(SAVE_KEY);

    // Reload to ensure fresh state (init will handle starter rabbit, etc)
    location.reload();
}

function resetAscendProgress() {
    if (!confirm('Reset all Ascend progress?\n\nThis will reset:\n- Burrow Tokens\n- Lifetime Dust\n- Prestige Count\n\nYour buildings, rabbits, and current dust will be kept.')) {
        return;
    }

    // Reset only prestige-related data
    GameState.burrowTokens = 0;
    GameState.lifetimeDust = new BigNumber(0);
    GameState.prestigeCount = 0;

    saveGame();
    updatePrestigeModal();
    updateUI();
    showNumberPop('Ascend Reset!');
}

// ============================================
// UI UPDATES
// ============================================
function checkUnlocks() {
    GameState.buildings.forEach((building, index) => {
        if (!building.unlocked && building.unlockRequirement) {
            const req = building.unlockRequirement;
            // Find requirement building
            const reqBuilding = GameState.buildings.find(b => b.id === req.buildingId);
            if (reqBuilding && reqBuilding.level >= req.level) {
                building.unlocked = true;
                showNumberPop(`Unlocked ${building.name}! 🔓`);
                renderBuildings(); // Re-render to show unlocked state
            }
        }
    });
}

function renderBuildings() {
    const container = document.getElementById('building-area');
    container.innerHTML = '';

    GameState.buildings.forEach((building, index) => {
        const div = document.createElement('div');
        div.className = `building ${building.unlocked ? '' : 'locked'}`;
        div.id = `building-${index}`;

        // Determine Icon
        let iconSrc = 'rabbit-captain.jpg'; // Default/Placeholder
        if (building.id === 'rabbit-farm') iconSrc = 'rabbit-farm-icon.png';
        if (building.id === 'weed-patch') iconSrc = 'weed-patch-icon.png';
        if (building.id === 'bake-shop') iconSrc = 'bake-shop-icon.png';
        if (building.id === 'infused-field') iconSrc = 'infused-field-icon.png';
        if (building.id === 'energy-extractor') iconSrc = 'energy-extractor-icon.png';

        // Rabbit Slot Logic
        let slotHtml = '';
        if (building.unlocked) {
            const assignedId = GameState.assignedRabbits[building.id];
            const assignedRabbit = assignedId ? GameState.rabbits.find(r => r.id === assignedId) : null;
            const borderColor = assignedRabbit ? RABBIT_DATA.rarities[assignedRabbit.rarity].color : 'rgba(255,255,255,0.3)';
            const content = assignedRabbit ? '🐰' : '+';

            slotHtml = `
            <div class="rabbit-slot" onclick="openRabbitSelector('${building.id}')" title="${assignedRabbit ? 'Change Rabbit' : 'Assign Rabbit'}"
                 style="position: absolute; top: 10px; right: 10px; width: 65px; height: 65px; 
                        border: 3px solid ${borderColor}; border-radius: 12px; transform: rotate(5deg);
                        display: flex; align-items: center; justify-content: center; 
                        background: ${assignedRabbit ? 'rgba(0,0,0,0.8)' : 'rgba(0,0,0,0.4)'}; 
                        box-shadow: 0 4px 10px rgba(0,0,0,0.5);
                        cursor: pointer; z-index: 10; font-size: 1.5rem; color: #fff; transition: transform 0.2s;">
                ${content}
                ${assignedRabbit ? `<div style="position:absolute; top:-8px; right:-8px; background:${borderColor}; color:#000; font-weight:bold; font-size:0.7rem; padding:2px 6px; border-radius:10px;">Lvl ${assignedRabbit.level}</div>` : ''}
            </div>`;
        }

        // Structure
        let content = `
            ${slotHtml}
            <div class="building-icon">
                <img src="${iconSrc}" alt="${building.name}" class="rabbit-nft">
            </div>
            <h2 id="name-${index}">${building.name}</h2>
        `;

    if (building.unlocked) {
        const assignedRabbitId = GameState.assignedRabbits[building.id];
        let rabbitDisplay = '';
        if (assignedRabbitId) {
            const rabbit = GameState.rabbits.find(r => r.id === assignedRabbitId);
            if (rabbit) {
                const typeData = RABBIT_DATA.types.find(t => t.id === rabbit.typeId);
                const rarityData = RABBIT_DATA.rarities[rabbit.rarity];
                rabbitDisplay = `<div style="font-size: 0.8rem; color: ${rarityData.color}; margin-bottom: 5px;">🐰 ${typeData.name} (×${rarityData.multiplier.toFixed(2)})</div>`;
            }
        }

        // Milestone info
        const milestoneMult = getMilestoneMultiplier(building.level);
        const nextMilestone = getNextMilestone(building.level);
        const nextMilestoneText = nextMilestone
            ? `Next: L${nextMilestone} → ${milestoneMult * 2}x`
            : 'MAX!';

        content += `
                <div class="building-stats">
                    <div>Level: <span id="level-${index}">${building.level}</span></div>
                    <div>Produces: <span id="prod-${index}">${getProductionRate(building).format()}</span>/sec</div>
                </div>
                <div class="milestone-info" style="font-size: 0.75rem; color: #f1c40f; margin: 5px 0;">
                    ⭐ ${milestoneMult}x bonus | <span style="color: #888;">${nextMilestoneText}</span>
                </div>
                ${rabbitDisplay}
                <div class="accumulated-dust">
                    Ready to collect: <span id="accum-${index}">${new BigNumber(building.accumulatedDust).format()}</span>
                </div>
                <div class="building-buttons">
                    <button id="btn-collect-${index}" class="game-btn collect-btn">
                        <span class="btn-icon">✨</span>
                        <span class="btn-text">Collect</span>
                    </button>
                    <button id="btn-upgrade-${index}" class="game-btn upgrade-btn">
                        <span class="btn-icon">⬆️</span>
                        <span class="btn-text">Upgrade: <span id="cost-${index}">${getUpgradeCost(building).format()}</span></span>
                    </button>
                </div>
            `;
    } else {
        content += `
                <div class="locked-stats">🔒 LOCKED</div>
                <div class="locked-reason">
                    Requires ${building.unlockRequirement.buildingId.replace('-', ' ')} Level ${building.unlockRequirement.level}
                </div>
            `;
    }

    div.innerHTML = content;
    container.appendChild(div);

    // Attach event listeners if unlocked
    if (building.unlocked) {
        document.getElementById(`btn-collect-${index}`).onclick = () => collectDust(index);
        document.getElementById(`btn-upgrade-${index}`).onclick = () => upgradeBuilding(index);
    }
});
}

function updateUI() {
    // Currency
    document.getElementById('dust-value').textContent = GameState.magicDust.format();

    // Calculate total rate for header
    let totalRate = new BigNumber(0);
    GameState.buildings.forEach(b => {
        if (b.unlocked) totalRate = totalRate.add(getProductionRate(b));
    });
    document.getElementById('rate-value').textContent = totalRate.format();

    // Update each building
    GameState.buildings.forEach((building, index) => {
        if (building.unlocked) {
            const levelEl = document.getElementById(`level-${index}`);
            // If element missing (e.g. just unlocked but not re-rendered), safe fail
            if (!levelEl) return;

            levelEl.textContent = building.level;
            document.getElementById(`prod-${index}`).textContent = getProductionRate(building).format();
            document.getElementById(`accum-${index}`).textContent = new BigNumber(building.accumulatedDust).format();

            const upgradeCost = getUpgradeCost(building);
            document.getElementById(`cost-${index}`).textContent = upgradeCost.format();
            document.getElementById(`btn-upgrade-${index}`).disabled = !canAffordUpgrade(building);
        }
    });

    // Stats
    document.getElementById('total-earned').textContent = GameState.totalEarned.format();
    document.getElementById('prestige-count').textContent = GameState.prestigeCount;

    // Boost Display
    const boostEl = document.getElementById('boost-display');
    if (GameState.activeBoosts.length > 0) {
        boostEl.classList.remove('hidden');
        // Show ONLY the active boost multiplier (not combined with token bonus)
        let boostMult = 1;
        GameState.activeBoosts.forEach(b => boostMult *= b.multiplier);

        // Find the boost that lasts the longest to display timer
        const longest = GameState.activeBoosts.reduce((prev, current) =>
            (prev.endTime > current.endTime) ? prev : current
        );

        const remaining = Math.max(0, longest.endTime - Date.now());
        const hours = Math.floor((remaining / (1000 * 60 * 60)) % 24);
        const mins = Math.floor((remaining / (1000 * 60)) % 60);
        const secs = Math.floor((remaining / 1000) % 60);

        document.getElementById('boost-text').textContent = `${boostMult}x Boost`;
        document.getElementById('boost-timer').textContent = `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    } else {
        boostEl.classList.add('hidden');
    }

    // Refresh Prestige Modal if open
    if (!document.getElementById('prestige-modal').classList.contains('hidden')) {
        updatePrestigeModal();
    }
}

// ============================================
// VISUAL EFFECTS
// ============================================
function spawnDustParticle() {
    const particle = document.createElement('div');
    particle.className = 'dust-particle';
    particle.textContent = '✨';
    particle.style.left = Math.random() * window.innerWidth + 'px';
    particle.style.top = Math.random() * 200 + 200 + 'px';
    document.body.appendChild(particle);

    setTimeout(() => particle.remove(), 1000);
}

function showNumberPop(text) {
    const pop = document.createElement('div');
    pop.className = 'number-pop';
    pop.textContent = text;
    pop.style.left = '50%';
    pop.style.top = '40%';
    pop.style.transform = 'translateX(-50%)';
    document.body.appendChild(pop);

    setTimeout(() => pop.remove(), 800);
}

function showOfflineModal(earnings) {
    document.getElementById('offline-earnings').textContent = new BigNumber(earnings).format();
    document.getElementById('offline-modal').classList.remove('hidden');
}

function hideOfflineModal() {
    document.getElementById('offline-modal').classList.add('hidden');
}

function showMinigamesModal() {
    document.getElementById('minigames-modal').classList.remove('hidden');
}

function hideMinigamesModal() {
    document.getElementById('minigames-modal').classList.add('hidden');
}

function activateBoost(type, multiplier, durationMinutes) {
    const now = Date.now();
    const durationMs = durationMinutes * 60 * 1000;

    // Check if boost of this type already exists
    const existing = GameState.activeBoosts.find(b => b.id === type);

    if (existing) {
        // Extend duration? Or Replace?
        // Let's stack duration for the same type
        if (existing.endTime < now) existing.endTime = now;
        existing.endTime += durationMs;
    } else {
        GameState.activeBoosts.push({
            id: type,
            multiplier: multiplier,
            endTime: now + durationMs
        });
    }

    updateUI();
    saveGame();
}

function checkBoosts() {
    const now = Date.now();
    // Filter out expired boosts
    const activeBefore = GameState.activeBoosts.length;

    // Keep only boosts that are NOT expired
    GameState.activeBoosts = GameState.activeBoosts.filter(b => b.endTime > now);

    // If a boost expired (count decreased), update UI
    if (GameState.activeBoosts.length !== activeBefore) {
        // Boost expired!
        updateUI();
        saveGame();
    }
}

// ============================================
// PRESTIGE & ASCENSION (Story 5.2, 5.3)
// ============================================
function showPrestigeModal() {
    updatePrestigeModal();
    document.getElementById('prestige-modal').classList.remove('hidden');
}

function hidePrestigeModal() {
    document.getElementById('prestige-modal').classList.add('hidden');
}

function updatePrestigeModal() {
    const currentTokens = GameState.burrowTokens;
    const reward = calculatePrestigeReward();
    const lifetime = GameState.lifetimeDust;

    document.getElementById('current-tokens').textContent = currentTokens;
    document.getElementById('lifetime-dust').textContent = lifetime.format();

    const rewardEl = document.getElementById('prestige-reward');
    rewardEl.textContent = `+${reward} Tokens`;

    // Calculate new multiplier preview
    // Base is 1 + (current + reward) * 0.05
    const newTotal = currentTokens + reward;
    const newMult = 1 + (newTotal * 0.05);
    document.getElementById('new-multiplier').textContent = `${newMult.toFixed(1)}x`;
    // new-token-total element may not exist in HTML
    const tokenTotalEl = document.getElementById('new-token-total');
    if (tokenTotalEl) tokenTotalEl.textContent = newTotal;

    // Button state
    const btn = document.getElementById('do-prestige-btn');
    if (reward >= 1) {
        btn.disabled = false;
        btn.style.opacity = '1';
        btn.style.cursor = 'pointer';
        rewardEl.style.color = 'var(--accent-gold)';
    } else {
        btn.disabled = true;
        btn.style.opacity = '0.5';
        btn.style.cursor = 'not-allowed';
        rewardEl.style.color = '#7f8c8d'; // Greyed out
        rewardEl.textContent = "+0 Tokens (Need 10B Dust)";
    }

    // Next goal logic - use Math.pow since BigNumber doesn't have pow()
    let nextGoal = new BigNumber(Math.pow(10, 10)); // Default 10B
    if (lifetime.toNumber() > 10) {
        const currentLog = Math.floor(Math.log10(lifetime.toNumber()));
        // If currentLog < 10, goal is 10. If 10, goal is 11.
        const nextExp = Math.max(10, currentLog + 1);
        nextGoal = new BigNumber(Math.pow(10, nextExp));
    }

    document.getElementById('next-token-goal').textContent = nextGoal.format();

    // Update available tokens display for talent tree
    const availableEl = document.getElementById('available-tokens');
    if (availableEl) availableEl.textContent = getAvailableTokens();

    // Render talent tree
    renderTalentTree();
}

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

    // Reset progress (Story 5.3)
    GameState.magicDust = new BigNumber(0);
    GameState.totalEarned = new BigNumber(0);
    // GameState.lifetimeDust STAYS
    GameState.lastSpinTime = 0;
    GameState.lastFlipTime = 0;

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
    // Rabbits array stays (Collection persists)

    saveGame();

    // Visual Polish (Story 5.5)
    showNumberPop("ASCENDED! 🌌");
    // Explosion of particles
    for (let i = 0; i < 30; i++) {
        setTimeout(spawnDustParticle, i * 50);
    }

    // Delay reload to let user see effect
    setTimeout(() => {
        location.reload();
    }, 2000);
}

// ============================================
// TALENT TREE
// ============================================
function getTalentLevel(talentId) {
    return GameState.talents[talentId] || 0;
}

function getTalentEffect(talentId) {
    const talent = TALENT_TREE[talentId];
    const level = getTalentLevel(talentId);
    return talent ? talent.effect(level) : 0;
}

function getAvailableTokens() {
    return GameState.burrowTokens - GameState.spentTokens;
}

function canAffordTalent(talentId) {
    const talent = TALENT_TREE[talentId];
    const currentLevel = getTalentLevel(talentId);
    if (currentLevel >= talent.maxLevel) return false;
    return getAvailableTokens() >= talent.cost;
}

function upgradeTalent(talentId) {
    const talent = TALENT_TREE[talentId];
    if (!talent) return;
    
    const currentLevel = getTalentLevel(talentId);
    if (currentLevel >= talent.maxLevel) {
        showNumberPop('Max level!');
        return;
    }
    
    if (getAvailableTokens() < talent.cost) {
        showNumberPop('Not enough tokens!');
        return;
    }
    
    // Spend tokens and upgrade
    GameState.spentTokens += talent.cost;
    GameState.talents[talentId] = currentLevel + 1;
    
    saveGame();
    renderTalentTree();
    updatePrestigeModal();
    showNumberPop(`${talent.name} upgraded!`);
}

function renderTalentTree() {
    const container = document.getElementById('talent-tree-container');
    if (!container) return;
    
    container.innerHTML = '';
    
    // Create talent grid
    Object.values(TALENT_TREE).forEach(talent => {
        const level = getTalentLevel(talent.id);
        const canAfford = canAffordTalent(talent.id);
        const isMaxed = level >= talent.maxLevel;
        
        const card = document.createElement('div');
        card.className = `talent-card ${isMaxed ? 'maxed' : ''} ${canAfford ? 'affordable' : ''}`;
        card.style.cssText = `
            background: rgba(0,0,0,0.4);
            border: 2px solid ${isMaxed ? '#f1c40f' : canAfford ? '#2ecc71' : '#444'};
            border-radius: 10px;
            padding: 10px;
            margin: 5px;
            display: inline-block;
            width: calc(50% - 20px);
            text-align: center;
            cursor: ${isMaxed ? 'default' : 'pointer'};
            transition: all 0.2s;
        `;
        
        card.innerHTML = `
            <div style="font-weight: bold; color: ${isMaxed ? '#f1c40f' : '#fff'};">${talent.name}</div>
            <div style="font-size: 0.8rem; color: #888; margin: 5px 0;">${talent.description}</div>
            <div style="font-size: 1rem; color: #f1c40f;">
                Level ${level}/${talent.maxLevel}
            </div>
            ${!isMaxed ? `<div style="font-size: 0.75rem; color: ${canAfford ? '#2ecc71' : '#e74c3c'}; margin-top: 5px;">Cost: ${talent.cost} Token${talent.cost > 1 ? 's' : ''}</div>` : '<div style="font-size: 0.75rem; color: #f1c40f; margin-top: 5px;">MAXED!</div>'}
        `;
        
        if (!isMaxed) {
            card.onclick = () => upgradeTalent(talent.id);
            card.onmouseenter = () => card.style.transform = 'scale(1.02)';
            card.onmouseleave = () => card.style.transform = 'scale(1)';
        }
        
        container.appendChild(card);
    });
    
    // Update available tokens display
    const availableEl = document.getElementById('available-tokens');
    if (availableEl) availableEl.textContent = getAvailableTokens();
}

// ============================================
// MINI-GAMES
// ============================================
const WHEEL_COOLDOWN = 4 * 60 * 60 * 1000; // 4 hours
const FLIP_COOLDOWN = 1 * 60 * 60 * 1000; // 1 hour

function spinWheel() {
    const now = Date.now();
    if (now - GameState.lastSpinTime < WHEEL_COOLDOWN) return;

    // Determine Reward
    const rand = Math.random() * 100;
    let rewardType = '';
    let rewardValue = 0;
    let rewardText = '';

    // Calculate current production per minute
    let totalRate = new BigNumber(0);
    GameState.buildings.forEach(b => {
        if (b.unlocked) totalRate = totalRate.add(getProductionRate(b));
    });
    const prodPerMin = totalRate.multiply(60);

    if (rand < 40) {
        // 40%: Small Dust (5 mins)
        rewardType = 'dust';
        rewardValue = prodPerMin.multiply(5);
        rewardText = `+${rewardValue.format()} Dust (Small)`;
    } else if (rand < 70) {
        // 30%: Medium Dust (15 mins)
        rewardType = 'dust';
        rewardValue = prodPerMin.multiply(15);
        rewardText = `+${rewardValue.format()} Dust (Medium)`;
    } else if (rand < 90) {
        // 20%: 2x Speed (10 mins)
        rewardType = 'boost';
        activateBoost('wheel_2x', 2, 10);
        rewardText = "🔥 2x Production Boost (10m)!";
    } else if (rand < 99) {
        // 9%: 5x Speed (5 mins)
        rewardType = 'boost';
        activateBoost('wheel_5x', 5, 5);
        rewardText = "🔥🔥 5x Production Boost (5m)!";
    } else {
        // 1%: Jackpot (100 mins)
        rewardType = 'dust';
        rewardValue = prodPerMin.multiply(100);
        rewardText = `JACKPOT! +${rewardValue.format()} Dust`;
    }

    // Apply Reward
    if (rewardType === 'dust' || rewardType === 'boost') {
        GameState.magicDust = GameState.magicDust.add(rewardValue);
        GameState.totalEarned = GameState.totalEarned.add(rewardValue);
        GameState.lifetimeDust = GameState.lifetimeDust.add(rewardValue);
    }

    // Update State
    GameState.lastSpinTime = now;
    saveGame();
    updateUI();
    checkSpinCooldown();

    // Visual Feedback
    const resultEl = document.getElementById('wheel-result');
    if (resultEl) {
        resultEl.textContent = rewardText;
        resultEl.style.color = '#f1c40f';
        resultEl.classList.remove('hidden');
        setTimeout(() => resultEl.classList.add('hidden'), 3000);
    }
    const resultModal = document.getElementById('wheel-result-modal');
    if (resultModal) {
        resultModal.textContent = rewardText;
        resultModal.style.color = '#f1c40f';
        resultModal.classList.remove('hidden');
        setTimeout(() => resultModal.classList.add('hidden'), 3000);
    }
}

function checkSpinCooldown() {
    const now = Date.now();
    const diff = now - GameState.lastSpinTime;

    // Sidebar UI
    const btn = document.getElementById('spin-wheel-btn');
    // Modal UI
    const btnModal = document.getElementById('spin-wheel-btn-modal');
    const timerModal = document.getElementById('wheel-timer-modal');

    // Card elements
    const card = document.getElementById('wheel-card');
    const iconTimer = document.getElementById('wheel-icon-timer');
    const readyDot = document.getElementById('wheel-ready-dot');

    if (diff < WHEEL_COOLDOWN) {
        // Disabled State
        if (btn) btn.disabled = true;
        if (btn) btn.classList.add('disabled');
        if (btnModal) btnModal.disabled = true;
        if (btnModal) btnModal.classList.add('disabled');

        if (timerModal) timerModal.classList.remove('hidden');

        const remaining = WHEEL_COOLDOWN - diff;
        const hours = Math.floor((remaining / (1000 * 60 * 60)) % 24);
        const minutes = Math.floor((remaining / (1000 * 60)) % 60);
        const seconds = Math.floor((remaining / 1000) % 60);

        const timeStr = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

        if (timerModal) timerModal.textContent = `Ready in: ${timeStr}`;

        // Update card
        if (card) card.classList.remove('ready');
        if (iconTimer) iconTimer.textContent = timeStr;
        if (iconTimer) iconTimer.classList.remove('ready-text');
        if (readyDot) readyDot.classList.add('hidden');
    } else {
        // Ready State
        if (btn) btn.disabled = false;
        if (btn) btn.classList.remove('disabled');
        if (btn) btn.textContent = "Spin!";
        if (btnModal) btnModal.disabled = false;
        if (btnModal) btnModal.classList.remove('disabled');

        if (timerModal) timerModal.classList.add('hidden');

        // Update card - READY!
        if (card) card.classList.add('ready');
        if (iconTimer) iconTimer.textContent = 'READY!';
        if (iconTimer) iconTimer.classList.add('ready-text');
        if (readyDot) readyDot.classList.remove('hidden');
    }
}

function flipCoin() {
    const now = Date.now();
    if (now - GameState.lastFlipTime < FLIP_COOLDOWN) return;

    const win = Math.random() < 0.5; // 50% chance
    let resultText = "";
    let color = "";

    if (win) {
        resultText = "WIN! 🔥 2x Boost (10m)";
        color = "#2ecc71";
        activateBoost('coin_2x', 2, 10);
        showNumberPop("Coin Flip WIN! 🎉");
    } else {
        resultText = "LOSS! 😢 Try again in 1h";
        color = "#e74c3c";
        showNumberPop("Coin Flip LOST 💀");
    }

    // Sidebar
    const resSidebar = document.getElementById('flip-result');
    if (resSidebar) {
        resSidebar.textContent = resultText;
        resSidebar.style.color = color;
        resSidebar.classList.remove('hidden');
        setTimeout(() => resSidebar.classList.add('hidden'), 3000);
    }
    // Modal
    const resModal = document.getElementById('flip-result-modal');
    if (resModal) {
        resModal.textContent = resultText;
        resModal.style.color = color;
        resModal.classList.remove('hidden');
        setTimeout(() => resModal.classList.add('hidden'), 3000);
    }

    GameState.lastFlipTime = now;
    saveGame();
    checkFlipCooldown();
}

function checkFlipCooldown() {
    const now = Date.now();
    const diff = now - GameState.lastFlipTime;
    // Sidebar UI
    const btn = document.getElementById('play-coin-btn');
    // Modal UI
    const btnModal = document.getElementById('play-coin-btn-modal');
    const timerModal = document.getElementById('flip-timer-modal');

    // Card elements
    const card = document.getElementById('flip-card');
    const iconTimer = document.getElementById('flip-icon-timer');
    const readyDot = document.getElementById('flip-ready-dot');

    if (diff < FLIP_COOLDOWN) {
        // Disabled State
        if (btn) btn.disabled = true;
        if (btn) btn.classList.add('disabled');
        if (btnModal) btnModal.disabled = true;
        if (btnModal) btnModal.classList.add('disabled');

        if (timerModal) timerModal.classList.remove('hidden');

        const remaining = FLIP_COOLDOWN - diff;
        const mins = Math.floor((remaining / 60000));
        const secs = Math.floor((remaining % 60000) / 1000);
        const timeStr = `${mins}:${String(secs).padStart(2, '0')}`;

        if (timerModal) timerModal.textContent = `Ready in: ${timeStr}`;

        // Update card
        if (card) card.classList.remove('ready');
        if (iconTimer) iconTimer.textContent = timeStr;
        if (iconTimer) iconTimer.classList.remove('ready-text');
        if (readyDot) readyDot.classList.add('hidden');
    } else {
        // Ready State
        if (btn) btn.disabled = false;
        if (btn) btn.classList.remove('disabled');
        if (btn) btn.textContent = "Flip!";
        if (btnModal) btnModal.disabled = false;
        if (btnModal) btnModal.classList.remove('disabled');

        if (timerModal) timerModal.classList.add('hidden');

        // Update card - READY!
        if (card) card.classList.add('ready');
        if (iconTimer) iconTimer.textContent = 'READY!';
        if (iconTimer) iconTimer.classList.add('ready-text');
        if (readyDot) readyDot.classList.remove('hidden');
    }
}

// ============================================
// RUMBLE BATTLES & EXPEDITIONS
// ============================================
const RUMBLE_COOLDOWN = 2 * 60 * 60 * 1000; // 2 hours
const EXPEDITION_DURATIONS = [
    { name: 'Quick Scout', duration: 30 * 60 * 1000, multiplier: 1 },      // 30 min
    { name: 'Forest Trek', duration: 2 * 60 * 60 * 1000, multiplier: 3 },  // 2 hours
    { name: 'Mountain Quest', duration: 8 * 60 * 60 * 1000, multiplier: 10 } // 8 hours
];

function startRumble() {
    const now = Date.now();
    if (now - GameState.lastRumbleTime < RUMBLE_COOLDOWN) return;

    // Need at least one rabbit
    if (GameState.rabbits.length === 0) {
        showNumberPop('Need a rabbit!');
        return;
    }

    // Pick best rabbit for battle (highest rarity)
    const sortedRabbits = [...GameState.rabbits].sort((a, b) => {
        return RABBIT_DATA.rarities[b.rarity].multiplier - RABBIT_DATA.rarities[a.rarity].multiplier;
    });
    const battleRabbit = sortedRabbits[0];
    const rabbitMult = RABBIT_DATA.rarities[battleRabbit.rarity].multiplier;

    // Battle outcome - higher rarity = higher win chance
    const winChance = 0.4 + (rabbitMult - 1) * 0.3; // 40% base + 30% per 1.0 mult
    const won = Math.random() < winChance;

    // Calculate reward based on production
    let totalRate = new BigNumber(0);
    GameState.buildings.forEach(b => {
        if (b.unlocked) totalRate = totalRate.add(getProductionRate(b));
    });
    const prodPerMin = totalRate.multiply(60);

    let resultText = '';
    let color = '';

    if (won) {
        // Win: 10-30 mins of production based on rarity
        const bonusMins = 10 + Math.floor(rabbitMult * 15);
        const reward = prodPerMin.multiply(bonusMins);
        GameState.magicDust = GameState.magicDust.add(reward);
        GameState.totalEarned = GameState.totalEarned.add(reward);
        GameState.lifetimeDust = GameState.lifetimeDust.add(reward);
        resultText = `WIN! +${reward.format()} Dust`;
        color = '#2ecc71';
        showNumberPop('Battle Won! ⚔️');
    } else {
        // Lose: Small consolation prize (3 mins)
        const consolation = prodPerMin.multiply(3);
        GameState.magicDust = GameState.magicDust.add(consolation);
        GameState.totalEarned = GameState.totalEarned.add(consolation);
        GameState.lifetimeDust = GameState.lifetimeDust.add(consolation);
        resultText = `Lost... +${consolation.format()}`;
        color = '#e74c3c';
        showNumberPop('Battle Lost 😢');
    }

    // Show result
    const resultEl = document.getElementById('rumble-result');
    if (resultEl) {
        resultEl.textContent = resultText;
        resultEl.style.color = color;
        resultEl.classList.remove('hidden');
        setTimeout(() => resultEl.classList.add('hidden'), 3000);
    }

    GameState.lastRumbleTime = now;
    saveGame();
    updateUI();
    checkRumbleCooldown();
}

function checkRumbleCooldown() {
    const now = Date.now();
    const diff = now - GameState.lastRumbleTime;

    const btn = document.getElementById('rumble-btn');
    const card = document.getElementById('rumble-card');
    const iconTimer = document.getElementById('rumble-icon-timer');
    const readyDot = document.getElementById('rumble-ready-dot');

    if (diff < RUMBLE_COOLDOWN) {
        if (btn) btn.disabled = true;
        if (btn) btn.classList.add('disabled');

        const remaining = RUMBLE_COOLDOWN - diff;
        const hours = Math.floor((remaining / (1000 * 60 * 60)) % 24);
        const minutes = Math.floor((remaining / (1000 * 60)) % 60);
        const seconds = Math.floor((remaining / 1000) % 60);
        const timeStr = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

        if (card) card.classList.remove('ready');
        if (iconTimer) iconTimer.textContent = timeStr;
        if (iconTimer) iconTimer.classList.remove('ready-text');
        if (readyDot) readyDot.classList.add('hidden');
    } else {
        if (btn) btn.disabled = false;
        if (btn) btn.classList.remove('disabled');
        if (card) card.classList.add('ready');
        if (iconTimer) iconTimer.textContent = 'READY!';
        if (iconTimer) iconTimer.classList.add('ready-text');
        if (readyDot) readyDot.classList.remove('hidden');
    }
}

function startExpedition() {
    // Check if already on expedition
    if (GameState.expeditionStartTime > 0) {
        // Check if expedition is complete
        const elapsed = Date.now() - GameState.expeditionStartTime;
        if (elapsed >= GameState.expeditionDuration) {
            claimExpedition();
        } else {
            showNumberPop('Already exploring!');
        }
        return;
    }

    // Need at least one rabbit
    if (GameState.rabbits.length === 0) {
        showNumberPop('Need a rabbit!');
        return;
    }

    // For simplicity, auto-select the Quick Scout (30 min)
    // In a full version, you'd show a modal to pick duration
    const expedition = EXPEDITION_DURATIONS[0]; // Quick Scout

    // Pick a random rabbit to send
    const availableRabbits = GameState.rabbits.filter(r => {
        // Not assigned to a building
        return !Object.values(GameState.assignedRabbits).includes(r.id);
    });

    if (availableRabbits.length === 0) {
        showNumberPop('All rabbits assigned!');
        return;
    }

    const expeditionRabbit = availableRabbits[0];

    GameState.expeditionStartTime = Date.now();
    GameState.expeditionDuration = expedition.duration;
    GameState.expeditionRabbitId = expeditionRabbit.id;

    saveGame();
    checkExpeditionStatus();
    showNumberPop(`${expedition.name} started! 🗺️`);
}

function claimExpedition() {
    if (GameState.expeditionStartTime === 0) return;

    const elapsed = Date.now() - GameState.expeditionStartTime;
    if (elapsed < GameState.expeditionDuration) {
        showNumberPop('Not ready yet!');
        return;
    }

    // Find expedition info
    const expedition = EXPEDITION_DURATIONS.find(e => e.duration === GameState.expeditionDuration) || EXPEDITION_DURATIONS[0];
    const rabbit = GameState.rabbits.find(r => r.id === GameState.expeditionRabbitId);
    const rabbitMult = rabbit ? RABBIT_DATA.rarities[rabbit.rarity].multiplier : 1;

    // Calculate reward
    let totalRate = new BigNumber(0);
    GameState.buildings.forEach(b => {
        if (b.unlocked) totalRate = totalRate.add(getProductionRate(b));
    });
    const prodPerMin = totalRate.multiply(60);

    // Reward = production * expedition_multiplier * rabbit_rarity * random(0.8-1.2)
    const randomMult = 0.8 + Math.random() * 0.4;
    const durationMins = GameState.expeditionDuration / 60000;
    const reward = prodPerMin.multiply(durationMins * expedition.multiplier * rabbitMult * randomMult);

    GameState.magicDust = GameState.magicDust.add(reward);
    GameState.totalEarned = GameState.totalEarned.add(reward);
    GameState.lifetimeDust = GameState.lifetimeDust.add(reward);

    // Small chance for bonus boost
    if (Math.random() < 0.2) {
        activateBoost('expedition_bonus', 2, 5); // 2x for 5 mins
        showNumberPop(`+${reward.format()} + 2x Boost!`);
    } else {
        showNumberPop(`Expedition: +${reward.format()}!`);
    }

    // Reset expedition state
    GameState.expeditionStartTime = 0;
    GameState.expeditionDuration = 0;
    GameState.expeditionRabbitId = null;

    saveGame();
    updateUI();
    checkExpeditionStatus();
}

function checkExpeditionStatus() {
    const btn = document.getElementById('expedition-btn');
    const card = document.getElementById('expedition-card');
    const iconTimer = document.getElementById('expedition-icon-timer');
    const readyDot = document.getElementById('expedition-ready-dot');
    const resultEl = document.getElementById('expedition-result');

    if (GameState.expeditionStartTime === 0) {
        // No active expedition - ready to start
        if (btn) {
            btn.disabled = false;
            btn.classList.remove('disabled');
            btn.textContent = 'Send!';
        }
        if (card) card.classList.add('ready');
        if (iconTimer) iconTimer.textContent = 'READY!';
        if (iconTimer) iconTimer.classList.add('ready-text');
        if (readyDot) readyDot.classList.remove('hidden');
        if (resultEl) resultEl.classList.add('hidden');
    } else {
        const elapsed = Date.now() - GameState.expeditionStartTime;
        const remaining = GameState.expeditionDuration - elapsed;

        if (remaining <= 0) {
            // Expedition complete - ready to claim
            if (btn) {
                btn.disabled = false;
                btn.classList.remove('disabled');
                btn.textContent = 'Claim!';
            }
            if (card) card.classList.add('ready');
            if (iconTimer) iconTimer.textContent = 'CLAIM!';
            if (iconTimer) iconTimer.classList.add('ready-text');
            if (readyDot) readyDot.classList.remove('hidden');
        } else {
            // Still exploring
            if (btn) {
                btn.disabled = true;
                btn.classList.add('disabled');
                btn.textContent = 'Exploring...';
            }
            const mins = Math.floor(remaining / 60000);
            const secs = Math.floor((remaining % 60000) / 1000);
            const timeStr = `${mins}:${String(secs).padStart(2, '0')}`;

            if (card) card.classList.remove('ready');
            if (iconTimer) iconTimer.textContent = timeStr;
            if (iconTimer) iconTimer.classList.remove('ready-text');
            if (readyDot) readyDot.classList.add('hidden');
        }
    }
}

// ============================================
// RABBIT MANAGER
// ============================================
const CRATE_COST = 1000;
const CRATE_DROP_RATES = {
    common: 60,
    rare: 25,
    epic: 10,
    legendary: 4,
    mythic: 1
};

function showRabbitsModal() {
    document.getElementById('rabbits-modal').classList.remove('hidden');
    renderRabbitCollection();
}

function hideRabbitsModal() {
    document.getElementById('rabbits-modal').classList.add('hidden');
}

function renderRabbitCollection() {
    const container = document.getElementById('rabbit-grid');
    const noRabbits = document.getElementById('no-rabbits');
    container.innerHTML = '';

    if (!GameState.rabbits || GameState.rabbits.length === 0) {
        noRabbits.classList.remove('hidden');
        return;
    }
    noRabbits.classList.add('hidden');

    GameState.rabbits.forEach((rabbit, index) => {
        const typeData = RABBIT_DATA.types.find(t => t.id === rabbit.typeId);
        const rarityData = RABBIT_DATA.rarities[rabbit.rarity];

        // Check if assigned
        const assignedTo = Object.entries(GameState.assignedRabbits)
            .find(([bid, rid]) => rid === rabbit.id);
        const isAssigned = !!assignedTo;

        // Check if this is an NFT rabbit
        const isNFT = rabbit.nftData && rabbit.nftData.image;
        const rabbitName = isNFT ? rabbit.nftData.name : (typeData ? typeData.name : 'Unknown');
        const rabbitImage = isNFT ? rabbit.nftData.image : 'rabbit-captain.jpg';
        const rankDisplay = isNFT && rabbit.nftData.rank ? `Rank #${rabbit.nftData.rank}` : '';

        const card = document.createElement('div');
        card.className = `rabbit-card ${isAssigned ? 'assigned' : ''} ${isNFT ? 'nft-rabbit' : ''}`;
        card.style.borderColor = rarityData.color;
        card.innerHTML = `
            ${isNFT ? `<img src="${rabbitImage}" alt="${rabbitName}" class="rabbit-thumb" onerror="this.src='rabbit-captain.jpg'" style="width: 60px; height: 60px; border-radius: 8px; object-fit: cover; border: 2px solid ${rarityData.color}; margin-bottom: 5px;">` : ''}
            <div class="rabbit-name" style="font-size: 0.85rem; font-weight: bold;">${rabbitName}</div>
            ${rankDisplay ? `<div class="rabbit-rank" style="font-size: 0.7rem; color: #888;">${rankDisplay}</div>` : ''}
            <div class="rabbit-rarity" style="color: ${rarityData.color}">${rarityData.name}</div>
            <div class="rabbit-mult">×${rarityData.multiplier.toFixed(2)}</div>
            <div class="rabbit-status" style="font-size: 0.7rem; color: ${isAssigned ? '#2ecc71' : '#888'};">${isAssigned ? 'Assigned' : 'Available'}</div>
            ${isNFT && rabbit.nftData.magicEdenUrl ? `<a href="${rabbit.nftData.magicEdenUrl}" target="_blank" style="font-size: 0.65rem; color: #e91e8c; text-decoration: none;">View on ME</a>` : ''}
            <button class="assign-btn" onclick="openAssignMenu('${rabbit.id}')" style="margin-top: 5px; padding: 5px 10px; font-size: 0.8rem; background: var(--bg-button); color: white; border: none; border-radius: 5px; cursor: pointer;">
                ${isAssigned ? 'Reassign' : 'Assign'}
            </button>
        `;
        container.appendChild(card);
    });
}

async function openCrate() {
    // Check cost
    if (GameState.magicDust.lessThan(CRATE_COST)) {
        showNumberPop('Not enough Dust!');
        return;
    }

    // Deduct cost
    GameState.magicDust = GameState.magicDust.subtract(CRATE_COST);
    saveGame();
    updateUI();

    // Use NFT API if available
    if (window.NFT && window.NFT.openCrate) {
        // NFT Crate System - Uses Magic Eden API
        const nft = await window.NFT.openCrate();

        if (nft) {
            // Create game rabbit from NFT data
            const newRabbit = {
                id: nft.id || `rabbit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                typeId: 'nft-rabbit',
                rarity: nft.rarity.key,
                level: 1,
                nftData: {
                    name: nft.name,
                    image: nft.image,
                    rank: nft.rank,
                    price: nft.price,
                    attributes: nft.attributes,
                    magicEdenUrl: nft.magicEdenUrl,
                    isReal: nft.isReal
                }
            };

            GameState.rabbits.push(newRabbit);
            saveGame();
            renderRabbitCollection();
        }
    } else {
        // Fallback: Old crate system
        const rand = Math.random() * 100;
        let rarity = 'common';
        let cumulative = 0;

        for (const [rar, rate] of Object.entries(CRATE_DROP_RATES)) {
            cumulative += rate;
            if (rand < cumulative) {
                rarity = rar;
                break;
            }
        }

        const typeIndex = Math.floor(Math.random() * RABBIT_DATA.types.length);
        const typeId = RABBIT_DATA.types[typeIndex].id;

        const newRabbit = {
            id: `rabbit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            typeId: typeId,
            rarity: rarity,
            level: 1
        };

        GameState.rabbits.push(newRabbit);
        saveGame();
        updateUI();
        showCrateResult(newRabbit);
    }
}

function showCrateResult(rabbit) {
    const typeData = RABBIT_DATA.types.find(t => t.id === rabbit.typeId);
    const rarityData = RABBIT_DATA.rarities[rabbit.rarity];

    document.getElementById('crate-result-name').textContent = typeData.name;
    document.getElementById('crate-result-rarity').textContent = rarityData.name;
    document.getElementById('crate-result-rarity').style.color = rarityData.color;
    document.getElementById('crate-result-mult').textContent = `×${rarityData.multiplier.toFixed(2)}`;

    document.getElementById('crate-result-modal').classList.remove('hidden');
}

function hideCrateResult() {
    document.getElementById('crate-result-modal').classList.add('hidden');
    renderRabbitCollection(); // Refresh grid
}

// Assignment Logic
let selectedRabbitId = null;

function openRabbitSelector(buildingId) {
    const container = document.getElementById('assign-building-list');
    container.innerHTML = '';

    // Header
    const header = document.createElement('h3');
    header.textContent = `Assign to ${GameState.buildings.find(b => b.id === buildingId).name}`;
    header.style.color = 'var(--accent-gold)';
    container.appendChild(header);

    // List Rabbits
    // Sort by multiplier (rarity) desc
    const sortedRabbits = [...GameState.rabbits].sort((a, b) => {
        return RABBIT_DATA.rarities[b.rarity].multiplier - RABBIT_DATA.rarities[a.rarity].multiplier;
    });

    sortedRabbits.forEach(rabbit => {
        // Check if assigned elsewhere
        let assignedTo = null;
        for (const [bId, rId] of Object.entries(GameState.assignedRabbits)) {
            if (rId === rabbit.id) assignedTo = bId;
        }

        const btn = document.createElement('button');
        btn.className = 'game-btn';
        btn.style.cssText = 'width: 100%; margin: 5px 0; padding: 10px; display: flex; justify-content: space-between;';

        const rarityData = RABBIT_DATA.rarities[rabbit.rarity];
        const mult = rarityData.multiplier;

        // Visuals
        const assignedText = assignedTo ? (assignedTo === buildingId ? '(Current)' : `(at ${GameState.buildings.find(b => b.id === assignedTo).name})`) : 'Available';
        const color = assignedTo ? '#7f8c8d' : rarityData.color; // Grey if busy

        btn.innerHTML = `
            <span>${rarityData.name} Rabbit (${mult}x)</span>
            <span style="font-size:0.8em; color:${assignedTo ? '#aaa' : '#fff'}">${assignedText}</span>
        `;

        if (assignedTo === buildingId) {
            btn.onclick = () => unassignRabbitFromBuilding(buildingId);
            btn.innerHTML = `<span>Unassign Rabbit</span>`;
            btn.style.background = '#c0392b';
        } else if (assignedTo) {
            btn.disabled = true; // Simplified: Must unassign first
            btn.style.opacity = '0.5';
        } else {
            btn.onclick = () => assignRabbitToBuilding(rabbit.id, buildingId);
            btn.style.borderColor = color;
        }

        container.appendChild(btn);
    });

    if (sortedRabbits.length === 0) {
        container.innerHTML += '<p>No rabbits found!</p>';
    }

    // Add "Unassign Current" if any
    if (GameState.assignedRabbits[buildingId]) {
        const unassignBtn = document.createElement('button');
        unassignBtn.className = 'game-btn';
        unassignBtn.textContent = 'Clear Slot';
        unassignBtn.style.background = '#7f8c8d';
        unassignBtn.onclick = () => unassignRabbitFromBuilding(buildingId);
        container.appendChild(unassignBtn);
    }

    document.getElementById('assign-modal').classList.remove('hidden');
}

function assignRabbitToBuilding(rabbitId, buildingId) {
    GameState.assignedRabbits[buildingId] = rabbitId;
    updateUI();
    saveGame();
    document.getElementById('assign-modal').classList.add('hidden');
}

function unassignRabbitFromBuilding(buildingId) {
    delete GameState.assignedRabbits[buildingId];
    updateUI();
    saveGame();
    document.getElementById('assign-modal').classList.add('hidden');
}

// Deprecated old function (keep for compatibility if needed, but new one replaces it)
function openAssignMenu(rabbitId) {
    // Redirect to building selector? Or just disable "Assign" button in Rabbit Manager?
    // for now, let's just log
    console.log("Legacy assign menu called");
}

function hideAssignMenu() {
    document.getElementById('assign-modal').classList.add('hidden');
    selectedRabbitId = null;
}

function assignRabbit(rabbitId, buildingId) {
    // Remove from any previous assignment
    for (const bid of Object.keys(GameState.assignedRabbits)) {
        if (GameState.assignedRabbits[bid] === rabbitId) {
            delete GameState.assignedRabbits[bid];
        }
    }

    // Assign to new building
    GameState.assignedRabbits[buildingId] = rabbitId;

    saveGame();
    updateUI();
    renderBuildings();
    renderRabbitCollection();
    hideAssignMenu();

    showNumberPop('Rabbit Assigned! 🐰');
}

function unassignRabbit(rabbitId) {
    for (const bid of Object.keys(GameState.assignedRabbits)) {
        if (GameState.assignedRabbits[bid] === rabbitId) {
            delete GameState.assignedRabbits[bid];
        }
    }

    saveGame();
    updateUI();
    renderBuildings();
    renderRabbitCollection();
    hideAssignMenu();
}

// ============================================
// TIER 2 BUILDING MECHANICS
// ============================================

// Ingredient types for Mystic Garden
const INGREDIENT_TYPES = [
    { id: 'moonpetal', name: 'Moon Petal', rarity: 'common', color: '#9b59b6' },
    { id: 'sunroot', name: 'Sun Root', rarity: 'common', color: '#f39c12' },
    { id: 'starleaf', name: 'Star Leaf', rarity: 'rare', color: '#3498db' },
    { id: 'crystaldust', name: 'Crystal Dust', rarity: 'rare', color: '#1abc9c' },
    { id: 'dragonbloom', name: 'Dragon Bloom', rarity: 'epic', color: '#e74c3c' },
    { id: 'phoenixash', name: 'Phoenix Ash', rarity: 'legendary', color: '#f1c40f' }
];

function processTier2Buildings() {
    GameState.buildings.forEach(building => {
        if (!building.tier || building.tier !== 2 || building.level === 0) return;

        switch (building.special) {
            case 'gems':
                // Crystal Cavern: Generate gems slowly
                const gemAmount = building.gemRate * building.level;
                GameState.gems = (GameState.gems || 0) + gemAmount;
                break;

            case 'xp':
                // Rabbit Academy: Generate XP for rabbits
                const xpAmount = building.xpRate * building.level;
                GameState.rabbitXP = (GameState.rabbitXP || 0) + xpAmount;
                break;

            case 'offline':
                // Time Warp Tower: Bonus calculated in offline progress function
                // No tick action needed
                break;

            case 'ingredients':
                // Mystic Garden: Random ingredient drops
                const dropChance = building.dropChance * building.level;
                if (Math.random() < dropChance) {
                    const ingredient = getRandomIngredient();
                    if (!GameState.ingredients) GameState.ingredients = [];
                    GameState.ingredients.push({
                        ...ingredient,
                        id: ingredient.id + '_' + Date.now(),
                        obtainedAt: Date.now()
                    });
                    showNotification(`Found ${ingredient.name}!`, ingredient.color);
                }
                break;
        }
    });

    // Update Tier 2 currency display
    updateTier2Display();
}

function getRandomIngredient() {
    // Weighted random based on rarity
    const roll = Math.random();
    if (roll < 0.01) {
        return INGREDIENT_TYPES.find(i => i.rarity === 'legendary');
    } else if (roll < 0.05) {
        return INGREDIENT_TYPES.find(i => i.rarity === 'epic');
    } else if (roll < 0.25) {
        const rares = INGREDIENT_TYPES.filter(i => i.rarity === 'rare');
        return rares[Math.floor(Math.random() * rares.length)];
    } else {
        const commons = INGREDIENT_TYPES.filter(i => i.rarity === 'common');
        return commons[Math.floor(Math.random() * commons.length)];
    }
}

function getTimeWarpBonus() {
    const tower = GameState.buildings.find(b => b.id === 'time-warp-tower');
    if (!tower || tower.level === 0) return 1;
    return 1 + (tower.offlineBonus * tower.level);
}

function updateTier2Display() {
    const gemsEl = document.getElementById('gems-display');
    const xpEl = document.getElementById('rabbit-xp-display');
    const ingredientsEl = document.getElementById('ingredients-count');
    const tier2Container = document.getElementById('tier2-currencies');

    if (gemsEl) gemsEl.textContent = Math.floor(GameState.gems || 0);
    if (xpEl) xpEl.textContent = Math.floor(GameState.rabbitXP || 0);
    if (ingredientsEl) ingredientsEl.textContent = (GameState.ingredients || []).length;

    // Show Tier 2 currencies bar if any Tier 2 building is unlocked
    if (tier2Container) {
        const anyTier2Unlocked = GameState.buildings.some(b => b.tier === 2 && b.unlocked);
        if (anyTier2Unlocked) {
            tier2Container.classList.remove('hidden');
        }
    }
}

function showNotification(message, color = '#f1c40f') {
    const container = document.getElementById('notification-container');
    if (!container) return;

    const notification = document.createElement('div');
    notification.className = 'game-notification';
    notification.style.cssText = `
        background: ${color}22;
        border: 2px solid ${color};
        color: ${color};
        padding: 10px 20px;
        border-radius: 8px;
        margin-bottom: 8px;
        animation: slideIn 0.3s ease, fadeOut 0.3s ease 2.7s;
    `;
    notification.textContent = message;
    container.appendChild(notification);

    setTimeout(() => notification.remove(), 3000);
}

// ============================================
// TIER 3 BUILDINGS - Endgame Special Mechanics
// ============================================
function processTier3Buildings() {
    GameState.buildings.forEach(building => {
        if (!building.tier || building.tier !== 3 || building.level === 0) return;

        switch (building.special) {
            case 'worlds':
                // Dimensional Portal: Unlock alternate worlds for global production bonus
                const worldProgress = building.worldBonus * building.level * Math.random();
                if (worldProgress > 0.99) {
                    // Rare chance to unlock a new world
                    const prevWorlds = GameState.worldsUnlocked || 0;
                    GameState.worldsUnlocked = prevWorlds + 1;
                    showNotification(`New World Unlocked! (#${GameState.worldsUnlocked})`, '#e74c3c');
                }
                break;

            case 'crafting':
                // Legendary Forge: Craft legendary rabbits from gems + ingredients
                // This is triggered via a button, not passive - just track crafting XP
                const craftXP = building.craftChance * building.level * 0.1;
                GameState.craftingXP = (GameState.craftingXP || 0) + craftXP;
                break;

            case 'staking':
                // Burrow Bank: Earn interest on staked Burrow Tokens
                const interest = (GameState.stakedTokens || 0) * building.interestRate * building.level;
                GameState.burrowTokens = (GameState.burrowTokens || 0) + interest;
                break;

            case 'infinity':
                // Infinity Engine: True endgame scaling
                const infinityProgress = building.infinityMultiplier * building.level * 0.001;
                GameState.infinityLevel = (GameState.infinityLevel || 0) + infinityProgress;
                break;
        }
    });

    updateTier3Display();
}

function getWorldBonus() {
    // Each unlocked world adds 25% global production
    const worlds = GameState.worldsUnlocked || 0;
    return 1 + (worlds * 0.25);
}

function getInfinityMultiplier() {
    // Infinity level provides exponential multiplier
    const infinity = GameState.infinityLevel || 0;
    return 1 + (infinity * 0.1); // 10% per infinity level
}

function stakeTokens(amount) {
    if (amount <= 0 || amount > GameState.burrowTokens) return false;
    GameState.burrowTokens -= amount;
    GameState.stakedTokens = (GameState.stakedTokens || 0) + amount;
    showNotification(`Staked ${amount} Burrow Tokens!`, '#3498db');
    saveGame();
    return true;
}

function unstakeTokens(amount) {
    if (amount <= 0 || amount > (GameState.stakedTokens || 0)) return false;
    GameState.stakedTokens -= amount;
    GameState.burrowTokens += amount;
    showNotification(`Unstaked ${amount} Burrow Tokens!`, '#9b59b6');
    saveGame();
    return true;
}

function craftLegendaryRabbit() {
    // Requires: 100 gems + 5 epic ingredients + level 50 Legendary Forge
    const forge = GameState.buildings.find(b => b.id === 'legendary-forge');
    if (!forge || forge.level < 50) {
        showNotification('Need Legendary Forge level 50!', '#e74c3c');
        return false;
    }

    const gemCost = 100;
    const ingredientCost = 5;
    const epicIngredients = (GameState.ingredients || []).filter(i => i.rarity === 'epic' || i.rarity === 'legendary');

    if ((GameState.gems || 0) < gemCost) {
        showNotification(`Need ${gemCost} Gems!`, '#e74c3c');
        return false;
    }
    if (epicIngredients.length < ingredientCost) {
        showNotification(`Need ${ingredientCost} Epic/Legendary Ingredients!`, '#e74c3c');
        return false;
    }

    // Spend resources
    GameState.gems -= gemCost;
    for (let i = 0; i < ingredientCost; i++) {
        const idx = GameState.ingredients.findIndex(ing => ing.rarity === 'epic' || ing.rarity === 'legendary');
        if (idx >= 0) GameState.ingredients.splice(idx, 1);
    }

    // Create legendary rabbit
    GameState.legendaryRabbitsCrafted = (GameState.legendaryRabbitsCrafted || 0) + 1;
    showNotification(`Crafted Legendary Rabbit #${GameState.legendaryRabbitsCrafted}!`, '#f1c40f');
    saveGame();
    return true;
}

function updateTier3Display() {
    const worldsEl = document.getElementById('worlds-display');
    const legendaryEl = document.getElementById('legendary-rabbits-display');
    const stakedEl = document.getElementById('staked-tokens-display');
    const infinityEl = document.getElementById('infinity-display');
    const tier3Container = document.getElementById('tier3-currencies');

    if (worldsEl) worldsEl.textContent = GameState.worldsUnlocked || 0;
    if (legendaryEl) legendaryEl.textContent = GameState.legendaryRabbitsCrafted || 0;
    if (stakedEl) stakedEl.textContent = Math.floor(GameState.stakedTokens || 0);
    if (infinityEl) infinityEl.textContent = (GameState.infinityLevel || 0).toFixed(2);

    // Show Tier 3 currencies bar if any Tier 3 building is unlocked
    if (tier3Container) {
        const anyTier3Unlocked = GameState.buildings.some(b => b.tier === 3 && b.unlocked);
        if (anyTier3Unlocked) {
            tier3Container.classList.remove('hidden');
        }
    }
}

// ============================================
// GAME LOOP
// ============================================
let lastTick = Date.now();
const TICK_RATE = 1000; // 1 second

function gameLoop() {
    const now = Date.now();
    const delta = now - lastTick;

    if (delta >= TICK_RATE) {
        lastTick = now;
        checkBoosts(); // Check for expired boosts FIRST (before UI updates)
        produceDust();
        checkUnlocks();
        checkSpinCooldown();
        checkFlipCooldown();
        checkRumbleCooldown();
        checkExpeditionStatus();
        processTier2Buildings(); // Tier 2 special mechanics
        processTier3Buildings(); // Tier 3 endgame mechanics
    }

    requestAnimationFrame(gameLoop);
}

// Auto-save every 30 seconds
setInterval(saveGame, 30000);

// ============================================
// INITIALIZATION
// ============================================
function init() {
    console.log('🐰 Stoned Rabbits: Idle Empire - Initializing...');

    // Load saved game
    const hasExistingSave = loadGame();

    // Check for offline progress
    if (hasExistingSave) {
        const offline = calculateOfflineProgress();
        if (offline && offline.earnings > 0) {
            showOfflineModal(offline.earnings);

            // Set up claim button
            document.getElementById('claim-offline-btn').onclick = () => {
                claimOfflineEarnings(offline.earnings);
            };
        }
    }

    // Set up event listeners
    // document.getElementById('collect-btn').onclick = collectDust; // Removed: now dynamic
    // document.getElementById('upgrade-btn').onclick = upgradeBuilding; // Removed: now dynamic
    document.getElementById('reset-btn').onclick = resetGame;
    // Mini-Games (now on main page, keep modal for legacy)
    document.getElementById('minigames-btn').onclick = showMinigamesModal;
    document.getElementById('close-minigames-btn').onclick = hideMinigamesModal;
    document.getElementById('spin-wheel-btn').onclick = spinWheel;
    document.getElementById('play-coin-btn').onclick = flipCoin;
    // Bind Modal Buttons
    const spinBtnModal = document.getElementById('spin-wheel-btn-modal');
    if (spinBtnModal) spinBtnModal.onclick = spinWheel;
    const playCoinBtnModal = document.getElementById('play-coin-btn-modal');
    if (playCoinBtnModal) playCoinBtnModal.onclick = flipCoin;

    // Prestige Buttons
    document.getElementById('prestige-btn').onclick = showPrestigeModal;
    document.getElementById('close-prestige-btn').onclick = hidePrestigeModal;
    document.getElementById('do-prestige-btn').onclick = performPrestige;
    document.getElementById('reset-ascend-btn').onclick = resetAscendProgress;

    // Mini-Game Cards (Main UI)
    const wheelCard = document.getElementById('wheel-card');
    if (wheelCard) wheelCard.onclick = spinWheel;
    const flipCard = document.getElementById('flip-card');
    if (flipCard) flipCard.onclick = flipCoin;

    // Rumble Battle & Expedition
    const rumbleBtn = document.getElementById('rumble-btn');
    if (rumbleBtn) rumbleBtn.onclick = startRumble;
    const rumbleCard = document.getElementById('rumble-card');
    if (rumbleCard) rumbleCard.onclick = startRumble;
    const expeditionBtn = document.getElementById('expedition-btn');
    if (expeditionBtn) expeditionBtn.onclick = startExpedition;
    const expeditionCard = document.getElementById('expedition-card');
    if (expeditionCard) expeditionCard.onclick = startExpedition;

    // Rabbit Manager
    document.getElementById('rabbits-btn').onclick = showRabbitsModal;
    document.getElementById('close-rabbits-btn').onclick = hideRabbitsModal;
    document.getElementById('open-crate-btn').onclick = openCrate;

    // Expose assign helpers globally for onclick
    window.openAssignMenu = openAssignMenu;
    window.hideAssignMenu = hideAssignMenu;
    window.hideCrateResult = hideCrateResult;

    // Click outside modal to close (for all modals)
    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', (e) => {
            // Only close if clicking the overlay itself, not the content
            if (e.target === modal) {
                modal.classList.add('hidden');
            }
        });
    });

    // Render buildings
    renderBuildings();

    // Starter Rabbit
    if (GameState.rabbits.length === 0) {
        const starterRabbit = {
            id: 'starter_rabbit_' + Date.now(),
            typeId: 'carrot-muncher',
            rarity: 'common',
            level: 1
        };
        GameState.rabbits.push(starterRabbit);
        saveGame();
        console.log('🐰 Gave starter rabbit!');

        // Show welcome message after a delay
        setTimeout(() => {
            showNumberPop('You found a rabbit! 🐰');
        }, 1000);
    }
    renderBuildings();

    // Initial UI update
    updateUI();

    // Start game loop
    gameLoop();

    // Check if tutorial needed for new players
    checkTutorial();

    console.log('🐰 Game initialized!');
}

// Start when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

// Save on page unload
window.addEventListener('beforeunload', saveGame);
window.addEventListener('visibilitychange', () => {
    if (document.hidden) saveGame();
});

// ============================================
// TUTORIAL SYSTEM
// ============================================
const TUTORIAL_STEPS = [
    {
        id: 'welcome',
        title: 'Welcome to Stoned Rabbits!',
        text: 'Build your Magic Dust empire with cute stoned rabbits! Tap to continue.',
        highlight: null
    },
    {
        id: 'collect',
        title: 'Collect Magic Dust',
        text: 'Your Rabbit Farm produces Magic Dust. Tap "Collect" to gather it!',
        highlight: 'btn-collect-0'
    },
    {
        id: 'upgrade',
        title: 'Upgrade Buildings',
        text: 'Use Magic Dust to upgrade buildings and increase production.',
        highlight: 'btn-upgrade-0'
    },
    {
        id: 'minigames',
        title: 'Play Mini-Games',
        text: 'Spin the wheel, flip coins, battle, and send expeditions for bonuses!',
        highlight: 'wheel-card'
    },
    {
        id: 'rabbits',
        title: 'Collect Rabbits',
        text: 'Open crates to get NFT rabbits. Assign them to buildings for multipliers!',
        highlight: null
    },
    {
        id: 'prestige',
        title: 'Ascend for Power',
        text: 'Once you earn enough, Ascend to get Burrow Tokens and unlock talents!',
        highlight: null
    },
    {
        id: 'done',
        title: 'You\'re Ready!',
        text: 'Build your empire, collect rare rabbits, and become the ultimate tycoon!',
        highlight: null
    }
];

let tutorialStep = 0;

function showTutorial() {
    // Check if tutorial already completed
    if (localStorage.getItem('tutorialCompleted') === 'true') return;
    
    // Create tutorial overlay if not exists
    let overlay = document.getElementById('tutorial-overlay');
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.id = 'tutorial-overlay';
        overlay.style.cssText = `
            position: fixed;
            top: 0; left: 0; right: 0; bottom: 0;
            background: rgba(0,0,0,0.85);
            z-index: 2000;
            display: flex;
            align-items: center;
            justify-content: center;
        `;
        overlay.innerHTML = `
            <div id="tutorial-box" style="
                background: linear-gradient(135deg, #1a1a2e, #16213e);
                border: 3px solid var(--accent-gold);
                border-radius: 20px;
                padding: 30px;
                max-width: 350px;
                text-align: center;
                box-shadow: 0 0 30px rgba(241, 196, 15, 0.4);
            ">
                <img src="rabbit-captain.jpg" style="width: 80px; height: 80px; border-radius: 50%; border: 3px solid var(--accent-gold); margin-bottom: 15px;">
                <h2 id="tutorial-title" style="color: var(--accent-gold); margin-bottom: 10px;"></h2>
                <p id="tutorial-text" style="color: #fff; font-size: 1rem; line-height: 1.5; margin-bottom: 20px;"></p>
                <div style="display: flex; gap: 10px; justify-content: center;">
                    <button id="tutorial-skip" style="
                        background: #444; color: #888;
                        border: none; padding: 10px 20px;
                        border-radius: 8px; cursor: pointer;
                    ">Skip</button>
                    <button id="tutorial-next" style="
                        background: linear-gradient(135deg, #f1c40f, #d35400);
                        color: #000; font-weight: bold;
                        border: none; padding: 10px 30px;
                        border-radius: 8px; cursor: pointer;
                    ">Next</button>
                </div>
                <div id="tutorial-progress" style="margin-top: 15px; color: #666; font-size: 0.8rem;"></div>
            </div>
        `;
        document.body.appendChild(overlay);
        
        document.getElementById('tutorial-next').onclick = advanceTutorial;
        document.getElementById('tutorial-skip').onclick = completeTutorial;
    }
    
    overlay.classList.remove('hidden');
    overlay.style.display = 'flex';
    renderTutorialStep();
}

function renderTutorialStep() {
    const step = TUTORIAL_STEPS[tutorialStep];
    if (!step) return;
    
    document.getElementById('tutorial-title').textContent = step.title;
    document.getElementById('tutorial-text').textContent = step.text;
    document.getElementById('tutorial-progress').textContent = `${tutorialStep + 1} / ${TUTORIAL_STEPS.length}`;
    
    // Update button text for last step
    const nextBtn = document.getElementById('tutorial-next');
    if (tutorialStep === TUTORIAL_STEPS.length - 1) {
        nextBtn.textContent = 'Start Playing!';
    } else {
        nextBtn.textContent = 'Next';
    }
    
    // Remove all previous highlights
    document.querySelectorAll('.tutorial-highlight').forEach(el => {
        el.classList.remove('tutorial-highlight');
    });
    
    // Add highlight if specified
    if (step.highlight) {
        const highlightEl = document.getElementById(step.highlight);
        if (highlightEl) {
            highlightEl.classList.add('tutorial-highlight');
            highlightEl.style.position = 'relative';
            highlightEl.style.zIndex = '2001';
        }
    }
}

function advanceTutorial() {
    tutorialStep++;
    if (tutorialStep >= TUTORIAL_STEPS.length) {
        completeTutorial();
    } else {
        renderTutorialStep();
    }
}

function completeTutorial() {
    localStorage.setItem('tutorialCompleted', 'true');
    const overlay = document.getElementById('tutorial-overlay');
    if (overlay) overlay.style.display = 'none';
    
    // Remove all highlights
    document.querySelectorAll('.tutorial-highlight').forEach(el => {
        el.classList.remove('tutorial-highlight');
        el.style.zIndex = '';
    });
    
    showNumberPop('Good luck! 🐰');
}

// Start tutorial for new players
function checkTutorial() {
    if (localStorage.getItem('tutorialCompleted') !== 'true') {
        setTimeout(showTutorial, 1500); // Show after 1.5s
    }
}

// DEBUGGING EXPORTS
window.GameState = GameState;
window.showTutorial = showTutorial; // Allow manual trigger
window.activateBoost = activateBoost;
window.resetGame = resetGame;

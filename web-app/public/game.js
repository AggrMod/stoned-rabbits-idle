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
    gems: 100,                      // Premium currency
    noAdsUntil: 0,                  // Timestamp when no-ads expires
    purchaseHistory: [],            // Track IAP purchases
    settings: {                     // User settings
        sfxVolume: 0.5,            // 0-1
        musicVolume: 0.3,          // 0-1
        particlesEnabled: true,
        soundEnabled: true
    },
    lastSaveTime: Date.now(),
    lastSpinTime: 0, // Timestamp of last spin
    lastFlipTime: 0, // Timestamp of last coin flip
    activeBoosts: [], // Array of { id, multiplier, endTime }
    rabbits: [],      // Array of { id, typeId, rarity, level }
    assignedRabbits: {}, // { buildingId: rabbitId }

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
        }
    ]
};

// ============================================
// AUDIO MANAGER
// ============================================
const AudioContext = window.AudioContext || window.webkitAudioContext;
let audioCtx = null;

function initAudio() {
    if (!audioCtx) {
        audioCtx = new AudioContext();
    }
}

function playSound(type) {
    if (!GameState.settings.soundEnabled || !audioCtx) return;

    const volume = GameState.settings.sfxVolume;
    if (volume === 0) return;

    const now = audioCtx.currentTime;
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    // Different sounds for different actions
    switch (type) {
        case 'collect':
            // Ascending chime
            oscillator.frequency.setValueAtTime(523.25, now); // C5
            oscillator.frequency.exponentialRampToValueAtTime(1046.5, now + 0.1); // C6
            gainNode.gain.setValueAtTime(volume * 0.3, now);
            gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
            oscillator.start(now);
            oscillator.stop(now + 0.2);
            break;

        case 'upgrade':
            // Power-up sound
            oscillator.type = 'square';
            oscillator.frequency.setValueAtTime(200, now);
            oscillator.frequency.exponentialRampToValueAtTime(800, now + 0.15);
            gainNode.gain.setValueAtTime(volume * 0.2, now);
            gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
            oscillator.start(now);
            oscillator.stop(now + 0.3);
            break;

        case 'purchase':
            // Cash register
            oscillator.frequency.setValueAtTime(800, now);
            oscillator.frequency.setValueAtTime(600, now + 0.05);
            gainNode.gain.setValueAtTime(volume * 0.25, now);
            gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
            oscillator.start(now);
            oscillator.stop(now + 0.15);
            break;

        case 'click':
            // Soft click
            oscillator.frequency.setValueAtTime(1000, now);
            gainNode.gain.setValueAtTime(volume * 0.15, now);
            gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.05);
            oscillator.start(now);
            oscillator.stop(now + 0.05);
            break;

        case 'error':
            // Buzz
            oscillator.type = 'sawtooth';
            oscillator.frequency.setValueAtTime(150, now);
            gainNode.gain.setValueAtTime(volume * 0.2, now);
            gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
            oscillator.start(now);
            oscillator.stop(now + 0.2);
            break;
    }
}

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

    return new BigNumber(base * globalMult * milestoneMult * rabbitMult);
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

    // Play collect sound
    playSound('collect');

    // Visual feedback
    showNumberPop(`+${new BigNumber(amount).format()} Dust`, '#ffcb05');

    // Spawn collect particles
    const buildingEl = document.querySelector(`.building-spatial[data-building-index="${index}"]`);
    if (buildingEl) {
        const rect = buildingEl.getBoundingClientRect();
        const scene = document.getElementById('grassland-scene');
        if (scene) {
            const sceneRect = scene.getBoundingClientRect();
            const x = `${rect.left - sceneRect.left + rect.width / 2}px`;
            const y = `${rect.top - sceneRect.top + rect.height / 2}px`;
            spawnCollectParticles(x, y);
        }
    }

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

    // Play upgrade sound
    playSound('upgrade');

    // Spawn upgrade particles
    const buildingEl = document.querySelector(`.building-spatial[data-building-index="${index}"]`);
    if (buildingEl) {
        spawnUpgradeEffect(buildingEl);
    }

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
    checkBuildingUnlocks();
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
        activeBoosts: GameState.activeBoosts,
        rabbits: GameState.rabbits,
        assignedRabbits: GameState.assignedRabbits,
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
        GameState.activeBoosts = data.activeBoosts || [];
        GameState.rabbits = data.rabbits || [];
        GameState.assignedRabbits = data.assignedRabbits || {};

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

        const offlineEarnings = totalRate * cappedSeconds;

        return {
            seconds: cappedSeconds,
            earnings: offlineEarnings
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
    if (!container) {
        // New HTML doesn't have building-area, use compact renderer instead
        console.log('📦 Old building-area not found, skipping legacy render');
        return;
    }
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
    // Update Info Bar (new tab system)
    updateInfoBar();

    // Currency (old system - for backward compat)
    const dustValueEl = document.getElementById('dust-value');
    if (dustValueEl) {
        dustValueEl.textContent = GameState.magicDust.format();
    }

    // Calculate total rate for header
    let totalRate = new BigNumber(0);
    GameState.buildings.forEach(b => {
        if (b.unlocked) totalRate = totalRate.add(getProductionRate(b));
    });

    const rateValueEl = document.getElementById('rate-value');
    if (rateValueEl) {
        rateValueEl.textContent = totalRate.format();
    }

    // Update grassland scene (new system)
    renderGrasslandScene();

    // Update each building (old system - for backward compat)
    GameState.buildings.forEach((building, index) => {
        if (building.unlocked) {
            const levelEl = document.getElementById(`level-${index}`);
            // If element missing (e.g. just unlocked but not re-rendered), safe fail
            if (!levelEl) return;

            levelEl.textContent = building.level;
            const prodEl = document.getElementById(`prod-${index}`);
            if (prodEl) prodEl.textContent = getProductionRate(building).format();

            const accumEl = document.getElementById(`accum-${index}`);
            if (accumEl) accumEl.textContent = new BigNumber(building.accumulatedDust).format();

            const upgradeCost = getUpgradeCost(building);
            const costEl = document.getElementById(`cost-${index}`);
            if (costEl) costEl.textContent = upgradeCost.format();

            const btnUpgrade = document.getElementById(`btn-upgrade-${index}`);
            if (btnUpgrade) btnUpgrade.disabled = !canAffordUpgrade(building);
        }
    });

    // Stats
    const totalEarnedEl = document.getElementById('total-earned');
    if (totalEarnedEl) totalEarnedEl.textContent = GameState.totalEarned.format();

    const prestigeCountEl = document.getElementById('prestige-count');
    if (prestigeCountEl) prestigeCountEl.textContent = GameState.prestigeCount;

    // Boost Display (old system)
    const boostEl = document.getElementById('boost-display');
    if (boostEl) {
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

            const boostTextEl = document.getElementById('boost-text');
            if (boostTextEl) boostTextEl.textContent = `${boostMult}x Boost`;

            const boostTimerEl = document.getElementById('boost-timer');
            if (boostTimerEl) boostTimerEl.textContent = `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
        } else {
            boostEl.classList.add('hidden');
        }
    }

    // Update mini-game timers (new system)
    updateMiniGameTimers();

    // Refresh Prestige Modal if open (old system)
    const prestigeModal = document.getElementById('prestige-modal');
    if (prestigeModal && !prestigeModal.classList.contains('hidden')) {
        updatePrestigeModal();
    }

    // Update prestige tab if on that tab (new system)
    if (currentTab === 'ascend') {
        updatePrestigeTab();
    }

    // Update rabbit count badge
    const rabbitBadge = document.getElementById('rabbit-count-badge');
    if (rabbitBadge && GameState.rabbits.length > 0) {
        rabbitBadge.textContent = GameState.rabbits.length;
        rabbitBadge.classList.remove('hidden');
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

        const card = document.createElement('div');
        card.className = `rabbit-card ${isAssigned ? 'assigned' : ''}`;
        card.style.borderColor = rarityData.color;
        card.innerHTML = `
            <div class="rabbit-name">${typeData ? typeData.name : 'Unknown'}</div>
            <div class="rabbit-rarity" style="color: ${rarityData.color}">${rarityData.name}</div>
            <div class="rabbit-mult">×${rarityData.multiplier.toFixed(2)}</div>
            <div class="rabbit-status">${isAssigned ? 'Assigned' : 'Available'}</div>
            <button class="assign-btn" onclick="openAssignMenu('${rabbit.id}')" style="margin-top: 5px; padding: 5px 10px; font-size: 0.8rem; background: var(--bg-button); color: white; border: none; border-radius: 5px; cursor: pointer;">
                ${isAssigned ? 'Reassign' : 'Assign'}
            </button>
        `;
        container.appendChild(card);
    });
}

function openCrate() {
    // Check cost
    if (GameState.magicDust.lessThan(CRATE_COST)) {
        showNumberPop('Not enough Dust!');
        return;
    }

    // Deduct cost
    GameState.magicDust = GameState.magicDust.subtract(CRATE_COST);

    // Determine rarity
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

    // Pick random type
    const typeIndex = Math.floor(Math.random() * RABBIT_DATA.types.length);
    const typeId = RABBIT_DATA.types[typeIndex].id;

    // Create rabbit
    const newRabbit = {
        id: `rabbit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        typeId: typeId,
        rarity: rarity,
        level: 1
    };

    GameState.rabbits.push(newRabbit);
    saveGame();
    updateUI();

    // Show result
    showCrateResult(newRabbit);
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
    }

    requestAnimationFrame(gameLoop);
}

// Auto-save every 30 seconds
setInterval(saveGame, 30000);

// ============================================
// TAB SYSTEM (Epic 7)
// ============================================
let currentTab = 'empire';

function switchTab(tabName) {
    // Hide all tab panels
    document.querySelectorAll('.tab-panel').forEach(panel => {
        panel.classList.remove('active');
    });

    // Remove active from all nav buttons
    document.querySelectorAll('.nav-tab').forEach(btn => {
        btn.classList.remove('active');
    });

    // Show selected tab panel
    const targetPanel = document.getElementById(`tab-${tabName}`);
    if (targetPanel) {
        targetPanel.classList.add('active');
    }

    // Activate selected nav button
    const targetBtn = document.querySelector(`.nav-tab[data-tab="${tabName}"]`);
    if (targetBtn) {
        targetBtn.classList.add('active');
    }

    currentTab = tabName;

    // Update content for the tab
    if (tabName === 'rabbits') {
        renderRabbitsTab();
    } else if (tabName === 'ascend') {
        updatePrestigeTab();
    } else if (tabName === 'games') {
        updateMiniGamesTab();
    }
}

function renderGrasslandScene() {
    const container = document.getElementById('buildings-container');
    if (!container) {
        console.warn('⚠️ buildings-container not found! Scene cannot render');
        return;
    }

    console.log(`🌳 Rendering grassland scene with ${GameState.buildings.length} buildings...`);
    container.innerHTML = '';

    // Building positions (x, y) for 800x600 scene - percentage based for responsiveness 
    const positions = [
        { x: '15%', y: '60%' },   //Rabbit Farm - bottom left
        { x: '45%', y: '50%' },    // Weed Patch - center  
        { x: '75%', y: '60%' },    // Bake Shop - bottom right
        { x: '25%', y: '25%' },    // Infused Field - top left
        { x: '65%', y: '25%' }     // Energy Extractor - top right
    ];

    // Building image files
    const imageFiles = [
        'rabbit-farm.png',
        'weed-patch.png',
        'bake-shop.png',
        'infused-field.png',
        'energy-extractor.png'
    ];

    GameState.buildings.forEach((building, index) => {
        console.log(`  Building ${index}: ${building.name}, unlocked: ${building.unlocked}, position: ${positions[index].x}, ${positions[index].y}`);

        const buildingEl = document.createElement('div');
        buildingEl.className = building.unlocked ? 'building-spatial' : 'building-spatial locked';
        buildingEl.style.left = positions[index].x;
        buildingEl.style.top = positions[index].y;
        buildingEl.dataset.buildingIndex = index;

        // Create building sprite container
        const spriteContainer = document.createElement('div');
        spriteContainer.className = 'building-sprite-container';

        // Building sprite (image)
        const sprite = document.createElement('div');
        sprite.className = 'building-sprite';

        const img = document.createElement('img');
        img.src = imageFiles[index];
        img.alt = building.name;
        img.style.width = '100%';
        img.style.height = '100%';
        img.style.objectFit = 'contain';
        sprite.appendChild(img);

        // Lock icon for locked buildings
        if (!building.unlocked) {
            const lockIcon = document.createElement('div');
            lockIcon.className = 'lock-icon';
            lockIcon.textContent = '🔒';
            sprite.appendChild(lockIcon);
        }

        // Collect bubble (only for unlocked buildings with accumulated dust)
        const accumulated = new BigNumber(building.accumulatedDust);
        if (building.unlocked && accumulated.value > 0) {
            const bubble = document.createElement('div');
            bubble.className = 'collect-bubble';
            bubble.textContent = `💰 ${accumulated.format()}`;
            bubble.onclick = (e) => {
                e.stopPropagation();
                collectDust(index);
            };
            spriteContainer.appendChild(bubble);
        }

        // Building label
        const label = document.createElement('div');
        label.className = 'building-label';
        if (building.unlocked) {
            label.textContent = `${building.name} L${building.level}`;
        } else {
            const unlockReq = building.unlockRequirement;
            if (unlockReq && unlockReq.buildingId) {
                const reqBuilding = GameState.buildings.find(b => b.id === unlockReq.buildingId);
                label.textContent = `🔒 ${reqBuilding?.name || 'Building'} L${unlockReq.level}`;
            } else {
                label.textContent = `🔒 ${building.name}`;
            }
        }

        spriteContainer.appendChild(sprite);
        spriteContainer.appendChild(label);
        buildingEl.appendChild(spriteContainer);

        // Click handler - show building panel
        if (building.unlocked) {
            buildingEl.onclick = () => showBuildingPanel(index);
        }

        container.appendChild(buildingEl);
    });

    console.log(`✅ Rendered ${container.children.length} spatial buildings`);
}

// Show building detail panel
let currentPanelBuilding = null;

function showBuildingPanel(buildingIndex) {
    console.log('🔍 showBuildingPanel called with index:', buildingIndex);

    const building = GameState.buildings[buildingIndex];
    if (!building || !building.unlocked) {
        console.warn('⚠️ Building not found or locked, index:', buildingIndex);
        return;
    }

    currentPanelBuilding = buildingIndex;
    const panel = document.getElementById('building-panel');
    const nameEl = document.getElementById('panel-building-name');
    const statsEl = document.getElementById('panel-building-stats');

    console.log('📋 Panel element:', panel);
    console.log('📋 Name element:', nameEl);
    console.log('📋 Stats element:', statsEl);

    if (!panel) {
        console.error('❌ building-panel element not found!');
        return;
    }

    // Set building name
    nameEl.textContent = `${building.name} (Level ${building.level})`;

    // Set stats
    const rate = getProductionRate(building);
    const accumulated = new BigNumber(building.accumulatedDust);
    const upgradeCost = getUpgradeCost(building);
    const canAfford = canAffordUpgrade(building);

    statsEl.innerHTML = `
        <div><span>Production:</span><span class="stat-value accent-green">+${rate.format()}/s</span></div>
        <div><span>Ready to Collect:</span><span class="stat-value">${accumulated.format()}</span></div>
        <div><span>Upgrade Cost:</span><span class="stat-value">${upgradeCost.format()}</span></div>
    `;

    // Set button states
    const collectBtn = document.getElementById('panel-collect-btn');
    const upgradeBtn = document.getElementById('panel-upgrade-btn');

    console.log('🔘 Collect button:', collectBtn);
    console.log('🔘 Upgrade button:', upgradeBtn);

    if (!collectBtn || !upgradeBtn) {
        console.error('❌ Buttons not found in panel!');
        return;
    }

    collectBtn.disabled = accumulated.value === 0;
    collectBtn.textContent = accumulated.value > 0 ? `Collect ${accumulated.format()}` : 'Nothing to Collect';
    collectBtn.onclick = () => {
        collectDust(buildingIndex);
        // Refresh panel to show new values
        setTimeout(() => showBuildingPanel(buildingIndex), 100);
    };

    upgradeBtn.disabled = !canAfford;
    upgradeBtn.textContent = `Upgrade (${upgradeCost.format()})`;
    upgradeBtn.onclick = () => {
        upgradeBuilding(buildingIndex);
        // Refresh panel to show new level and cost
        setTimeout(() => showBuildingPanel(buildingIndex), 100);
    };

    // Show panel
    console.log('✅ Panel ready to show, removing hidden class');
    panel.classList.remove('hidden');
}

function hideBuildingPanel() {
    const panel = document.getElementById('building-panel');
    panel.classList.add('hidden');
    currentPanelBuilding = null;
}

// ============================================
// WALKING RABBIT ANIMATION
// ============================================
let walkingRabbits = [];

function spawnWalkingRabbit() {
    const container = document.getElementById('rabbits-container');
    if (!container) return;

    // Building positions (match grassland scene)
    const buildingPositions = [
        { x: '15%', y: '60%' },   // Rabbit Farm
        { x: '45%', y: '50%' },   // Weed Patch  
        { x: '75%', y: '60%' },   // Bake Shop
        { x: '25%', y: '25%' },   // Infused Field
        { x: '65%', y: '25%' }    // Energy Extractor
    ];

    // Pick random start and end buildings
    const startIdx = Math.floor(Math.random() * buildingPositions.length);
    let endIdx = Math.floor(Math.random() * buildingPositions.length);
    while (endIdx === startIdx) {
        endIdx = Math.floor(Math.random() * buildingPositions.length);
    }

    const start = buildingPositions[startIdx];
    const end = buildingPositions[endIdx];

    // Create rabbit sprite
    const rabbit = document.createElement('div');
    rabbit.className = 'rabbit-sprite walking';
    rabbit.textContent = '🐰';
    rabbit.style.left = start.x;
    rabbit.style.top = start.y;
    rabbit.style.fontSize = '24px';

    // Determine if rabbit should be flipped
    const startX = parseFloat(start.x);
    const endX = parseFloat(end.x);
    if (endX < startX) {
        rabbit.classList.add('flipped');
    }

    container.appendChild(rabbit);

    // Animate to destination
    setTimeout(() => {
        rabbit.style.left = end.x;
        rabbit.style.top = end.y;
    }, 100);

    // Remove and create new rabbit after animation
    setTimeout(() => {
        container.removeChild(rabbit);
        // Respawn after delay
        setTimeout(spawnWalkingRabbit, Math.random() * 2000 + 1000);
    }, 3500);
}

function initWalkingRabbits() {
    // Spawn 2-3 rabbits at different times
    setTimeout(() => spawnWalkingRabbit(), 1000);
    setTimeout(() => spawnWalkingRabbit(), 3000);
    setTimeout(() => spawnWalkingRabbit(), 5000);
}

// ============================================
// PARTICLE EFFECTS
// ============================================

function spawnCollectParticles(x, y) {
    const scene = document.getElementById('grassland-scene');
    if (!scene) return;

    // Create 8-12 particles
    const particleCount = Math.floor(Math.random() * 5) + 8;

    for (let i = 0; i < particleCount; i++) {
        const particle = document.createElement('div');
        particle.className = 'particle collect-particle';
        particle.textContent = '✨';

        // Random offset from center
        const offsetX = (Math.random() - 0.5) * 60;
        const offsetY = (Math.random() - 0.5) * 40;

        particle.style.left = `calc(${x} + ${offsetX}px)`;
        particle.style.top = `calc(${y} + ${offsetY}px)`;
        particle.style.animationDelay = `${Math.random() * 0.2}s`;

        scene.appendChild(particle);

        // Remove after animation
        setTimeout(() => {
            if (particle.parentNode) {
                scene.removeChild(particle);
            }
        }, 1500);
    }
}

function spawnUpgradeEffect(buildingElement) {
    if (!buildingElement) return;

    const scene = document.getElementById('grassland-scene');
    if (!scene) return;

    const rect = buildingElement.getBoundingClientRect();
    const sceneRect = scene.getBoundingClientRect();

    const centerX = rect.left - sceneRect.left + rect.width / 2;
    const centerY = rect.top - sceneRect.top + rect.height / 2;

    // Create sparkle ring
    const sparkleCount = 12;
    for (let i = 0; i < sparkleCount; i++) {
        const particle = document.createElement('div');
        particle.className = 'particle upgrade-particle';
        particle.textContent = '⭐';

        const angle = (i / sparkleCount) * Math.PI * 2;
        const radius = 60;
        const offsetX = Math.cos(angle) * radius;
        const offsetY = Math.sin(angle) * radius;

        particle.style.left = `${centerX + offsetX}px`;
        particle.style.top = `${centerY + offsetY}px`;
        particle.style.animationDelay = `${i * 0.05}s`;

        scene.appendChild(particle);

        setTimeout(() => {
            if (particle.parentNode) {
                scene.removeChild(particle);
            }
        }, 1200);
    }

    // "+1 Level" text
    const levelText = document.createElement('div');
    levelText.className = 'level-up-text';
    levelText.textContent = '+1 LEVEL';
    levelText.style.left = `${centerX}px`;
    levelText.style.top = `${centerY - 40}px`;

    scene.appendChild(levelText);

    setTimeout(() => {
        if (levelText.parentNode) {
            scene.removeChild(levelText);
        }
    }, 1500);
}

function renderRabbitsTab() {
    const grid = document.getElementById('rabbit-grid-tab');
    const noRabbitsMsg = document.getElementById('no-rabbits-tab');
    const assignmentList = document.getElementById('assignment-list');

    if (!grid) return;

    if (GameState.rabbits.length === 0) {
        grid.innerHTML = '';
        noRabbitsMsg.classList.remove('hidden');
        return;
    }

    noRabbitsMsg.classList.add('hidden');
    grid.innerHTML = '';

    GameState.rabbits.forEach(rabbit => {
        const typeData = RABBIT_DATA.types.find(t => t.id === rabbit.typeId);
        const rarityData = RABBIT_DATA.rarities[rabbit.rarity];
        const isAssigned = Object.values(GameState.assignedRabbits).includes(rabbit.id);

        const card = document.createElement('div');
        card.className = `rabbit-card ${isAssigned ? 'assigned' : ''}`;
        card.style.borderColor = rarityData.color;

        card.innerHTML = `
            <div class="rabbit-name">${typeData.name}</div>
            <div class="rabbit-rarity" style="color: ${rarityData.color}">${rarityData.name}</div>
            <div class="rabbit-mult">×${rarityData.multiplier.toFixed(2)}</div>
            <div class="rabbit-status">Level ${rabbit.level}</div>
            ${isAssigned ? '<div class="assigned-badge">✅ Assigned</div>' : ''}
            <button class="game-btn assign-btn" style="margin-top: 8px; padding: 6px 12px; font-size: 0.8rem;" 
                    onclick="openAssignMenu('${rabbit.id}')">
                ${isAssigned ? 'Reassign' : 'Assign'}
            </button>
        `;

        grid.appendChild(card);
    });

    // Update assignment list
    if (assignmentList) {
        assignmentList.innerHTML = '';
        GameState.buildings.forEach(building => {
            if (!building.unlocked) return;

            const assignedId = GameState.assignedRabbits[building.id];
            if (assignedId) {
                const rabbit = GameState.rabbits.find(r => r.id === assignedId);
                if (rabbit) {
                    const typeData = RABBIT_DATA.types.find(t => t.id === rabbit.typeId);
                    const rarityData = RABBIT_DATA.rarities[rabbit.rarity];

                    const item = document.createElement('div');
                    item.className = 'assignment-item';
                    item.innerHTML = `
                        <span>${building.name}:</span>
                        <span style="color: ${rarityData.color}">🐰 ${typeData.name} (×${rarityData.multiplier.toFixed(1)})</span>
                    `;
                    assignmentList.appendChild(item);
                }
            }
        });

        if (assignmentList.children.length === 0) {
            assignmentList.innerHTML = '<div style="color: #888; padding: 10px; text-align: center;">No rabbits assigned yet</div>';
        }
    }
}

function updatePrestigeTab() {
    const currentTokens = GameState.burrowTokens;
    const reward = calculatePrestigeReward();
    const lifetime = GameState.lifetimeDust;
    const currentMult = 1 + (currentTokens * 0.10);

    document.getElementById('current-tokens-tab').textContent = currentTokens;
    document.getElementById('current-multiplier-tab').textContent = `${currentMult.toFixed(1)}x`;
    document.getElementById('lifetime-dust-tab').textContent = lifetime.format();
    document.getElementById('prestige-reward-tab').textContent = `+${reward} Tokens`;

    const newTotal = currentTokens + reward;
    const newMult = 1 + (newTotal * 0.10);

    // Calculate next goal
    let nextGoal = new BigNumber(Math.pow(10, 10));
    if (lifetime.toNumber() > 10) {
        const currentLog = Math.floor(Math.log10(lifetime.toNumber()));
        const nextExp = Math.max(10, currentLog + 1);
        nextGoal = new BigNumber(Math.pow(10, nextExp));
    }
    document.getElementById('next-token-goal-tab').textContent = nextGoal.format();

    // Button state
    const btn = document.getElementById('do-prestige-btn-tab');
    if (reward >= 1) {
        btn.disabled = false;
        btn.classList.remove('disabled');
    } else {
        btn.disabled = true;
        btn.classList.add('disabled');
    }
}

function updateMiniGamesTab() {
    updateMiniGameTimers();
}

function updateMiniGameTimers() {
    const now = Date.now();

    // Wheel timer
    const wheelReady = (now - GameState.lastSpinTime) >= WHEEL_COOLDOWN;
    const wheelStatus = document.getElementById('wheel-status-tab');
    if (wheelStatus) {
        if (wheelReady) {
            wheelStatus.innerHTML = '<span class="ready-status">✅ Ready to Spin!</span>';
        } else {
            const remaining = WHEEL_COOLDOWN - (now - GameState.lastSpinTime);
            const hours = Math.floor((remaining / (1000 * 60 * 60)) % 24);
            const mins = Math.floor((remaining / (1000 * 60)) % 60);
            const secs = Math.floor((remaining / 1000) % 60);
            wheelStatus.innerHTML = `<span class="cooldown-status">🕐 ${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}</span>`;
        }
    }

    // Flip timer
    const flipReady = (now - GameState.lastFlipTime) >= FLIP_COOLDOWN;
    const flipStatus = document.getElementById('flip-status-tab');
    if (flipStatus) {
        if (flipReady) {
            flipStatus.innerHTML = '<span class="ready-status">✅ Ready to Flip!</span>';
        } else {
            const remaining = FLIP_COOLDOWN - (now - GameState.lastFlipTime);
            const hours = Math.floor((remaining / (1000 * 60 * 60)) % 24);
            const mins = Math.floor((remaining / (1000 * 60)) % 60);
            const secs = Math.floor((remaining / 1000) % 60);
            flipStatus.innerHTML = `<span class="cooldown-status">🕐 ${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}</span>`;
        }
    }

    // Update quick action status
    const wheelQuickStatus = document.getElementById('wheel-quick-status');
    if (wheelQuickStatus) {
        wheelQuickStatus.textContent = wheelReady ? '✅' : '';
    }
    const flipQuickStatus = document.getElementById('flip-quick-status');
    if (flipQuickStatus) {
        flipQuickStatus.textContent = flipReady ? '✅' : '';
    }
}

function updateInfoBar() {
    const infoDust = document.getElementById('info-dust');
    const infoRate = document.getElementById('info-rate');
    const infoTokens = document.getElementById('info-tokens');
    const infoTokensItem = document.getElementById('info-tokens-item');
    const infoGems = document.getElementById('info-gems');
    const infoBoost = document.getElementById('info-boost');
    const infoBoostItem = document.getElementById('info-boost-item');

    if (infoDust) infoDust.textContent = GameState.magicDust.format();

    if (infoRate) {
        let totalRate = new BigNumber(0);
        GameState.buildings.forEach(b => {
            if (b.unlocked) totalRate = totalRate.add(getProductionRate(b));
        });
        infoRate.textContent = totalRate.format() + '/s';
    }

    if (infoTokens && GameState.burrowTokens > 0) {
        infoTokens.textContent = GameState.burrowTokens;
        if (infoTokensItem) infoTokensItem.classList.remove('hidden');
    } else if (infoTokensItem) {
        infoTokensItem.classList.add('hidden');
    }

    if (infoGems) {
        infoGems.textContent = GameState.gems;
    }

    if (infoBoost && GameState.activeBoosts.length > 0) {
        let boostMult = 1;
        GameState.activeBoosts.forEach(b => boostMult *= b.multiplier);
        infoBoost.textContent = `🔥 ${boostMult}x`;
        infoBoostItem.classList.remove('hidden');
    } else if (infoBoostItem) {
        infoBoostItem.classList.add('hidden');
    }
}


// ============================================
// SHOP SYSTEM
// ============================================

function openShop() {
    const modal = document.getElementById('shop-modal');
    if (modal) {
        modal.classList.remove('hidden');
    }
}

function closeShop() {
    const modal = document.getElementById('shop-modal');
    if (modal) {
        modal.classList.add('hidden');
    }
}

function buyItem(itemId, cost) {
    // Check if player has enough gems
    if (GameState.gems < cost) {
        showNumberPop('❌ Not enough gems!', '#ff0000');
        return;
    }

    // Deduct gems
    GameState.gems -= cost;

    // Play purchase sound
    playSound('purchase');

    // Grant item based on type
    if (itemId.startsWith('crate-')) {
        handleCratePurchase(itemId);
    } else if (itemId === 'boost-2x') {
        handleBoostPurchase();
    } else if (itemId === 'skip-time') {
        handleSkipTime();
    }

    // Update UI and save
    updateUI();
    saveGame();
    showNumberPop(`✓ Purchased ${itemId}!`, '#ffcb05');
}

function handleCratePurchase(crateType) {
    let rarity;

    // Determine rarity based on crate type
    if (crateType === 'crate-common') {
        // Common crate: 70% common, 25% rare, 5% epic
        const roll = Math.random();
        if (roll < 0.70) rarity = 'common';
        else if (roll < 0.95) rarity = 'rare';
        else rarity = 'epic';
    } else if (crateType === 'crate-rare') {
        // Rare crate: 60% rare, 35% epic, 5% legendary
        const roll = Math.random();
        if (roll < 0.60) rarity = 'rare';
        else if (roll < 0.95) rarity = 'epic';
        else rarity = 'legendary';
    } else if (crateType === 'crate-epic') {
        // Epic crate: 50% epic, 45% legendary, 5% mythic
        const roll = Math.random();
        if (roll < 0.50) rarity = 'epic';
        else if (roll < 0.95) rarity = 'legendary';
        else rarity = 'mythic';
    }

    // Add rabbit using existing function
    addRabbit(rarity);
    showNumberPop(`🎁 Got ${rarity} rabbit!`, RABBIT_DATA.rarities[rarity].color);
}

function handleBoostPurchase() {
    const endTime = Date.now() + (60 * 60 * 1000); // 1 hour
    GameState.activeBoosts.push({
        id: 'shop-boost',
        multiplier: 2,
        endTime: endTime
    });
    showNumberPop('⚡ 2x Production for 1 hour!', '#4CAF50');
}

function handleSkipTime() {
    const skipHours = 1;
    const skipMs = skipHours * 60 * 60 * 1000;

    // Calculate production for skipped time
    GameState.buildings.forEach(building => {
        if (!building.unlocked) return;
        const rate = getProductionRate(building).value;
        const skipped = rate * (skipMs / 1000);
        building.accumulatedDust += skipped;
    });

    showNumberPop('⏰ Skipped 1 hour of production!', '#2196F3');
}

function buyPremium(productId, price) {
    // In production, this would call real payment API
    // For now, simulate purchase

    if (confirm(`Purchase ${productId} for €${price}?\n\n(In the web version, this is simulated. Real payments would be processed via Stripe/PayPal or app stores.)`)) {
        if (productId === 'no-ads-day') {
            activateNoAds(24); // 24 hours
        } else if (productId === 'no-ads-week') {
            activateNoAds(24 * 7); // 7 days
        }

        // Track purchase
        GameState.purchaseHistory.push({
            product: productId,
            price: price,
            timestamp: Date.now()
        });

        saveGame();
        showNumberPop('👑 Purchase successful!', '#4CAF50');
    }
}

function activateNoAds(hours) {
    const durationMs = hours * 60 * 60 * 1000;
    GameState.noAdsUntil = Date.now() + durationMs;
    updateUI();
}

function openSettings() {
    const modal = document.getElementById('settings-modal');
    if (modal) {
        // Update UI with current settings
        const sfxSlider = document.getElementById('sfx-volume');
        const sfxValue = document.getElementById('sfx-value');
        const soundToggle = document.getElementById('sound-toggle');
        const particlesToggle = document.getElementById('particles-toggle');

        if (sfxSlider) sfxSlider.value = GameState.settings.sfxVolume * 100;
        if (sfxValue) sfxValue.textContent = Math.round(GameState.settings.sfxVolume * 100) + '%';
        if (soundToggle) soundToggle.checked = GameState.settings.soundEnabled;
        if (particlesToggle) particlesToggle.checked = GameState.settings.particlesEnabled;

        modal.classList.remove('hidden');
    }
}

function closeSettings() {
    const modal = document.getElementById('settings-modal');
    if (modal) {
        modal.classList.add('hidden');
    }
    saveGame(); // Save settings
}

function hasNoAds() {
    return Date.now() < GameState.noAdsUntil;
}

// ============================================
// INITIALIZATION
// ============================================
function init() {
    console.log('🐰 Stoned Rabbits: Idle Empire - Initializing...');

    // Load saved game
    const hasExistingSave = loadGame();

    // Initialize audio (needs user interaction due to browser autoplay policies)
    document.addEventListener('click', () => initAudio(), { once: true });

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
    // Tab Navigation (new system)
    document.querySelectorAll('.nav-tab').forEach(btn => {
        btn.addEventListener('click', () => {
            const tabName = btn.dataset.tab;
            if (tabName) switchTab(tabName);
        });
    });

    // Quick Action Buttons (new system)
    const quickShopBtn = document.getElementById('quick-shop-btn');
    if (quickShopBtn) quickShopBtn.onclick = openShop;

    const quickWheelBtn = document.getElementById('quick-wheel-btn');
    if (quickWheelBtn) quickWheelBtn.onclick = spinWheel;

    const quickFlipBtn = document.getElementById('quick-flip-btn');
    if (quickFlipBtn) quickFlipBtn.onclick = flipCoin;

    // Shop modal
    const closeShopBtn = document.getElementById('close-shop-btn');
    if (closeShopBtn) closeShopBtn.onclick = closeShop;

    // Settings modal
    const settingsBtn = document.getElementById('settings-btn');
    if (settingsBtn) settingsBtn.onclick = openSettings;

    const closeSettingsBtn = document.getElementById('close-settings-btn');
    if (closeSettingsBtn) closeSettingsBtn.onclick = closeSettings;

    // Settings controls
    const sfxSlider = document.getElementById('sfx-volume');
    const sfxValue = document.getElementById('sfx-value');
    if (sfxSlider && sfxValue) {
        sfxSlider.oninput = function () {
            GameState.settings.sfxVolume = this.value / 100;
            sfxValue.textContent = this.value + '%';
        };
    }

    const soundToggle = document.getElementById('sound-toggle');
    if (soundToggle) {
        soundToggle.onchange = function () {
            GameState.settings.soundEnabled = this.checked;
        };
    }

    const particlesToggle = document.getElementById('particles-toggle');
    if (particlesToggle) {
        particlesToggle.onchange = function () {
            GameState.settings.particlesEnabled = this.checked;
        };
    }

    // Tab-specific buttons (new system)
    const spinWheelBtnTab = document.getElementById('spin-wheel-btn-tab');
    if (spinWheelBtnTab) spinWheelBtnTab.onclick = spinWheel;

    const playCoinBtnTab = document.getElementById('play-coin-btn-tab');
    if (playCoinBtnTab) playCoinBtnTab.onclick = flipCoin;

    const openCrateBtnTab = document.getElementById('open-crate-btn-tab');
    if (openCrateBtnTab) openCrateBtnTab.onclick = openCrate;

    const doPrestigeBtnTab = document.getElementById('do-prestige-btn-tab');
    if (doPrestigeBtnTab) doPrestigeBtnTab.onclick = performPrestige;

    const resetAscendBtnTab = document.getElementById('reset-ascend-btn-tab');
    if (resetAscendBtnTab) resetAscendBtnTab.onclick = resetAscendProgress;

    // Old system buttons (for backward compat)
    const resetBtn = document.getElementById('reset-btn');
    if (resetBtn) resetBtn.onclick = resetGame;

    // Mini-Games (legacy modals)
    const minigamesBtn = document.getElementById('minigames-btn');
    if (minigamesBtn) minigamesBtn.onclick = showMinigamesModal;

    const closeMinigamesBtn = document.getElementById('close-minigames-btn');
    if (closeMinigamesBtn) closeMinigamesBtn.onclick = hideMinigamesModal;

    const spinBtn = document.getElementById('spin-wheel-btn');
    if (spinBtn) spinBtn.onclick = spinWheel;

    const playCoinBtn = document.getElementById('play-coin-btn');
    if (playCoinBtn) playCoinBtn.onclick = flipCoin;

    // Bind Modal Buttons
    const spinBtnModal = document.getElementById('spin-wheel-btn-modal');
    if (spinBtnModal) spinBtnModal.onclick = spinWheel;
    const playCoinBtnModal = document.getElementById('play-coin-btn-modal');
    if (playCoinBtnModal) playCoinBtnModal.onclick = flipCoin;

    // Prestige Buttons (legacy)
    const prestigeBtn = document.getElementById('prestige-btn');
    if (prestigeBtn) prestigeBtn.onclick = showPrestigeModal;

    const closePrestigeBtn = document.getElementById('close-prestige-btn');
    if (closePrestigeBtn) closePrestigeBtn.onclick = hidePrestigeModal;

    const doPrestigeBtn = document.getElementById('do-prestige-btn');
    if (doPrestigeBtn) doPrestigeBtn.onclick = performPrestige;

    const resetAscendBtn = document.getElementById('reset-ascend-btn');
    if (resetAscendBtn) resetAscendBtn.onclick = resetAscendProgress;

    // Mini-Game Cards (Main UI - legacy)
    const wheelCard = document.getElementById('wheel-card');
    if (wheelCard) wheelCard.onclick = spinWheel;
    const flipCard = document.getElementById('flip-card');
    if (flipCard) flipCard.onclick = flipCoin;

    // Rabbit Manager (legacy)
    const rabbitsBtn = document.getElementById('rabbits-btn');
    if (rabbitsBtn) rabbitsBtn.onclick = showRabbitsModal;

    const closeRabbitsBtn = document.getElementById('close-rabbits-btn');
    if (closeRabbitsBtn) closeRabbitsBtn.onclick = hideRabbitsModal;

    const openCrateBtn = document.getElementById('open-crate-btn');
    if (openCrateBtn) openCrateBtn.onclick = openCrate;

    // Building Panel close button (new grassland UI)
    const closePanelBtn = document.getElementById('close-panel-btn');
    if (closePanelBtn) closePanelBtn.onclick = hideBuildingPanel;

    // Expose assign helpers globally for onclick
    window.openAssignMenu = openAssignMenu;
    window.hideAssignMenu = hideAssignMenu;
    window.hideCrateResult = hideCrateResult;
    window.openRabbitSelector = openRabbitSelector;

    // Expose shop functions globally for onclick
    window.buyItem = buyItem;
    window.buyPremium = buyPremium;

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
    renderBuildings(); // Legacy system
    renderGrasslandScene(); // New tab system - explicitly render on init

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

    // Render buildings again after starter rabbit
    renderBuildings();
    renderGrasslandScene();

    // Initial UI update
    updateUI();

    // Start game loop
    gameLoop();

    // Start walking rabbits animation
    initWalkingRabbits();

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

// DEBUGGING EXPORTS
window.GameState = GameState;
window.activateBoost = activateBoost;
window.resetGame = resetGame;

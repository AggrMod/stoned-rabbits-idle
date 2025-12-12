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
            baseCost: 50,  // Balanced: ~30-45s per upgrade
            baseProduction: 1,
            costGrowthFactor: 1.07,  // GDD spec: costs grow slowly
            productionGrowthFactor: 1.15,  // GDD spec: production grows faster
            accumulatedDust: 0,
            unlocked: true,
            unlockRequirement: null
        },
        {
            id: 'energy-extractor',
            name: 'Energy Extractor',
            level: 0,  // 0 = not yet purchased
            baseCost: 2500,  // Significant investment at L10 unlock
            baseProduction: 5,
            costGrowthFactor: 1.07,  // GDD spec
            productionGrowthFactor: 1.15,  // GDD spec
            accumulatedDust: 0,
            unlocked: false,
            unlockRequirement: { buildingId: 'rabbit-farm', level: 10 }
        }
    ]
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

    // Burrow Token bonus: +5% per token (balanced for long-term play)
    const tokenBonus = 1 + (GameState.burrowTokens * 0.05);
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
    container.innerHTML = '';

    GameState.buildings.forEach((building, index) => {
        const div = document.createElement('div');
        div.className = `building ${building.unlocked ? '' : 'locked'}`;
        div.id = `building-${index}`;

        // Basic HTML structure
        let content = `
            <div class="building-icon">
                <img src="rabbit-captain.jpg" alt="Building Icon" class="rabbit-nft">
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

function openAssignMenu(rabbitId) {
    selectedRabbitId = rabbitId;
    const container = document.getElementById('assign-building-list');
    container.innerHTML = '';

    // Show unlocked buildings
    GameState.buildings.forEach((building, index) => {
        if (!building.unlocked) return;

        const currentRabbit = GameState.assignedRabbits[building.id];
        const hasRabbit = currentRabbit && currentRabbit !== rabbitId;

        const btn = document.createElement('button');
        btn.className = 'game-btn';
        btn.style.cssText = 'width: 100%; margin: 5px 0; padding: 10px;';
        btn.innerHTML = `${building.name} ${hasRabbit ? '(has rabbit)' : ''}`;
        btn.onclick = () => assignRabbit(rabbitId, building.id);
        container.appendChild(btn);
    });

    // Unassign option
    const unassignBtn = document.createElement('button');
    unassignBtn.className = 'game-btn';
    unassignBtn.style.cssText = 'width: 100%; margin: 5px 0; padding: 10px; background: #666;';
    unassignBtn.textContent = 'Unassign';
    unassignBtn.onclick = () => unassignRabbit(rabbitId);
    container.appendChild(unassignBtn);

    document.getElementById('assign-modal').classList.remove('hidden');
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

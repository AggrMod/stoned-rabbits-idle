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
// GAME STATE
// ============================================
const GameState = {
    magicDust: new BigNumber(0),
    totalEarned: new BigNumber(0),
    prestigeCount: 0,
    lastSaveTime: Date.now(),

    building: {
        name: 'Rabbit Farm',
        level: 1,
        baseCost: 15,
        baseProduction: 1,
        costGrowthFactor: 1.15,      // Balanced: cost grows same rate as production
        productionGrowthFactor: 1.12, // Slightly slower production growth
        accumulatedDust: 0
    }
};

// ============================================
// GAME CALCULATIONS
// ============================================
function getUpgradeCost() {
    const b = GameState.building;
    return new BigNumber(b.baseCost * Math.pow(b.costGrowthFactor, b.level));
}

function getProductionRate() {
    const b = GameState.building;
    return new BigNumber(b.baseProduction * Math.pow(b.productionGrowthFactor, b.level));
}

function canAffordUpgrade() {
    return GameState.magicDust.greaterThanOrEqual(getUpgradeCost());
}

// ============================================
// GAME ACTIONS
// ============================================
function collectDust() {
    const amount = GameState.building.accumulatedDust;
    if (amount <= 0) return;

    GameState.magicDust = GameState.magicDust.add(amount);
    GameState.totalEarned = GameState.totalEarned.add(amount);
    GameState.building.accumulatedDust = 0;

    // Visual feedback
    spawnDustParticle();
    showNumberPop('+' + new BigNumber(amount).format());

    updateUI();
    saveGame();
}

function upgradeBuilding() {
    const cost = getUpgradeCost();
    if (!GameState.magicDust.greaterThanOrEqual(cost)) return;

    GameState.magicDust = GameState.magicDust.subtract(cost);
    GameState.building.level++;

    // Visual feedback
    showNumberPop('Level Up! 🎉');

    updateUI();
    saveGame();
}

function produceDust() {
    const production = getProductionRate().toNumber();
    GameState.building.accumulatedDust += production;
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
        prestigeCount: GameState.prestigeCount,
        buildingLevel: GameState.building.level,
        accumulatedDust: GameState.building.accumulatedDust,
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
        GameState.prestigeCount = data.prestigeCount || 0;
        GameState.building.level = data.buildingLevel || 1;
        GameState.building.accumulatedDust = data.accumulatedDust || 0;
        GameState.lastSaveTime = data.lastSaveTime || Date.now();

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
        const productionRate = getProductionRate().toNumber();
        const offlineEarnings = productionRate * cappedSeconds;

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
    hideOfflineModal();
    updateUI();
    saveGame();
}

function resetGame() {
    if (!confirm('Are you sure you want to reset ALL progress? This cannot be undone!')) {
        return;
    }

    // Clear save data
    localStorage.removeItem(SAVE_KEY);

    // Reset game state
    GameState.magicDust = new BigNumber(0);
    GameState.totalEarned = new BigNumber(0);
    GameState.prestigeCount = 0;
    GameState.building.level = 1;
    GameState.building.accumulatedDust = 0;
    GameState.lastSaveTime = Date.now();

    // Update UI
    updateUI();
    showNumberPop('Progress Reset!');

    console.log('🐰 Game reset complete');
}

// ============================================
// UI UPDATES
// ============================================
function updateUI() {
    // Currency
    document.getElementById('dust-value').textContent = GameState.magicDust.format();
    document.getElementById('rate-value').textContent = getProductionRate().format();

    // Building
    document.getElementById('building-level').textContent = GameState.building.level;
    document.getElementById('building-production').textContent = getProductionRate().format();
    document.getElementById('accumulated-dust').textContent = new BigNumber(GameState.building.accumulatedDust).format();

    // Upgrade button
    const upgradeCost = getUpgradeCost();
    document.getElementById('upgrade-cost').textContent = upgradeCost.format();
    document.getElementById('upgrade-btn').disabled = !canAffordUpgrade();

    // Stats
    document.getElementById('total-earned').textContent = GameState.totalEarned.format();
    document.getElementById('prestige-count').textContent = GameState.prestigeCount;
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
        produceDust();
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
    document.getElementById('collect-btn').onclick = collectDust;
    document.getElementById('upgrade-btn').onclick = upgradeBuilding;
    document.getElementById('reset-btn').onclick = resetGame;

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

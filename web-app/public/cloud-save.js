/**
 * Stoned Rabbits: Cloud Save System
 * Uses Firebase Auth + Firestore for cross-device save sync
 */

// Firebase configuration for stoned-rabbits-game project
const FIREBASE_CONFIG = {
    apiKey: "AIzaSyBnur_FlpzJSLhkZIguMrLT7AePPvOHqt8",
    authDomain: "stoned-rabbits-game.firebaseapp.com",
    projectId: "stoned-rabbits-game",
    storageBucket: "stoned-rabbits-game.firebasestorage.app",
    messagingSenderId: "191676316860",
    appId: "1:191676316860:web:c1a6cfc7eac36286a324b9"
};

// Cloud save state
const CloudSave = {
    app: null,
    auth: null,
    db: null,
    user: null,
    syncStatus: 'offline', // 'offline', 'syncing', 'synced', 'error'
    lastSync: null,
    initialized: false
};

// Initialize Firebase (using CDN modules)
async function initCloudSave() {
    if (CloudSave.initialized) return;

    try {
        // Import Firebase modules from CDN
        const { initializeApp } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js');
        const { getAuth, signInWithPopup, GoogleAuthProvider, signOut, onAuthStateChanged } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js');
        const { getFirestore, doc, getDoc, setDoc, serverTimestamp } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');

        // Initialize Firebase app
        CloudSave.app = initializeApp(FIREBASE_CONFIG);
        CloudSave.auth = getAuth(CloudSave.app);
        CloudSave.db = getFirestore(CloudSave.app);

        // Store module references for later use
        CloudSave.modules = {
            signInWithPopup,
            GoogleAuthProvider,
            signOut,
            doc,
            getDoc,
            setDoc,
            serverTimestamp
        };

        // Listen for auth state changes
        onAuthStateChanged(CloudSave.auth, async (user) => {
            CloudSave.user = user;
            updateCloudSaveUI();

            if (user) {
                console.log('[CloudSave] User signed in:', user.email);
                // Offer to load cloud save or upload local
                await checkCloudSave();
            } else {
                console.log('[CloudSave] User signed out');
                CloudSave.syncStatus = 'offline';
            }
            updateCloudSaveUI();
        });

        CloudSave.initialized = true;
        console.log('[CloudSave] Firebase initialized');
        updateCloudSaveUI();

    } catch (error) {
        console.error('[CloudSave] Failed to initialize:', error);
        CloudSave.syncStatus = 'error';
        updateCloudSaveUI();
    }
}

// Sign in with Google
async function cloudSignIn() {
    if (!CloudSave.initialized) {
        await initCloudSave();
    }

    try {
        const { signInWithPopup, GoogleAuthProvider } = CloudSave.modules;
        const provider = new GoogleAuthProvider();
        await signInWithPopup(CloudSave.auth, provider);
    } catch (error) {
        console.error('[CloudSave] Sign in error:', error);
        alert('Sign in failed: ' + error.message);
    }
}

// Sign out
async function cloudSignOut() {
    if (!CloudSave.auth) return;

    try {
        const { signOut } = CloudSave.modules;
        await signOut(CloudSave.auth);
        CloudSave.syncStatus = 'offline';
        updateCloudSaveUI();
    } catch (error) {
        console.error('[CloudSave] Sign out error:', error);
    }
}

// Check if cloud save exists and compare with local
async function checkCloudSave() {
    if (!CloudSave.user || !CloudSave.db) return;

    try {
        const { doc, getDoc } = CloudSave.modules;
        const saveRef = doc(CloudSave.db, 'saves', CloudSave.user.uid);
        const saveSnap = await getDoc(saveRef);

        if (saveSnap.exists()) {
            const cloudData = saveSnap.data();
            const localData = localStorage.getItem('stonedRabbitsGameState');
            const localState = localData ? JSON.parse(localData) : null;

            // Compare timestamps
            const cloudTime = cloudData.lastSaved?.toDate?.() || new Date(0);
            const localTime = localState?.lastSaved ? new Date(localState.lastSaved) : new Date(0);

            if (cloudTime > localTime) {
                // Cloud save is newer - ask user
                showCloudSaveConflict(cloudData, localState, cloudTime, localTime);
            } else if (localTime > cloudTime) {
                // Local save is newer - auto upload
                await uploadSave();
            } else {
                CloudSave.syncStatus = 'synced';
                CloudSave.lastSync = new Date();
            }
        } else {
            // No cloud save exists - upload local
            await uploadSave();
        }
    } catch (error) {
        console.error('[CloudSave] Check error:', error);
        CloudSave.syncStatus = 'error';
    }

    updateCloudSaveUI();
}

// Upload local save to cloud
async function uploadSave() {
    if (!CloudSave.user || !CloudSave.db) return false;

    try {
        CloudSave.syncStatus = 'syncing';
        updateCloudSaveUI();

        const { doc, setDoc, serverTimestamp } = CloudSave.modules;

        // Get current game state
        const gameState = getGameStateForCloud();

        const saveRef = doc(CloudSave.db, 'saves', CloudSave.user.uid);
        await setDoc(saveRef, {
            ...gameState,
            lastSaved: serverTimestamp(),
            email: CloudSave.user.email
        });

        CloudSave.syncStatus = 'synced';
        CloudSave.lastSync = new Date();
        console.log('[CloudSave] Save uploaded successfully');

        return true;
    } catch (error) {
        console.error('[CloudSave] Upload error:', error);
        CloudSave.syncStatus = 'error';
        return false;
    } finally {
        updateCloudSaveUI();
    }
}

// Download cloud save to local
async function downloadSave() {
    if (!CloudSave.user || !CloudSave.db) return false;

    try {
        CloudSave.syncStatus = 'syncing';
        updateCloudSaveUI();

        const { doc, getDoc } = CloudSave.modules;
        const saveRef = doc(CloudSave.db, 'saves', CloudSave.user.uid);
        const saveSnap = await getDoc(saveRef);

        if (saveSnap.exists()) {
            const cloudData = saveSnap.data();
            loadGameStateFromCloud(cloudData);

            CloudSave.syncStatus = 'synced';
            CloudSave.lastSync = new Date();
            console.log('[CloudSave] Save downloaded successfully');

            return true;
        }

        return false;
    } catch (error) {
        console.error('[CloudSave] Download error:', error);
        CloudSave.syncStatus = 'error';
        return false;
    } finally {
        updateCloudSaveUI();
    }
}

// Get game state formatted for cloud storage
function getGameStateForCloud() {
    // Access the global GameState from game.js
    if (typeof GameState === 'undefined') {
        console.error('[CloudSave] GameState not found');
        return {};
    }

    return {
        dust: GameState.dust,
        totalEarned: GameState.totalEarned,
        lifetimeDust: GameState.lifetimeDust,
        buildings: GameState.buildings,
        rabbits: GameState.rabbits,
        burrowTokens: GameState.burrowTokens,
        prestigeCount: GameState.prestigeCount,
        talents: GameState.talents || {},
        spentTokens: GameState.spentTokens || 0,
        boostEndTime: GameState.boostEndTime,
        boostMultiplier: GameState.boostMultiplier,
        wheelCooldownEnd: GameState.wheelCooldownEnd,
        flipCooldownEnd: GameState.flipCooldownEnd,
        rumbleCooldownEnd: GameState.rumbleCooldownEnd,
        expeditionEndTime: GameState.expeditionEndTime,
        expeditionType: GameState.expeditionType
    };
}

// Load game state from cloud data
function loadGameStateFromCloud(cloudData) {
    if (typeof GameState === 'undefined') {
        console.error('[CloudSave] GameState not found');
        return;
    }

    // Update GameState
    GameState.dust = cloudData.dust || 0;
    GameState.totalEarned = cloudData.totalEarned || 0;
    GameState.lifetimeDust = cloudData.lifetimeDust || 0;
    GameState.buildings = cloudData.buildings || GameState.buildings;
    GameState.rabbits = cloudData.rabbits || [];
    GameState.burrowTokens = cloudData.burrowTokens || 0;
    GameState.prestigeCount = cloudData.prestigeCount || 0;
    GameState.talents = cloudData.talents || {};
    GameState.spentTokens = cloudData.spentTokens || 0;
    GameState.boostEndTime = cloudData.boostEndTime || 0;
    GameState.boostMultiplier = cloudData.boostMultiplier || 1;
    GameState.wheelCooldownEnd = cloudData.wheelCooldownEnd || 0;
    GameState.flipCooldownEnd = cloudData.flipCooldownEnd || 0;
    GameState.rumbleCooldownEnd = cloudData.rumbleCooldownEnd || 0;
    GameState.expeditionEndTime = cloudData.expeditionEndTime || 0;
    GameState.expeditionType = cloudData.expeditionType || null;

    // Save to localStorage and refresh UI
    if (typeof saveGame === 'function') saveGame();
    if (typeof renderBuildings === 'function') renderBuildings();
    if (typeof updateDisplay === 'function') updateDisplay();

    console.log('[CloudSave] Game state loaded from cloud');
}

// Show conflict resolution modal
function showCloudSaveConflict(cloudData, localData, cloudTime, localTime) {
    const modal = document.getElementById('cloud-conflict-modal');
    if (!modal) return;

    document.getElementById('cloud-save-time').textContent = cloudTime.toLocaleString();
    document.getElementById('local-save-time').textContent = localTime.toLocaleString();
    document.getElementById('cloud-save-dust').textContent = formatNumber(cloudData.dust || 0);
    document.getElementById('local-save-dust').textContent = formatNumber(localData?.dust || 0);

    modal.classList.remove('hidden');
}

function hideCloudConflict() {
    const modal = document.getElementById('cloud-conflict-modal');
    if (modal) modal.classList.add('hidden');
}

async function useCloudSave() {
    hideCloudConflict();
    await downloadSave();
}

async function useLocalSave() {
    hideCloudConflict();
    await uploadSave();
}

// Update cloud save UI elements
function updateCloudSaveUI() {
    const statusEl = document.getElementById('cloud-status');
    const userEl = document.getElementById('cloud-user');
    const signInBtn = document.getElementById('cloud-signin-btn');
    const signOutBtn = document.getElementById('cloud-signout-btn');
    const syncBtn = document.getElementById('cloud-sync-btn');

    if (!statusEl) return; // UI not loaded yet

    // Update status indicator
    const statusIcons = {
        'offline': '☁️',
        'syncing': '🔄',
        'synced': '✅',
        'error': '❌'
    };

    statusEl.textContent = statusIcons[CloudSave.syncStatus] || '☁️';
    statusEl.title = CloudSave.syncStatus === 'synced'
        ? `Last synced: ${CloudSave.lastSync?.toLocaleTimeString() || 'Never'}`
        : CloudSave.syncStatus;

    // Update user display
    if (CloudSave.user) {
        userEl.textContent = CloudSave.user.email?.split('@')[0] || 'User';
        signInBtn.classList.add('hidden');
        signOutBtn.classList.remove('hidden');
        syncBtn.classList.remove('hidden');
    } else {
        userEl.textContent = 'Not signed in';
        signInBtn.classList.remove('hidden');
        signOutBtn.classList.add('hidden');
        syncBtn.classList.add('hidden');
    }
}

// Auto-sync every 5 minutes when signed in
setInterval(() => {
    if (CloudSave.user && CloudSave.syncStatus !== 'syncing') {
        uploadSave();
    }
}, 5 * 60 * 1000);

// Sync before page unload
window.addEventListener('beforeunload', () => {
    if (CloudSave.user) {
        // Use sendBeacon for reliable sync on close
        const gameState = getGameStateForCloud();
        navigator.sendBeacon && navigator.sendBeacon('/sync', JSON.stringify(gameState));
    }
});

// Format number helper (use game.js version if available)
function formatNumber(num) {
    if (typeof BigNumber !== 'undefined' && BigNumber.format) {
        return BigNumber.format(num);
    }
    return num.toLocaleString();
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    // Delay init to let game.js load first
    setTimeout(initCloudSave, 2000);
});

// Export for use in game.js
window.CloudSave = CloudSave;
window.cloudSignIn = cloudSignIn;
window.cloudSignOut = cloudSignOut;
window.uploadSave = uploadSave;
window.downloadSave = downloadSave;
window.useCloudSave = useCloudSave;
window.useLocalSave = useLocalSave;
window.hideCloudConflict = hideCloudConflict;

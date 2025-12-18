/**
 * Stoned Rabbits NFT Integration
 * Connects to Magic Eden API to fetch real NFT data
 */

const NFT_CONFIG = {
    collection: 'stonned_rabitts',
    apiBase: 'https://api-mainnet.magiceden.dev/v2',
    corsProxy: 'https://corsproxy.io/?', // CORS proxy used by main site
    marketplaceUrl: 'https://magiceden.us/marketplace/stonned_rabitts',
    totalSupply: 3333,
    cachedNFTs: [],
    lastFetch: 0,
    cacheDuration: 5 * 60 * 1000 // 5 minutes
};

// Rarity based on rank (lower rank = rarer)
const RARITY_THRESHOLDS = {
    mythic: { maxRank: 99, name: 'Mythic', color: '#e74c3c', multiplier: 2.00, dropRate: 1 },
    legendary: { maxRank: 499, name: 'Legendary', color: '#f39c12', multiplier: 1.50, dropRate: 4 },
    epic: { maxRank: 999, name: 'Epic', color: '#9b59b6', multiplier: 1.25, dropRate: 10 },
    rare: { maxRank: 1999, name: 'Rare', color: '#3498db', multiplier: 1.10, dropRate: 25 },
    common: { maxRank: 3333, name: 'Common', color: '#888888', multiplier: 1.00, dropRate: 60 }
};

// Fetch NFT listings from Magic Eden via CORS proxy
async function fetchNFTListings(limit = 100) {
    const now = Date.now();

    // Return cached data if still valid
    if (NFT_CONFIG.cachedNFTs.length > 0 && (now - NFT_CONFIG.lastFetch) < NFT_CONFIG.cacheDuration) {
        console.log('[NFT] Using cached data');
        return NFT_CONFIG.cachedNFTs;
    }

    try {
        console.log('[NFT] Fetching from Magic Eden API via CORS proxy...');
        const apiUrl = `${NFT_CONFIG.apiBase}/collections/${NFT_CONFIG.collection}/listings?offset=0&limit=${limit}`;
        const proxyUrl = `${NFT_CONFIG.corsProxy}${encodeURIComponent(apiUrl)}`;

        const response = await fetch(proxyUrl);

        if (!response.ok) throw new Error(`HTTP ${response.status}`);

        const data = await response.json();
        NFT_CONFIG.cachedNFTs = data;
        NFT_CONFIG.lastFetch = now;
        console.log(`[NFT] Loaded ${data.length} NFT listings`);
        return data;
    } catch (error) {
        console.error('[NFT] Failed to fetch listings:', error);
        return NFT_CONFIG.cachedNFTs;
    }
}

// Get rarity info from rank
function getRarityFromRank(rank) {
    if (rank <= RARITY_THRESHOLDS.mythic.maxRank) return { key: 'mythic', ...RARITY_THRESHOLDS.mythic };
    if (rank <= RARITY_THRESHOLDS.legendary.maxRank) return { key: 'legendary', ...RARITY_THRESHOLDS.legendary };
    if (rank <= RARITY_THRESHOLDS.epic.maxRank) return { key: 'epic', ...RARITY_THRESHOLDS.epic };
    if (rank <= RARITY_THRESHOLDS.rare.maxRank) return { key: 'rare', ...RARITY_THRESHOLDS.rare };
    return { key: 'common', ...RARITY_THRESHOLDS.common };
}

// Get a random NFT based on rarity weights
async function getRandomNFT() {
    const listings = await fetchNFTListings();

    if (listings.length === 0) {
        console.log('[NFT] No listings, using fallback');
        return generateFallbackRabbit();
    }

    // Roll for rarity
    const roll = Math.random() * 100;
    let targetRank;

    if (roll < 1) {
        // 1% Mythic (rank 1-99)
        targetRank = Math.floor(Math.random() * 99) + 1;
    } else if (roll < 5) {
        // 4% Legendary (rank 100-499)
        targetRank = Math.floor(Math.random() * 400) + 100;
    } else if (roll < 15) {
        // 10% Epic (rank 500-999)
        targetRank = Math.floor(Math.random() * 500) + 500;
    } else if (roll < 40) {
        // 25% Rare (rank 1000-1999)
        targetRank = Math.floor(Math.random() * 1000) + 1000;
    } else {
        // 60% Common (rank 2000-3333)
        targetRank = Math.floor(Math.random() * 1334) + 2000;
    }

    // Find closest NFT to target rank
    let closestNFT = listings[0];
    let closestDiff = Math.abs((listings[0].extra?.rank || 2000) - targetRank);

    for (const nft of listings) {
        const rank = nft.extra?.rank || 2000;
        const diff = Math.abs(rank - targetRank);
        if (diff < closestDiff) {
            closestDiff = diff;
            closestNFT = nft;
        }
    }

    const rank = closestNFT.extra?.rank || 2000;
    const rarity = getRarityFromRank(rank);

    // Extract attributes
    const attributes = closestNFT.extra?.attributes || [];
    const attributeMap = {};
    attributes.forEach(attr => {
        attributeMap[attr.trait_type] = attr.value;
    });

    return {
        id: closestNFT.tokenMint,
        name: closestNFT.extra?.name || `Stoned Rabbit #${rank}`,
        image: closestNFT.extra?.img || 'rabbit-captain.jpg',
        rank: rank,
        rarity: rarity,
        price: closestNFT.price / 1e9, // Convert lamports to SOL
        attributes: attributeMap,
        magicEdenUrl: `https://magiceden.us/item-details/${closestNFT.tokenMint}`,
        isReal: true
    };
}

// Fallback when API fails
function generateFallbackRabbit() {
    const roll = Math.random() * 100;
    let rarityKey;

    if (roll < 1) rarityKey = 'mythic';
    else if (roll < 5) rarityKey = 'legendary';
    else if (roll < 15) rarityKey = 'epic';
    else if (roll < 40) rarityKey = 'rare';
    else rarityKey = 'common';

    const rarity = { key: rarityKey, ...RARITY_THRESHOLDS[rarityKey] };
    const rabbitNum = Math.floor(Math.random() * 3333) + 1;

    return {
        id: `local-${Date.now()}`,
        name: `Stoned Rabbit #${rabbitNum}`,
        image: 'rabbit-captain.jpg',
        rank: rabbitNum,
        rarity: rarity,
        price: null,
        attributes: {
            'Background': ['Solar Bite', 'Cool Dive', 'Sunbeam Pop', 'Purple Haze'][Math.floor(Math.random() * 4)],
            'Ears': ['Rocket Red', 'Cream Cloud', 'Starberry Pop', 'Blue Blaze'][Math.floor(Math.random() * 4)],
            'Top': ['Red Plaid Rebel', 'Blue Blazer', 'Green Hoodie', 'Gold Chain'][Math.floor(Math.random() * 4)],
            'Eyes': ['Chill Shades', 'Star Eyes', 'Laser Red', 'Classic'][Math.floor(Math.random() * 4)]
        },
        magicEdenUrl: NFT_CONFIG.marketplaceUrl,
        isReal: false
    };
}

// Show crate opening modal with NFT reveal
async function openCrate() {
    const modal = document.getElementById('crate-modal');
    const resultDiv = document.getElementById('crate-result');
    const crateBox = document.querySelector('.crate-box');

    if (!modal) {
        console.error('[NFT] Crate modal not found');
        return null;
    }

    // Show modal with closed crate
    modal.classList.remove('hidden');
    resultDiv.innerHTML = '<div class="crate-loading">Opening crate...</div>';
    crateBox?.classList.add('shaking');

    // Fetch random NFT
    const nft = await getRandomNFT();

    // Dramatic reveal after delay
    setTimeout(() => {
        crateBox?.classList.remove('shaking');
        crateBox?.classList.add('opened');

        resultDiv.innerHTML = `
            <div class="nft-reveal" style="animation: nftReveal 0.5s ease-out;">
                <div class="nft-image-container" style="border-color: ${nft.rarity.color};">
                    <img src="${nft.image}" alt="${nft.name}" class="nft-image"
                         onerror="this.src='rabbit-captain.jpg'">
                    <div class="rarity-badge" style="background: ${nft.rarity.color};">
                        ${nft.rarity.name}
                    </div>
                </div>
                <h3 class="nft-name" style="color: ${nft.rarity.color};">${nft.name}</h3>
                <div class="nft-rank">Rank #${nft.rank} / 3,333</div>
                ${nft.price ? `<div class="nft-price">${nft.price.toFixed(3)} SOL</div>` : ''}
                <div class="nft-attributes">
                    ${Object.entries(nft.attributes).map(([trait, value]) =>
                        `<span class="attribute">${trait}: ${value}</span>`
                    ).join('')}
                </div>
                <div class="nft-multiplier">Production Boost: ${nft.rarity.multiplier}x</div>
                <div class="nft-actions">
                    <a href="${nft.magicEdenUrl}" target="_blank" class="btn-magic-eden">
                        View on Magic Eden
                    </a>
                    <button onclick="closeCrateModal()" class="btn-close-crate">
                        Add to Collection
                    </button>
                </div>
            </div>
        `;
    }, 1500);

    return nft;
}

// Close crate modal
function closeCrateModal() {
    const modal = document.getElementById('crate-modal');
    const crateBox = document.querySelector('.crate-box');
    if (modal) modal.classList.add('hidden');
    if (crateBox) crateBox.classList.remove('opened', 'shaking');
}

// Pre-fetch NFTs on page load
document.addEventListener('DOMContentLoaded', () => {
    fetchNFTListings().then(data => {
        console.log(`[NFT] Pre-loaded ${data.length} NFT listings for crate system`);
    });
});

// Export for use in main game
window.NFT = {
    fetchListings: fetchNFTListings,
    getRandomNFT: getRandomNFT,
    openCrate: openCrate,
    closeCrateModal: closeCrateModal,
    getRarityFromRank: getRarityFromRank,
    config: NFT_CONFIG,
    rarities: RARITY_THRESHOLDS
};

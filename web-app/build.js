const fs = require('fs');
const path = require('path');
const { minify } = require('terser');
const CleanCSS = require('clean-css');

console.log('🏗️  Building optimized production files...\n');

// Ensure dist directory exists
const distDir = path.join(__dirname, 'dist');
if (!fs.existsSync(distDir)) {
    fs.mkdirSync(distDir);
}

// Minify JavaScript
async function buildJS() {
    console.log('📦 Minifying JavaScript...');
    const code = fs.readFileSync(path.join(__dirname, 'public', 'game.js'), 'utf8');

    const result = await minify(code, {
        compress: {
            dead_code: true,
            drop_console: false, // Keep console for debugging
            passes: 2
        },
        mangle: {
            reserved: ['GameState', 'BigNumber'] // Keep important globals
        },
        format: {
            comments: false
        }
    });

    if (result.error) {
        console.error('❌ JavaScript minification failed:', result.error);
        return false;
    }

    fs.writeFileSync(path.join(distDir, 'game.min.js'), result.code);
    const originalSize = (code.length / 1024).toFixed(2);
    const minifiedSize = (result.code.length / 1024).toFixed(2);
    const savings = ((1 - result.code.length / code.length) * 100).toFixed(1);

    console.log(`   Original: ${originalSize} KB`);
    console.log(`   Minified: ${minifiedSize} KB`);
    console.log(`   Savings:  ${savings}%\n`);
    return true;
}

// Minify CSS
function buildCSS() {
    console.log('🎨 Minifying CSS...');
    const css = fs.readFileSync(path.join(__dirname, 'public', 'styles.css'), 'utf8');

    const output = new CleanCSS({
        level: 2 // Advanced optimizations
    }).minify(css);

    if (output.errors.length > 0) {
        console.error('❌ CSS minification failed:', output.errors);
        return false;
    }

    fs.writeFileSync(path.join(distDir, 'styles.min.css'), output.styles);
    const originalSize = (css.length / 1024).toFixed(2);
    const minifiedSize = (output.styles.length / 1024).toFixed(2);
    const savings = ((1 - output.styles.length / css.length) * 100).toFixed(1);

    console.log(`   Original: ${originalSize} KB`);
    console.log(`   Minified: ${minifiedSize} KB`);
    console.log(`   Savings:  ${savings}%\n`);
    return true;
}

// Process HTML
function buildHTML() {
    console.log('📄 Processing HTML...');
    let html = fs.readFileSync(path.join(__dirname, 'public', 'index.html'), 'utf8');

    // Update references to minified files
    html = html.replace('game.js', 'game.min.js');
    html = html.replace('styles.css', 'styles.min.css');

    // Add performance meta tags if not present
    if (!html.includes('theme-color')) {
        const metaTags = `    <meta name="theme-color" content="#1a1a2e">
    <meta name="description" content="Stoned Rabbits: Idle Empire - A fun idle clicker game">`;
        html = html.replace('</head>', `${metaTags}\n    </head>`);
    }

    fs.writeFileSync(path.join(distDir, 'index.html'), html);
    console.log('   ✓ HTML updated\n');
    return true;
}

// Copy assets (images, sounds)
function copyAssets() {
    console.log('📂 Copying assets...');

    const publicDir = path.join(__dirname, 'public');
    const assets = ['sounds'];
    const imageExtensions = ['.png', '.jpg', '.jpeg', '.gif', '.webp'];

    // Copy image files from public root
    const files = fs.readdirSync(publicDir);
    let copiedCount = 0;

    files.forEach(file => {
        const ext = path.extname(file).toLowerCase();
        if (imageExtensions.includes(ext)) {
            fs.copyFileSync(
                path.join(publicDir, file),
                path.join(distDir, file)
            );
            copiedCount++;
        }
    });

    // Copy sounds folder if exists
    assets.forEach(asset => {
        const assetPath = path.join(publicDir, asset);
        if (fs.existsSync(assetPath)) {
            const destPath = path.join(distDir, asset);
            if (!fs.existsSync(destPath)) {
                fs.mkdirSync(destPath, { recursive: true });
            }
            // Copy would go here if we had audio files
        }
    });

    console.log(`   ✓ Copied ${copiedCount} asset files\n`);
    return true;
}

// Main build process
async function build() {
    const startTime = Date.now();

    try {
        const jsSuccess = await buildJS();
        const cssSuccess = buildCSS();
        const htmlSuccess = buildHTML();
        const assetsSuccess = copyAssets();

        if (jsSuccess && cssSuccess && htmlSuccess && assetsSuccess) {
            const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
            console.log(`✅ Build complete in ${elapsed}s!`);
            console.log(`📁 Output: ${distDir}\n`);
            console.log('🚀 Ready for deployment!\n');
        } else {
            console.error('❌ Build failed with errors');
            process.exit(1);
        }
    } catch (error) {
        console.error('❌ Build error:', error);
        process.exit(1);
    }
}

// Run build
build();

// ===========================
// STATE MANAGEMENT
// ===========================

const state = {
    project: {
        siteName: 'My Presentation',
        baseUrl: '',
        font: 'Geist'
    },
    pages: [
        { id: 1, name: 'Home', slug: 'index', imageName: 'index.jpg', title: 'Home', metaDesc: '' },
        { id: 2, name: 'About', slug: 'about', imageName: 'about.jpg', title: 'About', metaDesc: '' },
        { id: 3, name: 'Contact', slug: 'contact', imageName: 'contact.jpg', title: 'Contact', metaDesc: '' }
    ],
    menu: {
        position: 'fixed',
        style: 'pills',
        autoHide: true,
        backToTop: true,
        fontSize: 12,
        color: '#666666'
    },
    colors: {
        primary: '#347419',
        secondary: '#0dac76',
        bg: '#ffffff'
    },
    currentPageId: null,
    currentFile: 'index.php'
};

let nextPageId = 4;

// ===========================
// INITIALIZATION
// ===========================

document.addEventListener('DOMContentLoaded', () => {
    initializeApp();
    attachEventListeners();
    renderPages();
    updatePageSelector();
});

function initializeApp() {
    // Load from localStorage if available
    const saved = localStorage.getItem('templateCreatorState');
    if (saved) {
        try {
            const savedState = JSON.parse(saved);
            Object.assign(state, savedState);
            nextPageId = Math.max(...state.pages.map(p => p.id)) + 1;

            // Ensure all required properties exist with defaults
            if (!state.menu.color) state.menu.color = '#666666';
            if (!state.menu.fontSize) state.menu.fontSize = 12;
            if (!state.colors.primary) state.colors.primary = '#347419';
            if (!state.colors.secondary) state.colors.secondary = '#0dac76';
            if (!state.colors.bg) state.colors.bg = '#ffffff';

            // Update form values
            document.getElementById('siteName').value = state.project.siteName;
            document.getElementById('baseUrl').value = state.project.baseUrl;
            document.getElementById('defaultFont').value = state.project.font;
            document.getElementById('menuPosition').value = state.menu.position;
            document.getElementById('menuStyle').value = state.menu.style;
            document.getElementById('autoHideMenu').checked = state.menu.autoHide;
            document.getElementById('backToTop').checked = state.menu.backToTop;
            document.getElementById('menuFontSize').value = state.menu.fontSize;
            document.getElementById('menuColor').value = state.menu.color;
            document.getElementById('primaryColor').value = state.colors.primary;
            document.getElementById('secondaryColor').value = state.colors.secondary;
            document.getElementById('bgColor').value = state.colors.bg;
        } catch (e) {
            console.error('Failed to load saved state:', e);
        }
    }
}

function saveState() {
    localStorage.setItem('templateCreatorState', JSON.stringify(state));
}

// ===========================
// EVENT LISTENERS
// ===========================

function attachEventListeners() {
    // Project settings
    document.getElementById('siteName').addEventListener('input', (e) => {
        state.project.siteName = e.target.value;
        saveState();
    });

    document.getElementById('baseUrl').addEventListener('input', (e) => {
        state.project.baseUrl = e.target.value;
        saveState();
    });

    document.getElementById('defaultFont').addEventListener('change', (e) => {
        state.project.font = e.target.value;
        saveState();
        updatePreview();
    });

    // Menu settings
    document.getElementById('menuPosition').addEventListener('change', (e) => {
        state.menu.position = e.target.value;
        saveState();
        updatePreview();
    });

    document.getElementById('menuStyle').addEventListener('change', (e) => {
        state.menu.style = e.target.value;
        saveState();
        updatePreview();
    });

    document.getElementById('autoHideMenu').addEventListener('change', (e) => {
        state.menu.autoHide = e.target.checked;
        saveState();
        updatePreview();
    });

    document.getElementById('backToTop').addEventListener('change', (e) => {
        state.menu.backToTop = e.target.checked;
        saveState();
        updatePreview();
    });

    // Menu font size
    document.getElementById('menuFontSize').addEventListener('input', (e) => {
        state.menu.fontSize = parseInt(e.target.value);
        document.getElementById('fontSizeValue').textContent = e.target.value + 'px';
        saveState();
        updatePreview();
    });

    // Menu color
    document.getElementById('menuColor').addEventListener('input', (e) => {
        state.menu.color = e.target.value;
        saveState();
        updatePreview();
    });

    // Colors
    ['primaryColor', 'secondaryColor', 'bgColor'].forEach(id => {
        document.getElementById(id).addEventListener('input', (e) => {
            const key = id.replace('Color', '');
            state.colors[key] = e.target.value;
            saveState();
            updatePreview();
        });
    });

    // Page management
    document.getElementById('addPageBtn').addEventListener('click', openAddPageModal);
    document.getElementById('closeModal').addEventListener('click', closeAddPageModal);
    document.getElementById('cancelAddPage').addEventListener('click', closeAddPageModal);
    document.getElementById('confirmAddPage').addEventListener('click', addPage);

    // Page selector
    document.getElementById('pageSelector').addEventListener('change', (e) => {
        const pageId = parseInt(e.target.value);
        if (pageId) {
            selectPage(pageId);
        }
    });

    // Generate button
    document.getElementById('generateBtn').addEventListener('click', generateAllCode);

    // Export buttons
    document.getElementById('copyCodeBtn').addEventListener('click', copyCurrentCode);
    document.getElementById('downloadZipBtn').addEventListener('click', downloadZip);

    // Import/Export config
    document.getElementById('importBtn').addEventListener('click', () => {
        document.getElementById('importFileInput').click();
    });

    document.getElementById('importFileInput').addEventListener('change', importConfig);
    document.getElementById('exportConfigBtn').addEventListener('click', exportConfig);

    // Tab switching
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            switchTab(e.target.dataset.tab);
        });
    });

    // Auto-generate slug from page name
    document.getElementById('newPageName').addEventListener('input', (e) => {
        const slug = e.target.value.toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-|-$/g, '');
        document.getElementById('newPageSlug').value = slug;
    });

    // Mobile menu toggle
    document.getElementById('menuToggle').addEventListener('click', () => {
        const sidebar = document.querySelector('.sidebar');
        sidebar.classList.toggle('open');
    });

    // Close sidebar when clicking outside on mobile
    document.addEventListener('click', (e) => {
        const sidebar = document.querySelector('.sidebar');
        const menuToggle = document.getElementById('menuToggle');
        if (sidebar.classList.contains('open') &&
            !sidebar.contains(e.target) &&
            !menuToggle.contains(e.target)) {
            sidebar.classList.remove('open');
        }
    });
}

// ===========================
// PAGE MANAGEMENT
// ===========================

function renderPages() {
    const pagesList = document.getElementById('pagesList');
    pagesList.innerHTML = '';

    state.pages.forEach(page => {
        const pageItem = document.createElement('div');
        pageItem.className = 'page-item';
        if (state.currentPageId === page.id) {
            pageItem.classList.add('active');
        }

        pageItem.innerHTML = `
            <div class="page-info">
                <div class="page-name">${page.name}</div>
                <div class="page-slug">${page.slug}.php</div>
            </div>
            <div class="page-actions">
                <button class="edit-btn" onclick="selectPage(${page.id})" title="Edit">✏️</button>
                <button class="delete-btn" onclick="deletePage(${page.id})" title="Delete">🗑️</button>
            </div>
        `;

        pagesList.appendChild(pageItem);
    });
}

function updatePageSelector() {
    const selector = document.getElementById('pageSelector');
    selector.innerHTML = '<option value="">Select a page to edit</option>';

    state.pages.forEach(page => {
        const option = document.createElement('option');
        option.value = page.id;
        option.textContent = page.name;
        if (state.currentPageId === page.id) {
            option.selected = true;
        }
        selector.appendChild(option);
    });
}

function selectPage(pageId) {
    state.currentPageId = pageId;
    const page = state.pages.find(p => p.id === pageId);

    if (!page) return;

    const editorBody = document.getElementById('editorBody');
    editorBody.innerHTML = `
        <div class="editor-form">
            <div class="form-group">
                <label for="pageTitle">Page Title</label>
                <input type="text" id="pageTitle" value="${page.title || page.name}" placeholder="Page Title">
            </div>
            <div class="form-group">
                <label for="pageMetaDesc">Meta Description</label>
                <input type="text" id="pageMetaDesc" value="${page.metaDesc || ''}" placeholder="Brief description for SEO">
            </div>
            <div class="form-group">
                <label for="pageImageName">Design Image Filename</label>
                <input type="text" id="pageImageName" value="${page.imageName || page.slug + '.jpg'}" placeholder="${page.slug}.jpg">
                <small>Default: ${page.slug}.jpg - The image file should be in the same folder as the PHP files.</small>
            </div>
            <button class="btn btn-primary" onclick="savePage()">Save Changes</button>
        </div>
    `;

    renderPages();
    updatePageSelector();
    updatePreview();
}

function savePage() {
    if (!state.currentPageId) return;

    const page = state.pages.find(p => p.id === state.currentPageId);
    if (!page) return;

    page.title = document.getElementById('pageTitle').value;
    page.metaDesc = document.getElementById('pageMetaDesc').value;
    page.imageName = document.getElementById('pageImageName').value;

    saveState();
    updatePreview();

    // Show feedback
    const btn = event.target;
    const originalText = btn.textContent;
    btn.textContent = '✓ Saved!';
    setTimeout(() => {
        btn.textContent = originalText;
    }, 1500);
}

function openAddPageModal() {
    document.getElementById('addPageModal').classList.add('active');
    document.getElementById('newPageName').value = '';
    document.getElementById('newPageSlug').value = '';
    document.getElementById('newPageName').focus();
}

function closeAddPageModal() {
    document.getElementById('addPageModal').classList.remove('active');
}

function addPage() {
    const name = document.getElementById('newPageName').value.trim();
    const slug = document.getElementById('newPageSlug').value.trim();

    if (!name || !slug) {
        alert('Please enter both page name and slug');
        return;
    }

    // Check for duplicate slug
    if (state.pages.some(p => p.slug === slug)) {
        alert('A page with this slug already exists');
        return;
    }

    const newPage = {
        id: nextPageId++,
        name,
        slug,
        imageName: `${slug}.jpg`,
        title: name,
        metaDesc: ''
    };

    state.pages.push(newPage);
    saveState();
    renderPages();
    updatePageSelector();
    closeAddPageModal();
    selectPage(newPage.id);
}

function deletePage(pageId) {
    if (state.pages.length <= 1) {
        alert('You must have at least one page');
        return;
    }

    if (!confirm('Are you sure you want to delete this page?')) {
        return;
    }

    state.pages = state.pages.filter(p => p.id !== pageId);

    if (state.currentPageId === pageId) {
        state.currentPageId = null;
        document.getElementById('editorBody').innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">📄</div>
                <p>Select a page to start editing</p>
            </div>
        `;
    }

    saveState();
    renderPages();
    updatePageSelector();
}

// ===========================
// PREVIEW
// ===========================

function updatePreview() {
    const iframe = document.getElementById('previewFrame');
    const page = state.pages.find(p => p.id === state.currentPageId) || state.pages[0];

    const previewHTML = generatePreviewHTML(page);

    const blob = new Blob([previewHTML], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    iframe.src = url;
}

function generatePreviewHTML(page) {
    const menuItems = state.pages.map(p => {
        const isActive = p.id === page.id;
        return `<li${isActive ? ' class="active"' : ''}><a href="#">${p.name}</a></li>`;
    }).join('\n        ');

    const backToTopItem = state.menu.backToTop ? '<li><a href="#body" title="Back to Top">↑</a></li>' : '';

    // Use imageName if set, otherwise default to pagename.jpg
    const imageName = page.imageName || `${page.slug}.jpg`;

    // Check if imageName is a full URL (starts with http:// or https://)
    const isExternalUrl = imageName.startsWith('http://') || imageName.startsWith('https://');
    const imageSrc = isExternalUrl ? imageName : `./${imageName}`;

    // Add cache-busting to image
    const cacheBuster = `v=${Date.now()}&r=${Math.random().toString(36).substr(2, 9)}`;

    // Check if single page
    const isSinglePage = state.pages.length === 1;
    const bodyClass = isSinglePage ? ' class="single-page"' : '';

    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${page.title || page.name} | ${state.project.siteName}</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=${state.project.font}:wght@100..900&display=swap" rel="stylesheet">
    <style>${generateCSS()}</style>
</head>
<body id="body"${bodyClass}>
    ${!isSinglePage ? `<button class="hamburger" aria-label="Toggle menu">
        <span></span>
        <span></span>
        <span></span>
    </button>
    <ul id="site-header">
        ${menuItems}
        ${backToTopItem}
    </ul>` : ''}
    <img src="${imageSrc}?${cacheBuster}" alt="${page.name}" style="max-width: 100%; height: auto; ${isSinglePage ? '' : 'padding-top: var(--header-height);'}">
    <a href="#" class="purge-btn" title="Force cache refresh" onclick="event.preventDefault(); location.reload(true);" style="opacity:0">🔄 Force Refresh</a>
    <script>${generateJS()}</script>
</body>
</html>`;
}

// ===========================
// CODE GENERATION
// ===========================

function generateAllCode() {
    const files = {};

    // Generate PHP files for each page
    state.pages.forEach(page => {
        files[`${page.slug}.php`] = generatePHPFile(page);
    });

    // Generate CSS
    files['style.css'] = generateCSS();

    // Generate JS
    files['script.js'] = generateJS();

    // Generate .htaccess
    files['.htaccess'] = generateHTAccess();

    // Store generated files
    state.generatedFiles = files;

    // Update UI
    renderFileTabs();
    displayFile('index.php');
    switchTab('export');

    // Show success message
    const btn = document.getElementById('generateBtn');
    const originalHTML = btn.innerHTML;
    btn.innerHTML = '<span class="icon">✓</span> Generated!';
    setTimeout(() => {
        btn.innerHTML = originalHTML;
    }, 2000);
}

function generatePHPFile(page) {
    const menuItems = state.pages.map(p => {
        const isActive = p.slug === page.slug;
        return `        <li${isActive ? ' class="active"' : ''}><a href="./${p.slug}.php">${p.name}</a></li>`;
    }).join('\n');

    const backToTopItem = state.menu.backToTop ? '        <li><a href="#body" title="Back to Top">↑</a></li>' : '';

    // Use imageName if set, otherwise default to pagename.jpg
    const imageName = page.imageName || `${page.slug}.jpg`;

    return `<?php
// ========================================
// CLOUDFLARE + CPANEL CACHE BUSTING
// ========================================

// 1. BYPASS CLOUDFLARE CACHE with specific headers
header("Cache-Control: no-store, no-cache, must-revalidate, max-age=0, s-maxage=0");
header("Cache-Control: post-check=0, pre-check=0", false);
header("Pragma: no-cache");
header("Expires: Sat, 01 Jan 2000 00:00:00 GMT");
header("Last-Modified: " . gmdate("D, d M Y H:i:s") . " GMT");

// 2. Tell Cloudflare NOT to cache this page
header("CF-Cache-Status: BYPASS");
header("CDN-Cache-Control: no-store");

// 3. ADDITIONAL USEFUL HEADERS:

// Prevent proxy caching
header("Surrogate-Control: no-store");

// ETag removal (prevents conditional requests)
header_remove("ETag");
header("ETag: " . md5(microtime())); // Or remove entirely

// Vary header (tells caches this varies by headers)
header("Vary: *");

// Clear site data (nuclear option - use carefully!)
// header("Clear-Site-Data: \"cache\", \"storage\"");

// X-Accel-Expires for Nginx reverse proxy
header("X-Accel-Expires: 0");

// Prevent transformation by proxies
header("Cache-Control: no-transform");

// Cloudflare-specific: bypass edge cache
header("Cloudflare-CDN-Cache-Control: no-cache");

// Additional browser cache prevention
header("Cache-Control: private, no-cache, no-store, must-revalidate, max-age=0, s-maxage=0, proxy-revalidate");

// Prevent IE-specific caching
header("X-UA-Compatible: IE=edge");

// Generate cache-busting parameters
$timestamp = time();
$microtime = microtime(true);
$random = mt_rand(100000, 999999);

// Get file modification time
$imagePath = '${imageName}';
$fileTime = file_exists($imagePath) ? filemtime($imagePath) : $timestamp;

// 3. CLOUDFLARE TRICK: Add cache purge parameter
// When you want to force refresh, add ?purge=1 to URL
$forcePurge = isset($_GET['purge']) ? '&purge=' . $random : '';

// Combine all cache-busting parameters
$cacheBuster = "v={$timestamp}&t={$microtime}&r={$random}&m={$fileTime}{$forcePurge}";
?>
<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="Cache-Control" content="no-cache, no-store, must-revalidate">
    <meta http-equiv="Pragma" content="no-cache">
    <meta http-equiv="Expires" content="0">
    <title>${page.title || page.name} | ${state.project.siteName}</title>${page.metaDesc ? `\n    <meta name="description" content="${page.metaDesc}">` : ''}
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=${state.project.font}:wght@100..900&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="./style.css?<?php echo $cacheBuster; ?>">
    
    <script>
        // JavaScript cache-busting
        window.addEventListener('load', function() {
            var img = document.querySelector('img');
            if (img) {
                // Add additional random parameter via JS
                var currentSrc = img.src;
                if (currentSrc.indexOf('?') > -1) {
                    img.src = currentSrc + '&js=' + Date.now();
                }
            }
        });
        
        // Prevent bfcache
        window.addEventListener('pageshow', function(event) {
            if (event.persisted) {
                window.location.reload();
            }
        });
        
        // Force hard refresh on manual purge
        if (window.location.search.indexOf('purge=') > -1) {
            console.log('🔥 Cache purge mode activated');
        }
    </script>
</head>

<body id="body"<?php echo (count(glob('*.php')) <= 1) ? ' class="single-page"' : ''; ?>>
    <?php if (count(glob('*.php')) > 1): ?>
    <button class="hamburger" aria-label="Toggle menu">
        <span></span>
        <span></span>
        <span></span>
    </button>
    <ul id="site-header">
${menuItems}
${backToTopItem}
    </ul>
    <?php endif; ?>
    
    <!-- Main image with cache-busting -->
    <img src="./<?php echo $imagePath; ?>?<?php echo $cacheBuster; ?>" alt="${page.name}" />
    
    <!-- Purge button for cache refresh -->
    <a href="?purge=1" class="purge-btn" title="Force cache refresh"  style="opacity:0">🔄 Force Refresh</a>
    
    <!-- Debug info -->
    <?php if (isset($_GET['debug'])): ?>
    <div style="position: fixed; top: 10px; right: 10px; background: rgba(0,0,0,0.9); color: #0f0; padding: 15px; font-family: monospace; font-size: 11px; border-radius: 5px; max-width: 300px; z-index: 10000;">
        <strong style="color: ${state.colors.primary};">🔍 DEBUG MODE</strong><br><br>
        <strong>Timestamp:</strong> <?php echo $timestamp; ?><br>
        <strong>Microtime:</strong> <?php echo $microtime; ?><br>
        <strong>Random:</strong> <?php echo $random; ?><br>
        <strong>File Modified:</strong> <?php echo date('Y-m-d H:i:s', $fileTime); ?><br>
        <strong>Full URL:</strong><br>
        <div style="word-break: break-all; color: #fff; margin-top: 5px;">
            <?php echo $imagePath . '?' . $cacheBuster; ?>
        </div>
        <hr style="margin: 10px 0; border-color: #333;">
        <strong style="color: #ff6b6b;">CF Headers Sent:</strong><br>
        ✓ CF-Cache-Status: BYPASS<br>
        ✓ Cache-Control: no-store<br>
        ✓ CDN-Cache-Control: no-store
    </div>
    <?php endif; ?>

    <!-- JS -->
    <script src="./script.js?<?php echo $cacheBuster; ?>"></script>
    
    <!-- 
    ========================================
    CLOUDFLARE TIPS:
    ========================================
    
    1. CREATE PAGE RULE in Cloudflare:
       Pattern: yourdomain.com/path/to/this/folder/*
       Setting: Cache Level = Bypass
       
    2. OR set Cache TTL to very low:
       Cache Level = Standard
       Browser Cache TTL = 30 minutes
       
    3. MANUAL PURGE via Cloudflare Dashboard:
       Caching > Configuration > Purge Everything
       OR Purge by URL (faster)
       
    4. API PURGE (advanced):
       curl -X POST "https://api.cloudflare.com/client/v4/zones/YOUR_ZONE_ID/purge_cache" \\
       -H "Authorization: Bearer YOUR_API_TOKEN" \\
       -H "Content-Type: application/json" \\
       --data '{"files":["https://yourdomain.com/path/${imageName}"]}'
    
    5. USE QUERY STRING SORT OFF:
       In CF Dashboard: Caching > Configuration
       Enable "Query String Sort" = OFF
       This makes ?v=1 and ?v=2 treated as different URLs
       
    6. DEVELOPMENT MODE:
       Toggle on in CF Dashboard for 3 hours
       Bypasses cache temporarily
       
    7. USE ?purge=1 in URL:
       Click the orange button or manually add to URL
       
    8. ADD DEBUG MODE:
       Add ?debug=1 to see all cache-busting info
       
    ========================================
    -->
</body>

</html>`;
}

function generateCSS() {
    const menuStyle = state.menu.style;
    const menuPosition = state.menu.position;
    const menuFontSize = state.menu.fontSize;
    const menuColor = state.menu.color;

    // Base styles for menu items based on selected style
    let menuItemStyles = '';

    if (menuStyle === 'pills') {
        menuItemStyles = `
ul li a {
    text-decoration: none;
    display: inline-block;
    font-size: ${menuFontSize}px;
    letter-spacing: 1px;
    color: ${menuColor};
    background-color: ${adjustColor(state.colors.bg, -10)};
    text-transform: uppercase;
    padding: 5px 12px;
    border-radius: 50px;
    transition: all 0.3s ease;
    border: none;
}

ul li a:hover {
    background-color: ${adjustColor(state.colors.bg, -20)};
    transform: translateY(-2px);
}`;
    } else if (menuStyle === 'underline') {
        menuItemStyles = `
ul li a {
    text-decoration: none;
    display: inline-block;
    font-size: ${menuFontSize}px;
    letter-spacing: 1px;
    color: ${menuColor};
    background-color: transparent;
    text-transform: uppercase;
    padding: 5px 12px;
    border-radius: 0;
    border-bottom: 2px solid transparent;
    transition: all 0.3s ease;
}

ul li a:hover {
    border-bottom-color: ${state.colors.primary};
}`;
    } else if (menuStyle === 'buttons') {
        menuItemStyles = `
ul li a {
    text-decoration: none;
    display: inline-block;
    font-size: ${menuFontSize}px;
    letter-spacing: 1px;
    color: ${menuColor};
    background-color: ${adjustColor(state.colors.bg, -5)};
    text-transform: uppercase;
    padding: 8px 16px;
    border-radius: 4px;
    border: 1px solid ${adjustColor(state.colors.bg, -20)};
    transition: all 0.3s ease;
}

ul li a:hover {
    background-color: ${adjustColor(state.colors.bg, -15)};
    border-color: ${state.colors.primary};
}`;
    }

    return `:root {
    --header-height: 58px;
}

*,
*::after,
*::before {
    box-sizing: border-box;
    padding: 0;
    margin: 0;
}

html {
    scroll-behavior: smooth;
    scrollbar-width: thin;
    scrollbar-gutter: stable;
    scrollbar-color: ${menuColor} ${state.colors.bg};
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
}

body {
    font-family: "${state.project.font}", sans-serif;
    background-color: ${state.colors.bg};
    color: ${menuColor};
    padding: 0;
    margin: 0;
}

img {
    max-width: 100%;
    height: auto;
    padding-top: var(--header-height);
}

/* Hide navigation when only 1 page */
body.single-page #site-header {
    display: none !important;
}

body.single-page img {
    padding-top: 0;
}

ul {
    list-style: none;
    display: flex;
    gap: 10px;
    justify-content: center;
    align-items: center;
    padding: 10px 0;
    margin: 0;
}

${menuItemStyles}

ul li.active a {
    background-color: ${state.colors.primary};
    background-image: linear-gradient(0deg, ${state.colors.primary}, ${state.colors.secondary});
    color: #fff;
    border-color: ${state.colors.primary};
}

#site-header {
    position: ${menuPosition};
    top: 0;
    left: 0;
    width: 100%;
    background: ${state.colors.bg};
    padding: 1rem 2rem;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
    transform: translateY(0);
    transition: transform 0.3s ease-in-out;
    z-index: 999;
}

#site-header.hide {
    transform: translateY(-100%);
}

/* Hamburger Menu */
.hamburger {
    display: none;
    flex-direction: column;
    cursor: pointer;
    padding: 10px;
    background: none;
    border: none;
    z-index: 1001;
}

.hamburger span {
    width: 25px;
    height: 3px;
    background-color: ${menuColor};
    margin: 3px 0;
    transition: 0.3s;
    border-radius: 2px;
}

.hamburger.active span:nth-child(1) {
    transform: rotate(-45deg) translate(-5px, 6px);
}

.hamburger.active span:nth-child(2) {
    opacity: 0;
}

.hamburger.active span:nth-child(3) {
    transform: rotate(45deg) translate(-5px, -6px);
}

/* Mobile Optimization */
@media (max-width: 768px) {
    /* Show hamburger only when there are multiple pages */
    body:not(.single-page) .hamburger {
        display: flex;
        position: absolute;
        top: 10px;
        right: 15px;
    }
    
    body:not(.single-page) #site-header {
        padding: 0.75rem 1rem;
    }
    
    body:not(.single-page) #site-header {
        display: none;
        flex-direction: column;
        width: 100%;
        gap: 8px;
        padding: 60px 20px 20px;
        background: ${state.colors.bg};
        position: absolute;
        top: 0;
        left: 0;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    }
    
    body:not(.single-page) #site-header.mobile-open {
        display: flex;
    }
    
    body:not(.single-page) #site-header li {
        width: 100%;
    }
    
    body:not(.single-page) ul li a {
        display: block;
        width: 100%;
        text-align: center;
        padding: 12px;
        font-size: ${Math.max(menuFontSize - 1, 10)}px;
    }
}

@media (max-width: 480px) {
    #site-header {
        padding: 0.5rem 0.75rem;
    }
    
    ul li a {
        font-size: ${Math.max(menuFontSize - 2, 9)}px;
        padding: 3px 8px;
    }
}`
        ;
}

function generateJS() {
    let jsCode = '';

    // Hamburger menu toggle (always include for mobile)
    jsCode += `// Hamburger menu toggle
const hamburger = document.querySelector('.hamburger');
const menu = document.querySelector('#site-header');

if (hamburger && menu) {
    hamburger.addEventListener('click', function() {
        this.classList.toggle('active');
        menu.classList.toggle('mobile-open');
    });
    
    // Close menu when clicking a link
    const menuLinks = menu.querySelectorAll('a');
    menuLinks.forEach(link => {
        link.addEventListener('click', () => {
            hamburger.classList.remove('active');
            menu.classList.remove('mobile-open');
        });
    });
}

`;

    // Auto-hide menu on scroll (if enabled)
    if (state.menu.autoHide) {
        jsCode += `// Auto-hide menu on scroll
let lastScrollTop = 0;
const header = document.getElementById('site-header');
const scrollThreshold = 100;

window.addEventListener('scroll', function() {
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    
    if (scrollTop > scrollThreshold) {
        if (scrollTop > lastScrollTop) {
            // Scrolling down
            header.classList.add('hide');
        } else {
            // Scrolling up
            header.classList.remove('hide');
        }
    } else {
        // At top of page
        header.classList.remove('hide');
    }
    
    lastScrollTop = scrollTop;
});`;
    }

    return jsCode || '// No JavaScript features enabled';
}

function generateHTAccess() {
    return `# ========================================
# UNIVERSAL CACHE BUSTING CONFIGURATION
# Works with: Apache, LiteSpeed, Nginx (via .htaccess), IIS
# ========================================

# ========================================
# LITESPEED CACHE CONFIGURATION
# ========================================
<IfModule LiteSpeed>
    # Enable LiteSpeed Cache
    CacheLookup on
    
    # Cache static files for 1 year
    <FilesMatch "\\.(jpg|jpeg|png|gif|webp|svg|ico|woff|woff2|ttf|eot|otf)$">
        Header set Cache-Control "max-age=31536000, public, immutable"
        Header set X-Cache-Engine "LiteSpeed"
    </FilesMatch>
    
    # Cache CSS/JS for 1 month (with versioning via query strings)
    <FilesMatch "\\.(css|js)$">
        Header set Cache-Control "max-age=2592000, public"
        Header set X-Cache-Engine "LiteSpeed"
    </FilesMatch>
    
    # Don't cache PHP files (we handle it in PHP headers)
    <FilesMatch "\\.php$">
        Header set Cache-Control "no-store, no-cache, must-revalidate, max-age=0"
        Header set Pragma "no-cache"
        Header set Expires "0"
    </FilesMatch>
</IfModule>

# ========================================
# APACHE + GENERAL SERVER CONFIGURATION
# ========================================

# Enable ETags for better caching
FileETag MTime Size

# GZIP Compression (Apache & LiteSpeed)
<IfModule mod_deflate.c>
    # Compress HTML, CSS, JavaScript, Text, XML and fonts
    AddOutputFilterByType DEFLATE application/javascript
    AddOutputFilterByType DEFLATE application/rss+xml
    AddOutputFilterByType DEFLATE application/vnd.ms-fontobject
    AddOutputFilterByType DEFLATE application/x-font
    AddOutputFilterByType DEFLATE application/x-font-opentype
    AddOutputFilterByType DEFLATE application/x-font-otf
    AddOutputFilterByType DEFLATE application/x-font-truetype
    AddOutputFilterByType DEFLATE application/x-font-ttf
    AddOutputFilterByType DEFLATE application/x-javascript
    AddOutputFilterByType DEFLATE application/xhtml+xml
    AddOutputFilterByType DEFLATE application/xml
    AddOutputFilterByType DEFLATE font/opentype
    AddOutputFilterByType DEFLATE font/otf
    AddOutputFilterByType DEFLATE font/ttf
    AddOutputFilterByType DEFLATE image/svg+xml
    AddOutputFilterByType DEFLATE image/x-icon
    AddOutputFilterByType DEFLATE text/css
    AddOutputFilterByType DEFLATE text/html
    AddOutputFilterByType DEFLATE text/javascript
    AddOutputFilterByType DEFLATE text/plain
    AddOutputFilterByType DEFLATE text/xml
    
    # Remove browser bugs (optional)
    BrowserMatch ^Mozilla/4 gzip-only-text/html
    BrowserMatch ^Mozilla/4\\.0[678] no-gzip
    BrowserMatch \\bMSIE !no-gzip !gzip-only-text/html
    Header append Vary User-Agent
</IfModule>

# Browser Caching with Expires Headers
<IfModule mod_expires.c>
    ExpiresActive On
    ExpiresDefault "access plus 1 month"
    
    # Images - 1 year
    ExpiresByType image/jpg "access plus 1 year"
    ExpiresByType image/jpeg "access plus 1 year"
    ExpiresByType image/gif "access plus 1 year"
    ExpiresByType image/png "access plus 1 year"
    ExpiresByType image/webp "access plus 1 year"
    ExpiresByType image/svg+xml "access plus 1 year"
    ExpiresByType image/x-icon "access plus 1 year"
    ExpiresByType image/vnd.microsoft.icon "access plus 1 year"
    
    # Fonts - 1 year
    ExpiresByType font/ttf "access plus 1 year"
    ExpiresByType font/otf "access plus 1 year"
    ExpiresByType font/woff "access plus 1 year"
    ExpiresByType font/woff2 "access plus 1 year"
    ExpiresByType application/font-woff "access plus 1 year"
    ExpiresByType application/font-woff2 "access plus 1 year"
    ExpiresByType application/x-font-woff "access plus 1 year"
    ExpiresByType application/vnd.ms-fontobject "access plus 1 year"
    
    # CSS and JavaScript - 1 month (versioned via query strings)
    ExpiresByType text/css "access plus 1 month"
    ExpiresByType text/javascript "access plus 1 month"
    ExpiresByType application/javascript "access plus 1 month"
    ExpiresByType application/x-javascript "access plus 1 month"
    
    # HTML - 1 hour (dynamic content)
    ExpiresByType text/html "access plus 1 hour"
    
    # Data
    ExpiresByType application/json "access plus 0 seconds"
    ExpiresByType application/xml "access plus 0 seconds"
    ExpiresByType text/xml "access plus 0 seconds"
    
    # Media
    ExpiresByType video/mp4 "access plus 1 year"
    ExpiresByType video/webm "access plus 1 year"
    ExpiresByType audio/mp3 "access plus 1 year"
    ExpiresByType audio/ogg "access plus 1 year"
    
    # Documents
    ExpiresByType application/pdf "access plus 1 month"
</IfModule>

# ========================================
# CACHE-CONTROL HEADERS (All Servers)
# ========================================
<IfModule mod_headers.c>
    # Cache static assets aggressively
    <FilesMatch "\\.(jpg|jpeg|png|gif|webp|svg|ico|woff|woff2|ttf|eot|otf)$">
        Header set Cache-Control "max-age=31536000, public, immutable"
        Header set X-Content-Type-Options "nosniff"
    </FilesMatch>
    
    # Cache CSS/JS with versioning support
    <FilesMatch "\\.(css|js)$">
        Header set Cache-Control "max-age=2592000, public"
        Header unset Pragma
        Header unset Expires
    </FilesMatch>
    
    # Don't cache PHP/HTML (handled in PHP)
    <FilesMatch "\\.(php|html)$">
        Header set Cache-Control "no-store, no-cache, must-revalidate, max-age=0"
        Header set Pragma "no-cache"
        Header set Expires "0"
    </FilesMatch>
    
    # Security Headers
    Header set X-Content-Type-Options "nosniff"
    Header set X-Frame-Options "SAMEORIGIN"
    Header set X-XSS-Protection "1; mode=block"
    Header set Referrer-Policy "strict-origin-when-cross-origin"
    Header set Permissions-Policy "geolocation=(), microphone=(), camera=()"
    
    # Remove Server signature
    Header unset Server
    Header unset X-Powered-By
    
    # CORS (if needed - uncomment)
    # Header set Access-Control-Allow-Origin "*"
    # Header set Access-Control-Allow-Methods "GET, POST, OPTIONS"
</IfModule>

# ========================================
# CLOUDFLARE SPECIFIC HEADERS
# ========================================
<IfModule mod_headers.c>
    # Tell Cloudflare to respect our cache headers
    Header set CDN-Cache-Control "public, max-age=2592000"
    
    # For PHP files, bypass Cloudflare cache
    <FilesMatch "\\.php$">
        Header set CDN-Cache-Control "no-store"
        Header set CF-Cache-Status "BYPASS"
    </FilesMatch>
</IfModule>

# ========================================
# NGINX COMPATIBILITY (via .htaccess)
# ========================================
# Note: If using pure Nginx, convert these rules to nginx.conf format

# ========================================
# CLEAN URLs (Optional - uncomment to enable)
# ========================================
# <IfModule mod_rewrite.c>
#     RewriteEngine On
#     RewriteBase /
#     
#     # Remove .php extension
#     RewriteCond %{REQUEST_FILENAME} !-f
#     RewriteCond %{REQUEST_FILENAME} !-d
#     RewriteRule ^([^.]+)$ $1.php [NC,L]
#     
#     # Force HTTPS (uncomment if needed)
#     # RewriteCond %{HTTPS} off
#     # RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]
#     
#     # Force WWW (uncomment if needed)
#     # RewriteCond %{HTTP_HOST} !^www\\.
#     # RewriteRule ^(.*)$ https://www.%{HTTP_HOST}/$1 [R=301,L]
# </IfModule>

# ========================================
# QUERY STRING CACHE BUSTING
# ========================================
# Allow different query strings to be cached separately
# This makes ?v=1 and ?v=2 different cached versions
<IfModule mod_rewrite.c>
    RewriteEngine On
    # Don't cache if purge parameter is present
    RewriteCond %{QUERY_STRING} purge=
    RewriteRule .* - [E=no-cache:1]
</IfModule>

# ========================================
# DISABLE DIRECTORY BROWSING
# ========================================
Options -Indexes

# ========================================
# PROTECT SENSITIVE FILES
# ========================================
<FilesMatch "\\.(htaccess|htpasswd|ini|log|sh|sql|conf|bak)$">
    Order Allow,Deny
    Deny from all
</FilesMatch>

# ========================================
# IIS COMPATIBILITY NOTES
# ========================================
# If using IIS, create a web.config file with equivalent rules:
# - Use <staticContent> for cache headers
# - Use <httpCompression> for GZIP
# - Use <rewrite> for URL rewriting
# - Use <customHeaders> for security headers

# ========================================
# PERFORMANCE OPTIMIZATIONS
# ========================================

# Disable ETags for better caching across servers
# (Uncomment if you have multiple servers)
# Header unset ETag
# FileETag None

# Limit request size (prevent DoS)
LimitRequestBody 10485760

# ========================================
# TROUBLESHOOTING
# ========================================
# If cache isn't working:
# 1. Check if mod_headers and mod_expires are enabled
# 2. Verify file permissions (644 for files, 755 for directories)
# 3. Clear browser cache (Ctrl+Shift+R)
# 4. Check server error logs
# 5. Use ?purge=1 to force refresh
# 6. Enable Cloudflare Development Mode (if using CF)
# 7. Verify .htaccess is being read (add syntax error to test)
`;
}

// ===========================
// FILE DISPLAY & EXPORT
// ===========================

function renderFileTabs() {
    const fileTabs = document.getElementById('fileTabs');
    fileTabs.innerHTML = '';

    Object.keys(state.generatedFiles).forEach(filename => {
        const tab = document.createElement('button');
        tab.className = 'file-tab';
        tab.textContent = filename;
        tab.onclick = () => displayFile(filename);

        if (filename === state.currentFile) {
            tab.classList.add('active');
        }

        fileTabs.appendChild(tab);
    });
}

function displayFile(filename) {
    state.currentFile = filename;
    const code = state.generatedFiles[filename];

    // Determine language based on file extension
    let language = 'plaintext'; // default
    if (filename.endsWith('.php')) {
        language = 'php';
    } else if (filename.endsWith('.css')) {
        language = 'css';
    } else if (filename.endsWith('.js')) {
        language = 'javascript';
    } else if (filename.endsWith('.htaccess')) {
        language = 'apache';
    }

    // Get the code element
    const codeElement = document.getElementById('codeDisplay');

    // Set the code content
    codeElement.textContent = code;

    // Remove any existing language classes and highlighting
    codeElement.className = '';
    codeElement.removeAttribute('data-highlighted');

    // Apply Highlight.js highlighting
    if (typeof hljs !== 'undefined') {
        // Set the language class
        codeElement.className = `language-${language}`;
        // Highlight the element
        hljs.highlightElement(codeElement);
    }

    // Update active tab
    document.querySelectorAll('.file-tab').forEach(tab => {
        tab.classList.toggle('active', tab.textContent === filename);
    });

    // Ensure copy and download buttons are always visible and enabled
    const copyBtn = document.getElementById('copyCodeBtn');
    const downloadBtn = document.getElementById('downloadZipBtn');
    if (copyBtn) {
        copyBtn.style.display = 'inline-flex';
        copyBtn.style.visibility = 'visible';
        copyBtn.disabled = false;
    }
    if (downloadBtn) {
        downloadBtn.style.display = 'inline-flex';
        downloadBtn.style.visibility = 'visible';
        downloadBtn.disabled = false;
    }
}

function copyCurrentCode() {
    const code = state.generatedFiles[state.currentFile];

    navigator.clipboard.writeText(code).then(() => {
        const btn = document.getElementById('copyCodeBtn');
        const originalHTML = btn.innerHTML;
        btn.innerHTML = '<span class="icon">✓</span> Copied!';
        setTimeout(() => {
            btn.innerHTML = originalHTML;
        }, 1500);
    }).catch(err => {
        alert('Failed to copy: ' + err);
    });
}

async function downloadZip() {
    // Using JSZip library (we'll load it via CDN)
    if (typeof JSZip === 'undefined') {
        alert('Loading ZIP library...');
        await loadJSZip();
    }

    const zip = new JSZip();

    Object.entries(state.generatedFiles).forEach(([filename, content]) => {
        zip.file(filename, content);
    });

    zip.generateAsync({ type: 'blob' }).then(blob => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${state.project.siteName.toLowerCase().replace(/\s+/g, '-')}-template.zip`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    });
}

function loadJSZip() {
    return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js';
        script.onload = resolve;
        script.onerror = reject;
        document.head.appendChild(script);
    });
}

// ===========================
// IMPORT/EXPORT CONFIG
// ===========================

function exportConfig() {
    const config = {
        project: state.project,
        pages: state.pages,
        menu: state.menu,
        colors: state.colors
    };

    const blob = new Blob([JSON.stringify(config, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'template-config.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

function importConfig(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const config = JSON.parse(e.target.result);

            // Validate and merge config
            if (config.project) state.project = config.project;
            if (config.pages) state.pages = config.pages;
            if (config.menu) state.menu = config.menu;
            if (config.colors) state.colors = config.colors;

            // Update UI
            initializeApp();
            renderPages();
            updatePageSelector();
            saveState();

            alert('Configuration imported successfully!');
        } catch (err) {
            alert('Failed to import configuration: ' + err.message);
        }
    };
    reader.readAsText(file);
}

// ===========================
// TAB SWITCHING
// ===========================

function switchTab(tabName) {
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.tab === tabName);
    });

    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.toggle('active', content.id === `${tabName}Tab`);
    });

    if (tabName === 'preview') {
        updatePreview();
    }
}

// ===========================
// UTILITIES
// ===========================

function adjustColor(color, percent) {
    // Simple color adjustment for hover states
    const num = parseInt(color.replace('#', ''), 16);
    const amt = Math.round(2.55 * percent);
    const R = (num >> 16) + amt;
    const G = (num >> 8 & 0x00FF) + amt;
    const B = (num & 0x0000FF) + amt;
    return '#' + (0x1000000 + (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 +
        (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 +
        (B < 255 ? B < 1 ? 0 : B : 255))
        .toString(16).slice(1);
}




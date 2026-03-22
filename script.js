// script.js
const projects = window.PROJECTS_DATA || {};

// Keep references to handlers for cleanup
let _verticalToHorizontalHandler = null;
let _touchStartHandler = null;
let _touchMoveHandler = null;
let _scrollingEl = null;
let _indicatorCleanup = null;
let _scrollUpdateHandler = null;
let _resizeUpdateHandler = null;

function enableVerticalToHorizontal(imagesEl) {
    disableVerticalToHorizontal();
    if (!imagesEl) return;

    const isMobile = isMobileView();
    const multiplier = isMobile ? 1.8 : 1.2;
    const wheelMax = isMobile ? 900 : 600;
    const touchMax = isMobile ? 450 : 300;
    _scrollingEl = imagesEl;

    // Optimized wheel handler
    const wheelHandler = (e) => {
        if (Math.abs(e.deltaY) === 0) return;

        // Check if event originated inside imagesEl
        const inTarget = typeof e.composedPath === 'function' 
            ? e.composedPath().includes(imagesEl)
            : imagesEl.contains(e.target);
        if (!inTarget) return;

        e.preventDefault();
        let delta = e.deltaY;
        if (e.deltaMode === 1) delta *= 16;
        else if (e.deltaMode === 2) delta *= window.innerHeight;

        const step = Math.max(-wheelMax, Math.min(wheelMax, Math.round(delta * multiplier)));
        imagesEl.scrollBy({ left: step, behavior: 'smooth' });
    };

    // Touch handlers: map vertical drag to horizontal scrolling + direct horizontal swipe
    let lastY = null;
    let lastX = null;
    const touchStart = (e) => {
        if (e.touches?.length) {
            lastY = e.touches[0].clientY;
            lastX = e.touches[0].clientX;
        }
    };
    const touchMove = (e) => {
        if (!e.touches?.length) return;
        const y = e.touches[0].clientY;
        const x = e.touches[0].clientX;

        // Vertical drag → horizontal scroll (existing behavior)
        const dy = lastY != null ? lastY - y : 0;
        lastY = y;

        // Direct horizontal swipe (new, faster)
        const dx = lastX != null ? lastX - x : 0;
        lastX = x;

        // Combine both: horizontal swipe is 2x faster than vertical mapping
        const verticalStep = Math.max(-touchMax, Math.min(touchMax, Math.round(-dy * multiplier)));
        const horizontalStep = Math.max(-touchMax * 2, Math.min(touchMax * 2, Math.round(dx * 2)));
        const totalStep = verticalStep + horizontalStep;

        imagesEl.scrollBy({ left: totalStep, behavior: 'auto' });
    };

    imagesEl.addEventListener('wheel', wheelHandler, { passive: false });
    imagesEl.addEventListener('touchstart', touchStart, { passive: true });
    imagesEl.addEventListener('touchmove', touchMove, { passive: false });

    _verticalToHorizontalHandler = wheelHandler;
    _touchStartHandler = touchStart;
    _touchMoveHandler = touchMove;
}

// Right arrow: on click/tap jump to next image
function installIndicatorClick(displayEl) {
    if (!displayEl) return;
    const indicator = displayEl.querySelector('.scroll-indicator');
    if (!indicator) return;

    let lastScrollTime = 0;
    const DEBOUNCE_MS = 220;

    function scrollToNextImage() {
        const now = Date.now();
        if (now - lastScrollTime < DEBOUNCE_MS) return;
        lastScrollTime = now;

        const imagesEl = displayEl.querySelector('.project-images');
        if (!imagesEl) return;
        const imageEls = Array.from(imagesEl.querySelectorAll('.project-image'));
        if (!imageEls.length) return;

        const curScroll = imagesEl.scrollLeft;
        const threshold = 15;

        const offsets = imageEls.map(el => Math.round(el.offsetLeft)).sort((a, b) => a - b);
        let targetScroll = offsets.find(left => left > curScroll + threshold);
        if (targetScroll == null) {
            const step = Math.max(220, Math.round(imagesEl.clientWidth * 0.9));
            const maxLeft = Math.max(0, imagesEl.scrollWidth - imagesEl.clientWidth);
            targetScroll = Math.min(maxLeft, curScroll + step);
        }
        try {
            imagesEl.scrollTo({ left: Math.round(targetScroll), behavior: 'smooth' });
        } catch (e) {
            imagesEl.scrollLeft = Math.round(targetScroll);
        }
    }

    function handleActivate(e) {
        e.preventDefault();
        e.stopPropagation();
        scrollToNextImage();
    }

    const keyHandler = (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            scrollToNextImage();
        }
    };

    indicator.setAttribute('tabindex', '0');
    indicator.setAttribute('role', 'button');
    indicator.setAttribute('aria-label', 'Next image');
    indicator.style.cursor = 'pointer';
    indicator.style.pointerEvents = 'auto';
    indicator.style.touchAction = 'manipulation';
    indicator.addEventListener('pointerdown', handleActivate);
    indicator.addEventListener('keydown', keyHandler);

    return () => {
        indicator.removeEventListener('pointerdown', handleActivate);
        indicator.removeEventListener('keydown', keyHandler);
    };
}

function disableVerticalToHorizontal() {
    if (_scrollingEl) {
        if (_verticalToHorizontalHandler) {
            _scrollingEl.removeEventListener('wheel', _verticalToHorizontalHandler);
        }
        if (_touchStartHandler) {
            _scrollingEl.removeEventListener('touchstart', _touchStartHandler);
        }
        if (_touchMoveHandler) {
            _scrollingEl.removeEventListener('touchmove', _touchMoveHandler);
        }
    }
    if (_scrollUpdateHandler) {
        _scrollingEl?.removeEventListener('scroll', _scrollUpdateHandler);
        window.removeEventListener('resize', _resizeUpdateHandler);
    }
    if (_indicatorCleanup) {
        _indicatorCleanup();
    }
    
    _verticalToHorizontalHandler = null;
    _touchStartHandler = null;
    _touchMoveHandler = null;
    _scrollingEl = null;
    _indicatorCleanup = null;
    _scrollUpdateHandler = null;
    _resizeUpdateHandler = null;
}

// Mobile-specific helpers
function isMobileView() {
    const portraitPhone = window.matchMedia('(max-width: 720px)').matches;
    const landscapePhone = window.matchMedia('(max-height: 520px) and (pointer: coarse)').matches;
    return portraitPhone || landscapePhone;
}

function createMobileTopBar() {
    removeMobileTopBar();
    const content = document.querySelector('.content');
    if (!content) return null;
    
    const bar = document.createElement('div');
    bar.className = 'mobile-top-bar';
    bar.setAttribute('role', 'button');
    bar.setAttribute('aria-label', 'Back to home');
    bar.tabIndex = 0;
    bar.textContent = 'antonio patljak';
    
    const handler = () => {
        document.getElementById('home-link').click();
    };
    
    bar.addEventListener('click', handler);
    bar.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handler();
        }
    });
    
    content.prepend(bar);
    content.classList.add('has-top-bar');
    return bar;
}

function removeMobileTopBar() {
    const existing = document.querySelector('.mobile-top-bar');
    if (existing) existing.remove();
    const content = document.querySelector('.content');
    if (content) content.classList.remove('has-top-bar');
}

function syncHash(hashValue) {
    const nextHash = `#${hashValue}`;
    if (window.location.hash !== nextHash) {
        window.location.hash = nextHash;
    }
}

function hideSidebarOnMobile() {
    const sidebar = document.querySelector('.sidebar');
    if (sidebar) sidebar.classList.add('mobile-hidden');
}

function showSidebarOnMobile(options = {}) {
    const { resetDisplay = true } = options;
    const sidebar = document.querySelector('.sidebar');
    if (sidebar) sidebar.classList.remove('mobile-hidden');
    removeMobileTopBar();
    disableVerticalToHorizontal();
    if (resetDisplay) {
        const display = document.querySelector('.project-display');
        if (display) display.innerHTML = `<p class="placeholder">select a project to view details</p>`;
    }
}

// Escape HTML to prevent XSS
const escapeHtml = (str) => {
    const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
    return String(str || '').replace(/[&<>"']/g, m => map[m]);
};

// Format text with line breaks
const formatText = (text) => {
    return String(text || '').replace(/\\n/g, '<br>').replace(/\n/g, '<br>');
};

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', () => {
    const header = document.querySelector('.portfolio-header');
    const homeLink = document.getElementById('home-link');
    
    if (header && homeLink) {
        header.addEventListener('click', () => homeLink.click());
    }
    
    // Ensure proper initial formatting on mobile
    if (isMobileView()) {
        showSidebarOnMobile();
    }
    applyRouteFromHash();
});

// Home handler: reset view and disable mapping
document.getElementById('home-link').addEventListener('click', function() {
    // Update meta tags back to default/home
    if (typeof updateMetaTags === 'function') {
        updateMetaTags(
            window.META_CONFIG.pages.default.title,
            window.META_CONFIG.pages.default.description,
            window.META_CONFIG.pages.default.image
        );
    }

    document.querySelectorAll('.project-item, .about-item').forEach(item => item.classList.remove('active'));
    const display = document.querySelector('.project-display');
    if (display) display.innerHTML = `<p class="placeholder">select a project to view details</p>`;
    disableVerticalToHorizontal();
    if (isMobileView()) showSidebarOnMobile();
    syncHash('home');
});

// About handler: show about and disable mapping
const aboutData = {
    image: './images/about/08A6363cropbw.jpg',
    text: 'Antonio Patljak was born in Zagreb on January 15, 1998. He graduated in 2022 from the Faculty of Architecture at the University of Zagreb with a diploma thesis titled “The New Drama Building of the Croatian National Theatre in Zagreb”, supervised by Prof. Modrčin.\n\nHe has participated in the production of more than 30 films and several theatre productions, and is the recipient of the Golden Arena Award for Visual Effects at the Pula Film Festival for the film The Eighth Commissioner (2018). He is one of the authors of the Croatian National Pavilion in Osaka, Japan.\n\nHis main fields of interest include temporary architecture and the application of new technologies. He currently works as an architect and scenographer in Zagreb. He is fluent in English and has a working knowledge of German.'
};
document.querySelectorAll('.about-item').forEach(item => {
    item.addEventListener('click', function() {
        document.querySelectorAll('.project-item').forEach(proj => proj.classList.remove('active'));
        document.querySelectorAll('.about-item').forEach(about => about.classList.remove('active'));
        this.classList.add('active');

        // Update meta tags for about page
        if (typeof updateMetaTags === 'function') {
            updateMetaTags(
                window.META_CONFIG.pages.about.title,
                window.META_CONFIG.pages.about.description,
                window.META_CONFIG.pages.about.image
            );
        }

        const display = document.querySelector('.project-display');
        const textHTML = String(aboutData.text || '').replace(/\\n/g, '<br>').replace(/\n/g, '<br>');
        display.innerHTML = `
            <div class="project-images about-layout">
                <div class="project-description about-description">
                    <div class="about-text">${textHTML}</div>
                </div>
                <div class="project-image about-image-container">
                    <img src="${aboutData.image}" alt="about">
                </div>
            </div>
        `;
        disableVerticalToHorizontal();
        // On phone, show about in content view (same flow as project pages)
        if (isMobileView()) {
            hideSidebarOnMobile();
            createMobileTopBar();
        }
        syncHash('about');
    });
});

// Update sidebar project names
document.querySelectorAll('.project-item').forEach(item => {
    const projectId = item.getAttribute('data-project');
    const project = projects[projectId];
    if (project) item.textContent = project.title;
});

// Category toggle (accordion) handlers
document.querySelectorAll('.category .category-header').forEach(header => {
    header.addEventListener('click', function() {
        const categoryEl = this.closest('.category');
        if (!categoryEl) return;
        const isActive = categoryEl.classList.contains('active');

        document.querySelectorAll('.category').forEach(c => {
            c.classList.remove('active');
            const toggle = c.querySelector('.toggle');
            if (toggle) toggle.textContent = '+';
        });

        if (!isActive) {
            categoryEl.classList.add('active');
            const toggle = categoryEl.querySelector('.toggle');
            if (toggle) toggle.textContent = '−';
        }
    });
});

// Project selection handler
document.querySelectorAll('.project-item').forEach(item => {
    item.addEventListener('click', function() {
        document.querySelectorAll('.project-item, .about-item').forEach(el => el.classList.remove('active'));
        this.classList.add('active');

        const projectId = this.getAttribute('data-project');
        const project = projects[projectId];
        if (!project) return;

        // Update meta tags for project
        const description = project.text || project.details.split('\\n')[0] || window.META_CONFIG.site.description;
        const image = project.images && project.images.length > 0 ? project.images[0] : window.META_CONFIG.site.image;
        if (typeof updateMetaTags === 'function') {
            updateMetaTags(
                `${escapeHtml(project.title)} | Antonio Patljak`,
                description.substring(0, 160),
                image
            );
        }

        const display = document.querySelector('.project-display');
        if (!display) return;

        const imageHTML = project.images.map(img => {
            return typeof img === 'string'
                ? `<div class="project-image"><img src="${img}" alt="${escapeHtml(project.title)}"></div>`
                : `<div class="project-image">${img}</div>`;
        }).join('');

        display.innerHTML = `
            <div class="project-images" tabindex="0" aria-label="Project images and description">
                <div class="project-description">
                    <div class="project-title">${escapeHtml(project.title)}</div>
                    <div class="project-details">${formatText(project.details)}</div>
                    <div class="project-text">${formatText(project.text)}</div>
                </div>
                ${imageHTML}
            </div>
            <div class="scroll-indicator" role="button" aria-label="Next image"></div>
        `;

        const imagesEl = display.querySelector('.project-images');
        const descEl = display.querySelector('.project-description');

        // Reset scroll positions
        if (descEl) {
            descEl.scrollTop = 0;
            const titleEl = descEl.querySelector('.project-title');
            if (titleEl) titleEl.style.marginTop = '0';
        }
        if (imagesEl) imagesEl.scrollLeft = 0;

        // Cleanup previous handlers
        if (_indicatorCleanup) {
            _indicatorCleanup();
            _indicatorCleanup = null;
        }

        // Enable vertical->horizontal mapping first.
        // This function clears old handlers, so it must run before new indicator handlers are attached.
        enableVerticalToHorizontal(imagesEl);

        // Setup scroll indicator
        if (imagesEl) {
            const updateIndicator = () => {
                const overflow = imagesEl.scrollWidth > imagesEl.clientWidth + 1;
                const atEnd = imagesEl.scrollLeft + imagesEl.clientWidth >= imagesEl.scrollWidth - 2;
                const indicatorEl = display.querySelector('.scroll-indicator');
                if (indicatorEl) {
                    display.classList.toggle('no-indicator', !overflow || atEnd);
                }
            };
            
            _scrollUpdateHandler = updateIndicator;
            _resizeUpdateHandler = updateIndicator;
            
            imagesEl.addEventListener('scroll', updateIndicator, { passive: true });
            window.addEventListener('resize', updateIndicator);
            setTimeout(updateIndicator, 50);
            
            const removeClick = installIndicatorClick(display);
            _indicatorCleanup = () => {
                imagesEl.removeEventListener('scroll', updateIndicator);
                window.removeEventListener('resize', updateIndicator);
                if (removeClick) removeClick();
                display.classList.add('no-indicator');
            };
        }

        // Mobile behavior: hide sidebar and show top bar
        if (isMobileView()) {
            hideSidebarOnMobile();
            createMobileTopBar();
        }
        syncHash(projectId);
    });
});

// Project preview on hover (desktop only)
let currentHoverItem = null;
let previewEl = null;

// Only enable preview on non-touch devices
if (!isMobileView() && window.matchMedia('(pointer: fine)').matches) {
    previewEl = document.createElement('div');
    previewEl.className = 'project-item-preview';
    document.body.appendChild(previewEl);

    document.querySelectorAll('.project-item').forEach(item => {
        item.addEventListener('mouseenter', function() {
            const projectId = this.getAttribute('data-project');
            const project = projects[projectId];
            if (!project || !project.images || project.images.length === 0) return;

            const firstImage = project.images[0];
            previewEl.innerHTML = `<img src="${firstImage}" alt="${escapeHtml(project.title)}">`;
            previewEl.classList.add('show');
            currentHoverItem = this;
        });

        item.addEventListener('mouseleave', function() {
            previewEl.classList.remove('show');
            currentHoverItem = null;
        });
    });

    // Track mouse movement to position preview
    document.addEventListener('mousemove', (e) => {
        if (!currentHoverItem || !previewEl.classList.contains('show')) return;

        const offsetX = 15;
        const offsetY = 15;
        let x = e.clientX + offsetX;
        let y = e.clientY + offsetY;

        // Keep preview within viewport
        const previewWidth = previewEl.offsetWidth;
        const previewHeight = previewEl.offsetHeight;

        if (x + previewWidth > window.innerWidth) {
            x = e.clientX - previewWidth - offsetX;
        }
        if (y + previewHeight > window.innerHeight) {
            y = e.clientY - previewHeight - offsetY;
        }

        previewEl.style.left = x + 'px';
        previewEl.style.top = y + 'px';
    });
}

function applyRouteFromHash() {
    const route = window.location.hash.replace(/^#/, '').trim();
    if (!route || route === 'home') {
        document.getElementById('home-link')?.click();
        return;
    }
    if (route === 'about') {
        document.querySelector('.about-item')?.click();
        return;
    }
    if (projects[route]) {
        document.querySelector(`.project-item[data-project="${route}"]`)?.click();
        return;
    }
    document.getElementById('home-link')?.click();
}

window.addEventListener('hashchange', applyRouteFromHash);

// Handle window resize
window.addEventListener('resize', () => {
    if (!isMobileView()) {
        const sidebar = document.querySelector('.sidebar');
        if (sidebar) sidebar.classList.remove('mobile-hidden');
        removeMobileTopBar();
    } else {
        // Ensure proper formatting on mobile resize
        const display = document.querySelector('.project-display');
        const hasProject = display && display.querySelector('.project-images');
        if (hasProject) {
            hideSidebarOnMobile();
            createMobileTopBar();
        }
    }
});

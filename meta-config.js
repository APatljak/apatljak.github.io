// Centralized meta tags configuration
window.META_CONFIG = {
    // Site-wide defaults
    site: {
        name: 'Antonio Patljak',
        description: 'Antonio Patljak\'s portfolio of architecture, production design, photography, and graphic design work.',
        keywords: 'architecture, production design, photography, graphic design, film, Zagreb, Croatia, set design, art direction, creative direction, portfolio',
        author: 'Antonio Patljak',
        domain: 'https://antoniopatljak.com',
        image: './images/arch/2025_osakaexpo/expo1_AntonioPatljak.jpg',
        type: 'website'
    },
    
    // Page-specific meta tags
    pages: {
        default: {
            title: 'Antonio Patljak',
            description: 'Antonio Patljak\'s portfolio of architecture, production design, photography, and graphic design work.',
            image: './images/arch/2025_osakaexpo/expo1_AntonioPatljak.jpg'
        },
        about: {
            title: 'Antonio Patljak',
            description: 'Antonio Patljak, an architect and creative professional based in Zagreb, Croatia.',
            image: './images/arch/2025_osakaexpo/expo1_AntonioPatljak.jpg'
        }
    }
};

// Meta tag injection function
function updateMetaTags(title, description, image) {
    // Update title
    document.title = title || window.META_CONFIG.pages.default.title;
    
    // Update or create meta description
    let metaDescription = document.querySelector('meta[name="description"]');
    if (!metaDescription) {
        metaDescription = document.createElement('meta');
        metaDescription.setAttribute('name', 'description');
        document.head.appendChild(metaDescription);
    }
    metaDescription.setAttribute('content', description || window.META_CONFIG.site.description);
    
    // Update or create OG image
    let ogImage = document.querySelector('meta[property="og:image"]');
    if (!ogImage) {
        ogImage = document.createElement('meta');
        ogImage.setAttribute('property', 'og:image');
        document.head.appendChild(ogImage);
    }
    ogImage.setAttribute('content', window.META_CONFIG.site.domain + '/' + (image || window.META_CONFIG.site.image).replace('./', ''));
    
    // Update or create OG title
    let ogTitle = document.querySelector('meta[property="og:title"]');
    if (!ogTitle) {
        ogTitle = document.createElement('meta');
        ogTitle.setAttribute('property', 'og:title');
        document.head.appendChild(ogTitle);
    }
    ogTitle.setAttribute('content', title || window.META_CONFIG.pages.default.title);
    
    // Update or create OG description
    let ogDescription = document.querySelector('meta[property="og:description"]');
    if (!ogDescription) {
        ogDescription = document.createElement('meta');
        ogDescription.setAttribute('property', 'og:description');
        document.head.appendChild(ogDescription);
    }
    ogDescription.setAttribute('content', description || window.META_CONFIG.site.description);
}

// Initialize with default meta tags on page load
document.addEventListener('DOMContentLoaded', function() {
    updateMetaTags(
        window.META_CONFIG.pages.default.title,
        window.META_CONFIG.pages.default.description,
        window.META_CONFIG.pages.default.image
    );
});

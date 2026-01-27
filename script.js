document.addEventListener('DOMContentLoaded', () => {
    // 0. Disable Right Click & DevTools Shortcuts
    document.addEventListener('contextmenu', e => e.preventDefault());

    document.addEventListener('keydown', (e) => {
        if (e.key === 'F12') e.preventDefault();
        if (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'J' || e.key === 'C')) e.preventDefault();
        if (e.ctrlKey && e.key === 'u') e.preventDefault();
        if (
            (e.ctrlKey && e.shiftKey && e.key === "I") ||
            (e.metaKey && e.altKey && e.key === "I")
        ) {
            e.preventDefault();
        }
    });

    // 1. Core State & Elements
    const cursor = document.getElementById('custom-cursor');
    const cursorDot = cursor?.querySelector('div');
    const portfolioGrid = document.querySelector('.portfolio-grid');
    const rewindOverlay = document.getElementById('rewind-overlay');
    const filmToggle = document.getElementById('film-toggle');
    const modernToggle = document.getElementById('modern-toggle');

    let currentMode = 'modern';


    // Intersection Observer for reveal animations
    const observerOptions = { threshold: 0.1, rootMargin: '0px 0px -50px 0px' };
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('active');
            }
        });
    }, observerOptions);

    // 2. Load Projects from JSON
    const loadProjects = async (source = 'projects.json') => {
        try {
            const response = await fetch(source);
            const projects = await response.json();

            if (!portfolioGrid) return;

            // Fade out grid before replacing content if not initial load
            portfolioGrid.style.opacity = '0';

            setTimeout(() => {
                portfolioGrid.innerHTML = projects.map(project => `
                    <div class="portfolio-item group cursor-none">
                        <img src="${project.primaryImg}" alt="${project.primaryAlt}" class="primary-img"
                            loading="lazy" decoding="async" fetchpriority="low">
                        <img src="${project.secondaryImg}" alt="${project.secondaryAlt}" 
                            class="secondary-img absolute inset-0 opacity-0 scale-110" 
                            loading="lazy" decoding="async" fetchpriority="low">
                        <div class="item-overlay"></div>
                        <div class="item-details">
                            <h3 class="text-xs font-medium tracking-widest uppercase mb-1">${project.title}</h3>
                            <p class="text-[9px] tracking-widest text-neutral-400 uppercase">${project.date}</p>
                        </div>
                    </div>
                `).join('');

                // Re-initialize logic that depends on portfolio items
                setupRevealAnimations();
                startPreloader();
                portfolioGrid.style.opacity = '1';
                portfolioGrid.style.transition = 'opacity 0.5s ease';
            }, 300);
        } catch (error) {
            console.error('Error loading projects:', error);
        }
    };


    // 3. Setup Cursor Interactions
    const setupCursorInteractions = () => {
        if (!cursor) return;

        // Global Delegation for cursor effects
        document.addEventListener('mouseover', (e) => {
            const target = e.target.closest('a, .portfolio-item, button');
            if (target && cursorDot) {
                cursorDot.style.transform = 'translate(-50%, -50%) scale(4)';
                cursorDot.style.opacity = '0.3';
            }
        });

        document.addEventListener('mouseout', (e) => {
            const target = e.target.closest('a, .portfolio-item, button');
            if (target && cursorDot) {
                cursorDot.style.transform = 'translate(-50%, -50%) scale(1)';
                cursorDot.style.opacity = '1';
            }
        });
    };

    // Cursor movement (global)
    if (cursor) {
        document.addEventListener('mousemove', (e) => {
            requestAnimationFrame(() => {
                cursor.style.transform = `translate3d(${e.clientX}px, ${e.clientY}px, 0)`;
            });
        });
    }

    // 4. Reveal Animations
    const setupRevealAnimations = () => {
        document.querySelectorAll('.portfolio-item, #about').forEach(el => {
            el.classList.add('reveal');
            observer.observe(el);
        });
    };

    // 5. Image Preloader Logic
    let loadedCount = 0;
    const startPreloader = () => {
        loadedCount = 0; // Reset count for new gallery items
        const imagesToPreload = Array.from(document.querySelectorAll('.portfolio-item img'));

        const preloadNext = () => {
            if (loadedCount >= imagesToPreload.length) return;

            const img = imagesToPreload[loadedCount];
            const tempImg = new Image();

            tempImg.onload = () => {
                img.setAttribute('loading', 'eager');
                img.classList.add('is-cached');
                loadedCount++;
                updateProgress(loadedCount, imagesToPreload.length);
                preloadNext();
            };

            tempImg.onerror = () => {
                loadedCount++;
                preloadNext();
            };

            tempImg.src = img.src;
        };

        const updateProgress = (current, total) => {
            const percentage = Math.round((current / total) * 100);
            const enterBtn = document.querySelector('.enter-btn');
            if (enterBtn) {
                if (percentage < 100) {
                    enterBtn.setAttribute('data-progress', `PREPARING ${percentage}%`);
                } else {
                    enterBtn.setAttribute('data-progress', 'READY');
                }
            }
        };

        // Start preloading after a short delay
        setTimeout(preloadNext, 1000);
    };

    // 6. Navigation & Smooth Scroll
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({ behavior: 'smooth' });
            }
        });
    });

    // 7. Scroll Effects (Parallax & Nav Fade)
    let isScrolling = false;
    window.addEventListener('scroll', () => {
        if (!isScrolling) {
            window.requestAnimationFrame(() => {
                const scrolled = window.scrollY;
                const vh = window.innerHeight;
                const heroBg = document.querySelector('.hero-bg');
                const heroOverlay = document.querySelector('.overlay');
                const galleryNav = document.querySelector('.gallery-nav');

                if (heroBg && !document.body.classList.contains('gallery-active')) {
                    const opacity = 1 - (scrolled / (vh * 0.8));
                    heroBg.style.opacity = Math.max(0, opacity);
                    const scale = 1 + (scrolled / vh) * 0.1;
                    heroBg.style.transform = `scale(${scale})`;
                    if (heroOverlay) heroOverlay.style.opacity = 0.4 + (scrolled / vh) * 0.6;
                }

                if (galleryNav && document.body.classList.contains('gallery-active')) {
                    const fadeThreshold = 250;
                    const navOpacity = 1 - (scrolled / fadeThreshold);
                    galleryNav.style.opacity = Math.min(1, Math.max(0, navOpacity));
                    galleryNav.style.pointerEvents = navOpacity <= 0 ? 'none' : 'auto';

                    // If in film mode, we might want to keep the nav visible or handle its opacity differently
                    if (document.body.classList.contains('film-mode')) {
                        galleryNav.style.opacity = '1';
                        galleryNav.style.pointerEvents = 'auto';
                    }
                }
                isScrolling = false;
            });
            isScrolling = true;
        }
    });

    // 7.1 Horizontal Scroll for Film Mode
    portfolioGrid?.addEventListener('wheel', (e) => {
        if (currentMode === 'film' && Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
            e.preventDefault();
            // Slower scroll speed for cinematic feel
            portfolioGrid.scrollLeft += e.deltaY * 0.8;
        }
    }, { passive: false });

    // 8. Landing Transition
    const enterBtns = document.querySelectorAll('.enter-btn');
    if (enterBtns.length > 0) {
        document.body.style.overflow = 'hidden';
        enterBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                document.body.classList.add('gallery-active');
                setTimeout(() => { document.body.style.overflowY = 'auto'; }, 500);

                const targetId = btn.getAttribute('href');
                setTimeout(() => {
                    if (targetId && targetId !== '#') {
                        const target = document.querySelector(targetId);
                        if (target) target.scrollIntoView({ behavior: 'smooth' });
                    }
                }, 1000);
            });
        });
    }

    // 9. About Modal
    const aboutModal = document.getElementById('about-modal');
    const aboutTriggers = document.querySelectorAll('.about-trigger');
    const modalClose = document.querySelector('.modal-close');

    if (aboutModal) {
        const openModal = () => {
            aboutModal.classList.add('active');
            document.body.style.overflow = 'hidden';
        };

        const closeModal = () => {
            aboutModal.classList.remove('active');
            document.body.style.overflowY = document.body.classList.contains('gallery-active') ? 'auto' : 'hidden';
        };

        aboutTriggers.forEach(t => t.addEventListener('click', e => { e.preventDefault(); openModal(); }));
        modalClose?.addEventListener('click', closeModal);
        aboutModal.addEventListener('click', e => { if (e.target === aboutModal) closeModal(); });
        document.addEventListener('keydown', e => { if (e.key === 'Escape' && aboutModal.classList.contains('active')) closeModal(); });
    }

    const yearEl = document.getElementById("year");
    const yearFilmEl = document.getElementById("year-film");
    const currentYear = new Date().getFullYear();

    if (yearEl) {
        yearEl.textContent = currentYear;
    }
    if (yearFilmEl) {
        yearFilmEl.textContent = currentYear;
    }


    // 10. Film Mode Toggle Logic
    const toggleFilmMode = (mode) => {
        if (mode === currentMode) return;

        // Trigger Rewind Animation
        if (rewindOverlay) {
            rewindOverlay.classList.add('active');

            // Halfway through animation, switch theme and content
            setTimeout(() => {
                if (mode === 'film') {
                    document.body.classList.add('film-mode');
                    filmToggle.classList.add('hidden');
                    modernToggle.classList.remove('hidden');
                    loadProjects('film-projects.json');
                } else {
                    document.body.classList.remove('film-mode');
                    filmToggle.classList.remove('hidden');
                    modernToggle.classList.add('hidden');
                    loadProjects('projects.json');
                }
                currentMode = mode;

                // Reset scroll position for the grid
                if (portfolioGrid) portfolioGrid.scrollLeft = 0;

                // Scroll to top for fresh experience
                window.scrollTo({ top: 0, behavior: 'instant' });
            }, 400);

            // Clean up animation
            setTimeout(() => {
                rewindOverlay.classList.remove('active');
            }, 800);
        }
    };

    if (filmToggle) filmToggle.addEventListener('click', () => toggleFilmMode('film'));
    if (modernToggle) modernToggle.addEventListener('click', () => toggleFilmMode('modern'));

    // 11. Film Mode Navigation - Click on Grid Background
    if (portfolioGrid) {
        portfolioGrid.addEventListener('click', (e) => {
            if (currentMode !== 'film') return;

            // Allow navigation even when clicking on images (hover effects still work via CSS)
            // We removed the blocker line here

            const gridRect = portfolioGrid.getBoundingClientRect();
            const clickX = e.clientX - gridRect.left;
            const gridWidth = gridRect.width;

            const gridCenter = portfolioGrid.scrollLeft + (gridWidth / 2);
            const items = Array.from(document.querySelectorAll('.portfolio-item'));

            // Find the item closest to the center
            let closestItemIndex = 0;
            let minDistance = Infinity;

            items.forEach((item, index) => {
                const itemCenter = item.offsetLeft + (item.offsetWidth / 2);
                const distance = Math.abs(gridCenter - itemCenter);
                if (distance < minDistance) {
                    minDistance = distance;
                    closestItemIndex = index;
                }
            });

            if (clickX < gridWidth / 2) {
                // Clicked left half - go to previous
                const prevIndex = Math.max(0, closestItemIndex - 1);
                const targetItem = items[prevIndex];

                // Calculate position to center the target item
                const targetScroll = targetItem.offsetLeft - (gridWidth / 2) + (targetItem.offsetWidth / 2);

                portfolioGrid.scrollTo({
                    left: targetScroll,
                    behavior: 'smooth'
                });
            } else {
                // Clicked right half - go to next
                const nextIndex = Math.min(items.length - 1, closestItemIndex + 1);
                const targetItem = items[nextIndex];

                // Calculate position to center the target item
                const targetScroll = targetItem.offsetLeft - (gridWidth / 2) + (targetItem.offsetWidth / 2);

                portfolioGrid.scrollTo({
                    left: targetScroll,
                    behavior: 'smooth'
                });
            }
        });
    }

    // Initialize
    loadProjects();
    setupCursorInteractions(); // Initial setup for existing elements (nav, etc)


});


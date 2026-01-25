document.addEventListener('DOMContentLoaded', () => {
    // 0. Disable Right Click & DevTools Shortcuts
    document.addEventListener('contextmenu', e => e.preventDefault());

    document.addEventListener('keydown', (e) => {
        // Disable F12
        if (e.key === 'F12') {
            e.preventDefault();
        }
        // Disable Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+Shift+C
        if (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'J' || e.key === 'C')) {
            e.preventDefault();
        }
        // Disable Ctrl+U (View Source)
        if (e.ctrlKey && e.key === 'u') {
            e.preventDefault();
        }
    });

    // 1. Welcome Animations Load
    setTimeout(() => {
        document.querySelector('.welcome-title')?.classList.add('active');
        document.querySelector('.welcome-subtitle')?.classList.add('active');
    }, 500);

    // 2. Custom Cursor Logic
    const cursor = document.getElementById('custom-cursor');
    const cursorDot = cursor?.querySelector('div');

    if (cursor) {
        document.addEventListener('mousemove', (e) => {
            requestAnimationFrame(() => {
                // Use translate3d for GPU acceleration
                cursor.style.transform = `translate3d(${e.clientX}px, ${e.clientY}px, 0)`;
            });
        });

        // Hover effect on links and portfolio items
        const links = document.querySelectorAll('a, .portfolio-item');
        links.forEach(link => {
            link.addEventListener('mouseenter', () => {
                if (cursorDot) {
                    cursorDot.style.transform = 'translate(-50%, -50%) scale(4)';
                    cursorDot.style.opacity = '0.3';
                }
            });
            link.addEventListener('mouseleave', () => {
                if (cursorDot) {
                    cursorDot.style.transform = 'translate(-50%, -50%) scale(1)';
                    cursorDot.style.opacity = '1';
                }
            });
        });
    }

    // 3. Scroll Reveal Logic
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('active');
                // Optional: stop observing once revealed
                // observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    // Add reveal class to portfolio items dynamically if not already there
    document.querySelectorAll('.portfolio-item, #about').forEach(el => {
        el.classList.add('reveal');
        observer.observe(el);
    });

    // 4. Smooth Scrolling for Internal Links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth'
                });
            }
        });
    });

    // 5. Hero Fade & Parallax on Scroll + Gallery Nav Fade
    let isScrolling = false;
    window.addEventListener('scroll', () => {
        if (!isScrolling) {
            window.requestAnimationFrame(() => {
                const scrolled = window.scrollY;
                const vh = window.innerHeight;
                const heroBg = document.querySelector('.hero-bg');
                const heroOverlay = document.querySelector('.overlay');
                const galleryNav = document.querySelector('.gallery-nav');

                // Hero logic (only if welcome is visible)
                if (heroBg && !document.body.classList.contains('gallery-active')) {
                    const opacity = 1 - (scrolled / (vh * 0.8));
                    heroBg.style.opacity = Math.max(0, opacity);
                    const scale = 1 + (scrolled / vh) * 0.1;
                    heroBg.style.transform = `scale(${scale})`;
                    if (heroOverlay) {
                        heroOverlay.style.opacity = 0.4 + (scrolled / vh) * 0.6;
                    }
                }

                // Gallery Nav Fade logic
                if (galleryNav && document.body.classList.contains('gallery-active')) {
                    const fadeThreshold = 250;
                    const navOpacity = 1 - (scrolled / fadeThreshold);
                    galleryNav.style.opacity = Math.min(1, Math.max(0, navOpacity));

                    // Disable pointer events when faded out
                    galleryNav.style.pointerEvents = navOpacity <= 0 ? 'none' : 'auto';
                }
                isScrolling = false;
            });
            isScrolling = true;
        }
    });

    // 6. Landing to Gallery Transition
    const enterBtns = document.querySelectorAll('.enter-btn');
    const imagesToPreload = Array.from(document.querySelectorAll('.portfolio-item img'));
    let loadedCount = 0;

    // Sequential Background Loader
    const preloadImages = () => {
        if (loadedCount >= imagesToPreload.length) return;

        const img = imagesToPreload[loadedCount];
        const tempImg = new Image();

        tempImg.onload = () => {
            // Once loaded in background, make it eager in the DOM
            img.setAttribute('loading', 'eager');
            img.classList.add('is-cached');

            loadedCount++;
            // Update progress if you want to show it
            updateLoadingProgress(loadedCount, imagesToPreload.length);

            // Sip the next one
            preloadImages();
        };

        tempImg.onerror = () => {
            loadedCount++;
            preloadImages();
        };

        tempImg.src = img.src;
    };

    const updateLoadingProgress = (current, total) => {
        const percentage = Math.round((current / total) * 100);
        const enterBtn = document.querySelector('.enter-btn');
        if (enterBtn && percentage < 100) {
            enterBtn.setAttribute('data-progress', `PREPARING ${percentage}%`);
        } else if (enterBtn) {
            enterBtn.setAttribute('data-progress', 'READY');
        }
    }

    // Start preloading after the welcome title animation
    setTimeout(preloadImages, 2000);

    if (enterBtns.length > 0) {
        document.body.style.overflow = 'hidden';

        enterBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                document.body.classList.add('gallery-active');

                setTimeout(() => {
                    document.body.style.overflowY = 'auto';
                }, 500);

                const targetId = btn.getAttribute('href');

                setTimeout(() => {
                    document.querySelectorAll('.portfolio-item, #about').forEach(el => {
                        observer.observe(el);
                    });

                    if (targetId && targetId !== '#') {
                        const target = document.querySelector(targetId);
                        if (target) target.scrollIntoView({ behavior: 'smooth' });
                    }
                }, 1000);
            });
        });
    }

    // 7. About Modal Logic
    const aboutModal = document.getElementById('about-modal');
    const aboutTriggers = document.querySelectorAll('.about-trigger');
    const modalClose = document.querySelector('.modal-close');

    if (aboutModal && aboutTriggers.length > 0) {
        const openModal = () => {
            aboutModal.classList.add('active');
            document.body.style.overflow = 'hidden';
        };

        const closeModal = () => {
            aboutModal.classList.remove('active');
            // Only restore overflow if gallery isn't active or if we're on the landing page
            if (!document.body.classList.contains('gallery-active')) {
                // We're on landing page, but landing page originally has overflow:hidden until ENTER is clicked
                // Wait, script says document.body.style.overflow = 'hidden' initially (line 175)
            }

            // Simpler approach:
            if (document.body.classList.contains('gallery-active')) {
                document.body.style.overflowY = 'auto';
            } else {
                document.body.style.overflow = 'hidden';
            }
        };

        aboutTriggers.forEach(trigger => {
            trigger.addEventListener('click', (e) => {
                e.preventDefault();
                openModal();
            });
        });

        modalClose?.addEventListener('click', closeModal);

        // Close on click outside content
        aboutModal.addEventListener('click', (e) => {
            if (e.target === aboutModal) closeModal();
        });

        // Close on ESC key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && aboutModal.classList.contains('active')) {
                closeModal();
            }
        });
    }
});

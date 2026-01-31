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

    // 0.1 Disable Double Click
    document.addEventListener('dblclick', e => {
        e.preventDefault();
        e.stopPropagation();
    }, { capture: true });

    // 1. Core State & Elements
    const cursor = document.getElementById('custom-cursor');
    const cursorDot = cursor?.querySelector('div');
    const portfolioGrid = document.querySelector('.portfolio-grid');
    const eventsContainer = document.querySelector('.events-container');
    const rewindOverlay = document.getElementById('rewind-overlay');
    const filmToggle = document.getElementById('film-toggle');
    const modernToggle = document.getElementById('modern-toggle');
    const eventsToggle = document.getElementById('events-toggle');

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
            }, 100);
        } catch (error) {
            console.error('Error loading projects:', error);
        }
    };

    // 2.1 Load Events with New Layout & Color Transitions
    const loadEvents = async () => {
        try {
            const response = await fetch('events.json');
            const events = await response.json();

            if (!eventsContainer) return;

            eventsContainer.innerHTML = events.map((event, index) => `
                <div class="event-section" data-color="${event.color}" data-text="${event.textColor}" data-id="${event.id}">
                    <div class="event-content">
                        <div class="event-image-wrapper">
                             <img src="${event.image}" alt="${event.title}" class="event-image" loading="lazy">
                             ${event.previewImages ? event.previewImages.map((img, i) =>
                `<img src="${img}" class="event-preview" data-index="${i}">`
            ).join('') : ''}
                        </div>
                        <div class="event-details">
                            <span class="event-counter">0${index + 1} / 0${events.length}</span>
                            <h2 class="event-title">${event.title}</h2>
                            <p class="event-desc">${event.description}</p>
                            <button class="event-btn" onclick="openEventGallery(${event.id})">View Gallery</button>
                        </div>
                    </div>
                </div>
            `).join('');

            // Append Footer Section
            const currentYear = new Date().getFullYear();
            const footerHTML = `
                <div class="event-section footer-section" data-color="#000000" data-text="text-white">
                    <footer class="w-full h-full flex flex-col justify-end p-8 pb-12">
                        <div class="flex justify-between items-center text-[9px] tracking-[0.2em] text-neutral-400 uppercase w-full">
                            <p>&copy; <span id="year-events">${currentYear}</span> SPOTTEDBYBRYAN</p>
                            <p>Built for visual excellence</p>
                        </div>
                    </footer>
                </div>
            `;
            eventsContainer.innerHTML += footerHTML;

            // Setup Background Color Observer
            setupEventObserver();

            // Setup Hover Slideshow
            setupEventHover();

        } catch (error) {
            console.error('Error loading events:', error);
        }
    };

    // 2.2 Event Scroll Observer for Background Colors
    const setupEventObserver = () => {
        const eventSections = document.querySelectorAll('.event-section');
        const nav = document.querySelector('.gallery-nav');

        const eventObserverOptions = {
            threshold: 0.5 // Slightly lower default
        };

        const eventObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                // Logic: Only update color if the section is entering the center of the screen
                if (entry.isIntersecting && entry.intersectionRatio > 0.3) {
                    entry.target.classList.add('active');

                    const color = entry.target.getAttribute('data-color');
                    const textColorClass = entry.target.getAttribute('data-text');

                    if (color) {
                        document.body.style.backgroundColor = color;

                        if (textColorClass === 'text-black') {
                            document.body.classList.remove('text-white');
                            document.body.classList.add('text-black');
                            if (nav) nav.style.color = 'black';
                        } else {
                            document.body.classList.remove('text-black');
                            document.body.classList.add('text-white');
                            if (nav) nav.style.color = 'white';
                        }
                    }

                    // Mobile Autoplay Slideshow
                    if (window.innerWidth <= 768 && entry.target._startSlideshow) {
                        entry.target._startSlideshow();
                    }
                } else {
                    // Stop slideshow when moving away
                    if (window.innerWidth <= 768 && entry.target._stopSlideshow) {
                        entry.target._stopSlideshow();
                    }
                }
            });
        }, {
            threshold: [0.1, 0.4, 0.7],
            rootMargin: '-15% 0px -15% 0px'
        });


        eventSections.forEach(section => {
            eventObserver.observe(section);
        });
    };

    // 2.3 Event Hover Slideshow Logic
    const setupEventHover = () => {
        const sections = document.querySelectorAll('.event-section');

        sections.forEach(section => {
            const wrapper = section.querySelector('.event-image-wrapper');
            const previews = section.querySelectorAll('.event-preview');

            if (!wrapper || previews.length === 0) return;

            let interval;

            const startSlideshow = () => {
                if (interval) return; // Prevent multiple intervals
                let cycleIndex = 0;
                previews.forEach(p => p.classList.remove('active-preview'));
                previews[0].classList.add('active-preview');

                interval = setInterval(() => {
                    cycleIndex = (cycleIndex + 1) % previews.length;
                    previews.forEach(p => p.classList.remove('active-preview'));
                    previews[cycleIndex].classList.add('active-preview');
                }, 1500); // Slower for mobile/scrolling
            };

            const stopSlideshow = () => {
                clearInterval(interval);
                interval = null;
                previews.forEach(p => p.classList.remove('active-preview'));
            };

            // Attach to element for observer access
            section._startSlideshow = startSlideshow;
            section._stopSlideshow = stopSlideshow;

            wrapper.addEventListener('mouseenter', startSlideshow);
            wrapper.addEventListener('mouseleave', stopSlideshow);
        });
    };

    // 2.4 Open Event Gallery
    window.openEventGallery = async (eventId) => {
        try {
            const response = await fetch('events.json');
            const events = await response.json();
            const event = events.find(e => e.id === eventId);

            if (!event || !event.gallery) return;

            // Create or Get Detail View Container
            let detailView = document.getElementById('event-detail-view');
            if (!detailView) {
                detailView = document.createElement('div');
                detailView.id = 'event-detail-view';
                detailView.className = 'event-detail-view';
                document.body.appendChild(detailView);
            }

            // Populate
            detailView.innerHTML = `
                <div class="detail-close-btn" onclick="closeEventGallery()">Close Gallery</div>
                <div class="max-w-7xl mx-auto">
                    <h2 class="text-4xl md:text-6xl font-bold text-white mb-2 uppercase tracking-tighter">${event.title}</h2> 
                    <p class="text-neutral-400 text-sm tracking-widest uppercase mb-12">${event.location} // ${event.date}</p>
                    
                    <div class="event-gallery-grid">
                        ${event.gallery.map(img => `
                            <div class="event-gallery-item reveal">
                                <img src="${img}" loading="lazy" alt="Gallery Image">
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;

            // Show
            requestAnimationFrame(() => {
                detailView.classList.add('active');
                document.body.style.overflow = 'hidden'; // Lock scroll
            });

            // Trigger reveals in the new view
            setTimeout(() => {
                const newReveals = detailView.querySelectorAll('.reveal');
                const observer = new IntersectionObserver((entries) => {
                    entries.forEach(entry => {
                        if (entry.isIntersecting) entry.target.classList.add('active');
                    });
                }, { threshold: 0.1 });
                newReveals.forEach(el => observer.observe(el));
            }, 100);

        } catch (error) {
            console.error('Error opening gallery:', error);
        }
    };

    window.closeEventGallery = () => {
        const detailView = document.getElementById('event-detail-view');
        if (detailView) {
            detailView.classList.remove('active');
            // If in events mode, we usually keep body overflow hidden, 
            // but if we came from another mode we might need to restore it.
            // Our current system locks body scroll in events mode anyway.

            setTimeout(() => {
                detailView.innerHTML = '';
            }, 500);
        }
    };




    // 3. Setup Cursor Interactions
    const setupCursorInteractions = () => {
        if (!cursor) return;

        // Global Delegation for cursor effects
        document.addEventListener('mouseover', (e) => {
            const target = e.target.closest('a, .portfolio-item, button, .event-item');
            if (target && cursorDot) {
                cursorDot.style.transform = 'translate(-50%, -50%) scale(4)';
                cursorDot.style.opacity = '0.3';
            }
        });

        document.addEventListener('mouseout', (e) => {
            const target = e.target.closest('a, .portfolio-item, button, .event-item');
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
        document.querySelectorAll('.portfolio-item, #about, .event-item, footer').forEach(el => {
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
                    enterBtn.setAttribute('data-progress', '');
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
            // If clicking #portfolio or events-toggle, we handle it separately, but smooth scroll is good.
            // Exception: modern-toggle is often #portfolio
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

                    // If in film mode or events mode, we might want to keep the nav visible or handle its opacity differently
                    if (document.body.classList.contains('film-mode') || currentMode === 'events') {
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


    // 10. Mode Toggle Logic (Modern, Film, Events)
    const switchContent = (mode) => {
        // Reset Layout & Classes
        if (mode === 'film') {
            document.body.classList.add('film-mode');
            filmToggle.classList.add('hidden');
            modernToggle.classList.remove('hidden');
            eventsToggle.classList.remove('hidden');
            loadProjects('film-projects.json');

            if (portfolioGrid) {
                portfolioGrid.style.display = 'flex';
                // Ensure opacity transition happens a frame later
                requestAnimationFrame(() => {
                    portfolioGrid.style.opacity = '1';
                });
            }
            if (eventsContainer) eventsContainer.classList.add('hidden');

        } else if (mode === 'modern') {
            document.body.classList.remove('film-mode');
            filmToggle.classList.remove('hidden');
            modernToggle.classList.add('hidden');
            eventsToggle.classList.remove('hidden');

            // Fading out events before calling loadProjects
            if (eventsContainer) {
                eventsContainer.style.opacity = '0';
                setTimeout(() => eventsContainer.classList.add('hidden'), 400);
            }

            loadProjects('projects.json');

            if (portfolioGrid) {
                portfolioGrid.style.display = 'grid';
                requestAnimationFrame(() => {
                    portfolioGrid.style.opacity = '1';
                });
            }

        } else if (mode === 'events') {
            document.body.classList.remove('film-mode');
            filmToggle.classList.remove('hidden');
            modernToggle.classList.remove('hidden');
            eventsToggle.classList.add('hidden');

            if (portfolioGrid) {
                portfolioGrid.style.display = 'none';
                portfolioGrid.style.opacity = '0';
            }
            if (eventsContainer) {
                eventsContainer.classList.remove('hidden');
                requestAnimationFrame(() => {
                    eventsContainer.style.opacity = '1';
                });
            }

            // Reset Body Styles before entering events mode
            document.body.style.backgroundColor = '';
            document.body.classList.remove('text-black', 'text-white');

            // Lock Body Scroll for pure Event container usage
            document.body.style.overflow = 'hidden';
            loadEvents();
            currentMode = mode;
            return; // Exit early, events handles its own setup
        }

        // Reset Body Scroll/Styles if NOT events
        document.body.style.overflow = '';
        document.body.style.backgroundColor = '';
        document.body.classList.remove('text-black', 'text-white');
        const nav = document.querySelector('.gallery-nav');
        if (nav) nav.style.color = '';

        currentMode = mode;

        // Reset scroll position for the grid
        if (portfolioGrid) portfolioGrid.scrollLeft = 0;
        window.scrollTo({ top: 0, behavior: 'instant' });
    };

    const toggleMode = (mode) => {
        if (mode === currentMode) return;

        // Determine Transition Type
        // RULE: If either Source OR Target is 'film', use REWIND. Otherwise use FADE.
        const useRewind = (mode === 'film' || currentMode === 'film');

        if (useRewind) {
            // REWIND TRANSITION
            if (rewindOverlay) {
                rewindOverlay.classList.add('active');

                // Halfway through animation, switch content
                setTimeout(() => {
                    switchContent(mode);
                }, 400);

                // Clean up animation
                setTimeout(() => {
                    rewindOverlay.classList.remove('active');
                }, 800);
            }
        } else {
            // FADE TRANSITION (Modern <-> Events)
            // Snappier 400ms transition for better UX
            if (currentMode === 'events' && eventsContainer) {
                eventsContainer.style.opacity = '0';
            } else if (portfolioGrid) {
                portfolioGrid.style.opacity = '0';
            }

            // Reset background immediately to start the fade alongside content
            document.body.style.backgroundColor = '';
            document.body.classList.remove('text-black', 'text-white');

            setTimeout(() => {
                switchContent(mode);
            }, 400);
        }
    };


    if (filmToggle) filmToggle.addEventListener('click', () => toggleMode('film'));
    if (modernToggle) modernToggle.addEventListener('click', () => toggleMode('modern'));
    if (eventsToggle) eventsToggle.addEventListener('click', () => toggleMode('events'));

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


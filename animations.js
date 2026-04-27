document.addEventListener("DOMContentLoaded", () => {
    if (typeof anime === "undefined") return;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const motionFactor = reducedMotion ? 0.65 : 1;
    const d = (ms) => Math.round(ms * motionFactor);

    const animatePress = (selector, scaleUp = 1.1) => {
        document.querySelectorAll(selector).forEach((el) => {
            el.addEventListener("click", () => {
                anime.remove(el);
                anime({
                    targets: el,
                    scale: [{ value: scaleUp, duration: d(130) }, { value: 1, duration: d(170) }],
                    easing: "easeOutCubic"
                });
            });
        });
    };

    //         GLOBAL BUTTON FEEDBACK 
    animatePress("#play", 1.22);
    animatePress("#playerToggle", 1.16);
    animatePress(".player-circle-btn", 1.12);
    animatePress(".login-btn, .hero-secondary-btn, .page-back-btn, .player-search-submit", 1.05);

    //                 
    //  DYNAMIC CARD HOVER (works for API-loaded cards too) 
    document.addEventListener("mouseover", (e) => {
        const target = e.target;
        if (!(target instanceof Element)) return;
        const card = target.closest(".music-card");
        if (!card) return;

        anime.remove(card);
        anime({
            targets: card,
            translateY: -10,
            scale: 1.035,
            duration: d(260),
            easing: "easeOutQuart"
        });
    });

    document.addEventListener("mouseout", (e) => {
        const target = e.target;
        if (!(target instanceof Element)) return;
        const card = target.closest(".music-card");
        if (!card) return;
        if (card.contains(e.relatedTarget)) return;

        anime.remove(card);
        anime({
            targets: card,
            translateY: 0,
            scale: 1,
            duration: d(220),
            easing: "easeOutQuad"
        });
    });

    //  HOME PAGE REVEAL 
    if (document.querySelector(".main")) {
        anime.timeline({ easing: "easeOutExpo" })
            .add({
                targets: "nav",
                opacity: [0, 1],
                translateY: [-18, 0],
                duration: d(480)
            })
            .add({
                targets: ".main-left-part",
                opacity: [0, 1],
                translateY: [20, 0],
                duration: d(560)
            }, "-=220")
            .add({
                targets: ".main-right-part",
                opacity: [0, 1],
                translateY: [24, 0],
                duration: d(600)
            }, "-=480")
            .add({
                targets: ".player-bar",
                opacity: [0, 1],
                translateY: [16, 0],
                duration: d(450)
            }, "-=420");

        anime({
            targets: ".music-section",
            opacity: [0, 1],
            translateY: [24, 0],
            delay: anime.stagger(110, { start: 180 }),
            duration: d(520),
            easing: "easeOutCubic"
        });

        // Song cards popup animation when API data loads
        const sectionIds = ["#popular-songs", "#trending-songs", "#top-songs"];
        const observedSections = sectionIds
            .map((id) => document.querySelector(id))
            .filter(Boolean);

        const animateCardsPopup = (cards) => {
            if (!cards.length) return;

            cards.forEach((card) => {
                if (!(card instanceof HTMLElement)) return;
                card.style.opacity = "0";
                card.style.transform = "translateY(24px) scale(0.92)";
            });

            anime({
                targets: cards,
                opacity: [0, 1],
                translateY: [24, 0],
                scale: [0.92, 1],
                duration: d(560),
                delay: anime.stagger(80),
                easing: "easeOutBack"
            });
        };

        observedSections.forEach((section) => {
            const observer = new MutationObserver((mutations) => {
                const freshCards = [];

                mutations.forEach((mutation) => {
                    mutation.addedNodes.forEach((node) => {
                        if (!(node instanceof HTMLElement)) return;
                        if (node.classList.contains("music-card")) {
                            if (!node.dataset.popupAnimated) {
                                node.dataset.popupAnimated = "1";
                                freshCards.push(node);
                            }
                        }

                        node.querySelectorAll?.(".music-card").forEach((card) => {
                            if (!(card instanceof HTMLElement)) return;
                            if (!card.dataset.popupAnimated) {
                                card.dataset.popupAnimated = "1";
                                freshCards.push(card);
                            }
                        });
                    });
                });

                animateCardsPopup(freshCards);
            });

            observer.observe(section, { childList: true, subtree: true });

            // In case cards already rendered before observer setup
            const existingCards = Array.from(section.querySelectorAll(".music-card")).filter(
                (card) => !card.dataset.popupAnimated
            );

            existingCards.forEach((card) => {
                card.dataset.popupAnimated = "1";
            });

            animateCardsPopup(existingCards);
        });
    }

    //  PLAYER PAGE REVEAL 
    if (document.querySelector(".player-page-shell")) {
        anime.timeline({ easing: "easeOutExpo" })
            .add({
                targets: ".player-topbar",
                opacity: [0, 1],
                translateY: [-16, 0],
                duration: d(450)
            })
            .add({
                targets: ".player-stage-card",
                opacity: [0, 1],
                translateY: [30, 0],
                duration: d(620)
            }, "-=180")
            .add({
                targets: ".player-queue-panel",
                opacity: [0, 1],
                translateY: [24, 0],
                duration: d(580)
            }, "-=430");

        anime({
            targets: [".player-kicker", ".player-song-title", ".player-song-artist", ".player-song-album"],
            opacity: [0, 1],
            translateY: [16, 0],
            delay: anime.stagger(90, { start: 120 }),
            duration: d(520),
            easing: "easeOutCubic"
        });

        anime({
            targets: ".player-controls-card",
            opacity: [0, 1],
            scale: [0.96, 1],
            translateY: [18, 0],
            duration: d(620),
            delay: d(180),
            easing: "easeOutBack"
        });

        anime({
            targets: ".player-glow",
            scale: [1, 1.08],
            opacity: [0.45, 0.78],
            duration: d(2300),
            direction: "alternate",
            loop: true,
            easing: "easeInOutSine"
        });
    }

    //  MUTATION HELPERS
    const collectAddedTargets = (mutations, selector) => {
        const fresh = [];
        mutations.forEach((mutation) => {
            mutation.addedNodes.forEach((node) => {
                if (!(node instanceof HTMLElement)) return;
                if (node.matches(selector)) fresh.push(node);
                fresh.push(...node.querySelectorAll(selector));
            });
        });
        return fresh;
    };

    // SEARCH RESULTS ENTRY 
    const searchResultsEl = document.querySelector(".search-results");
    if (searchResultsEl) {
        const searchObserver = new MutationObserver((mutations) => {
            const newItems = collectAddedTargets(mutations, ".search-item");
            if (!newItems.length) return;

            anime({
                targets: newItems,
                opacity: [0, 1],
                translateY: [14, 0],
                duration: d(320),
                delay: anime.stagger(45),
                easing: "easeOutQuad"
            });
        });

        searchObserver.observe(searchResultsEl, { childList: true, subtree: true });
    }

    // Queue/song-change animations removed as requested.
});
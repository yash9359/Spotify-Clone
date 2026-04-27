document.addEventListener("DOMContentLoaded", function () {
    const API_LIST = [
        "https://jiosaavn-api-privatecvc2.vercel.app",
        "https://saavn.dev/api",
        "https://jiosaavn-api-2-harsh-patel.vercel.app"
    ];
    let currentApiIndex = 0;
    let API_BASE = API_LIST[0];
    const MAX_RETRIES = 3;
    const FETCH_TIMEOUT = 8000; // 8 seconds timeout

    const play = document.getElementById("play");
    const progressBar = document.getElementById("progressBar");
    const forward = document.getElementById("forward");
    const backward = document.getElementById("backward");
    const shuffle = document.getElementById("shuffle");
    const repeat = document.getElementById("repeat");
    const searchInput = document.querySelector(".input-box");
    const searchResults = document.getElementById("search-results");
    const nowImg = document.querySelector(".now-img");
    const nowInfo = document.querySelector(".now-info");
    const nowTitle = document.querySelector(".img-title-info");
    const nowDes = document.querySelector(".img-des-info");
    const idlePlayer = document.querySelector(".idle-player");
    const idleTip = document.querySelector(".idle-tip");
    const homeIcon = document.querySelector(".home-icon");
    const logo = document.querySelector(".logo");

    const idleTips = [
        "Explore trending songs above ↑",
        "Press Space to play/pause 🎵",
        "Use ← → to skip songs",
        "Search any song or artist 🔍",
        "Press M to mute/unmute 🔇",
        "Use ↑ ↓ to change volume",
        "Shuffle ON for surprises 🎲",
        "Try searching your fav artist ✨",
        "Good music = Good mood 💚",
    ];
    let tipIndex = 0;
    let tipInterval = null;

    function startIdleTips() {
        if (tipInterval) return;
        tipInterval = setInterval(() => {
            tipIndex = (tipIndex + 1) % idleTips.length;
            if (idleTip) {
                idleTip.style.opacity = '0';
                setTimeout(() => {
                    idleTip.textContent = idleTips[tipIndex];
                    idleTip.style.opacity = '1';
                }, 400);
            }
        }, 3500);
    }

    function stopIdleTips() {
        if (tipInterval) {
            clearInterval(tipInterval);
            tipInterval = null;
        }
    }

    function showIdleState() {
        if (idlePlayer) idlePlayer.classList.remove('hidden');
        nowImg.style.display = 'none';
        if (nowInfo) nowInfo.style.display = 'none';
        startIdleTips();
    }

    function hideIdleState() {
        if (idlePlayer) idlePlayer.classList.add('hidden');
        nowImg.style.display = '';
        if (nowInfo) nowInfo.style.display = '';
        stopIdleTips();
    }

    startIdleTips();
    const volumeBar = document.getElementById("volumeBar");
    const volumeIcon = document.getElementById("volumeIcon");
    const currentTimeEl = document.getElementById("currentTime");
    const totalTimeEl = document.getElementById("totalTime");

    let audio = new Audio();
    audio.volume = 0.7;
    let playlist = [];
    let currentIndex = -1;
    let isPlaying = false;
    let songOnRepeat = false;
    let songOnShuffle = false;

    const mobileSearchBtn = document.querySelector(".mobile-search-btn");
    const searchContainer = document.querySelector(".search-container");

    if (mobileSearchBtn) {
        mobileSearchBtn.addEventListener("click", () => {
            searchContainer.classList.toggle("mobile-active");
            if (searchContainer.classList.contains("mobile-active")) {
                setTimeout(() => searchInput.focus(), 100);
            }
        });

        document.addEventListener("keydown", (e) => {
            if (e.key === "Escape" && searchContainer.classList.contains("mobile-active")) {
                searchContainer.classList.remove("mobile-active");
            }
        });

        searchContainer.addEventListener("click", (e) => {
            if (e.target === searchContainer) {
                searchContainer.classList.remove("mobile-active");
            }
        });
    }


    function formatTime(sec) {
        if (isNaN(sec)) return "0:00";
        const m = Math.floor(sec / 60);
        const s = Math.floor(sec % 60);
        return `${m}:${s < 10 ? "0" : ""}${s}`;
    }

    function formatDuration(seconds) {
        const s = parseInt(seconds);
        if (isNaN(s)) return "";
        const m = Math.floor(s / 60);
        const sec2 = s % 60;
        return `${m}:${sec2 < 10 ? "0" : ""}${sec2}`;
    }

    function getAudioUrl(song) {
        if (!song.downloadUrl || !song.downloadUrl.length) return null;
        const q = song.downloadUrl.find((d) => d.quality === "160kbps");
        return q ? q.link : song.downloadUrl[song.downloadUrl.length - 1].link;
    }

    const FALLBACK_IMG = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='500' height='500' viewBox='0 0 500 500'%3E%3Crect width='500' height='500' fill='%23121212'/%3E%3Ctext x='50%25' y='54%25' dominant-baseline='middle' text-anchor='middle' font-size='160' fill='%231db954'%3E%26%23127925%3B%3C/text%3E%3C/svg%3E`;

    function getImageUrl(song) {
        if (!song.image || !song.image.length) return FALLBACK_IMG;
        const q = song.image.find((i) => i.quality === "500x500");
        return q ? q.link : song.image[song.image.length - 1].link;
    }

    function openPlayerPage(song, queue = [song], queueIndex = 0, searchQuery = "") {
        if (!song) return;

        const safeQueue = Array.isArray(queue) && queue.length ? queue : [song];
        const state = {
            queue: safeQueue,
            currentIndex: queueIndex,
            searchQuery,
            openedFrom: "home",
            savedAt: Date.now(),
        };

        sessionStorage.setItem("spotifyPlayerState", JSON.stringify(state));

        const params = new URLSearchParams({
            index: String(queueIndex),
        });

        if (searchQuery) {
            params.set("query", searchQuery);
        } else if (song.name) {
            params.set("song", song.name);
        }

        window.location.href = `player.html?${params.toString()}`;
    }

    function loadStoredPlayerState() {
        try {
            return JSON.parse(sessionStorage.getItem("spotifyPlayerState") || "null");
        } catch (error) {
            return null;
        }
    }

    async function restorePlaybackFromPlayerState() {
        const stored = loadStoredPlayerState();
        if (!stored?.returnToHome || !Array.isArray(stored.queue) || stored.queue.length === 0) {
            return false;
        }

        playlist = stored.queue.slice();

        const requestedIndex = parseInt(stored.currentIndex, 10);
        const safeIndex = Number.isNaN(requestedIndex)
            ? 0
            : Math.min(Math.max(requestedIndex, 0), playlist.length - 1);

        if (typeof stored.volume === "number" && Number.isFinite(stored.volume)) {
            audio.volume = Math.min(1, Math.max(0, stored.volume));
            volumeBar.value = String(Math.round(audio.volume * 100));
            volumeBar.style.background = `linear-gradient(to right, #1db954 ${volumeBar.value}%, #333 ${volumeBar.value}%)`;
            updateVolumeIcon();
        }

        songOnShuffle = Boolean(stored.songOnShuffle);
        songOnRepeat = Boolean(stored.songOnRepeat);
        shuffle.classList.toggle("active", songOnShuffle);
        repeat.classList.toggle("active", songOnRepeat);

        const seekTime = Number(stored.currentTime);
        const shouldKeepPlaying = stored.wasPlaying !== false;

        playSongAtIndex(safeIndex);

        const applySeekAndPlayState = () => {
            if (Number.isFinite(seekTime) && seekTime > 0 && Number.isFinite(audio.duration) && audio.duration > 0) {
                audio.currentTime = Math.min(seekTime, Math.max(audio.duration - 0.25, 0));
            }

            if (!shouldKeepPlaying) {
                audio.pause();
                isPlaying = false;
                play.classList.remove("fa-circle-pause");
                play.classList.add("fa-circle-play");
                nowImg.classList.add("paused");
                updateAllCardButtons();
            }
        };

        if (audio.readyState >= 1) {
            applySeekAndPlayState();
        } else {
            audio.addEventListener("loadedmetadata", applySeekAndPlayState, { once: true });
        }

        sessionStorage.removeItem("spotifyPlayerState");
        return true;
    }

    

    function showToast(message, type = 'error', duration = 3500) {
        // Remove existing toast
        const existing = document.querySelector('.toast-notification');
        if (existing) existing.remove();

        const toast = document.createElement('div');
        toast.className = 'toast-notification';
        toast.innerHTML = `
            <i class="fa-solid ${type === 'error' ? 'fa-circle-exclamation' : type === 'success' ? 'fa-circle-check' : 'fa-circle-info'}"></i>
            <span>${message}</span>
        `;
        document.body.appendChild(toast);

        // Animate in
        requestAnimationFrame(() => toast.classList.add('show'));

        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, duration);
    }

    

    window.addEventListener('offline', () => {
        showToast('Internet disconnected! Songs won\'t load.', 'error', 5000);
    });

    window.addEventListener('online', () => {
        showToast('Back online! 🎵', 'success', 2500);
    });

    

    async function fetchWithTimeout(url, timeout = FETCH_TIMEOUT) {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), timeout);
        try {
            const response = await fetch(url, { signal: controller.signal });
            clearTimeout(timer);
            return response;
        } catch (e) {
            clearTimeout(timer);
            throw e;
        }
    }

    

    function switchToNextApi() {
        currentApiIndex = (currentApiIndex + 1) % API_LIST.length;
        API_BASE = API_LIST[currentApiIndex];
        console.log(`Switched to fallback API: ${API_BASE}`);
    }



    async function searchSongs(query, limit = 15) {
        let lastError = null;

        for (let apiAttempt = 0; apiAttempt < API_LIST.length; apiAttempt++) {
            for (let retry = 0; retry < 2; retry++) {
                try {
                    if (!navigator.onLine) {
                        showToast('No internet connection!', 'error');
                        return [];
                    }

                    const res = await fetchWithTimeout(
                        `${API_BASE}/search/songs?query=${encodeURIComponent(query)}&limit=${limit}`
                    );

                    if (!res.ok) {
                        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
                    }

                    const data = await res.json();

                    if (data.status === "SUCCESS" && data.data?.results?.length > 0) {
                        return data.data.results;
                    }

                    if (data.data?.results?.length > 0) {
                        return data.data.results;
                    }

                    if (data.results?.length > 0) {
                        return data.results;
                    }

                    return [];
                } catch (e) {
                    lastError = e;
                    console.warn(`API attempt failed [${API_BASE}] retry ${retry + 1}:`, e.message);

                    if (retry < 1) {
                        await new Promise(r => setTimeout(r, 1000 * (retry + 1)));
                    }
                }
            }

            switchToNextApi();
            console.log(`Trying fallback API: ${API_BASE}`);
        }

        console.error("All APIs failed:", lastError);
        showToast('Server down. Please try again later.', 'error', 4000);
        return [];
    }

    

    function createSongCard(song, globalIndex, queueOverride = null, queueIndex = 0) {
        const card = document.createElement("div");
        card.className = "music-card";
        const duration = song.duration ? formatDuration(song.duration) : "";
        card.innerHTML = `
            <img src="${getImageUrl(song)}" alt="${song.name}" loading="lazy" />
            <div class="music-play-btn">
                <i data-index="${globalIndex}" class="playmusic fa-sharp fa-solid fa-circle-play"></i>
            </div>
            ${duration ? `<span class="song-duration">${duration}</span>` : ""}
            <div class="img-title" title="${song.name}">${song.name}</div>
            <div class="img-description" title="${song.primaryArtists}">${song.primaryArtists}</div>
        `;

        const launchPlayer = () => {
            openPlayerPage(song, queueOverride || [song], queueIndex, "");
        };

        card.addEventListener("click", launchPlayer);
        card.querySelector(".playmusic").addEventListener("click", (e) => {
            e.stopPropagation();
            launchPlayer();
        });
        return card;
    }

    async function loadSection(query, containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;
        container.innerHTML =
            '<div class="loading"><div class="spinner"></div> Loading songs...</div>';

        const songs = await searchSongs(query, 10);
        container.innerHTML = "";

        if (songs.length === 0) {
            const errorDiv = document.createElement('div');
            errorDiv.className = 'loading';
            errorDiv.style.flexDirection = 'column';
            errorDiv.style.gap = '12px';

            const isOffline = !navigator.onLine;
            const msg = isOffline
                ? '📡 No internet connection'
                : '⚠️ Could not load songs. Server might be down.';

            errorDiv.innerHTML = `
                <span>${msg}</span>
                <button class="retry-btn" style="background:#1db954;color:black;border:none;padding:8px 20px;border-radius:20px;font-weight:600;cursor:pointer;font-family:inherit;font-size:0.9rem;transition:0.2s;">
                    <i class="fa-solid fa-rotate-right"></i> Retry
                </button>
            `;

            errorDiv.querySelector('.retry-btn').addEventListener('click', (e) => {
                e.target.closest('.retry-btn').innerHTML = '<div class="spinner" style="width:16px;height:16px;display:inline-block;"></div> Retrying...';
                loadSection(query, containerId);
            });

            container.appendChild(errorDiv);
            return;
        }

        songs.forEach((song, songIndex) => {
            const idx = playlist.length;
            playlist.push(song);
            container.appendChild(createSongCard(song, idx, songs, songIndex));
        });
    }



    function updateAllCardButtons() {
        document.querySelectorAll(".playmusic").forEach((el) => {
            el.classList.remove("fa-circle-pause");
            el.classList.add("fa-circle-play");
        });
        if (isPlaying && currentIndex >= 0) {
            const btn = document.querySelector(
                `.playmusic[data-index="${currentIndex}"]`
            );
            if (btn) {
                btn.classList.remove("fa-circle-play");
                btn.classList.add("fa-circle-pause");
            }
        }
    }

    function updateNowBar(song) {
        hideIdleState();
        nowImg.src = getImageUrl(song);
        nowTitle.innerText = song.name;
        nowDes.innerText = song.primaryArtists;

        // Browser tab title
        document.title = `${song.name} • ${song.primaryArtists} | Spotify`;

        // Marquee if title is too long
        if (song.name.length > 18) {
            nowTitle.classList.add("marquee");
        } else {
            nowTitle.classList.remove("marquee");
        }

        // Now-img spinning
        nowImg.classList.add("now-spinning");
        nowImg.classList.remove("paused");

        // MediaSession API (OS media controls / lock screen)
        if ('mediaSession' in navigator) {
            navigator.mediaSession.metadata = new MediaMetadata({
                title: song.name,
                artist: song.primaryArtists,
                album: song.album?.name || '',
                artwork: (song.image || []).map(img => ({
                    src: img.link,
                    sizes: img.quality === '500x500' ? '512x512' : img.quality === '150x150' ? '128x128' : '96x96',
                    type: 'image/jpeg'
                }))
            });

            navigator.mediaSession.setActionHandler('play', () => togglePlay());
            navigator.mediaSession.setActionHandler('pause', () => togglePlay());
            navigator.mediaSession.setActionHandler('previoustrack', () => playPrev());
            navigator.mediaSession.setActionHandler('nexttrack', () => playNext());
        }
    }

    function playSongAtIndex(index) {
        if (index < 0 || index >= playlist.length) return;

        const song = playlist[index];
        const url = getAudioUrl(song);
        if (!url) {
            showToast('Song URL not available, skipping...', 'error', 2000);
            // Skip to next song
            currentIndex = index;
            setTimeout(() => playNext(), 500);
            return;
        }

        currentIndex = index;
        audio.src = url;
        
        const playPromise = audio.play();
        if (playPromise !== undefined) {
            playPromise.then(() => {
                isPlaying = true;
            }).catch((err) => {
                console.warn('Play was interrupted:', err.message);
                // Auto-play might be blocked by browser
                if (err.name === 'NotAllowedError') {
                    showToast('Click play to start the song', 'info', 2500);
                    isPlaying = false;
                    play.classList.remove("fa-circle-pause");
                    play.classList.add("fa-circle-play");
                    updateAllCardButtons();
                }
            });
        }

        isPlaying = true;
        updateNowBar(song);

        play.classList.remove("fa-circle-play");
        play.classList.add("fa-circle-pause");

        updateAllCardButtons();
    }

    function togglePlay() {
        if (currentIndex === -1 && playlist.length > 0) {
            playSongAtIndex(0);
            return;
        }
        if (audio.paused) {
            audio.play();
            isPlaying = true;
            play.classList.remove("fa-circle-play");
            play.classList.add("fa-circle-pause");
            nowImg.classList.remove("paused");
        } else {
            audio.pause();
            isPlaying = false;
            play.classList.remove("fa-circle-pause");
            play.classList.add("fa-circle-play");
            nowImg.classList.add("paused");
        }
        updateAllCardButtons();
    }

    
    audio.addEventListener("ended", () => {
        // If repeat is off and we're at the last song, go idle
        if (!songOnRepeat && !songOnShuffle && currentIndex >= playlist.length - 1) {
            isPlaying = false;
            currentIndex = -1;
            play.classList.remove("fa-circle-pause");
            play.classList.add("fa-circle-play");
            nowImg.classList.remove("now-spinning");
            nowImg.classList.remove("paused");
            showIdleState();
            document.title = 'Spotify';
            progressBar.value = 0;
            document.getElementById('currentTime').textContent = '0:00';
            document.getElementById('totalTime').textContent = '0:00';
            updateAllCardButtons();
            return;
        }
        playNext();
    });

    function playNext() {
        if (playlist.length === 0) return;
        if (songOnRepeat) {
            audio.currentTime = 0;
            audio.play();
            return;
        }
        let next;
        if (songOnShuffle) {
            next = Math.floor(Math.random() * playlist.length);
        } else {
            next = (currentIndex + 1) % playlist.length;
        }
        playSongAtIndex(next);
    }

    function playPrev() {
        if (playlist.length === 0) return;
        // Agar 3 second se zyada baj chuka hai, restart current song
        if (audio.currentTime > 3) {
            audio.currentTime = 0;
            return;
        }
        let prev;
        if (songOnShuffle) {
            prev = Math.floor(Math.random() * playlist.length);
        } else {
            prev = (currentIndex - 1 + playlist.length) % playlist.length;
        }
        playSongAtIndex(prev);
    }


    play.addEventListener("click", togglePlay);
    forward.addEventListener("click", playNext);
    backward.addEventListener("click", playPrev);

    let audioErrorCount = 0;
    const MAX_AUDIO_ERRORS = 3;

    audio.addEventListener("error", () => {
        audioErrorCount++;
        console.error(`Audio error #${audioErrorCount} for song index ${currentIndex}`);

        if (audioErrorCount >= MAX_AUDIO_ERRORS) {
            showToast('Multiple songs failed to load. Check your connection.', 'error', 4000);
            audioErrorCount = 0;
            isPlaying = false;
            currentIndex = -1;
            play.classList.remove("fa-circle-pause");
            play.classList.add("fa-circle-play");
            showIdleState();
            document.title = 'Spotify';
            updateAllCardButtons();
            return;
        }

        if (currentIndex >= 0 && currentIndex < playlist.length) {
            const song = playlist[currentIndex];
            const urls = song.downloadUrl || [];
            const currentUrl = audio.src;

            const altUrl = urls.find(u => u.link !== currentUrl);
            if (altUrl) {
                showToast('Trying different quality...', 'info', 1500);
                audio.src = altUrl.link;
                audio.play().catch(() => {
                    showToast('Song unavailable, skipping...', 'error', 2000);
                    setTimeout(() => playNext(), 1000);
                });
                return;
            }
        }

        showToast('Song unavailable, skipping...', 'error', 2000);
        nowTitle.innerText = "Error loading song";
        nowDes.innerText = "Skipping to next...";
        setTimeout(() => playNext(), 1500);
    });

    audio.addEventListener("playing", () => {
        audioErrorCount = 0;
    });

    let bufferToast = false;
    audio.addEventListener("waiting", () => {
        if (!bufferToast) {
            showToast("Buffering...", "info", 2000);
            bufferToast = true;
            setTimeout(() => bufferToast = false, 3000);
        }
    });

    audio.addEventListener("stalled", () => {
        showToast("Song stalled. Trying to resume...", "info", 2500);
    });

    audio.addEventListener("timeupdate", () => {
        let progress = (audio.currentTime / audio.duration) * 100;
        if (isNaN(progress)) progress = 0;
        progressBar.value = progress;
        progressBar.style.background = `linear-gradient(to right, #1db954 ${progress}%, #333 ${progress}%)`;
        currentTimeEl.innerText = formatTime(audio.currentTime);
        totalTimeEl.innerText = formatTime(audio.duration);
    });

    progressBar.addEventListener("input", function () {
        const value = this.value;
        this.style.background = `linear-gradient(to right, #1db954 ${value}%, #333 ${value}%)`;
        audio.currentTime = (value * audio.duration) / 100;
    });


    volumeBar.addEventListener("input", function () {
        audio.volume = this.value / 100;
        const value = this.value;
        this.style.background = `linear-gradient(to right, #1db954 ${value}%, #333 ${value}%)`;
        updateVolumeIcon();
    });

    function updateVolumeIcon() {
        volumeIcon.classList.remove(
            "fa-volume-high",
            "fa-volume-low",
            "fa-volume-xmark"
        );
        if (audio.volume === 0) volumeIcon.classList.add("fa-volume-xmark");
        else if (audio.volume < 0.5) volumeIcon.classList.add("fa-volume-low");
        else volumeIcon.classList.add("fa-volume-high");
    }

    volumeIcon.addEventListener("click", () => {
        if (audio.volume > 0) {
            audio.dataset.prevVol = audio.volume;
            audio.volume = 0;
            volumeBar.value = 0;
        } else {
            audio.volume = parseFloat(audio.dataset.prevVol) || 0.7;
            volumeBar.value = audio.volume * 100;
        }
        const v = volumeBar.value;
        volumeBar.style.background = `linear-gradient(to right, #1db954 ${v}%, #333 ${v}%)`;
        updateVolumeIcon();
    });

    volumeBar.style.background = `linear-gradient(to right, #1db954 70%, #333 70%)`;


    shuffle.addEventListener("click", () => {
        songOnShuffle = !songOnShuffle;
        songOnRepeat = false;
        shuffle.classList.toggle("active", songOnShuffle);
        repeat.classList.remove("active");
    });

    repeat.addEventListener("click", () => {
        songOnRepeat = !songOnRepeat;
        songOnShuffle = false;
        repeat.classList.toggle("active", songOnRepeat);
        shuffle.classList.remove("active");
    });

    // ===== Search =====

    let searchTimeout;

    searchInput.addEventListener("input", (e) => {
        clearTimeout(searchTimeout);
        const query = e.target.value.trim();
        if (query.length < 2) {
            searchResults.style.display = "none";
            return;
        }
        searchTimeout = setTimeout(async () => {
            searchResults.innerHTML = '<div class="loading" style="padding:1rem;"><div class="spinner"></div></div>';
            searchResults.style.display = "block";

            const songs = await searchSongs(query, 8);
            if (songs.length === 0) {
                searchResults.innerHTML =
                    `<div class="search-no-results">
                        ${!navigator.onLine ? '📡 No internet' : 'No results found'}
                    </div>`;
                searchResults.style.display = "block";
                return;
            }
            searchResults.innerHTML = "";
            songs.forEach((song, songIndex) => {
                const item = document.createElement("div");
                item.className = "search-item";
                item.innerHTML = `
                    <img src="${getImageUrl(song)}" alt="${song.name}" />
                    <div class="search-item-info">
                        <div class="search-item-title">${song.name}</div>
                        <div class="search-item-artist">${song.primaryArtists}</div>
                    </div>
                `;
                item.addEventListener("click", () => {
                    openPlayerPage(song, songs, songIndex, query);
                    searchResults.style.display = "none";
                    searchInput.value = "";
                    searchContainer.classList.remove("mobile-active");
                });
                searchResults.appendChild(item);
            });
            searchResults.style.display = "block";
        }, 400);
    });

    searchInput.addEventListener("keydown", async (e) => {
        if (e.key === "Enter") {
            const query = searchInput.value.trim();
            if (query.length < 2) return;
            e.preventDefault();
            searchResults.style.display = "none";

            const songs = await searchSongs(query, 15);
            if (songs.length === 0) {
                showToast(!navigator.onLine ? '📡 No internet connection' : 'No songs found', 'info', 2500);
                return;
            }

            openPlayerPage(songs[0], songs, 0, query);
            searchInput.value = "";
            searchContainer.classList.remove("mobile-active");
        }
    });

    [homeIcon, logo].forEach((element) => {
        if (!element) return;
        element.addEventListener("click", () => {
            window.scrollTo({ top: 0, behavior: "smooth" });
        });
    });

    document.addEventListener("click", (e) => {
        if (
            !searchResults.contains(e.target) &&
            !searchInput.contains(e.target)
        ) {
            searchResults.style.display = "none";
        }
    });


    document.addEventListener("keydown", (e) => {
        if (e.target.tagName === "INPUT") return;
        if (e.code === "Space") {
            e.preventDefault();
            togglePlay();
        }
        if (e.code === "ArrowRight") playNext();
        if (e.code === "ArrowLeft") playPrev();
        if (e.code === "ArrowUp") {
            e.preventDefault();
            audio.volume = Math.min(1, audio.volume + 0.1);
            volumeBar.value = audio.volume * 100;
            const v = volumeBar.value;
            volumeBar.style.background = `linear-gradient(to right, #1db954 ${v}%, #333 ${v}%)`;
            updateVolumeIcon();
        }
        if (e.code === "ArrowDown") {
            e.preventDefault();
            audio.volume = Math.max(0, audio.volume - 0.1);
            volumeBar.value = audio.volume * 100;
            const v = volumeBar.value;
            volumeBar.style.background = `linear-gradient(to right, #1db954 ${v}%, #333 ${v}%)`;
            updateVolumeIcon();
        }
        if (e.key === "m" || e.key === "M") {
            volumeIcon.click();
        }
    });


    async function checkApiHealth() {
        for (let i = 0; i < API_LIST.length; i++) {
            try {
                const res = await fetchWithTimeout(
                    `${API_LIST[i]}/search/songs?query=test&limit=1`, 5000
                );
                if (res.ok) {
                    API_BASE = API_LIST[i];
                    currentApiIndex = i;
                    console.log(`API health check passed: ${API_BASE}`);
                    return true;
                }
            } catch (e) {
                console.warn(`API ${API_LIST[i]} not reachable`);
            }
        }
        // No API works
        showToast('All music servers are down. Try later.', 'error', 5000);
        return false;
    }


    async function init() {
        const restoredFromPlayer = await restorePlaybackFromPlayerState();

        if (restoredFromPlayer) {
            // Keep audio startup smooth after page switch; load home sections in background.
            setTimeout(async () => {
                const apiOk = await checkApiHealth();
                if (!apiOk) return;

                await Promise.all([
                    loadSection("Arijit Singh best songs", "popular-songs"),
                    loadSection("trending Hindi songs 2025", "trending-songs"),
                    loadSection("Bollywood romantic hits", "top-songs"),
                ]);
            }, 300);

            return;
        }

        // Check network first
        if (!navigator.onLine) {
            showToast('No internet connection!', 'error', 5000);
            // Still attempt — maybe browser reports wrong
        }

        // Find a working API
        const apiOk = await checkApiHealth();

        if (!apiOk) {
            // Show retry in all sections
            ['popular-songs', 'trending-songs', 'top-songs'].forEach(id => {
                const c = document.getElementById(id);
                if (c) {
                    c.innerHTML = `
                        <div class="loading" style="flex-direction:column;gap:12px;">
                            <span>⚠️ Server unavailable</span>
                            <button class="retry-btn" style="background:#1db954;color:black;border:none;padding:8px 20px;border-radius:20px;font-weight:600;cursor:pointer;font-family:inherit;font-size:0.9rem;">
                                <i class="fa-solid fa-rotate-right"></i> Retry
                            </button>
                        </div>`;
                    c.querySelector('.retry-btn').addEventListener('click', () => init());
                }
            });
            return;
        }

        await Promise.all([
            loadSection("Arijit Singh best songs", "popular-songs"),
            loadSection("trending Hindi songs 2025", "trending-songs"),
            loadSection("Bollywood romantic hits", "top-songs"),
        ]);
    }

    init();
});

document.addEventListener("DOMContentLoaded", () => {
    const API_LIST = [
        "https://jiosaavn-api-privatecvc2.vercel.app",
        "https://saavn.dev/api",
        "https://jiosaavn-api-2-harsh-patel.vercel.app"
    ];
    const PLAYER_STATE_KEY = "spotifyPlayerState";
    const FETCH_TIMEOUT = 8000;
    const FALLBACK_IMG = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='500' height='500' viewBox='0 0 500 500'%3E%3Crect width='500' height='500' fill='%23121212'/%3E%3Ctext x='50%25' y='54%25' dominant-baseline='middle' text-anchor='middle' font-size='160' fill='%231db954'%3E%26%23127925%3B%3C/text%3E%3C/svg%3E";

    let currentApiIndex = 0;
    let API_BASE = API_LIST[0];
    let playlist = [];
    let currentIndex = 0;
    let isPlaying = false;
    let songOnShuffle = false;
    let songOnRepeat = false;
    let isNavigatingHome = false;
    const audio = new Audio();
    audio.volume = 0.7;

    const backHomeBtn = document.getElementById("backHomeBtn");
    const heroHomeBtn = document.getElementById("heroHomeBtn");
    const searchForm = document.getElementById("playerSearchForm");
    const searchInput = document.getElementById("playerSearchInput");
    const sourceLabel = document.getElementById("playerSourceLabel");
    const titleEl = document.getElementById("playerSongTitle");
    const artistEl = document.getElementById("playerSongArtist");
    const albumEl = document.getElementById("playerSongAlbum");
    const coverEl = document.getElementById("playerCover");
    const statusEl = document.getElementById("playerStatus");
    const queueEl = document.getElementById("playerQueue");
    const queueCountEl = document.getElementById("queueCount");
    const toggleBtn = document.getElementById("playerToggle");
    const prevBtn = document.getElementById("playerPrev");
    const nextBtn = document.getElementById("playerNext");
    const shuffleBtn = document.getElementById("playerShuffle");
    const repeatBtn = document.getElementById("playerRepeat");
    const progressEl = document.getElementById("playerProgress");
    const currentTimeEl = document.getElementById("playerCurrentTime");
    const totalTimeEl = document.getElementById("playerTotalTime");
    const volumeEl = document.getElementById("playerVolume");
    const volumeIcon = document.getElementById("playerVolumeIcon");

    function showToast(message, type = "info", duration = 3000) {
        const existing = document.querySelector(".toast-notification");
        if (existing) existing.remove();

        const toast = document.createElement("div");
        toast.className = "toast-notification";
        toast.innerHTML = `
            <i class="fa-solid ${type === "error" ? "fa-circle-exclamation" : type === "success" ? "fa-circle-check" : "fa-circle-info"}"></i>
            <span>${message}</span>
        `;
        document.body.appendChild(toast);
        requestAnimationFrame(() => toast.classList.add("show"));

        setTimeout(() => {
            toast.classList.remove("show");
            setTimeout(() => toast.remove(), 300);
        }, duration);
    }

    function formatTime(sec) {
        if (Number.isNaN(sec) || !Number.isFinite(sec)) return "0:00";
        const min = Math.floor(sec / 60);
        const rem = Math.floor(sec % 60);
        return `${min}:${rem < 10 ? "0" : ""}${rem}`;
    }

    function formatDuration(seconds) {
        const total = parseInt(seconds, 10);
        if (Number.isNaN(total)) return "";
        const min = Math.floor(total / 60);
        const rem = total % 60;
        return `${min}:${rem < 10 ? "0" : ""}${rem}`;
    }

    function getImageUrl(song) {
        if (!song?.image?.length) return FALLBACK_IMG;
        const best = song.image.find((item) => item.quality === "500x500");
        return best ? best.link : song.image[song.image.length - 1].link;
    }

    function getAudioUrl(song) {
        if (!song?.downloadUrl?.length) return null;
        const preferred = song.downloadUrl.find((item) => item.quality === "160kbps");
        return preferred ? preferred.link : song.downloadUrl[song.downloadUrl.length - 1].link;
    }

    function switchToNextApi() {
        currentApiIndex = (currentApiIndex + 1) % API_LIST.length;
        API_BASE = API_LIST[currentApiIndex];
    }

    async function fetchWithTimeout(url, timeout = FETCH_TIMEOUT) {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), timeout);

        try {
            const response = await fetch(url, { signal: controller.signal });
            clearTimeout(timer);
            return response;
        } catch (error) {
            clearTimeout(timer);
            throw error;
        }
    }

    async function searchSongs(query, limit = 12) {
        let lastError = null;

        for (let apiAttempt = 0; apiAttempt < API_LIST.length; apiAttempt++) {
            for (let retry = 0; retry < 2; retry++) {
                try {
                    const response = await fetchWithTimeout(`${API_BASE}/search/songs?query=${encodeURIComponent(query)}&limit=${limit}`);

                    if (!response.ok) {
                        throw new Error(`HTTP ${response.status}`);
                    }

                    const data = await response.json();

                    if (data.status === "SUCCESS" && data.data?.results?.length) {
                        return data.data.results;
                    }

                    if (data.data?.results?.length) {
                        return data.data.results;
                    }

                    if (data.results?.length) {
                        return data.results;
                    }

                    return [];
                } catch (error) {
                    lastError = error;
                    if (retry < 1) {
                        await new Promise((resolve) => setTimeout(resolve, 900));
                    }
                }
            }

            switchToNextApi();
        }

        console.error("Player page search failed", lastError);
        return [];
    }

    function persistState(searchQuery = "", overrides = {}) {
        const safeIndex = Math.min(Math.max(currentIndex, 0), Math.max(playlist.length - 1, 0));
        sessionStorage.setItem(PLAYER_STATE_KEY, JSON.stringify({
            queue: playlist,
            currentIndex: safeIndex,
            searchQuery,
            openedFrom: overrides.openedFrom || "player",
            returnToHome: Boolean(overrides.returnToHome),
            currentTime: Number.isFinite(audio.currentTime) ? audio.currentTime : 0,
            wasPlaying: !audio.paused,
            volume: audio.volume,
            songOnShuffle,
            songOnRepeat,
            savedAt: Date.now()
        }));
    }

    function loadStoredState() {
        try {
            return JSON.parse(sessionStorage.getItem(PLAYER_STATE_KEY) || "null");
        } catch (error) {
            return null;
        }
    }

    function updateVolumeIcon() {
        volumeIcon.classList.remove("fa-volume-high", "fa-volume-low", "fa-volume-xmark");
        if (audio.volume === 0) {
            volumeIcon.classList.add("fa-volume-xmark");
        } else if (audio.volume < 0.5) {
            volumeIcon.classList.add("fa-volume-low");
        } else {
            volumeIcon.classList.add("fa-volume-high");
        }
    }

    function updatePlayButton() {
        const icon = toggleBtn.querySelector("i");
        icon.classList.toggle("fa-circle-play", !isPlaying);
        icon.classList.toggle("fa-circle-pause", isPlaying);
    }

    function renderQueue() {
        queueEl.innerHTML = "";
        queueCountEl.textContent = `${playlist.length} song${playlist.length === 1 ? "" : "s"}`;

        playlist.forEach((song, index) => {
            const item = document.createElement("button");
            item.type = "button";
            item.className = `player-queue-item ${index === currentIndex ? "active" : ""}`;
            item.innerHTML = `
                <img src="${getImageUrl(song)}" alt="${song.name}">
                <div class="player-queue-info">
                    <div class="player-queue-title">${song.name}</div>
                    <div class="player-queue-artist">${song.primaryArtists || "Unknown artist"}</div>
                </div>
                <span class="player-queue-duration">${formatDuration(song.duration)}</span>
            `;

            item.addEventListener("click", () => playSongAtIndex(index));
            queueEl.appendChild(item);
        });
    }

    function updateSongDetails(song, searchQuery = "") {
        titleEl.textContent = song?.name || "Song unavailable";
        artistEl.textContent = song?.primaryArtists || "Unknown artist";
        albumEl.textContent = song?.album?.name ? `Album • ${song.album.name}` : "Streaming from your search";
        coverEl.src = getImageUrl(song);
        sourceLabel.textContent = searchQuery ? `Results for \"${searchQuery}\"` : "Now Playing";
        statusEl.textContent = isPlaying ? "Playing now" : "Ready to play";
        document.title = song?.name ? `${song.name} | Spotify Player` : "Spotify Player";
        renderQueue();
    }

    function updateShuffleRepeatUI() {
        if (shuffleBtn) shuffleBtn.classList.toggle("active", songOnShuffle);
        if (repeatBtn) repeatBtn.classList.toggle("active", songOnRepeat);
    }

    async function playSongAtIndex(index) {
        if (index < 0 || index >= playlist.length) return;

        const song = playlist[index];
        const audioUrl = getAudioUrl(song);
        if (!audioUrl) {
            showToast("Song URL unavailable", "error", 2200);
            return;
        }

        currentIndex = index;
        audio.src = audioUrl;
        persistState(searchInput.value.trim(), { returnToHome: false });
        updateSongDetails(song, searchInput.value.trim());

        try {
            await audio.play();
            isPlaying = true;
            statusEl.textContent = "Playing now";
        } catch (error) {
            isPlaying = false;
            statusEl.textContent = "Tap play to start";
            if (error.name === "NotAllowedError") {
                showToast("Browser blocked autoplay. Tap play.", "info", 2500);
            } else {
                showToast("Song play nahi hua. Dobara try karo.", "error", 2500);
            }
        }

        updatePlayButton();
        renderQueue();
    }

    async function handleQuerySearch(query) {
        statusEl.textContent = "Searching songs...";
        const songs = await searchSongs(query, 12);

        if (!songs.length) {
            statusEl.textContent = "No songs found";
            showToast("Koi song nahi mila", "info", 2200);
            return false;
        }

        playlist = songs;
        currentIndex = 0;
        persistState(query);
        await playSongAtIndex(0);
        return true;
    }

    function goHome() {
        isNavigatingHome = true;
        persistState(searchInput.value.trim(), { returnToHome: true });

        if (window.history.length > 1) {
            window.history.back();
            setTimeout(() => {
                if (document.visibilityState === "visible") {
                    window.location.href = "index.html";
                }
            }, 180);
            return;
        }

        window.location.href = "index.html";
    }

    toggleBtn.addEventListener("click", async () => {
        if (!playlist.length) return;

        if (audio.paused) {
            try {
                await audio.play();
                isPlaying = true;
                statusEl.textContent = "Playing now";
            } catch (error) {
                isPlaying = false;
                showToast("Song play nahi hua", "error", 2200);
            }
        } else {
            audio.pause();
            isPlaying = false;
            statusEl.textContent = "Paused";
        }

        updatePlayButton();
    });

    prevBtn.addEventListener("click", () => {
        if (!playlist.length) return;
        const prevIndex = songOnShuffle
            ? Math.floor(Math.random() * playlist.length)
            : (currentIndex - 1 + playlist.length) % playlist.length;
        playSongAtIndex(prevIndex);
    });

    nextBtn.addEventListener("click", () => {
        if (!playlist.length) return;
        const nextIndex = songOnShuffle
            ? Math.floor(Math.random() * playlist.length)
            : (currentIndex + 1) % playlist.length;
        playSongAtIndex(nextIndex);
    });

    shuffleBtn.addEventListener("click", () => {
        songOnShuffle = !songOnShuffle;
        if (songOnShuffle) songOnRepeat = false;
        updateShuffleRepeatUI();
    });

    repeatBtn.addEventListener("click", () => {
        songOnRepeat = !songOnRepeat;
        if (songOnRepeat) songOnShuffle = false;
        updateShuffleRepeatUI();
    });

    progressEl.addEventListener("input", () => {
        const value = Number(progressEl.value);
        progressEl.style.background = `linear-gradient(to right, #1db954 ${value}%, #333 ${value}%)`;
        if (audio.duration) {
            audio.currentTime = (value / 100) * audio.duration;
        }
    });

    volumeEl.addEventListener("input", () => {
        const value = Number(volumeEl.value);
        audio.volume = value / 100;
        volumeEl.style.background = `linear-gradient(to right, #1db954 ${value}%, #333 ${value}%)`;
        updateVolumeIcon();
    });

    volumeIcon.addEventListener("click", () => {
        if (audio.volume > 0) {
            audio.dataset.prevVol = String(audio.volume);
            audio.volume = 0;
            volumeEl.value = 0;
        } else {
            audio.volume = parseFloat(audio.dataset.prevVol || "0.7");
            volumeEl.value = String(audio.volume * 100);
        }

        volumeEl.style.background = `linear-gradient(to right, #1db954 ${volumeEl.value}%, #333 ${volumeEl.value}%)`;
        updateVolumeIcon();
    });

    audio.addEventListener("timeupdate", () => {
        const progress = audio.duration ? (audio.currentTime / audio.duration) * 100 : 0;
        progressEl.value = String(progress || 0);
        progressEl.style.background = `linear-gradient(to right, #1db954 ${progress || 0}%, #333 ${progress || 0}%)`;
        currentTimeEl.textContent = formatTime(audio.currentTime);
        totalTimeEl.textContent = formatTime(audio.duration);
    });

    audio.addEventListener("ended", () => {
        if (!playlist.length) return;
        if (songOnRepeat) {
            audio.currentTime = 0;
            audio.play();
            return;
        }

        const nextIndex = songOnShuffle
            ? Math.floor(Math.random() * playlist.length)
            : (currentIndex + 1) % playlist.length;
        playSongAtIndex(nextIndex);
    });

    audio.addEventListener("pause", () => {
        if (!audio.ended) {
            isPlaying = false;
            statusEl.textContent = "Paused";
            updatePlayButton();
        }
    });

    audio.addEventListener("playing", () => {
        isPlaying = true;
        statusEl.textContent = "Playing now";
        updatePlayButton();
    });

    window.addEventListener("beforeunload", () => {
        persistState(searchInput.value.trim(), { returnToHome: isNavigatingHome });
    });

    audio.addEventListener("error", () => {
        showToast("Song load nahi hua. Next try kar raha hoon.", "error", 2600);
        if (playlist.length > 1) {
            const nextIndex = (currentIndex + 1) % playlist.length;
            playSongAtIndex(nextIndex);
        }
    });

    searchForm.addEventListener("submit", async (event) => {
        event.preventDefault();
        const query = searchInput.value.trim();
        if (query.length < 2) {
            showToast("2 letters se zyada likho", "info", 2000);
            return;
        }

        sessionStorage.removeItem(PLAYER_STATE_KEY);
        window.location.href = `player.html?query=${encodeURIComponent(query)}&index=0`;
    });

    [backHomeBtn, heroHomeBtn].forEach((button) => {
        button.addEventListener("click", goHome);
    });

    document.addEventListener("keydown", (event) => {
        if (event.target.tagName === "INPUT") return;

        if (event.code === "Space") {
            event.preventDefault();
            toggleBtn.click();
        }

        if (event.code === "ArrowRight") {
            nextBtn.click();
        }

        if (event.code === "ArrowLeft") {
            prevBtn.click();
        }
    });

    async function init() {
        const params = new URLSearchParams(window.location.search);
        const query = params.get("query") || "";
        const storedState = loadStoredState();
        currentIndex = parseInt(params.get("index") || storedState?.currentIndex || "0", 10);

        volumeEl.style.background = "linear-gradient(to right, #1db954 70%, #333 70%)";
        updateVolumeIcon();
        updateShuffleRepeatUI();

        const shouldSearchFresh = Boolean(query) && query !== (storedState?.searchQuery || "");

        if (storedState?.queue?.length && !shouldSearchFresh) {
            playlist = storedState.queue;
        }

        if ((!playlist.length && query) || shouldSearchFresh) {
            searchInput.value = query;
            await handleQuerySearch(query);
            return;
        }

        if (playlist.length) {
            searchInput.value = query || storedState?.searchQuery || "";
            if (currentIndex >= playlist.length) {
                currentIndex = 0;
            }
            updateSongDetails(playlist[currentIndex], searchInput.value.trim());
            await playSongAtIndex(currentIndex);
            return;
        }

        statusEl.textContent = "Search a song to start";
        titleEl.textContent = "Search a song from home page";
        artistEl.textContent = "Open from search, then this page will autoplay";
        albumEl.textContent = "Back button se home page par jaa sakte ho";
        queueEl.innerHTML = '<div class="player-empty-state">No queue yet. Search above or go back home.</div>';
        queueCountEl.textContent = "0 songs";
    }

    init();
});

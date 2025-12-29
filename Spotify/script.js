document.addEventListener("DOMContentLoaded", function () {


    let play = document.getElementById('play');
    let progressBar = document.getElementById("progressBar");
    // audio ek object hota new Audio
    let audio = new Audio('songs/1.mp3');
    let currentSong = 1;



    /// now bar ke liye


    const songsData = {
        1: { img: "images/1.jpg", title: "Agar Tum Saath Ho", artist: "Alka Yagnik, Arijit Singh" },
        2: { img: "images/2.jpg", title: "Gehra Hua", artist: "Arijit Singh" },
        3: { img: "images/3.jpg", title: "Salamat", artist: "Amaal Mallik, Arijit Singh" },
        4: { img: "images/4.jpg", title: "Sanam Re", artist: "Mithoon, Arijit Singh" },
        5: { img: "images/5.jpg", title: "Sawan Aaya Hai", artist: "Tony Kakkar, Mithoon, Arijit Singh" },
        6: { img: "images/6.jpg", title: "Soch Na Sake", artist: "Arijit Singh" },
        7: { img: "images/7.jpg", title: "Raabta", artist: "Pritam, Arijit Singh" },
        8: { img: "images/8.jpg", title: "Brown Rang", artist: "Yo Yo Honey Singh" },
        9: { img: "images/9.jpg", title: "Kaise Hua", artist: "Vishal Mishra" },
        10: { img: "images/10.jpg", title: "Desi Kalakaar", artist: "Yo Yo Honey Singh" },
        11: { img: "images/11.jpg", title: "Tu Hai Ki Nahi", artist: "Ankit Tiwari" },
        12: { img: "images/12.jpg", title: "Pal Pal Dil Ke Paas", artist: "Kishore Kumar" },
        13: { img: "images/13.jpg", title: "Khuda Jaane", artist: "Vishal & Shekhar, KK, Shilpa Rao" },
        14: { img: "images/14.jpg", title: "Tu Hi Meri Shab Hai", artist: "KK, Pritam" },
        15: { img: "images/15.jpg", title: "Tum Hi Ho", artist: "Mithoon, Arijit Singh" },
        16: { img: "images/16.jpg", title: "Chahun Main Ya Naa", artist: "Arijit Singh, Palak Muchhal" },
        17: { img: "images/17.jpg", title: "Ajab Si", artist: "Vishal & Shekhar, KK" },
        18: { img: "images/17.jpg", title: "Main Agar Kahoon", artist: "Sonu Nigam, Shreya Ghoshal" }
    };


    // now_bar

    const nowImg = document.querySelector(".now-img");
    const nowTitle = document.querySelector(".img-title-info");
    const nowDes = document.querySelector(".img-des-info");

    function nowChanger(idx) {
        nowImg.src = songsData[idx].img
        nowTitle.innerText = songsData[idx].title
        nowDes.innerText = songsData[idx].artist;
    }



    play.addEventListener('click', () => {

        if (audio.paused || audio.currentTime == 0) {
            audio.play();
            nowChanger(currentSong);
            play.classList.remove('fa-circle-play');
            play.classList.add('fa-circle-pause');

            playMusic[currentSong - 1]?.classList.remove("fa-circle-play");
            playMusic[currentSong - 1]?.classList.add("fa-circle-pause");

        } else {
            audio.pause();

            play.classList.remove('fa-circle-pause');
            play.classList.add('fa-circle-play');

            playMusic[currentSong - 1]?.classList.remove("fa-circle-pause");
            playMusic[currentSong - 1]?.classList.add("fa-circle-play");
        }
    });

    audio.addEventListener('timeupdate', () => {

        //slider moves bye audio

        let progress = (audio.currentTime / audio.duration) * 100;
        progressBar.value = progress;
        progressBar.style.background = `linear-gradient(to right, #17720f ${progress}%, #333 ${progress}%)`;

    })

    progressBar.addEventListener('input', function () {

        // when use move the slider
        let value = this.value;
        this.style.background = `linear-gradient(to right, #17720f ${value}%, #333 ${value}%)`;
        /// slidbar ko set karne audio ka current time bhi chnage ho
        audio.currentTime = (progressBar.value * audio.duration) / 100;

    });

    let playMusic = Array.from(document.getElementsByClassName('playmusic'));

    makeAllplay = () => {

        playMusic.forEach((element) => {
            element.classList.remove("fa-circle-pause");
            element.classList.add("fa-circle-play");
        });

    }

    playMusic.forEach((element) => {
        element.addEventListener('click', (e) => {

            let songId = parseInt(e.target.id);

            if (songId === currentSong) {

                if (audio.paused) {
                    audio.play();
                    nowChanger(songId);
                    makeAllplay();

                    e.target.classList.remove("fa-circle-play");
                    e.target.classList.add("fa-circle-pause");

                    play.classList.remove("fa-circle-play");
                    play.classList.add("fa-circle-pause");
                } else {
                    audio.pause();

                    e.target.classList.remove("fa-circle-pause");
                    e.target.classList.add("fa-circle-play");

                    play.classList.remove("fa-circle-pause");
                    play.classList.add("fa-circle-play");
                }
                return;
            }

            makeAllplay();
            currentSong = songId;
            shuffleIndex = order.indexOf(currentSong);
            nowChanger(songId);

            audio.src = `songs/${currentSong}.mp3`;
            audio.currentTime = 0;
            audio.play();

            e.target.classList.remove("fa-circle-play");
            e.target.classList.add("fa-circle-pause");

            play.classList.remove("fa-circle-play");
            play.classList.add("fa-circle-pause");
        })
    });


    const shuffle = document.getElementById('shuffle');
    const repeat = document.getElementById('repeat');
    let songOrder = Object.keys(songsData).map(Number);

    // ===== jooo jarauri thaa =====
    let order = [...songOrder];
    let shuffleIndex = order.indexOf(currentSong);
    
    let songOnRepeat = false;
    let songOnShuffle = false;

    function shuffleSongs(originalOrder) {

        // deepcopy
        let order = [...originalOrder];

        for (let i = order.length - 1; i > 0; i--) {
            let j = Math.floor(Math.random() * (i + 1));
            [order[i], order[j]] = [order[j], order[i]];
        }
        return order;
    }

    shuffle.addEventListener('click', () => {
        songOnShuffle = !songOnShuffle;
        songOnRepeat = false;

        shuffle.classList.toggle("active", songOnShuffle);
        repeat.classList.remove("active");

        order = songOnShuffle ? shuffleSongs(songOrder) : [...songOrder];
        shuffleIndex = order.indexOf(currentSong);
    })


    repeat.addEventListener('click', () => {
        songOnRepeat = !songOnRepeat;
        songOnShuffle = false;

        repeat.classList.toggle("active", songOnRepeat);
        shuffle.classList.remove("active");

        order = [...songOrder];
        shuffleIndex = order.indexOf(currentSong);
    })


    playNextSong = () => {

        if (songOnRepeat) {
            audio.currentTime = 0;
            audio.play();
            return;
        }

        shuffleIndex++;

        if (shuffleIndex >= order.length) {
            shuffleIndex = 0;
        }

        currentSong = order[shuffleIndex];

        audio.currentTime = 0;
        audio.src = `songs/${currentSong}.mp3`;
        nowChanger(currentSong);

        makeAllplay()

        playMusic[currentSong - 1]?.classList.remove("fa-circle-play");
        playMusic[currentSong - 1]?.classList.add("fa-circle-pause");

        play.classList.remove("fa-circle-play");
        play.classList.add("fa-circle-pause");

        audio.play();
    }

    playPreviousSong = () => {

        shuffleIndex--;

        if (shuffleIndex < 0) {
            shuffleIndex = order.length - 1;
        }

        currentSong = order[shuffleIndex];

        audio.currentTime = 0;
        audio.src = `songs/${currentSong}.mp3`;
        nowChanger(currentSong);

        makeAllplay()

        playMusic[currentSong - 1]?.classList.remove("fa-circle-play");
        playMusic[currentSong - 1]?.classList.add("fa-circle-pause");

        play.classList.remove("fa-circle-play");
        play.classList.add("fa-circle-pause");

        audio.play();
    }

    const forward = document.getElementById("forward");
    const backward = document.getElementById("backward");

    forward.addEventListener("click", () => {
        playNextSong();
    });

    audio.addEventListener('ended', () => {
        playNextSong();
    })

    backward.addEventListener("click", () => {
        playPreviousSong();
    });

});

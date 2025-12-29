document.addEventListener("DOMContentLoaded", function () {


    let play = document.getElementById('play');
    let progressBar = document.getElementById("progressBar");
    // audio ek object hota new Audio
    let audio = new Audio('songs/1.mp3');
    let currentSong = 1;



    /// now bar ke liye








    play.addEventListener('click', () => {


        if (audio.paused || audio.currentTime == 0) {
            audio.play();
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

            // 👉 DIFFERENT SONG CLICKED
            makeAllplay();
            currentSong = songId;

            audio.src = `songs/${currentSong}.mp3`;
            audio.currentTime = 0;
            audio.play();

            e.target.classList.remove("fa-circle-play");
            e.target.classList.add("fa-circle-pause");

            play.classList.remove("fa-circle-play");
            play.classList.add("fa-circle-pause");
        })
    });

    playNextSong = () => {

        currentSong++;

        if (currentSong > playMusic.length) {
            currentSong = 1;
        }
        audio.currentTime = 0;
        audio.src = `songs/${currentSong}.mp3`;

        makeAllplay()

        playMusic[currentSong - 1]?.classList.remove("fa-circle-play");
        playMusic[currentSong - 1]?.classList.add("fa-circle-pause");

        play.classList.remove("fa-circle-play");
        play.classList.add("fa-circle-pause");

        audio.play();
    }

    playPreviousSong = () => {


        currentSong--;

        if (currentSong < 1) {
            currentSong = playMusic.length;
        }
        audio.currentTime = 0;
        audio.src = `songs/${currentSong}.mp3`;

        makeAllplay()

        playMusic[currentSong - 1]?.classList.remove("fa-circle-play");
        playMusic[currentSong - 1]?.classList.add("fa-circle-pause");

        play.classList.remove("fa-circle-play");
        play.classList.add("fa-circle-pause");


        audio.play();

    }

    forward = document.getElementById("forward");
    backward = document.getElementById("backward");
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


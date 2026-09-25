/* =====================================================
   🧩 PUZZLE GAME
   7 × 9
   Author: ULUG'BEK.R
===================================================== */

const ROWS = 7;
const COLS = 9;
const TOTAL = ROWS * COLS;

// Game variables
let board = [];
let emptyIndex = TOTAL - 1;

let level = 1;
let score = 0;
let moves = 0;
let lives = 3;

let seconds = 0;

let timerInterval = null;

let gameStarted = false;
let paused = false;

let soundOn = true;
let musicOn = true;

let bestScore =
    Number(localStorage.getItem("ULUGBEK_PUZZLE_BEST")) || 0;


// Update best score
document.getElementById("bestScore").textContent = bestScore;


/* =====================================================
   🔊 AUDIO
===================================================== */

let audioContext = null;

function getAudio() {

    if (!audioContext) {

        audioContext =
            new (window.AudioContext ||
                 window.webkitAudioContext)();
    }

    return audioContext;
}


function playSound(type) {

    if (!soundOn) return;

    try {

        const ctx = getAudio();

        const oscillator =
            ctx.createOscillator();

        const gain =
            ctx.createGain();

        oscillator.connect(gain);
        gain.connect(ctx.destination);

        let frequency = 400;

        if (type === "move") {
            frequency = 450;
        }

        if (type === "good") {
            frequency = 700;
        }

        if (type === "bad") {
            frequency = 180;
        }

        if (type === "win") {
            frequency = 900;
        }

        if (type === "click") {
            frequency = 300;
        }

        oscillator.frequency.value =
            frequency;

        oscillator.type = "sine";

        gain.gain.setValueAtTime(
            0.001,
            ctx.currentTime
        );

        gain.gain.exponentialRampToValueAtTime(
            0.15,
            ctx.currentTime + 0.01
        );

        gain.gain.exponentialRampToValueAtTime(
            0.001,
            ctx.currentTime + 0.18
        );

        oscillator.start();

        oscillator.stop(
            ctx.currentTime + 0.2
        );

    } catch (error) {

        console.log("Audio error:", error);

    }
}


/* =====================================================
   🎵 MUSIC
===================================================== */

let musicTimer = null;
let musicStep = 0;

const musicNotes = [
    261.63,
    329.63,
    392.00,
    329.63,
    293.66,
    349.23,
    440.00,
    349.23
];


function startMusic() {

    if (!musicOn) return;

    if (musicTimer !== null) return;

    musicTimer = setInterval(() => {

        if (
            !musicOn ||
            paused ||
            !gameStarted
        ) {
            return;
        }

        try {

            const ctx = getAudio();

            const oscillator =
                ctx.createOscillator();

            const gain =
                ctx.createGain();

            oscillator.connect(gain);

            gain.connect(
                ctx.destination
            );

            oscillator.frequency.value =
                musicNotes[
                    musicStep %
                    musicNotes.length
                ];

            oscillator.type = "sine";

            gain.gain.value = 0.025;

            oscillator.start();

            oscillator.stop(
                ctx.currentTime + 0.18
            );

            musicStep++;

        } catch (error) {

            console.log(
                "Music error:",
                error
            );

        }

    }, 350);
}


function stopMusic() {

    clearInterval(musicTimer);

    musicTimer = null;
}


function toggleMusic() {

    musicOn = !musicOn;

    document.getElementById(
        "musicText"
    ).textContent =
        musicOn
            ? "MUSIQA ON"
            : "MUSIQA OFF";

    if (musicOn) {

        startMusic();

    } else {

        stopMusic();

    }
}


function toggleSound() {

    soundOn = !soundOn;

    document.getElementById(
        "soundText"
    ).textContent =
        soundOn
            ? "OVOZ ON"
            : "OVOZ OFF";

    if (soundOn) {

        playSound("click");

    }
}


/* =====================================================
   ⏱ TIMER
===================================================== */

function startTimer() {

    clearInterval(timerInterval);

    timerInterval = setInterval(() => {

        if (
            !gameStarted ||
            paused
        ) {
            return;
        }

        seconds++;

        updateTimer();

    }, 1000);
}


function updateTimer() {

    const minutes =
        String(
            Math.floor(seconds / 60)
        ).padStart(2, "0");

    const secs =
        String(
            seconds % 60
        ).padStart(2, "0");

    document.getElementById(
        "timer"
    ).textContent =
        `${minutes}:${secs}`;
}


function formatTime(totalSeconds) {

    const minutes =
        String(
            Math.floor(
                totalSeconds / 60
            )
        ).padStart(2, "0");

    const secs =
        String(
            totalSeconds % 60
        ).padStart(2, "0");

    return `${minutes}:${secs}`;
}


/* =====================================================
   🧩 CREATE SOLVED BOARD
===================================================== */

function createSolvedBoard() {

    board = [];

    for (
        let i = 1;
        i < TOTAL;
        i++
    ) {

        board.push(i);

    }

    // Empty space
    board.push(0);

    emptyIndex =
        TOTAL - 1;
}


/* =====================================================
   🔀 SHUFFLE
===================================================== */

function shuffleBoard() {

    createSolvedBoard();

    const shuffleMoves =
        100 + level * 30;

    let previousIndex = -1;

    for (
        let i = 0;
        i < shuffleMoves;
        i++
    ) {

        const possibleMoves =
            getPossibleMoves(
                emptyIndex
            ).filter(
                index =>
                    index !==
                    previousIndex
            );

        if (
            possibleMoves.length === 0
        ) {
            continue;
        }

        const selected =
            possibleMoves[
                Math.floor(
                    Math.random() *
                    possibleMoves.length
                )
            ];

        previousIndex =
            emptyIndex;

        swapTiles(
            selected,
            emptyIndex
        );

        emptyIndex =
            selected;
    }

    // Don't start already solved
    if (isSolved()) {

        shuffleBoard();

    }
}


/* =====================================================
   ↔️ POSSIBLE MOVES
===================================================== */

function getPossibleMoves(index) {

    const row =
        Math.floor(index / COLS);

    const col =
        index % COLS;

    const result = [];

    // Up
    if (row > 0) {

        result.push(
            index - COLS
        );

    }

    // Down
    if (row < ROWS - 1) {

        result.push(
            index + COLS
        );

    }

    // Left
    if (col > 0) {

        result.push(
            index - 1
        );

    }

    // Right
    if (col < COLS - 1) {

        result.push(
            index + 1
        );

    }

    return result;
}


/* =====================================================
   🔄 SWAP
===================================================== */

function swapTiles(a, b) {

    const temp = board[a];

    board[a] = board[b];

    board[b] = temp;
}


/* =====================================================
   🎨 RENDER BOARD
===================================================== */

function renderBoard() {

    const puzzle =
        document.getElementById(
            "puzzle"
        );

    puzzle.innerHTML = "";

    board.forEach(
        (value, index) => {

            const tile =
                document.createElement(
                    "div"
                );

            tile.className =
                "tile";

            // Empty tile
            if (value === 0) {

                tile.classList.add(
                    "empty"
                );

            }

            // Normal tile
            else {

                tile.textContent =
                    value;

                tile.addEventListener(
                    "click",
                    () => {

                        moveTile(index);

                    }
                );

            }

            puzzle.appendChild(
                tile
            );

        }
    );
}


/* =====================================================
   🖱 MOVE TILE
===================================================== */

function moveTile(index) {

    if (
        !gameStarted ||
        paused
    ) {
        return;
    }

    const possibleMoves =
        getPossibleMoves(
            emptyIndex
        );

    // Invalid move
    if (
        !possibleMoves.includes(
            index
        )
    ) {

        loseLife();

        return;
    }

    // Swap
    swapTiles(
        index,
        emptyIndex
    );

    emptyIndex =
        index;

    // Statistics
    moves++;

    score += 5;

    document.getElementById(
        "moves"
    ).textContent =
        moves;

    document.getElementById(
        "score"
    ).textContent =
        score;

    playSound("move");

    renderBoard();

    // Check win
    if (isSolved()) {

        winLevel();

    }
}


/* =====================================================
   ❤️ LOSE LIFE
===================================================== */

function loseLife() {

    lives--;

    updateLives();

    playSound("bad");

    const puzzle =
        document.getElementById(
            "puzzle"
        );

    puzzle.classList.add(
        "level-up"
    );

    setTimeout(() => {

        puzzle.classList.remove(
            "level-up"
        );

    }, 400);

    if (lives <= 0) {

        gameOver();

    }
}


/* =====================================================
   ❤️ UPDATE LIVES
===================================================== */

function updateLives() {

    let hearts = "";

    for (
        let i = 0;
        i < lives;
        i++
    ) {

        hearts += "❤️";

    }

    for (
        let i = lives;
        i < 3;
        i++
    ) {

        hearts += "🖤";

    }

    document.getElementById(
        "lives"
    ).textContent =
        hearts;
}


/* =====================================================
   🏆 CHECK SOLVED
===================================================== */

function isSolved() {

    for (
        let i = 0;
        i < TOTAL - 1;
        i++
    ) {

        if (
            board[i] !== i + 1
        ) {

            return false;

        }

    }

    return (
        board[
            TOTAL - 1
        ] === 0
    );
}


/* =====================================================
   🎮 START GAME
===================================================== */

function startGame() {

    const nameInput =
        document.getElementById(
            "playerName"
        );

    if (
        nameInput.value.trim() === ""
    ) {

        nameInput.focus();

        nameInput.placeholder =
            "⚠️ Avval ismingizni yozing!";

        return;
    }

    closeModal();

    level = 1;
    score = 0;
    moves = 0;
    lives = 3;
    seconds = 0;

    gameStarted = true;
    paused = false;

    updateInterface();

    shuffleBoard();

    renderBoard();

    startTimer();

    startMusic();

    playSound("click");
}


/* =====================================================
   🔄 RESTART GAME
===================================================== */

function restartGame() {

    if (!gameStarted) {

        startGame();

        return;
    }

    level = 1;
    score = 0;
    moves = 0;
    lives = 3;
    seconds = 0;

    paused = false;

    updateInterface();

    shuffleBoard();

    renderBoard();

    playSound("click");
}


/* =====================================================
   ⏸ PAUSE
===================================================== */

function pauseGame() {

    if (!gameStarted) {
        return;
    }

    paused = !paused;

    if (paused) {

        document.getElementById(
            "modalTitle"
        ).textContent =
            "⏸️ O'YIN PAUZA";

        document.getElementById(
            "modalContent"
        ).innerHTML =

            `<p class="pause-text">⏸️</p>
             <p>O'yin vaqtincha to'xtatildi.</p>`;

        const modalButton =
            document.querySelector(
                ".modal button"
            );

        modalButton.textContent =
            "▶️ DAVOM ETISH";

        modalButton.onclick =
            resumeGame;

        document
            .getElementById(
                "overlay"
            )
            .classList.add(
                "show"
            );

    } else {

        resumeGame();

    }
}


/* =====================================================
   ▶ RESUME
===================================================== */

function resumeGame() {

    paused = false;

    closeModal();

    playSound("click");
}


/* =====================================================
   🎉 WIN LEVEL
===================================================== */

function winLevel() {

    playSound("win");

    createParticles();

    // Time bonus
    const timeBonus =
        Math.max(
            100,
            1000 -
            seconds * 3
        );

    score += timeBonus;

    const completedLevel =
        level;

    level++;

    document.getElementById(
        "score"
    ).textContent =
        score;

    document.getElementById(
        "level"
    ).textContent =
        level;

    // Save record
    if (
        score > bestScore
    ) {

        bestScore =
            score;

        localStorage.setItem(
            "ULUGBEK_PUZZLE_BEST",
            bestScore
        );

        document.getElementById(
            "bestScore"
        ).textContent =
            bestScore;
    }

    document.getElementById(
        "modalTitle"
    ).textContent =
        `🎉 LEVEL ${completedLevel} TUGADI!`;

    document.getElementById(
        "modalContent"
    ).innerHTML =

        `<p>
            👤 O'yinchi:
            <b>${getPlayerName()}</b>
        </p>

        <p>
            🏆 Score:
            <b>${score}</b>
        </p>

        <p>
            🔢 Harakatlar:
            <b>${moves}</b>
        </p>

        <p>
            ⏱️ Vaqt:
            <b>${formatTime(seconds)}</b>
        </p>

        <p>
            🚀 Keyingi level:
            <b>${level}</b>
        </p>`;

    const modalButton =
        document.querySelector(
            ".modal button"
        );

    modalButton.textContent =
        "🚀 KEYINGI LEVEL";

    modalButton.onclick =
        nextLevel;

    document
        .getElementById(
            "overlay"
        )
        .classList.add(
            "show"
        );
}


/* =====================================================
   🚀 NEXT LEVEL
===================================================== */

function nextLevel() {

    closeModal();

    lives = 3;

    updateLives();

    shuffleBoard();

    renderBoard();

    playSound("click");
}


/* =====================================================
   💔 GAME OVER
===================================================== */

function gameOver() {

    gameStarted = false;

    clearInterval(
        timerInterval
    );

    stopMusic();

    document.getElementById(
        "modalTitle"
    ).textContent =
        "💔 O'YIN TUGADI";

    document.getElementById(
        "modalContent"
    ).innerHTML =

        `<p>
            👤 O'yinchi:
            <b>${getPlayerName()}</b>
        </p>

        <p>
            📈 Level:
            <b>${level}</b>
        </p>

        <p>
            🏆 Score:
            <b>${score}</b>
        </p>

        <p>
            🔢 Harakatlar:
            <b>${moves}</b>
        </p>

        <p>
            ⏱️ Vaqt:
            <b>${formatTime(seconds)}</b>
        </p>

        <p>
            🏅 Rekord:
            <b>${bestScore}</b>
        </p>`;

    const modalButton =
        document.querySelector(
            ".modal button"
        );

    modalButton.textContent =
        "🔄 QAYTA BOSHLASH";

    modalButton.onclick =
        () => {

            closeModal();

            startGame();

        };

    document
        .getElementById(
            "overlay"
        )
        .classList.add(
            "show"
        );
}


/* =====================================================
   👤 PLAYER NAME
===================================================== */

function getPlayerName() {

    const name =
        document.getElementById(
            "playerName"
        ).value.trim();

    if (name === "") {

        return "O'yinchi";

    }

    return name;
}


/* =====================================================
   📊 UPDATE INTERFACE
===================================================== */

function updateInterface() {

    document.getElementById(
        "level"
    ).textContent =
        level;

    document.getElementById(
        "score"
    ).textContent =
        score;

    document.getElementById(
        "moves"
    ).textContent =
        moves;

    document.getElementById(
        "timer"
    ).textContent =
        formatTime(seconds);

    document.getElementById(
        "bestScore"
    ).textContent =
        bestScore;

    updateLives();
}


/* =====================================================
   ❌ CLOSE MODAL
===================================================== */

function closeModal() {

    document
        .getElementById(
            "overlay"
        )
        .classList.remove(
            "show"
        );
}


/* =====================================================
   🌟 PARTICLES
===================================================== */

function createParticles() {

    for (
        let i = 0;
        i < 35;
        i++
    ) {

        const particle =
            document.createElement(
                "div"
            );

        particle.className =
            "particle";

        particle.style.left =
            Math.random() *
            window.innerWidth +
            "px";

        particle.style.top =
            Math.random() *
            window.innerHeight +
            "px";

        document.body.appendChild(
            particle
        );

        const x =
            (Math.random() - 0.5) *
            400;

        const y =
            (Math.random() - 0.5) *
            400;

        particle.animate(

            [
                {
                    transform:
                        "translate(0,0)",
                    opacity: 1
                },

                {
                    transform:
                        `translate(${x}px,${y}px)`,
                    opacity: 0
                }
            ],

            {
                duration: 1000,

                easing: "ease-out"
            }

        );

        setTimeout(() => {

            particle.remove();

        }, 1000);
    }
}


/* =====================================================
   ⌨️ KEYBOARD
===================================================== */

document.addEventListener(
    "keydown",
    function(event) {

        // ESC = pause
        if (
            event.key === "Escape"
        ) {

            if (gameStarted) {

                pauseGame();

            }

        }

    }
);


/* =====================================================
   💾 SAVE PLAYER NAME
===================================================== */

document
    .getElementById(
        "playerName"
    )
    .addEventListener(
        "input",
        function() {

            localStorage.setItem(
                "ULUGBEK_PLAYER_NAME",
                this.value
            );

        }
    );


/* =====================================================
   📂 LOAD PLAYER NAME
===================================================== */

const savedName =
    localStorage.getItem(
        "ULUGBEK_PLAYER_NAME"
    );

if (savedName) {

    document.getElementById(
        "playerName"
    ).value =
        savedName;
}


/* =====================================================
   🚀 INITIALIZE
===================================================== */

createSolvedBoard();

renderBoard();

updateInterface();


/* =====================================================
    🚫 PREVENT DRAG
===================================================== */

document.addEventListener(
    "dragstart",
    function(event) {

        event.preventDefault();

    }
);


/* =====================================================
    📱 TOUCH SUPPORT
===================================================== */

document.addEventListener(
    "touchstart",
    function() {

        try {

            getAudio();

        } catch (error) {}

    },
    {
        once: true
    }
);


console.log(
    "🧩 Puzzle Game loaded successfully!"
);

console.log(
    "👨‍💻 ULUG'BEK.R"
);
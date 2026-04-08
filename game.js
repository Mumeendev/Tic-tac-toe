const board = document.getElementById('board');
const cells = document.querySelectorAll('.cell');
const status = document.getElementById('status');
const restart = document.getElementById('restart');
const backToMenu = document.getElementById('back-to-menu');
const menu = document.getElementById('menu');
const game = document.getElementById('game');
const aiModeBtn = document.getElementById('ai-mode');
const twoPlayerBtn = document.getElementById('two-player');
const difficultyMenu = document.getElementById('difficulty-menu');
const easyBtn = document.getElementById('easy');
const mediumBtn = document.getElementById('medium');
const hardBtn = document.getElementById('hard');
const backToModeBtn = document.getElementById('back-to-mode');
const xWinsDisplay = document.getElementById('x-wins');
const oWinsDisplay = document.getElementById('o-wins');
const drawsDisplay = document.getElementById('draws');
const bgMusic = document.getElementById('bg-music');
const toggleMusicBtn = document.getElementById('toggle-music');
const replayBtn = document.getElementById('replay');

// Web Audio API for sound effects
let audioContext = null;
let isMusicPlaying = true;
let audioInitialized = false;
let soundEffectsEnabled = true;

function initAudio() {
    if (!audioInitialized) {
        try {
            audioContext = new (window.AudioContext || window.webkitAudioContext)();
            
            // Force resume immediately if suspended
            if (audioContext.state === 'suspended') {
                audioContext.resume().then(() => {
                    console.log('AudioContext resumed successfully');
                }).catch(err => {
                    console.warn('AudioContext resume failed:', err);
                });
            }
            
            audioInitialized = true;
            console.log('Audio initialized, state:', audioContext.state);
        } catch (e) {
            console.error('Failed to create AudioContext:', e);
            return;
        }
    }

    // Always try to resume on user interaction
    if (audioContext && audioContext.state === 'suspended') {
        audioContext.resume().catch(err => console.warn('Resume failed:', err));
    }
    
    return audioContext;
}

// Ensure audio context is running before playing sound
function ensureAudioReady() {
    if (!audioInitialized) {
        initAudio();
    }
    if (audioContext && audioContext.state === 'suspended') {
        audioContext.resume().catch(err => console.warn('Resume failed:', err));
    }
    console.log('Audio context state:', audioContext?.state);
}

let currentPlayer = 'X';
let gameState = ['', '', '', '', '', '', '', '', ''];
let gameActive = false;
let gameMode = ''; // 'ai' or 'two-player'
let aiDifficulty = ''; // 'easy', 'medium', or 'hard'
let scores = {
    xWins: 0,
    oWins: 0,
    draws: 0
};

const winningConditions = [
    [0, 1, 2],
    [3, 4, 5],
    [6, 7, 8],
    [0, 3, 6],
    [1, 4, 7],
    [2, 5, 8],
    [0, 4, 8],
    [2, 4, 6]
];

function startGame(mode) {
    gameMode = mode;

    if (mode === 'ai') {
        menu.classList.add('hidden');
        difficultyMenu.classList.remove('hidden');
        return;
    }

    gameActive = true;
    menu.classList.add('hidden');
    game.classList.remove('hidden');
    hideReplayButton();
    restartGame();
}

function startAIGame(difficulty) {
    aiDifficulty = difficulty;
    gameActive = true;
    difficultyMenu.classList.add('hidden');
    game.classList.remove('hidden');
    hideReplayButton();
    restartGame();
}

function handleCellClick(e) {
    initAudio(); // Initialize audio on cell click
    
    const clickedCell = e.target;
    const clickedCellIndex = parseInt(clickedCell.getAttribute('data-index'));

    if (gameState[clickedCellIndex] !== '' || !gameActive) {
        return;
    }

    // In AI mode, prevent clicking during AI's turn
    if (gameMode === 'ai' && currentPlayer === 'O') {
        return;
    }

    handleCellPlayed(clickedCell, clickedCellIndex);
    playClickSound();
    handleResultValidation();

    // AI move after player's turn
    if (gameMode === 'ai' && gameActive && currentPlayer === 'O') {
        setTimeout(makeAIMove, 500);
    }
}

function handleCellPlayed(cell, index) {
    gameState[index] = currentPlayer;
    const emoji = currentPlayer === 'X' ? '❌' : '⭕';
    cell.textContent = emoji;
    cell.classList.add(currentPlayer.toLowerCase());
}

function handleResultValidation() {
    let roundWon = false;
    let winningCells = [];

    for (let i = 0; i < winningConditions.length; i++) {
        const [a, b, c] = winningConditions[i];
        if (gameState[a] && gameState[a] === gameState[b] && gameState[a] === gameState[c]) {
            roundWon = true;
            winningCells = [a, b, c];
            break;
        }
    }

    if (roundWon) {
        const emoji = currentPlayer === 'X' ? '❌' : '⭕';
        status.textContent = `Player ${emoji} wins! 🎉`;
        gameActive = false;
        highlightWinningCells(winningCells);
        playWinSound();
        showReplayButton();

        // Update scores
        if (currentPlayer === 'X') {
            scores.xWins++;
            xWinsDisplay.textContent = scores.xWins;
        } else {
            scores.oWins++;
            oWinsDisplay.textContent = scores.oWins;
        }
        return;
    }

    if (!gameState.includes('')) {
        status.textContent = 'Game ended in a draw! 🤝';
        gameActive = false;
        scores.draws++;
        drawsDisplay.textContent = scores.draws;
        playDrawSound();
        showReplayButton();
        return;
    }

    currentPlayer = currentPlayer === 'X' ? 'O' : 'X';
    const emoji = currentPlayer === 'X' ? '❌' : '⭕';
    status.textContent = `Player ${emoji}'s turn`;
}

function highlightWinningCells(cells) {
    cells.forEach(index => {
        document.querySelector(`[data-index="${index}"]`).classList.add('winner');
    });
}

function restartGame() {
    currentPlayer = 'X';
    gameState = ['', '', '', '', '', '', '', '', ''];
    gameActive = true;
    status.textContent = `Player ❌'s turn`;
    cells.forEach(cell => {
        cell.textContent = '';
        cell.classList.remove('x', 'o', 'winner');
    });
    hideReplayButton();
}

function showReplayButton() {
    replayBtn.classList.remove('hidden');
}

function hideReplayButton() {
    replayBtn.classList.add('hidden');
}

function replayGame() {
    restartGame();
}

function backToMenuScreen() {
    gameActive = false;
    game.classList.add('hidden');
    difficultyMenu.classList.add('hidden');
    menu.classList.remove('hidden');
    restartGame();
    gameActive = false;
    hideReplayButton();

    // Reset scores
    scores = { xWins: 0, oWins: 0, draws: 0 };
    xWinsDisplay.textContent = '0';
    oWinsDisplay.textContent = '0';
    drawsDisplay.textContent = '0';
}

function backToModeSelection() {
    difficultyMenu.classList.add('hidden');
    menu.classList.remove('hidden');
}

// AI Logic based on difficulty
function makeAIMove() {
    if (!gameActive) return;

    let bestMove = -1;

    if (aiDifficulty === 'easy') {
        bestMove = getRandomMove();
    } else if (aiDifficulty === 'medium') {
        // 60% chance of best move, 40% random
        if (Math.random() < 0.6) {
            bestMove = getBestMove();
        } else {
            bestMove = getRandomMove();
        }
    } else {
        // Hard - always uses minimax
        bestMove = getBestMove();
    }

    if (bestMove !== -1) {
        const cell = document.querySelector(`[data-index="${bestMove}"]`);
        handleCellPlayed(cell, bestMove);
        handleResultValidation();
    }
}

function getRandomMove() {
    const availableMoves = [];
    for (let i = 0; i < 9; i++) {
        if (gameState[i] === '') {
            availableMoves.push(i);
        }
    }
    if (availableMoves.length === 0) return -1;
    return availableMoves[Math.floor(Math.random() * availableMoves.length)];
}

function getBestMove() {
    let bestScore = -Infinity;
    let bestMove = -1;

    for (let i = 0; i < 9; i++) {
        if (gameState[i] === '') {
            gameState[i] = 'O';
            let score = minimax(gameState, 0, false);
            gameState[i] = '';
            if (score > bestScore) {
                bestScore = score;
                bestMove = i;
            }
        }
    }

    return bestMove;
}

function minimax(board, depth, isMaximizing) {
    let result = checkWinner();
    if (result !== null) {
        return result;
    }

    if (isMaximizing) {
        let bestScore = -Infinity;
        for (let i = 0; i < 9; i++) {
            if (board[i] === '') {
                board[i] = 'O';
                let score = minimax(board, depth + 1, false);
                board[i] = '';
                bestScore = Math.max(score, bestScore);
            }
        }
        return bestScore;
    } else {
        let bestScore = Infinity;
        for (let i = 0; i < 9; i++) {
            if (board[i] === '') {
                board[i] = 'X';
                let score = minimax(board, depth + 1, true);
                board[i] = '';
                bestScore = Math.min(score, bestScore);
            }
        }
        return bestScore;
    }
}

function checkWinner() {
    for (let i = 0; i < winningConditions.length; i++) {
        const [a, b, c] = winningConditions[i];
        if (gameState[a] && gameState[a] === gameState[b] && gameState[a] === gameState[c]) {
            return gameState[a] === 'O' ? 10 : -10;
        }
    }
    
    if (!gameState.includes('')) {
        return 0; // Draw
    }
    
    return null; // Game continues
}

// Event Listeners
cells.forEach(cell => cell.addEventListener('click', handleCellClick));
restart.addEventListener('click', restartGame);
replayBtn.addEventListener('click', replayGame);
backToMenu.addEventListener('click', backToMenuScreen);
aiModeBtn.addEventListener('click', () => startGame('ai'));
twoPlayerBtn.addEventListener('click', () => startGame('two-player'));
easyBtn.addEventListener('click', () => startAIGame('easy'));
mediumBtn.addEventListener('click', () => startAIGame('medium'));
hardBtn.addEventListener('click', () => startAIGame('hard'));
backToModeBtn.addEventListener('click', backToModeSelection);

// Floating Chess Pieces Background
function createFloatingChessPieces() {
    const container = document.getElementById('chess-pieces');
    const chessEmojis = ['♔', '♕', '♖', '♗', '♘', '♙', '♚', '♛', '♜', '♝', '♞', '♟'];
    const numberOfPieces = 20;

    for (let i = 0; i < numberOfPieces; i++) {
        const piece = document.createElement('div');
        piece.classList.add('chess-piece');
        piece.textContent = chessEmojis[Math.floor(Math.random() * chessEmojis.length)];
        
        // Random position and animation properties
        const leftPosition = Math.random() * 100;
        const animationDuration = 10 + Math.random() * 20; // 10-30 seconds
        const animationDelay = Math.random() * 20; // 0-20 seconds delay
        const fontSize = 2 + Math.random() * 3; // 2-5rem
        const opacity = 0.05 + Math.random() * 0.15; // 0.05-0.2

        piece.style.left = `${leftPosition}%`;
        piece.style.fontSize = `${fontSize}rem`;
        piece.style.opacity = opacity;
        piece.style.animationDuration = `${animationDuration}s`;
        piece.style.animationDelay = `${animationDelay}s`;

        container.appendChild(piece);
    }
}

// Initialize floating chess pieces on page load
createFloatingChessPieces();

// Sound Effects using Web Audio API
function playClickSound() {
    if (!soundEffectsEnabled) return;
    
    try {
        ensureAudioReady();
        console.log('Playing click sound');
        
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(400, audioContext.currentTime + 0.1);
        
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.1);
    } catch (error) {
        console.log('Click sound error:', error);
    }
}

function playWinSound() {
    if (!soundEffectsEnabled) return;
    
    try {
        ensureAudioReady();
        console.log('Playing win sound');
        
        const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
        notes.forEach((freq, index) => {
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            oscillator.frequency.value = freq;
            oscillator.type = 'sine';
            
            gainNode.gain.setValueAtTime(0, audioContext.currentTime + index * 0.15);
            gainNode.gain.linearRampToValueAtTime(0.3, audioContext.currentTime + index * 0.15 + 0.05);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + index * 0.15 + 0.4);
            
            oscillator.start(audioContext.currentTime + index * 0.15);
            oscillator.stop(audioContext.currentTime + index * 0.15 + 0.4);
        });
    } catch (error) {
        console.log('Win sound error:', error);
    }
}

function playDrawSound() {
    if (!soundEffectsEnabled) return;
    
    try {
        ensureAudioReady();
        console.log('Playing draw sound');
        
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.setValueAtTime(300, audioContext.currentTime);
        oscillator.frequency.linearRampToValueAtTime(250, audioContext.currentTime + 0.3);
        oscillator.type = 'sine';
        
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.3);
    } catch (error) {
        console.log('Draw sound error:', error);
    }
}

// Toggle Background Music and Sound Effects
toggleMusicBtn.addEventListener('click', () => {
    initAudio(); // Ensure audio is initialized on user click
    
    if (isMusicPlaying) {
        bgMusic.pause();
        toggleMusicBtn.innerHTML = '🔇';
        toggleMusicBtn.classList.add('muted');
        isMusicPlaying = false;
        soundEffectsEnabled = false;
    } else {
        bgMusic.play().catch(e => console.log('Audio autoplay blocked:', e));
        toggleMusicBtn.innerHTML = '🔊';
        toggleMusicBtn.classList.remove('muted');
        isMusicPlaying = true;
        soundEffectsEnabled = true;
    }
});

// Start background music on first user interaction
function startMusic() {
    initAudio();
    if (isMusicPlaying) {
        bgMusic.play().catch(e => console.log('Audio autoplay blocked:', e));
    }
}

document.addEventListener('click', startMusic, { once: true });
document.addEventListener('touchstart', startMusic, { once: true });

// Initialize - hide replay button on page load
hideReplayButton();

// Navbar button functionality
const navHome = document.getElementById('nav-home');
const navPlay = document.getElementById('nav-play');
const navScores = document.getElementById('nav-scores');
const navAbout = document.getElementById('nav-about');

function setActiveNav(activeBtn) {
    [navHome, navPlay, navScores, navAbout].forEach(btn => {
        btn.classList.remove('active');
    });
    activeBtn.classList.add('active');
}

navHome.addEventListener('click', () => {
    setActiveNav(navHome);
    backToMenuScreen();
});

navPlay.addEventListener('click', () => {
    setActiveNav(navPlay);
    if (game.classList.contains('hidden')) {
        menu.classList.remove('hidden');
    }
});

navScores.addEventListener('click', () => {
    setActiveNav(navScores);
    // Scroll to scoreboard if game is visible
    if (!game.classList.contains('hidden')) {
        document.querySelector('.scoreboard').scrollIntoView({ behavior: 'smooth' });
    }
});

navAbout.addEventListener('click', () => {
    setActiveNav(navAbout);
    alert('🎮 Tic Tac Toe\n\nFeatures:\n• Two Player Mode\n• AI with 3 difficulty levels\n• Sound Effects & Background Music\n• Score Tracking\n• Replay Button\n\nEnjoy the game!');
});

// Console log for debugging
console.log('Game initialized. Click anywhere to enable sound.');

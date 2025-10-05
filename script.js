function toggleMenu(){
    const menu= document.querySelector(".menu-links");
    const icon= document.querySelector(".hamburger-icon");
    menu.classList.toggle("open");
    icon.classList.toggle("open");
}

// Dark Mode Toggle Functionality
(function() {
    // Get theme toggle buttons
    const themeToggle = document.getElementById('theme-toggle');
    const mobileThemeToggle = document.getElementById('mobile-theme-toggle');
    
    // Get theme icon elements
    const themeIcon = document.querySelector('#theme-toggle .theme-toggle-icon');
    const mobileThemeIcon = document.querySelector('#mobile-theme-toggle .theme-toggle-icon');
    
    // Check for saved theme preference or default to light mode
    const currentTheme = localStorage.getItem('theme') || 'light';
    
    // Apply the saved theme on page load
    document.documentElement.setAttribute('data-theme', currentTheme);
    updateThemeIcon(currentTheme);
    
    // Theme toggle function
    function toggleTheme() {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';
        
        // Update theme
        document.documentElement.setAttribute('data-theme', newTheme);
        
        // Save to localStorage
        localStorage.setItem('theme', newTheme);
        
        // Update icons
        updateThemeIcon(newTheme);
        
        // Add a subtle animation effect
        document.body.style.transition = 'all 0.3s ease';
        setTimeout(() => {
            document.body.style.transition = '';
        }, 300);
    }
    
    // Update theme icon based on current theme
    function updateThemeIcon(theme) {
        const icon = theme === 'light' ? '🌙' : '☀️';
        if (themeIcon) themeIcon.textContent = icon;
        if (mobileThemeIcon) mobileThemeIcon.textContent = icon;
    }
    
    // Add event listeners
    if (themeToggle) {
        themeToggle.addEventListener('click', toggleTheme);
    }
    
    if (mobileThemeToggle) {
        mobileThemeToggle.addEventListener('click', toggleTheme);
    }
    
    // Listen for system theme changes
    if (window.matchMedia) {
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        mediaQuery.addListener((e) => {
            // Only auto-switch if user hasn't manually set a preference
            if (!localStorage.getItem('theme')) {
                const newTheme = e.matches ? 'dark' : 'light';
                document.documentElement.setAttribute('data-theme', newTheme);
                updateThemeIcon(newTheme);
            }
        });
    }
})();

// Tic Tac Toe
(() => {
    const boardElement = document.querySelector('.ttt-board');
    if (!boardElement) return;

    const statusElement = document.querySelector('.ttt-status');
    const resetButton = document.querySelector('.ttt-reset');
    const cells = Array.from(document.querySelectorAll('.ttt-cell'));
    const difficultySelect = document.querySelector('#ttt-difficulty');

    let board = Array(9).fill(null);
    let currentPlayer = 'X';
    let gameOver = false;
    let aiThinking = false;
    const aiPlayer = 'O';
    const humanPlayer = 'X';
    let difficulty = (difficultySelect && difficultySelect.value) || 'hard'; // easy | medium | hard

    const winningCombos = [
        [0,1,2],[3,4,5],[6,7,8],
        [0,3,6],[1,4,7],[2,5,8],
        [0,4,8],[2,4,6]
    ];

    function setStatus(message){
        if (statusElement) statusElement.textContent = message;
    }

    function render(){
        cells.forEach((cell, idx) => {
            const val = board[idx];
            cell.textContent = val ? val : '';
            cell.classList.toggle('x', val === 'X');
            cell.classList.toggle('o', val === 'O');
            cell.disabled = !!val || gameOver || aiThinking || currentPlayer !== humanPlayer;
        });
    }

    function checkWinner(){
        for (const [a,b,c] of winningCombos){
            if (board[a] && board[a] === board[b] && board[a] === board[c]){
                return board[a];
            }
        }
        if (board.every(v => v)) return 'draw';
        return null;
    }

    function handleCellClick(e){
        const index = Number(e.currentTarget.getAttribute('data-index'));
        if (board[index] || gameOver || aiThinking || currentPlayer !== humanPlayer) return;
        board[index] = currentPlayer;
        const result = checkWinner();
        if (result === 'X' || result === 'O'){
            gameOver = true;
            setStatus(`Player ${result} wins!`);
        } else if (result === 'draw'){
            gameOver = true;
            setStatus("It's a draw!");
        } else {
            currentPlayer = currentPlayer === 'X' ? 'O' : 'X';
            setStatus(currentPlayer === aiPlayer ? 'AI is thinking…' : `Player ${currentPlayer}'s turn`);
        }
        render();

        if (!gameOver && currentPlayer === aiPlayer){
            aiThinking = true;
            render();
            setTimeout(() => {
                const move = decideAiMove(board, aiPlayer, difficulty);
                if (move !== -1 && !gameOver){
                    board[move] = aiPlayer;
                    const outcome = checkWinner();
                    if (outcome === aiPlayer){
                        gameOver = true;
                        setStatus('AI wins!');
                    } else if (outcome === 'draw'){
                        gameOver = true;
                        setStatus("It's a draw!");
                    } else {
                        currentPlayer = humanPlayer;
                        setStatus(`Player ${currentPlayer}'s turn`);
                    }
                }
                aiThinking = false;
                render();
            }, 350);
        }
    }

    function reset(){
        board = Array(9).fill(null);
        currentPlayer = 'X';
        gameOver = false;
        aiThinking = false;
        setStatus("Player X's turn");
        render();
    }

    cells.forEach(cell => cell.addEventListener('click', handleCellClick));
    if (resetButton) resetButton.addEventListener('click', reset);
    if (difficultySelect) difficultySelect.addEventListener('change', (e) => {
        difficulty = e.target.value;
        // small UX: reset hints/status to player's turn if not in game over
        if (!gameOver){
            setStatus(currentPlayer === aiPlayer ? 'AI is thinking…' : `Player ${currentPlayer}'s turn`);
            render();
        }
    });

    // initial
    setStatus("Player X's turn");
    render();

    // Minimax AI (optimal)
    function findBestMove(currentBoard, player){
        // If first move for AI and center is free, take center
        if (currentBoard.filter(v => v !== null).length === 1 && currentBoard[4] === null) return 4;

        let bestScore = -Infinity;
        let bestMove = -1;
        for (let i = 0; i < 9; i++){
            if (currentBoard[i] === null){
                currentBoard[i] = player;
                const score = minimax(currentBoard, 0, false, player);
                currentBoard[i] = null;
                if (score > bestScore){
                    bestScore = score;
                    bestMove = i;
                }
            }
        }
        return bestMove;
    }

    function decideAiMove(currentBoard, aiSymbol, mode){
        // Easy: random available
        const available = currentBoard.map((v, i) => v === null ? i : -1).filter(i => i !== -1);
        if (mode === 'easy'){
            if (available.length === 0) return -1;
            return available[Math.floor(Math.random() * available.length)];
        }

        // Medium: try to win, then block, else random
        if (mode === 'medium'){
            // Try winning move
            for (const i of available){
                currentBoard[i] = aiSymbol;
                if (terminalState(currentBoard) === aiSymbol){ currentBoard[i] = null; return i; }
                currentBoard[i] = null;
            }
            // Try block opponent
            const opp = getOpponent(aiSymbol);
            for (const i of available){
                currentBoard[i] = opp;
                if (terminalState(currentBoard) === opp){ currentBoard[i] = null; return i; }
                currentBoard[i] = null;
            }
            // Prefer center, corners, then random
            const priorities = [4,0,2,6,8,1,3,5,7];
            for (const p of priorities){ if (available.includes(p)) return p; }
            return available.length ? available[0] : -1;
        }

        // Hard: minimax optimal
        return findBestMove(currentBoard, aiSymbol);
    }

    function minimax(currentBoard, depth, isMaximizing, aiSymbol){
        const result = terminalState(currentBoard);
        if (result !== null){
            // positive for AI, negative for human, prefer faster wins and slower losses
            if (result === aiSymbol) return 10 - depth;
            if (result === getOpponent(aiSymbol)) return depth - 10;
            return 0; // draw
        }

        if (isMaximizing){
            let best = -Infinity;
            for (let i = 0; i < 9; i++){
                if (currentBoard[i] === null){
                    currentBoard[i] = aiSymbol;
                    best = Math.max(best, minimax(currentBoard, depth + 1, false, aiSymbol));
                    currentBoard[i] = null;
                }
            }
            return best;
        } else {
            let best = Infinity;
            const opp = getOpponent(aiSymbol);
            for (let i = 0; i < 9; i++){
                if (currentBoard[i] === null){
                    currentBoard[i] = opp;
                    best = Math.min(best, minimax(currentBoard, depth + 1, true, aiSymbol));
                    currentBoard[i] = null;
                }
            }
            return best;
        }
    }

    function terminalState(b){
        for (const [a,bIdx,c] of winningCombos){
            if (b[a] && b[a] === b[bIdx] && b[a] === b[c]){
                return b[a];
            }
        }
        if (b.every(v => v)) return 'draw';
        return null;
    }

    function getOpponent(symbol){
        return symbol === 'X' ? 'O' : 'X';
    }
})();


// Mines Game
(() => {
    const boardContainer = document.querySelector('.mines-board');
    if (!boardContainer) return;

    const minesCountSelect = document.querySelector('#mines-count');
    const startButton = document.querySelector('.mines-start');
    const stopButton = document.querySelector('.mines-stop');
    const resetButton = document.querySelector('.mines-reset');
    const statusLabel = document.querySelector('.mines-status');
    const scoreLabel = document.querySelector('.mines-score');

    const GRID_SIZE = 16; // 4x4
    let minesCount = Number(minesCountSelect ? minesCountSelect.value : 3);
    let minesSet = new Set();
    let revealedSafeCount = 0;
    let score = 0;
    let started = false;
    let gameOver = false;

    function updateScore(){
        if (scoreLabel) scoreLabel.textContent = `Score: ${score}`;
    }

    function setStatus(msg){
        if (statusLabel) statusLabel.textContent = msg;
    }

    function renderBoard(){
        boardContainer.innerHTML = '';
        for (let i = 0; i < GRID_SIZE; i++){
            const cell = document.createElement('button');
            cell.className = 'mines-cell';
            cell.setAttribute('role', 'gridcell');
            cell.setAttribute('aria-label', `Cell ${i + 1}`);
            cell.dataset.index = String(i);
            cell.addEventListener('click', onCellClick);
            boardContainer.appendChild(cell);
        }
    }

    function randomizeMines(){
        minesSet.clear();
        const total = Math.min(Math.max(1, minesCount), GRID_SIZE - 1);
        while (minesSet.size < total){
            minesSet.add(Math.floor(Math.random() * GRID_SIZE));
        }
    }

    function onCellClick(e){
        const cell = e.currentTarget;
        if (!started || gameOver) return;
        const idx = Number(cell.dataset.index);
        if (cell.classList.contains('revealed')) return;

        if (minesSet.has(idx)){
            revealMine(cell);
            revealAllMines();
            gameOver = true;
            started = false;
            stopButton.disabled = true;
            startButton.disabled = false;
            setStatus('Boom! You hit a mine.');
            return;
        }
        revealSafe(cell);
        revealedSafeCount++;
        score += 1; // +1 per safe pick
        updateScore();
        setStatus('Safe! Continue or press Stop.');

        const totalSafes = GRID_SIZE - minesSet.size;
        if (revealedSafeCount >= totalSafes){
            gameOver = true;
            started = false;
            setStatus(`Perfect! Board cleared. Final Score: ${score}`);
            stopButton.disabled = true;
            startButton.disabled = false;
        }
    }

    function revealMine(cell){
        cell.classList.add('revealed', 'mine');
        cell.textContent = '💣';
    }

    function revealSafe(cell){
        cell.classList.add('revealed', 'safe');
        cell.textContent = '⭐️';
    }

    function revealAllMines(){
        const cells = Array.from(boardContainer.querySelectorAll('.mines-cell'));
        for (const idx of minesSet){
            const c = cells[idx];
            if (!c.classList.contains('revealed')){
                c.classList.add('revealed', 'mine');
                c.textContent = '💣';
            }
        }
    }

    function resetGame(full = false){
        revealedSafeCount = 0;
        score = 0;
        gameOver = false;
        started = false;
        if (minesCountSelect) minesCount = Number(minesCountSelect.value);
        if (full){
            randomizeMines();
        } else {
            minesSet.clear();
        }
        renderBoard();
        updateScore();
        stopButton.disabled = true;
        startButton.disabled = false;
        setStatus('Choose mines and press Start');
    }

    // Controls
    if (minesCountSelect){
        minesCountSelect.addEventListener('change', () => {
            minesCount = Number(minesCountSelect.value);
            resetGame(false);
        });
    }

    if (startButton){
        startButton.addEventListener('click', () => {
            if (started && !gameOver) return;
            revealedSafeCount = 0;
            score = 0;
            gameOver = false;
            started = true;
            randomizeMines();
            renderBoard();
            updateScore();
            setStatus('Game started. Pick a safe tile.');
            stopButton.disabled = false;
            startButton.disabled = true;
        });
    }

    if (stopButton){
        stopButton.addEventListener('click', () => {
            if (!started || gameOver) return;
            setStatus(`Stopped. Final Score: ${score}`);
            started = false;
            gameOver = true;
            stopButton.disabled = true;
            startButton.disabled = false;
            revealAllMines();
        });
    }

    if (resetButton){
        resetButton.addEventListener('click', () => {
            resetGame(false);
        });
    }

    // Initial
    renderBoard();
    updateScore();
    setStatus('Choose mines and press Start');
})();

// Surprise Games Section
(() => {
    const surpriseButton = document.getElementById('surprise-button');
    
    if (!surpriseButton) return;
    
    function navigateToGames() {
        // Add a subtle celebration effect
        surpriseButton.style.transform = 'scale(1.1) rotate(5deg)';
        setTimeout(() => {
            surpriseButton.style.transform = '';
        }, 300);
        
        // Update button text
        const buttonText = surpriseButton.querySelector('.surprise-text');
        const buttonEmoji = surpriseButton.querySelector('.surprise-emoji');
        if (buttonText) buttonText.textContent = 'Loading...';
        if (buttonEmoji) buttonEmoji.textContent = '🎮';
        
        // Navigate to games page after a short delay
        setTimeout(() => {
            window.location.href = 'games.html';
        }, 500);
    }
    
    surpriseButton.addEventListener('click', navigateToGames);
    
    // Add some hover effects for the surprise button
    surpriseButton.addEventListener('mouseenter', () => {
        surpriseButton.style.transform = 'scale(1.05) translateY(-2px)';
    });
    
    surpriseButton.addEventListener('mouseleave', () => {
        surpriseButton.style.transform = '';
    });
})();
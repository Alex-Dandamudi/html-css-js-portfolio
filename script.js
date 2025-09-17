function toggleMenu(){
    const menu= document.querySelector(".menu-links");
    const icon= document.querySelector(".hamburger-icon");
    menu.classList.toggle("open");
    icon.classList.toggle("open");
}

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
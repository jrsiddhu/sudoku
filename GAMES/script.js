document.addEventListener('DOMContentLoaded', () => {
    const boardElement = document.getElementById('sudoku-board');
    const timerElement = document.getElementById('timer');
    const livesElement = document.getElementById('lives');
    const difficultySelect = document.getElementById('difficulty-select');
    const newGameBtn = document.getElementById('new-game-btn');
    const eraseBtn = document.getElementById('erase-btn');
    const numberButtons = document.querySelectorAll('.n-btn');
    const modal = document.getElementById('game-modal');
    const modalTitle = document.getElementById('modal-title');
    const modalMessage = document.getElementById('modal-message');
    const modalRestart = document.getElementById('modal-restart');

    let board = [];
    let solution = [];
    let initial = [];
    let selectedCell = null;
    let timer = 0;
    let timerInterval = null;
    let lives = 3;

    // --- Sudoku Core ---

    function isValid(grid, row, col, num) {
        for (let x = 0; x <= 8; x++) if (grid[row][x] === num) return false;
        for (let x = 0; x <= 8; x++) if (grid[x][col] === num) return false;
        let startRow = row - row % 3, startCol = col - col % 3;
        for (let i = 0; i < 3; i++)
            for (let j = 0; j < 3; j++)
                if (grid[i + startRow][j + startCol] === num) return false;
        return true;
    }

    function solveSudoku(grid) {
        for (let row = 0; row < 9; row++) {
            for (let col = 0; col < 9; col++) {
                if (grid[row][col] === 0) {
                    let nums = [1, 2, 3, 4, 5, 6, 7, 8, 9];
                    // Fisher-Yates shuffle
                    for (let i = nums.length - 1; i > 0; i--) {
                        const j = Math.floor(Math.random() * (i + 1));
                        [nums[i], nums[j]] = [nums[j], nums[i]];
                    }
                    for (let n of nums) {
                        if (isValid(grid, row, col, n)) {
                            grid[row][col] = n;
                            if (solveSudoku(grid)) return true;
                            grid[row][col] = 0;
                        }
                    }
                    return false;
                }
            }
        }
        return true;
    }

    function generateGame() {
        let grid = Array.from({ length: 9 }, () => Array(9).fill(0));
        solveSudoku(grid);
        solution = grid.map(row => [...row]);

        let clues;
        switch (difficultySelect.value) {
            case 'easy': clues = 45; break;
            case 'medium': clues = 35; break;
            case 'hard': clues = 25; break;
            default: clues = 35;
        }

        let currentBoard = grid.map(row => [...row]);
        let attempts = 81 - clues;
        while (attempts > 0) {
            let r = Math.floor(Math.random() * 9);
            let c = Math.floor(Math.random() * 9);
            if (currentBoard[r][c] !== 0) {
                currentBoard[r][c] = 0;
                attempts--;
            }
        }
        board = currentBoard.map(row => [...row]);
        initial = currentBoard.map(row => [...row]);
    }

    // --- UI Logic ---

    function initBoard() {
        boardElement.innerHTML = '';
        for (let r = 0; r < 9; r++) {
            for (let c = 0; c < 9; c++) {
                const cell = document.createElement('div');
                cell.classList.add('cell');
                cell.dataset.row = r;
                cell.dataset.col = c;
                
                if (board[r][c] !== 0) {
                    cell.innerText = board[r][c];
                    cell.classList.add('given');
                } else {
                    cell.addEventListener('click', () => selectCell(cell));
                }
                boardElement.appendChild(cell);
            }
        }
    }

    function selectCell(cell) {
        if (selectedCell) selectedCell.classList.remove('selected');
        selectedCell = cell;
        selectedCell.classList.add('selected');
    }

    function inputNumber(num) {
        if (!selectedCell) return;
        const r = parseInt(selectedCell.dataset.row);
        const c = parseInt(selectedCell.dataset.col);

        if (initial[r][c] !== 0) return; // Cannot edit initial clues

        if (solution[r][c] === num) {
            board[r][c] = num;
            selectedCell.innerText = num;
            selectedCell.classList.remove('wrong');
            selectedCell.classList.add('given');
            selectedCell.classList.remove('selected');
            selectedCell = null;
            checkWin();
        } else {
            lives--;
            updateLivesUI();
            selectedCell.innerText = num;
            selectedCell.classList.add('wrong');
            setTimeout(() => {
                selectedCell.innerText = '';
                selectedCell.classList.remove('wrong');
            }, 500);
            if (lives <= 0) gameOver(false);
        }
    }

    function updateLivesUI() {
        livesElement.innerText = '⭐'.repeat(lives) + '☆'.repeat(3 - lives);
    }

    function checkWin() {
        for (let r = 0; r < 9; r++) {
            for (let c = 0; c < 9; c++) {
                if (board[r][c] !== solution[r][c]) return;
            }
        }
        gameOver(true);
    }

    function updateTimer() {
        timer++;
        const mins = Math.floor(timer / 60).toString().padStart(2, '0');
        const secs = (timer % 60).toString().padStart(2, '0');
        timerElement.innerText = `${mins}:${secs}`;
    }

    function startTimer() {
        stopTimer();
        timer = 0;
        timerInterval = setInterval(updateTimer, 1000);
    }

    function stopTimer() {
        if (timerInterval) clearInterval(timerInterval);
    }

    function startNewGame() {
        lives = 3;
        updateLivesUI();
        generateGame();
        initBoard();
        startTimer();
        modal.classList.add('hidden');
        selectedCell = null;
    }

    function gameOver(isWin) {
        stopTimer();
        modal.classList.remove('hidden');
        if (isWin) {
            modalTitle.innerText = "You Won! 🎉";
            modalMessage.innerText = `Great job! You finished in ${timerElement.innerText}.`;
            modalRestart.innerText = "Play Again";
        } else {
            modalTitle.innerText = "Game Over 💀";
            modalMessage.innerText = "You ran out of lives. Try again?";
            modalRestart.innerText = "Restart";
        }
    }

    // --- Event Listeners ---

    newGameBtn.addEventListener('click', startNewGame);
    modalRestart.addEventListener('click', startNewGame);

    numberButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            inputNumber(parseInt(btn.dataset.value));
        });
    });

    eraseBtn.addEventListener('click', () => {
        if (!selectedCell) return;
        const r = parseInt(selectedCell.dataset.row);
        const c = parseInt(selectedCell.dataset.col);
        if (initial[r][c] === 0) {
            board[r][c] = 0;
            selectedCell.innerText = '';
            selectedCell.classList.remove('wrong');
        }
    });

    // Start on load
    startNewGame();
});

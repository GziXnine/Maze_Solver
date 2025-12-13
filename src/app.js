import { generateMaze, generateMazeData } from './MazeGeneration/generateMaze.js';
import { posKey, dirs } from './helper/help.js';
import { writeMazeFile, runPythonSolver, generateMazeContent, parseSolutionFile } from './fileHandler.js';

// State
let gridSize = 15;
let grid = [];
let wallCells = new Set();
let startPos = { row: 0, col: 0 };
let endPositions = [];
let isAnimating = false;
let shouldStopAlgorithm = false;
let speed = 100;
let startTime = null;
let timerInterval = null;

// Maze entities
let mazeData = null; // Stores R, C, D, x positions
let ratPath = []; // Path from Python BFS solution
let currentRatStep = 0; // Current position in path
let trapsPenalty = 0; // Total penalty from traps hit by rat
let ratFrozen = false; // Is rat frozen by a trap?

// DOM Elements
const gridSizeInput = document.getElementById('gridSize');
const algorithmSelect = document.getElementById('algorithm');
const speedSlider = document.getElementById('speed');
const speedValue = document.getElementById('speedValue');
const doorCountInput = document.getElementById('doorCount');
const trapCountInput = document.getElementById('trapCount');
const mazeGrid = document.getElementById('mazeGrid');
const generateBtn = document.getElementById('generateBtn');
const solveBtn = document.getElementById('solveBtn');
const resetBtn = document.getElementById('resetBtn');
const downloadBtn = document.getElementById('downloadBtn');
const pathLengthEl = document.getElementById('pathLength');
const nodesVisitedEl = document.getElementById('nodesVisited');
const statusEl = document.getElementById('status');
const timerEl = document.getElementById('timer');
const efficiencyEl = document.getElementById('efficiency');
const themeToggle = document.getElementById('themeToggle');

// Initialize
function init() {
    setupEventListeners();
    updateGrid();
    renderGrid();
    loadTheme();

    updateStatus('Click "Generate Maze" to start');
}

// Setup Event Listeners
function setupEventListeners() {
    gridSizeInput.addEventListener('change', () => {
        gridSize = parseInt(gridSizeInput.value) || 25;
        updateGrid();
        renderGrid();
    });

    speedSlider.addEventListener('input', () => {
        speed = parseInt(speedSlider.value);
        speedValue.textContent = speed;
    });

    generateBtn.addEventListener('click', handleGenerate);
    solveBtn.addEventListener('click', handleSolve);
    resetBtn.addEventListener('click', handleReset);
    downloadBtn.addEventListener('click', downloadMazeImage);

    // Theme toggle
    if (themeToggle) {
        themeToggle.addEventListener('click', toggleTheme);
    }

    document.addEventListener('keydown', (e) => {
        if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
            e.preventDefault();
            moveCat(e.key);
        }
        // WASD controls removed - Python BFS controls rat
    });
}



function updateGrid() {
    grid = Array(gridSize).fill(null).map(() => Array(gridSize).fill(null));
}

function renderGrid() {
    if (!mazeGrid) {
        return;
    }

    mazeGrid.innerHTML = '';
    const availableWidth = Math.max(600, window.innerWidth - 400);
    const availableHeight = Math.max(600, window.innerHeight - 100);
    const cellSize = Math.max(20, Math.min(40, Math.floor(Math.min(availableWidth, availableHeight) / gridSize)));

    mazeGrid.style.gridTemplateColumns = `repeat(${gridSize}, ${cellSize}px)`;
    mazeGrid.style.gridTemplateRows = `repeat(${gridSize}, ${cellSize}px)`;

    for (let i = 0; i < gridSize; i++) {
        for (let j = 0; j < gridSize; j++) {
            const cell = document.createElement('div');
            cell.className = 'cell';
            cell.dataset.row = i;
            cell.dataset.col = j;
            cell.style.width = `${cellSize}px`;
            cell.style.height = `${cellSize}px`;

            // Check if we have mazeData with entity info
            if (mazeData && mazeData[i] && mazeData[i][j]) {
                const cellData = mazeData[i][j];
                if (cellData === 'R') {
                    cell.classList.add('rat');
                    cell.textContent = '🐭';
                } else if (cellData === 'C') {
                    cell.classList.add('cat');
                    cell.textContent = '🐱';
                } else if (cellData === 'D') {
                    cell.classList.add('door');
                    cell.textContent = '🚪';
                } else if (cellData === 'x') {
                    cell.classList.add('trap');
                    cell.textContent = '🕳️';
                } else if (cellData === 0) {
                    cell.classList.add('wall');
                }
                // cellData === 1 means empty path, no class needed
            } else {
                // No mazeData - just show walls
                if (wallCells.has(posKey(i, j))) {
                    cell.classList.add('wall');
                }
            }

            mazeGrid.appendChild(cell);
            grid[i][j] = cell;
        }
    }
}


function moveCat(direction) {
    if (!mazeData) {
        updateStatus('Generate a maze first!');
        return;
    }

    // Find cat and rat positions from mazeData
    let catR = -1, catC = -1, ratR = -1, ratC = -1;
    for (let r = 0; r < gridSize; r++) {
        for (let c = 0; c < gridSize; c++) {
            if (mazeData[r][c] === 'C') {
                catR = r;
                catC = c;
            }
            if (mazeData[r][c] === 'R') {
                ratR = r;
                ratC = c;
            }
        }
    }

    if (catR === -1) return;

    let newRow = catR, newCol = catC;

    switch (direction) {
        case 'ArrowUp': newRow = Math.max(0, catR - 1); break;
        case 'ArrowDown': newRow = Math.min(gridSize - 1, catR + 1); break;
        case 'ArrowLeft': newCol = Math.max(0, catC - 1); break;
        case 'ArrowRight': newCol = Math.min(gridSize - 1, catC + 1); break;
    }

    // Don't move onto walls
    if (mazeData[newRow][newCol] === 0) return;

    // CHECK IF CAT IS MOVING ONTO RAT'S POSITION
    if (newRow === ratR && newCol === ratC) {
        // Cat caught the rat!
        mazeData[catR][catC] = 1; // Old cat position becomes path
        mazeData[newRow][newCol] = 'C'; // Cat replaces rat
        renderGrid();
        updateStatus('Cat caught the rat!\n Game Over!');
        ratPath = []; // Stop the game
        return;
    }

    // Move cat normally
    mazeData[catR][catC] = 1; // Old position becomes path
    mazeData[newRow][newCol] = 'C'; // New position is cat

    renderGrid();

    // If rat is frozen from trap, unfreeze it instead of moving it
    if (ratFrozen) {
        ratFrozen = false;
        updateStatus('Rat is unfrozen!\n Can move next turn.');
        return; // Rat doesn't move this turn
    }

    // If cat didn't catch rat, let rat move
    moveRatOneStep();

    renderGrid();

    // Check again after rat moved (in case rat moved onto cat)
    checkGameOver();
}

function moveRatOneStep() {
    if (!ratPath || ratPath.length === 0) return;
    if (currentRatStep >= ratPath.length - 1) {
        updateStatus(`Rat reached the door! Rat wins!\n Total penalty: ${trapsPenalty}`);
        return;
    }

    // Get current and next rat position
    const currentPos = ratPath[currentRatStep];
    const nextPos = ratPath[currentRatStep + 1];

    // Find cat position to make sure we don't move rat onto cat
    let catR = -1, catC = -1;
    for (let r = 0; r < gridSize; r++) {
        for (let c = 0; c < gridSize; c++) {
            if (mazeData[r][c] === 'C') {
                catR = r;
                catC = c;
                break;
            }
        }
        if (catR !== -1) break;
    }

    // Check if rat is moving onto cat (rat loses)
    if (nextPos.row === catR && nextPos.col === catC) {
        // Clear old rat position
        if (mazeData[currentPos.row][currentPos.col] === 'R') {
            mazeData[currentPos.row][currentPos.col] = 1;
        }
        // Don't place rat - it was caught!
        updateStatus('Cat caught the rat!\n Game Over!');
        ratPath = [];
        return;
    }

    // Check if next position is a trap BEFORE moving
    const isMovingOntoTrap = mazeData[nextPos.row][nextPos.col] === 'x';

    // Move rat normally
    if (mazeData[currentPos.row][currentPos.col] === 'R') {
        mazeData[currentPos.row][currentPos.col] = 1; // Old position becomes path
    }

    mazeData[nextPos.row][nextPos.col] = 'R'; // New position is rat
    currentRatStep++;

    // If rat stepped on trap, freeze it for next turn and add penalty
    if (isMovingOntoTrap) {
        trapsPenalty++;
        ratFrozen = true;
        updateStatus(`Rat caught by TRAP! Frozen for 1 turn! \n Penalty: +1 (Total: ${trapsPenalty})`);
    } else {
        updateStatus(`Rat moved to step ${currentRatStep}/${ratPath.length - 1} \n Penalty: ${trapsPenalty}`);
    }
}

function checkGameOver() {
    if (!mazeData) return false;

    // Find rat and cat positions
    let ratR = -1, ratC = -1, catR = -1, catC = -1;

    for (let r = 0; r < gridSize; r++) {
        for (let c = 0; c < gridSize; c++) {
            if (mazeData[r][c] === 'R') {
                ratR = r;
                ratC = c;
            }
            if (mazeData[r][c] === 'C') {
                catR = r;
                catC = c;
            }
        }
    }

    // If we can't find rat, cat already caught it!
    if (ratR === -1 && catR !== -1) {
        updateStatus('Cat caught the rat!\n Game Over!');
        ratPath = []; // Stop the game
        return true; // Game over
    }

    // Check if cat caught rat (they're on same position)
    if (ratR !== -1 && catR !== -1 && ratR === catR && ratC === catC) {
        updateStatus('Cat caught the rat!\n Game Over!');
        ratPath = []; // Stop the game
        return true; // Game over
    }

    return false; // Game continues
}



async function handleGenerate() {
    if (isAnimating) return;
    isAnimating = true;
    updateStatus('Generating maze...');

    // Clear old maze data
    mazeData = null;
    wallCells.clear();

    // Clear all cells - make them black (walls)
    for (let i = 0; i < gridSize; i++) {
        for (let j = 0; j < gridSize; j++) {
            const cell = grid[i][j];
            if (cell) {
                cell.className = 'cell wall';
                cell.textContent = '';
            }
            wallCells.add(posKey(i, j));
        }
    }

    await new Promise(resolve => setTimeout(resolve, 300));

    // Call generateMaze with proper parameters
    const isValid = (r, c) => r >= 0 && r < gridSize && c >= 0 && c < gridSize;

    await generateMaze({
        numCells: gridSize,
        startPos: startPos,
        endPos: endPositions[0] || { row: gridSize - 1, col: gridSize - 1 },
        grid: grid,
        wallCells: wallCells,
        getSpeed: () => speed,
        isValid: isValid,
        shouldStop: () => false
    });


    // Generate entity positions after maze is created
    const doorCount = parseInt(doorCountInput?.value) || 3;
    const trapCount = parseInt(trapCountInput?.value) || 10;
    mazeData = generateMazeData(gridSize, wallCells, doorCount, trapCount);

    renderGrid();

    // Auto-export maze.txt after generation
    if (mazeData) {
        const content = generateMazeContent(gridSize, mazeData);
        const success = await writeMazeFile(content);
        if (success) {
            updateStatus('Maze saved!');
        } else {
            updateStatus('Error: Make sure server is running (node server.js)');
        }
    } else {
        updateStatus('Maze generated but failed to save entities!');
    }

    isAnimating = false;
}

// Timer Functions
function startTimer() {
    startTime = Date.now();
    if (timerInterval) clearInterval(timerInterval);
    timerInterval = setInterval(() => {
        const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
        if (timerEl) timerEl.textContent = elapsed + 's';
    }, 100);
}

function stopTimer() {
    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
    }
}

function resetTimer() {
    stopTimer();
    if (timerEl) timerEl.textContent = '0.0s';
}

function handleReset() {
    if (isAnimating) return;
    wallCells.clear();
    mazeData = null;
    ratPath = [];
    currentRatStep = 0;
    trapsPenalty = 0;
    ratFrozen = false;
    renderGrid();
    pathLengthEl.textContent = '--';
    nodesVisitedEl.textContent = '0';
    efficiencyEl.textContent = '--';
    resetTimer();
    updateStatus('Reset complete');
}



async function handleSolve() {
    if (!mazeData) {
        updateStatus('Please generate a maze first!');
        return;
    }

    updateStatus('Running Python BFS solver...');

    try {
        const solutionText = await runPythonSolver();
        const solution = parseSolutionFile(solutionText);

        // Check if no solution found
        if (solution.status === 'NO_SOLUTION') {
            updateStatus(`${solution.message}`);

            // Update stats display to show NO_SOLUTION
            if (pathLengthEl) pathLengthEl.textContent = '0';
            if (nodesVisitedEl) nodesVisitedEl.textContent = solution.stats.nodesVisited || '0';
            if (efficiencyEl) efficiencyEl.textContent = 'NaN%';

            alert(solution.message);
            return;
        }

        // Store the path and reset rat position
        ratPath = solution.path;
        currentRatStep = 0;
        trapsPenalty = 0; // Reset penalty counter for new solution
        ratFrozen = false; // Reset frozen state

        displaySolution(solution);

        // Display stats
        const { stats } = solution;
        const statusText = `${solution.status}\n`;
        updateStatus(statusText);

        // Update stats display
        if (pathLengthEl) pathLengthEl.textContent = stats.pathLength;
        if (nodesVisitedEl) nodesVisitedEl.textContent = stats.nodesVisited;
        if (efficiencyEl) {
            const efficiency = ((stats.pathLength / stats.nodesVisited) * 100).toFixed(1);
            efficiencyEl.textContent = efficiency + '%';
        }

    } catch (error) {
        updateStatus('Error: ' + error.message);
        console.error(error);
    }
}

function displaySolution(solution) {
    const { path } = solution;

    if (!path || path.length === 0) {
        updateStatus('No path found in solution!');
        return;
    }

    // Clear previous path visualization
    for (let r = 0; r < gridSize; r++) {
        for (let c = 0; c < gridSize; c++) {
            grid[r][c].classList.remove('path');
        }
    }

    // Highlight the path
    for (const step of path) {
        if (grid[step.row] && grid[step.row][step.col]) {
            grid[step.row][step.col].classList.add('path');
        }
    }

    updateStatus(`Path has ${path.length} steps.`);
}

function downloadMazeImage() {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const cellSize = 30;
    canvas.width = gridSize * cellSize;
    canvas.height = gridSize * cellSize;
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    for (let i = 0; i < gridSize; i++) {
        for (let j = 0; j < gridSize; j++) {
            const x = j * cellSize, y = i * cellSize;
            const cellData = mazeData[i][j];

            // Draw based on mazeData
            if (cellData === 'R') {
                ctx.fillStyle = '#00ff00';
            } else if (cellData === 'C') {
                ctx.fillStyle = '#ff6b00';
            } else if (cellData === 'D') {
                ctx.fillStyle = '#8b4513';
            } else if (cellData === 'x') {
                ctx.fillStyle = '#ff0000';
            } else if (cellData === 0) {
                ctx.fillStyle = '#000000';
            } else if (grid[i][j].classList.contains('path')) {
                ctx.fillStyle = '#00bfff';
            } else {
                ctx.fillStyle = '#ffffff';
            }

            ctx.fillRect(x, y, cellSize - 2, cellSize - 2);

            // Add emoji text
            ctx.font = '20px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            if (cellData === 'R') ctx.fillText('🐭', x + cellSize / 2, y + cellSize / 2);
            else if (cellData === 'C') ctx.fillText('🐱', x + cellSize / 2, y + cellSize / 2);
            else if (cellData === 'D') ctx.fillText('🚪', x + cellSize / 2, y + cellSize / 2);
            else if (cellData === 'x') ctx.fillText('🕳️', x + cellSize / 2, y + cellSize / 2);
        }
    }

    canvas.toBlob((blob) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `maze-${Date.now()}.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        updateStatus('Image downloaded!');
    });
}

function updateStatus(message) {
    statusEl.textContent = message;
}

// Theme Toggle Functions
function toggleTheme() {
    const body = document.body;
    const currentTheme = body.classList.contains('light-theme') ? 'light' : 'dark';
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';

    if (newTheme === 'light') {
        body.classList.add('light-theme');
        themeToggle.querySelector('.theme-icon').textContent = '🌙';
    } else {
        body.classList.remove('light-theme');
        themeToggle.querySelector('.theme-icon').textContent = '☀️';
    }

    localStorage.setItem('theme', newTheme);
    updateStatus(`Switched to ${newTheme} theme`);
}

function loadTheme() {
    if (!themeToggle) {
        return;
    }

    const savedTheme = localStorage.getItem('theme') || 'dark';

    if (savedTheme === 'light') {
        document.body.classList.add('light-theme');
        themeToggle.querySelector('.theme-icon').textContent = '🌙';
    } else {
        themeToggle.querySelector('.theme-icon').textContent = '☀️';
    }
}

// Initialize app when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

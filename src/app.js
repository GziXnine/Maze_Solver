import { generateMaze, generateMazeData } from './MazeGeneration/generateMaze.js';
import { posKey } from './helper/help.js';
import { solveMaze } from './Algorithm/bfs_solver.js';

// UI wiring
const ui = {
    gridSizeInput: document.getElementById('gridSize'),
    speedSlider: document.getElementById('speed'),
    speedValue: document.getElementById('speedValue'),
    doorCountInput: document.getElementById('doorCount'),
    trapCountInput: document.getElementById('trapCount'),
    mazeGrid: document.getElementById('mazeGrid'),
    generateBtn: document.getElementById('generateBtn'),
    solveBtn: document.getElementById('solveBtn'),
    resetBtn: document.getElementById('resetBtn'),
    downloadBtn: document.getElementById('downloadBtn'),
    pathLengthEl: document.getElementById('pathLength'),
    nodesVisitedEl: document.getElementById('nodesVisited'),
    efficiencyEl: document.getElementById('efficiency'),
    statusEl: document.getElementById('status'),
    timerEl: document.getElementById('timer'),
    themeToggle: document.getElementById('themeToggle'),
};

// Core state container (Single Responsibility for game state)
class GameState {
    constructor() {
        this.gridSize = 15;
        this.grid = [];
        this.wallCells = new Set();
        this.startPos = { row: 0, col: 0 };
        this.endPositions = [];
        this.isAnimating = false;
        this.speed = 100;

        // Entities
        this.mazeData = null;
        this.ratPath = [];
        this.currentRatStep = 0;
        this.trapsPenalty = 0;
        this.ratFrozen = false;
    }

    setGridSize(size) {
        this.gridSize = size;
    }

    resetEntities() {
        this.mazeData = null;
        this.ratPath = [];
        this.currentRatStep = 0;
        this.trapsPenalty = 0;
        this.ratFrozen = false;
    }

    resetWalls() {
        this.wallCells.clear();
    }

    buildGridArray() {
        this.grid = Array(this.gridSize).fill(null).map(() => Array(this.gridSize).fill(null));
    }
}

// Status view
class StatusPanel {
    constructor(statusEl) {
        this.statusEl = statusEl;
    }

    update(message) {
        if (this.statusEl) {
            this.statusEl.textContent = message;
        }
    }
}

// Timer
class Timer {
    constructor(timerEl) {
        this.timerEl = timerEl;
        this.startTime = null;
        this.timerInterval = null;
    }

    start() {
        this.startTime = Date.now();
        this.stop();
        this.timerInterval = setInterval(() => {
            const elapsed = ((Date.now() - this.startTime) / 1000).toFixed(1);
            if (this.timerEl) this.timerEl.textContent = `${elapsed}s`;
        }, 100);
    }

    stop() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
    }

    reset() {
        this.stop();
        if (this.timerEl) this.timerEl.textContent = '0.0s';
    }
}

// Stats display
class StatsPanel {
    constructor(pathEl, visitedEl, efficiencyEl) {
        this.pathEl = pathEl;
        this.visitedEl = visitedEl;
        this.efficiencyEl = efficiencyEl;
    }

    reset() {
        if (this.pathEl) this.pathEl.textContent = '--';
        if (this.visitedEl) this.visitedEl.textContent = '0';
        if (this.efficiencyEl) this.efficiencyEl.textContent = '--';
    }

    update(stats) {
        if (!stats) return;
        const { pathLength, nodesVisited } = stats;
        if (this.pathEl) this.pathEl.textContent = pathLength;
        if (this.visitedEl) this.visitedEl.textContent = nodesVisited;
        if (this.efficiencyEl) {
            const efficiency = nodesVisited ? ((pathLength / nodesVisited) * 100).toFixed(1) : '0.0';
            this.efficiencyEl.textContent = `${efficiency}%`;
        }
    }
}

// Renderer handles all DOM painting for the grid
class MazeRenderer {
    constructor(state, ui, status) {
        this.state = state;
        this.ui = ui;
        this.status = status;
    }

    rebuildGrid() {
        const { mazeGrid, gridSizeInput } = this.ui;
        const { gridSize } = this.state;

        if (!mazeGrid) return;

        this.state.buildGridArray();
        mazeGrid.innerHTML = '';

        const availableWidth = Math.max(600, window.innerWidth - 400);
        const availableHeight = Math.max(600, window.innerHeight - 100);
        const cellSize = Math.max(20, Math.min(40, Math.floor(Math.min(availableWidth, availableHeight) / gridSize)));

        mazeGrid.style.gridTemplateColumns = `repeat(${gridSize}, ${cellSize}px)`;
        mazeGrid.style.gridTemplateRows = `repeat(${gridSize}, ${cellSize}px)`;

        for (let r = 0; r < gridSize; r++) {
            for (let c = 0; c < gridSize; c++) {
                const cell = document.createElement('div');
                cell.className = 'cell';
                cell.dataset.row = r;
                cell.dataset.col = c;
                cell.style.width = `${cellSize}px`;
                cell.style.height = `${cellSize}px`;
                mazeGrid.appendChild(cell);
                this.state.grid[r][c] = cell;
            }
        }

        if (gridSizeInput) gridSizeInput.value = gridSize;
        this.render();
    }

    render() {
        const { mazeData, grid, gridSize, wallCells } = this.state;
        const { mazeGrid } = this.ui;
        if (!mazeGrid || !grid.length) return;

        for (let r = 0; r < gridSize; r++) {
            for (let c = 0; c < gridSize; c++) {
                const cell = grid[r][c];
                cell.className = 'cell';
                cell.textContent = '';

                const cellData = mazeData?.[r]?.[c];

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
                } else if (cellData === 0 || wallCells.has(posKey(r, c))) {
                    cell.classList.add('wall');
                }
            }
        }
    }

    clearPath() {
        const { grid, gridSize } = this.state;
        for (let r = 0; r < gridSize; r++) {
            for (let c = 0; c < gridSize; c++) {
                grid[r][c].classList.remove('path');
            }
        }
    }

    highlightPath(path) {
        if (!path || !path.length) return;
        this.clearPath();
        for (const step of path) {
            const cell = this.state.grid?.[step.row]?.[step.col];
            if (cell) cell.classList.add('path');
        }
    }
}

// Movement controller (encapsulates rat/cat behaviors)
class MovementController {
    constructor(state, renderer, status) {
        this.state = state;
        this.renderer = renderer;
        this.status = status;
    }

    getPositions() {
        const { mazeData, gridSize } = this.state;
        let rat = null;
        let cat = null;
        for (let r = 0; r < gridSize; r++) {
            for (let c = 0; c < gridSize; c++) {
                const cell = mazeData?.[r]?.[c];
                if (cell === 'R') rat = { row: r, col: c };
                if (cell === 'C') cat = { row: r, col: c };
            }
        }
        return { rat, cat };
    }

    moveCat(direction) {
        const { mazeData, gridSize, ratPath } = this.state;
        if (!mazeData) {
            this.status.update('Generate a maze first!');
            return;
        }

        const { rat, cat } = this.getPositions();
        if (!cat) return;

        let newRow = cat.row;
        let newCol = cat.col;

        switch (direction) {
            case 'ArrowUp': newRow = Math.max(0, cat.row - 1); break;
            case 'ArrowDown': newRow = Math.min(gridSize - 1, cat.row + 1); break;
            case 'ArrowLeft': newCol = Math.max(0, cat.col - 1); break;
            case 'ArrowRight': newCol = Math.min(gridSize - 1, cat.col + 1); break;
            default: return;
        }

        // Block walls
        if (mazeData[newRow][newCol] === 0) return;

        // Cat captures rat
        if (rat && newRow === rat.row && newCol === rat.col) {
            mazeData[cat.row][cat.col] = 1;
            mazeData[newRow][newCol] = 'C';
            this.renderer.render();
            this.status.update('Cat caught the rat!\n Game Over!');
            this.state.ratPath = [];
            return;
        }

        mazeData[cat.row][cat.col] = 1;
        mazeData[newRow][newCol] = 'C';

        this.renderer.render();

        if (this.state.ratFrozen) {
            this.state.ratFrozen = false;
            this.status.update('Rat is unfrozen!\n Can move next turn.');
            return;
        }

        this.moveRatOneStep();
        this.renderer.render();
        this.checkGameOver(ratPath);
    }

    moveRatOneStep() {
        const { ratPath, currentRatStep, mazeData } = this.state;
        if (!ratPath || !ratPath.length) return;
        if (currentRatStep >= ratPath.length - 1) {
            this.status.update(`Rat reached the door! Rat wins!\n Total penalty: ${this.state.trapsPenalty}`);
            return;
        }

        const currentPos = ratPath[currentRatStep];
        const nextPos = ratPath[currentRatStep + 1];

        const { cat } = this.getPositions();
        if (cat && nextPos.row === cat.row && nextPos.col === cat.col) {
            if (mazeData[currentPos.row][currentPos.col] === 'R') {
                mazeData[currentPos.row][currentPos.col] = 1;
            }
            this.status.update('Cat caught the rat!\n Game Over!');
            this.state.ratPath = [];
            return;
        }

        const steppingOnTrap = mazeData[nextPos.row][nextPos.col] === 'x';

        if (mazeData[currentPos.row][currentPos.col] === 'R') {
            mazeData[currentPos.row][currentPos.col] = 1;
        }

        mazeData[nextPos.row][nextPos.col] = 'R';
        this.state.currentRatStep++;

        if (steppingOnTrap) {
            this.state.trapsPenalty++;
            this.state.ratFrozen = true;
            this.status.update(`Rat caught by TRAP! Frozen for 1 turn! \n Penalty: +1 (Total: ${this.state.trapsPenalty})`);
        } else {
            this.status.update(`Rat moved to step ${this.state.currentRatStep}/${ratPath.length - 1} \n Penalty: ${this.state.trapsPenalty}`);
        }
    }

    checkGameOver() {
        const { rat, cat } = this.getPositions();
        if (!this.state.mazeData) return false;

        if (!rat && cat) {
            this.status.update('Cat caught the rat!\n Game Over!');
            this.state.ratPath = [];
            return true;
        }

        if (rat && cat && rat.row === cat.row && rat.col === cat.col) {
            this.status.update('Cat caught the rat!\n Game Over!');
            this.state.ratPath = [];
            return true;
        }
        return false;
    }
}

// MazeFlow orchestrates actions (facade-like controller)
class MazeFlow {
    constructor(state, renderer, movement, status, stats) {
        this.state = state;
        this.renderer = renderer;
        this.movement = movement;
        this.status = status;
        this.stats = stats;
        this.timer = new Timer(ui.timerEl);
    }

    async handleGenerate() {
        if (this.state.isAnimating) return;
        this.state.isAnimating = true;
        this.status.update('Generating maze...');

        this.state.resetEntities();
        this.state.resetWalls();

        // Paint everything as walls first
        for (let r = 0; r < this.state.gridSize; r++) {
            for (let c = 0; c < this.state.gridSize; c++) {
                const cell = this.state.grid[r][c];
                if (cell) {
                    cell.className = 'cell wall';
                    cell.textContent = '';
                }
                this.state.wallCells.add(posKey(r, c));
            }
        }

        await new Promise(resolve => setTimeout(resolve, 200));

        const isValid = (r, c) => r >= 0 && r < this.state.gridSize && c >= 0 && c < this.state.gridSize;

        await generateMaze({
            numCells: this.state.gridSize,
            startPos: this.state.startPos,
            endPos: this.state.endPositions[0] || { row: this.state.gridSize - 1, col: this.state.gridSize - 1 },
            grid: this.state.grid,
            wallCells: this.state.wallCells,
            getSpeed: () => this.state.speed,
            isValid,
            shouldStop: () => false
        });

        const doorCount = parseInt(ui.doorCountInput?.value) || 3;
        const trapCount = parseInt(ui.trapCountInput?.value) || 10;
        this.state.mazeData = generateMazeData(this.state.gridSize, this.state.wallCells, doorCount, trapCount);

        this.renderer.render();

        if (this.state.mazeData) {
            this.status.update('Maze ready. Click Solve or move the cat.');
        } else {
            this.status.update('Maze generated but failed to place entities');
        }

        this.state.isAnimating = false;
    }

    async handleSolve() {
        if (!this.state.mazeData) {
            this.status.update('Please generate a maze first!');
            return;
        }

        this.status.update('Solving maze in your browser...');

        const solution = solveMaze(this.state.mazeData);

        if (solution.status === 'NO_SOLUTION') {
            this.status.update(solution.message || 'No path found to any door.');
            this.stats.update(solution.stats);
            return;
        }

        this.state.ratPath = solution.path;
        this.state.currentRatStep = 0;
        this.state.trapsPenalty = 0;
        this.state.ratFrozen = false;

        this.renderer.highlightPath(solution.path);
        this.status.update('Path ready. Move the cat with arrow keys or watch the rat follow the path.');
        this.stats.update(solution.stats);
    }

    handleReset() {
        if (this.state.isAnimating) return;
        this.state.resetWalls();
        this.state.resetEntities();
        this.renderer.render();
        this.stats.reset();
        this.timer.reset();
        this.status.update('Reset complete');
    }
}

// Screenshot export kept functional
function downloadMazeImage(state, status) {
    if (!state.mazeData) {
        status.update('Generate a maze first!');
        return;
    }

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const cellSize = 30;
    canvas.width = state.gridSize * cellSize;
    canvas.height = state.gridSize * cellSize;
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    for (let i = 0; i < state.gridSize; i++) {
        for (let j = 0; j < state.gridSize; j++) {
            const x = j * cellSize;
            const y = i * cellSize;
            const cellData = state.mazeData[i][j];

            if (cellData === 'R') ctx.fillStyle = '#00ff00';
            else if (cellData === 'C') ctx.fillStyle = '#ff6b00';
            else if (cellData === 'D') ctx.fillStyle = '#8b4513';
            else if (cellData === 'x') ctx.fillStyle = '#ff0000';
            else if (cellData === 0) ctx.fillStyle = '#000000';
            else if (state.grid[i][j].classList.contains('path')) ctx.fillStyle = '#00bfff';
            else ctx.fillStyle = '#ffffff';

            ctx.fillRect(x, y, cellSize - 2, cellSize - 2);
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
        status.update('Image downloaded!');
    });
}

// Theme toggle kept small
function toggleTheme(status) {
    const { themeToggle } = ui;
    const body = document.body;
    const currentTheme = body.classList.contains('light-theme') ? 'light' : 'dark';
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';

    if (newTheme === 'light') {
        body.classList.add('light-theme');
        if (themeToggle) {
            const icon = themeToggle.querySelector('.theme-icon');
            if (icon) icon.textContent = '🌙';
        }
    } else {
        body.classList.remove('light-theme');
        if (themeToggle) {
            const icon = themeToggle.querySelector('.theme-icon');
            if (icon) icon.textContent = '☀️';
        }
    }

    localStorage.setItem('theme', newTheme);
    status.update(`Switched to ${newTheme} theme`);
}

function loadTheme() {
    const { themeToggle } = ui;
    if (!themeToggle) return;
    const savedTheme = localStorage.getItem('theme') || 'dark';
    if (savedTheme === 'light') {
        document.body.classList.add('light-theme');
        const icon = themeToggle.querySelector('.theme-icon');
        if (icon) icon.textContent = '🌙';
    } else {
        const icon = themeToggle.querySelector('.theme-icon');
        if (icon) icon.textContent = '☀️';
    }
}

// Bootstrap
function init() {
    const state = new GameState();
    const status = new StatusPanel(ui.statusEl);
    const stats = new StatsPanel(ui.pathLengthEl, ui.nodesVisitedEl, ui.efficiencyEl);
    const renderer = new MazeRenderer(state, ui, status);
    const movement = new MovementController(state, renderer, status);
    const flow = new MazeFlow(state, renderer, movement, status, stats);

    renderer.rebuildGrid();
    loadTheme();
    status.update('Click "Generate Maze" to start');

    if (ui.gridSizeInput) {
        ui.gridSizeInput.addEventListener('change', () => {
            const size = parseInt(ui.gridSizeInput.value) || 25;
            state.setGridSize(size);
            renderer.rebuildGrid();
        });
    }

    if (ui.speedSlider) {
        ui.speedSlider.addEventListener('input', () => {
            state.speed = parseInt(ui.speedSlider.value);
            if (ui.speedValue) ui.speedValue.textContent = state.speed;
        });
    }

    if (ui.generateBtn) ui.generateBtn.addEventListener('click', () => flow.handleGenerate());
    if (ui.solveBtn) ui.solveBtn.addEventListener('click', () => flow.handleSolve());
    if (ui.resetBtn) ui.resetBtn.addEventListener('click', () => flow.handleReset());
    if (ui.downloadBtn) ui.downloadBtn.addEventListener('click', () => downloadMazeImage(state, status));

    if (ui.themeToggle) {
        ui.themeToggle.addEventListener('click', () => toggleTheme(status));
    }

    document.addEventListener('keydown', (e) => {
        if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
            e.preventDefault();
            movement.moveCat(e.key);
        }
    });
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

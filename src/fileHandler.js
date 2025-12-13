const SERVER_URL = 'http://localhost:3001';

// Write maze data to file via server
export async function writeMazeFile(mazeContent) {
    try {
        const response = await fetch(`${SERVER_URL}/write-maze`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ content: mazeContent })
        });

        const result = await response.json();

        if (result.success) {
            return true;
        } else {
            return false;
        }
    } catch (error) {
        return false;
    }
}

// Run Python solver and get solution
export async function runPythonSolver() {
    try {
        const response = await fetch(`${SERVER_URL}/solve`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        });

        const result = await response.json();

        if (result.success) {
            return result.solution;
        } else {
            throw new Error(result.error);
        }
    } catch (error) {
        console.error('Solver error:', error);
        throw error;
    }
}

// Generate maze text content from grid data
export function generateMazeContent(gridSize, mazeData) {
    let content = 'J\n'; // JavaScript
    content += `${gridSize} ${gridSize}\n`;

    for (let r = 0; r < gridSize; r++) {
        let row = '';
        for (let c = 0; c < gridSize; c++) {
            const cell = mazeData[r][c];
            row += cell; // R, C, D, x, 0, or 1
        }
        content += row + '\n';
    }

    return content;
}

// Parse solution file content
export function parseSolutionFile(solutionText) {
    const lines = solutionText.trim().split('\n');

    if (lines.length < 2) {
        throw new Error('Invalid solution file format');
    }

    const language = lines[0].trim();
    const status = lines[1].trim();

    // Check if no solution found
    if (status === 'NO_SOLUTION') {
        return {
            language,
            status: 'NO_SOLUTION',
            message: lines[2] || 'No path found from rat to any door!',
            path: [],
            stats: {
                pathLength: 0,
                totalCost: 0,
                nodesVisited: 0,
                doorReached: '',
                trapsHit: 0
            }
        };
    }

    // Extract stats
    let pathLength = 0;
    let totalCost = 0;
    let nodesVisited = 0;
    let doorReached = '';
    let trapsHit = 0;

    // Extract path from solution
    const path = [];
    let inPath = false;

    for (let line of lines) {
        line = line.trim();

        // Parse stats
        if (line.startsWith('Path length:')) {
            pathLength = parseInt(line.match(/\d+/)[0]);
        }
        if (line.startsWith('Total cost:')) {
            totalCost = parseInt(line.match(/\d+/)[0]);
        }
        if (line.startsWith('Nodes visited:')) {
            nodesVisited = parseInt(line.match(/\d+/)[0]);
        }
        if (line.startsWith('Door reached:')) {
            doorReached = line.substring(line.indexOf('('));
        }
        if (line.startsWith('Traps hit:')) {
            trapsHit = parseInt(line.match(/\d+/)[0]);
        }

        if (line === 'Path (row,col):') {
            inPath = true;
            continue;
        }

        if (inPath && line.includes(',')) {
            const [row, col] = line.split(',').map(Number);
            if (!isNaN(row) && !isNaN(col)) {
                path.push({ row, col });
            }
        }
    }

    return {
        language,
        status: 'SOLUTION_FOUND',
        path,
        stats: {
            pathLength,
            totalCost,
            nodesVisited,
            doorReached,
            trapsHit
        }
    };
}

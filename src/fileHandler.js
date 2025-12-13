import { solveMaze } from './Algorithm/bfs_solver.js';

export function generateMazeContent(gridSize, mazeData) {
    let content = 'J\n';
    content += `${gridSize} ${gridSize}\n`;

    for (let r = 0; r < gridSize; r++) {
        let row = '';
        for (let c = 0; c < gridSize; c++) {
            row += mazeData[r][c];
        }
        content += row + '\n';
    }

    return content;
}

export function runMazeSolver(mazeData) {
    return solveMaze(mazeData);
}

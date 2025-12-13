import { posKey, dirs } from "../helper/help.js";
import { wallColor, emptyCellColor } from "../helper/constants.js";

export async function generateMaze({
  numCells,
  startPos,
  endPos,
  grid,
  wallCells,
  getSpeed,
  isValid,
  shouldStop = () => false
}) {

  const getDelay = () => {
    const visualSpeed = typeof getSpeed === 'function' ? getSpeed() : getSpeed;
    return visualSpeed;
  };

  const visited = Array.from({ length: numCells }, () => Array(numCells).fill(false));


  // Shuffle array helper (Fisher-Yates)
  function shuffleArray(arr) {
    const shuffled = [...arr];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  // Recursive backtracking algorithm
  async function carvePath(r, c) {
    if (shouldStop()) {
      throw new Error("Generation stopped");
    }

    visited[r][c] = true;
    wallCells.delete(posKey(r, c));

    // Visual update
    const cell = grid[r][c];
    if (!(r === startPos.row && c === startPos.col) && !(r === endPos.row && c === endPos.col)) {
      cell.style.backgroundColor = emptyCellColor;
      await new Promise(resolve => setTimeout(resolve, getDelay()));
    }

    const shuffledDirs = shuffleArray(dirs);

    for (const [dr, dc] of shuffledDirs) {
      if (shouldStop()) {
        throw new Error("Generation stopped");
      }

      const nextR = r + dr * 2;  // Move 2 steps (skip wall)
      const nextC = c + dc * 2;

      // Check if next cell is valid and unvisited
      if (isValid(nextR, nextC) && !visited[nextR][nextC]) {
        // Remove wall between current and next cell
        const wallR = r + dr;
        const wallC = c + dc;
        wallCells.delete(posKey(wallR, wallC));

        // Visual update for wall removal
        const wallCell = grid[wallR][wallC];
        if (!(wallR === startPos.row && wallC === startPos.col) && !(wallR === endPos.row && wallC === endPos.col)) {
          wallCell.style.backgroundColor = emptyCellColor;
          await new Promise(resolve => setTimeout(resolve, getDelay()));
        }
        await carvePath(nextR, nextC);
      }
    }
  }

  // Start from a random position
  // For recursive backtracking, we want to start from an odd position (1, 3, 5, etc.)
  // to ensure we can move 2 steps in any direction for proper maze generation
  let startR, startC;
  const oddPositions = [];
  for (let i = 1; i < numCells - 1; i += 2)
    oddPositions.push(i);
  startR = oddPositions[Math.floor(Math.random() * oddPositions.length)];
  startC = oddPositions[Math.floor(Math.random() * oddPositions.length)];

  if (!startR) startR = 1;
  if (!startC) startC = 1;

  await carvePath(startR, startC)


  wallCells.delete(posKey(startPos.row, startPos.col));
  wallCells.delete(posKey(endPos.row, endPos.col));
  for (const [dr, dc] of dirs) {
    let nr = startPos.row + dr;
    let nc = startPos.col + dc;
    if (isValid(nr, nc)) {
      wallCells.delete(posKey(nr, nc));
    }

    nr = endPos.row + dr;
    nc = endPos.col + dc;
    if (isValid(nr, nc)) {
      wallCells.delete(posKey(nr, nc));
    }
  }

}

// Generate maze data with entities (R, C, D, x)
export function generateMazeData(numCells, wallCells, doorCount = 3, trapCount = 10) {
  // Find all path cells
  const pathCells = [];
  for (let r = 0; r < numCells; r++) {
    for (let c = 0; c < numCells; c++) {
      if (!wallCells.has(posKey(r, c))) {
        pathCells.push({ r, c });
      }
    }
  }

  if (pathCells.length < 10) return null;

  // Find edge cells for doors (on the very edge of the map)
  const edgeCells = [];

  for (let i = 0; i < numCells; i++) {
    // Top edge
    if (!wallCells.has(posKey(0, i))) {
      edgeCells.push({ r: 0, c: i });
    }
    // Bottom edge
    if (!wallCells.has(posKey(numCells - 1, i))) {
      edgeCells.push({ r: numCells - 1, c: i });
    }
    // Left edge
    if (!wallCells.has(posKey(i, 0))) {
      edgeCells.push({ r: i, c: 0 });
    }
    // Right edge
    if (!wallCells.has(posKey(i, numCells - 1))) {
      edgeCells.push({ r: i, c: numCells - 1 });
    }
  }

  function shuffle(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  // Place doors randomly on edges (like traps but on edge cells)
  shuffle(edgeCells);
  const doors = edgeCells.slice(0, Math.min(doorCount, edgeCells.length));

  // Filter out door positions from pathCells
  const availablePaths = pathCells.filter(p =>
    !doors.some(d => d.r === p.r && d.c === p.c)
  );

  // Place Rat (R) - completely random position in any path
  shuffle(availablePaths);
  const ratPos = availablePaths[0];
  availablePaths.splice(0, 1);

  // Place Cat (C) - completely random position in any remaining path
  const catPos = availablePaths[0];
  availablePaths.splice(0, 1);

  // Place traps - exact count specified
  const traps = [];
  const actualTrapCount = Math.min(trapCount, availablePaths.length);
  for (let i = 0; i < actualTrapCount; i++) {
    traps.push(availablePaths[i]);
  }

  // Create 2D grid with entities
  const mazeGrid = [];
  for (let r = 0; r < numCells; r++) {
    const row = [];
    for (let c = 0; c < numCells; c++) {
      if (r === ratPos.r && c === ratPos.c) {
        row.push('R');
      } else if (r === catPos.r && c === catPos.c) {
        row.push('C');
      } else if (doors.some(d => d.r === r && d.c === c)) {
        row.push('D');
      } else if (traps.some(t => t.r === r && t.c === c)) {
        row.push('x');
      } else if (wallCells.has(posKey(r, c))) {
        row.push(0); // Wall
      } else {
        row.push(1); // Path
      }
    }
    mazeGrid.push(row);
  }

  return mazeGrid;
}

// Export maze to text format
export function exportMazeToText(numCells, wallCells, ratPos, catPos, doors, traps) {
  let text = 'J\n'; // JavaScript
  text += `${numCells} ${numCells}\n`;

  // Create grid
  for (let r = 0; r < numCells; r++) {
    let row = '';
    for (let c = 0; c < numCells; c++) {
      if (r === ratPos.r && c === ratPos.c) {
        row += 'R';
      } else if (r === catPos.r && c === catPos.c) {
        row += 'C';
      } else if (doors.some(d => d.r === r && d.c === c)) {
        row += 'D';
      } else if (traps.some(t => t.r === r && t.c === c)) {
        row += 'x';
      } else if (wallCells.has(posKey(r, c))) {
        row += '0'; // Wall
      } else {
        row += '1'; // Path
      }
    }
    text += row + '\n';
  }

  return text;
}

// Write maze.txt file to disk (for Node.js environment)
// For browser, we'll use a different method
export async function writeMazeFile(content) {
  // This will be handled in app.js using FileSystem Access API or download
  return content;
}

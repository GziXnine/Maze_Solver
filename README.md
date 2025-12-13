# 🐭 Maze Game - Rat vs Cat

A maze generation and solving game with JavaScript frontend and Python BFS solver backend.

## ✨ Features

- **Random Maze Generation**: Generates mazes with recursive backtracking algorithm
- **Game Elements**:
  - `R` - Rat (player-controlled with WASD)
  - `C` - Cat (user-controlled with Arrow keys)
  - `D` - Doors (3 random exits at maze edges)
  - `x` - Traps (avoid these!)
  - `0` - Walls (impassable)
  - `1` - Paths (walkable)

- **Export/Import**: Save mazes to TXT format
- **Python BFS Solver**: Finds shortest path from rat to nearest door
- **Dark/Light Theme**: Toggle between themes

## 🚀 Quick Start

1. Open `index.html` in a modern web browser
2. Click "Generate Maze" to create a random maze
3. Use WASD to move the rat, Arrow keys to move the cat
4. Export maze to TXT and run Python solver

## 🎮 How to Play

### Game Controls

- **Arrow Keys** - Move the cat (user-controlled)
- **Python BFS** - Controls rat movement (automated via solution import)
- **Generate Maze** - Watch animated maze generation
- **Export to TXT** - Save maze for Python solver
- **Import from TXT** - Load Python solution and watch rat move

### Game Objective

- **Export maze** → Python teammate solves → **Import solution**
- **Watch** rat follow BFS path to nearest door
- **Control cat** to try to intercept the rat
- **Traps**: Add +1 move penalty (rat slows down, doesn't die)

## 📁 File Format

The maze is saved in this format:

```
J
25 25
R1000000000000000000...
11001x10000000xC1110...
...
```

- **Line 1**: `J` (JavaScript) or `P` (Python) - indicates which language wrote the file
- **Line 2**: Size (rows cols)
- **Following lines**: Maze grid with R, C, D, x, 0, 1 characters

## 🐍 Python BFS Solver

Run the Python solver:

```bash
python bfs_solver.py
```

This will:
1. Read `maze.txt` (exported from JavaScript)
2. Solve using **BFS algorithm** (finds shortest path)
3. **Traps add +1 cost** (penalty, not blockage)
4. Avoids cat position
5. Write solution to `maze_solution.txt` with step-by-step path

### Solution File Format

```
P
SOLUTION_FOUND
Path length: 45 moves
Total cost: 48 (with trap penalties)
Nodes visited: 123
Door reached: (0, 24)
Traps hit: 3

Path (row,col):
0,0
0,1
0,2
...
```

## 📂 Project Structure

```
Maze/
├── index.html              # Main HTML file
├── bfs_solver.py          # Python BFS solver
├── README.md              # This file
└── src/
    ├── app.js             # Main JavaScript application
    ├── style.css          # Styles
    └── MazeGeneration/
        └── generateMaze.js # Maze generation algorithm
```

## 🛠️ Technologies

- **Frontend**: HTML, CSS, JavaScript (ES6 modules)
- **Maze Generation**: Recursive backtracking with **animated visualization**
- **Pathfinding**: Python BFS with weighted edges (trap penalties)
- **Data Exchange**: Text file format for maze and solution

## 🎯 Team Workflow

1. **JavaScript Developer** (You): 
   - Generate maze with animation
   - Watch maze carve paths in real-time
   - Export to TXT
   
2. **Python Developer**: 
   - Read TXT
   - Solve with BFS (traps = +1 cost)
   - Write solution
   
3. **JavaScript Developer**: 
   - Import solution
   - Watch rat follow path automatically
   - Control cat to intercept

## 📝 Notes

- Maze size: 15-50 (adjustable)
- **Animated generation**: Watch maze build in real-time
- Doors: 3 random positions at maze edges
- Traps: ~5% of path cells
- **Traps add delay (+1 move cost), don't block path**
- Cat blocks paths in BFS calculation
- **No manual rat control** - Python BFS controls movement

- **Arrow Keys** - Move the cat around the maze

## 🎨 Color Coding

- **Green** - Starting position (Rat)
- **Red** - Goal positions (Cheese)
- **Orange** - Obstacle (Cat)
- **Dark Gray** - Walls
- **Yellow** - Visited nodes during search
- **Blue** - Final shortest path

## 🏗️ Project Structure

```
Maze-Solver-main/
├── index.html           # Main HTML file
├── style.css            # Professional dark theme styles
├── app.js              # Main application logic
├── bfs_solver.py       # Python BFS algorithm implementation
├── README.md           # This file
└── src/
    ├── MazeGeneration/
    │   └── generateMaze.js  # Maze generation
    └── helper/
        └── help.js     # Helper functions
```

## 🔧 Technical Details

### Technologies

- **HTML5** - Semantic markup
- **CSS3** - Modern styling with variables
- **JavaScript ES6+** - Modules, async/await
- **Python 3** - BFS algorithm implementation

### Performance Optimizations

- Minimal DOM manipulation
- Efficient grid rendering
- Optimized animation timing
- Clean state management
- Removed all unused files

### Python BFS Solver

The `bfs_solver.py` file contains a professional implementation of the BFS algorithm:

```python
python bfs_solver.py '{"gridSize":25,"walls":[],"start":[0,0],"goals":[[24,24]],"cat":null}'
```

Output format:
```json
{
  "found": true,
  "path": [[1,0], [2,0], ...],
  "visited": [[1,1], [0,1], ...],
  "pathLength": 48,
  "nodesVisited": 156
}
```

## 📊 Statistics Display

The interface shows real-time statistics:

- **Path Length** - Number of steps in solution
- **Nodes Visited** - Search efficiency metric
- **Status** - Current operation status

## 🎓 Algorithm: BFS (Breadth-First Search)

### How it Works

1. Start from rat position
2. Explore all neighbors level by level
3. Avoid walls and cat's danger zone (1 cell radius)
4. Find shortest path to nearest cheese
5. Visualize visited nodes and final path

### Complexity

- **Time:** O(V + E) where V = cells, E = edges
- **Space:** O(V) for queue and visited set
- **Guaranteed:** Finds shortest path

## 📱 Responsive Design

- Desktop: Full sidebar + large maze view
- Tablet: Compact sidebar
- Mobile: Stacked layout with scrollable sidebar

---

**Enjoy solving mazes! 🎮**


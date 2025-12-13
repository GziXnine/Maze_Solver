# 🐭 Maze Game - Rat vs Cat

Maze generation, play, and BFS solving: JavaScript frontend for maze building and play, Python backend for shortest-path solving.

## ✨ Highlights

- **Animated maze generation** (recursive backtracking)
- **Rat vs Cat gameplay**: rat follows BFS path; you steer the cat
- **Traps, doors, walls**: traps add +1 cost, doors are exits on maze edges
- **TXT export/import** for sharing between JS app and Python solver
- **Dark/Light themes** planned with screenshots + gameplay GIF (placeholders below)

## 🚀 Quick Start

- **Play in browser**: open `index.html`, click **Generate Maze**, move cat with Arrow Keys, let BFS drive the rat via imported solution
- **Export maze**: click **Export to TXT** (writes `maze.txt`)
- **Solve in Python**: `python bfs_solver.py` (reads `maze.txt`, writes `maze_solution.txt`)
- **Import solution**: back in the browser, **Import from TXT** to watch the rat follow the path

## 🎮 Controls & Goals

- **Cat**: Arrow Keys (player)
- **Rat**: follows imported BFS path
- **Generate Maze**: animated carve
- **Objective**: rat reaches any door before the cat blocks it; traps slow the rat (penalty, not death)

## 📄 File Formats

Maze file (`maze.txt`):

```
J
25 25
R1000000000000000000...
11001x10000000xC1110...
...
```

- Line 1: `J` (JavaScript) or `P` (Python) indicates generator
- Line 2: `rows cols`
- Body: grid of `R, C, D, x, 0, 1`

Solver output (`maze_solution.txt`):

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

## 🐍 Python BFS Solver

```bash
python bfs_solver.py
```

- Reads `Algorithm/maze.txt`
- BFS with trap cost (+1) and cat avoidance
- Writes `Algorithm/maze_solution.txt` (path + visit stats)

## 🗺️ Maze Elements

- `R` rat (start)
- `C` cat (enemy)
- `D` doors (3 random exits)
- `x` traps (cost +1)
- `1` path (walkable)
- `0` wall (blocked)

## 🎨 Themes & Media

- **Light theme screenshot**: _placeholder — add when ready_
- **Dark theme screenshot**: _placeholder — add when ready_
- **Gameplay GIF**: _placeholder — add your capture_

Color cues (UI/visualization): Green start, Red doors, Orange cat, Dark Gray walls, Yellow visited, Blue final path.

## 📂 Project Layout

```
Maze_Solver/
├── index.html
├── server.js
├── LICENSE
├── README.md
├── USAGE.md
└── src/
      ├── app.js
      ├── style.css
      ├── fileHandler.js
      ├── Algorithm/
      │   ├── bfs_solver.py
      │   ├── maze.txt
      │   └── maze_solution.txt
      ├── helper/
      │   ├── constants.js
      │   └── help.js
      └── MazeGeneration/
            └── generateMaze.js
```

## 🛠️ Tech Notes

- **Frontend**: HTML, CSS, JavaScript (ES6 modules)
- **Generation**: recursive backtracking with animation
- **Pathfinding**: Python BFS with trap weights
- **Exchange**: TXT files for maze and solution
- **Performance**: lean DOM updates, efficient grid rendering

## 🤝 Workflow

1. JavaScript: generate + export maze
2. Python: run BFS, write solution
3. JavaScript: import solution, watch rat move, steer the cat

---

Enjoy solving mazes! 🎮


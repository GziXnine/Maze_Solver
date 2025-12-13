# Quick Usage Guide

## For You (JavaScript Developer)

### Step 1: Generate and Export Maze
1. Open `index.html` in your browser
2. Adjust maze size (15-50)
3. Click "🎲 Generate Maze"
4. Click "💾 Export to TXT" - this saves `maze.txt`

### Step 2: Share with Python Team
- Send the `maze.txt` file to your Python teammate

## For Python Developer

### Step 3: Solve Maze
```bash
python bfs_solver.py
```

This creates `maze_solution.txt` with the shortest path.

### Step 4: Share Solution Back
- Send `maze_solution.txt` back to JavaScript developer

## For You Again (JavaScript Developer)

### Step 5: Visualize Solution
1. Click "📂 Import from TXT"
2. Load `maze_solution.txt`
3. The path will be displayed (you can animate this later)

## Game Controls

- **WASD** - Move rat
- **Arrow Keys** - Move cat
- **Goal**: Rat reaches door (D) before cat catches it

## Maze Elements

- `R` - Rat (start)
- `C` - Cat (enemy)
- `D` - Door (goal - 3 random doors)
- `x` - Trap (danger)
- `1` - Path (walkable)
- `0` - Wall (blocked)

## Example Workflow

```
JavaScript Dev:  Generate maze → Export maze.txt
                           ↓
Python Dev:      Read maze.txt → BFS solve → Write maze_solution.txt
                           ↓
JavaScript Dev:  Import solution → Animate rat movement
```

## Tips

1. **Larger mazes** = harder to solve
2. **More traps** = more challenging
3. **Cat position** blocks some paths
4. **3 doors** give multiple escape routes
5. BFS finds **shortest** path to **nearest** door

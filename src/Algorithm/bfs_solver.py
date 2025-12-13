"""
BFS Maze Solver - Python Implementation
Reads maze from TXT file, solves using BFS algorithm, writes solution back
"""

from collections import deque

def read_maze(filename='maze.txt'):
    """Read maze from text file"""
    with open(filename, 'r') as f:
        lines = f.readlines()
    
    language = lines[0].strip()
    size_line = lines[1].strip().split()
    rows, cols = int(size_line[0]), int(size_line[1])
    
    maze = []
    rat_pos = None
    cat_pos = None
    doors = []
    traps = []
    
    for r in range(rows):
        row_str = lines[r + 2].strip()
        maze_row = []
        
        for c, char in enumerate(row_str):
            if char == 'R':
                rat_pos = (r, c)
                maze_row.append(0)  # Path (0=walkable in our internal format)
            elif char == 'C':
                cat_pos = (r, c)
                maze_row.append(0)  # Path
            elif char == 'D':
                doors.append((r, c))
                maze_row.append(0)  # Path
            elif char == 'x':
                traps.append((r, c))
                maze_row.append(0)  # Path (with penalty)
            elif char == '1':
                maze_row.append(0)  # Path
            else:  # '0'
                maze_row.append(1)  # Wall
        
        maze.append(maze_row)
    
    return {
        'language': language,
        'size': (rows, cols),
        'maze': maze,
        'rat_pos': rat_pos,
        'cat_pos': cat_pos,
        'doors': doors,
        'traps': traps
    }


def bfs_solve(maze_data):
    """
    Solve maze using Breadth-First Search (BFS) with weighted edges
    Find shortest path from rat to nearest door, avoiding cat
    Traps add +1 move penalty but don't block the path
    """
    maze = maze_data['maze']
    rows, cols = maze_data['size']
    start = maze_data['rat_pos']
    cat = maze_data['cat_pos']
    doors = maze_data['doors']
    traps = set(maze_data['traps'])
    
    if not start or not doors:
        return None
    
    # Directions: up, down, left, right
    directions = [(-1, 0), (1, 0), (0, -1), (0, 1)]
    
    # BFS with cost tracking (traps add +1 cost)
    from collections import deque
    queue = deque([(start, 0)])  # (position, cost)
    visited = {start: 0}  # position -> minimum cost to reach
    parent = {start: None}
    
    found_door = None
    min_cost = float('inf')
    
    while queue:
        current, cost = queue.popleft()
        r, c = current
        
        # Check if reached a door
        if current in doors:
            if cost < min_cost:
                min_cost = cost
                found_door = current
            continue  # Keep searching for better paths
        
        # Explore neighbors
        for dr, dc in directions:
            nr, nc = r + dr, c + dc
            neighbor = (nr, nc)
            
            # Check bounds
            if nr < 0 or nr >= rows or nc < 0 or nc >= cols:
                continue
            
            # Check if wall (in our format: 0=path, 1=wall)
            if maze[nr][nc] == 1:
                continue
            
            # Check if cat position (avoid cat)
            if neighbor == cat:
                continue
            
            # Calculate cost (traps add +1 penalty)
            move_cost = cost + 1
            if neighbor in traps:
                move_cost += 1  # +1 penalty for stepping on trap
            
            # Only visit if we found a better path
            if neighbor not in visited or move_cost < visited[neighbor]:
                visited[neighbor] = move_cost
                parent[neighbor] = current
                queue.append((neighbor, move_cost))
    
    # Reconstruct path
    if not found_door:
        return None
    
    path = []
    current = found_door
    while current is not None:
        path.append(current)
        current = parent[current]
    
    path.reverse()
    
    # Calculate actual steps (including trap penalties)
    total_steps = 0
    for pos in path[1:]:  # Skip start position
        total_steps += 1
        if pos in traps:
            total_steps += 1  # Trap penalty
    
    return {
        'path': path,
        'length': len(path) - 1,  # Number of moves
        'cost': total_steps,  # Total cost with trap penalties
        'visited': len(visited),
        'door': found_door,
        'traps_hit': sum(1 for pos in path if pos in traps)
    }


def write_solution(solution, maze_data, output_file='maze_solution.txt'):
    """Write solution back to TXT file"""
    with open(output_file, 'w') as f:
        f.write('P\n')  # Python output
        
        if not solution:
            f.write('NO_SOLUTION\n')
            f.write('No path found from rat to any door!\n')
            return
        
        f.write('SOLUTION_FOUND\n')
        f.write(f'Path length: {solution["length"]} moves\n')
        f.write(f'Total cost: {solution["cost"]} (with trap penalties)\n')
        f.write(f'Nodes visited: {solution["visited"]}\n')
        f.write(f'Door reached: {solution["door"]}\n')
        f.write(f'Traps hit: {solution["traps_hit"]}\n')
        f.write('\nPath (row,col):\n')
        
        for step in solution['path']:
            f.write(f'{step[0]},{step[1]}\n')


def main():
    """Main function - read maze, solve, write solution"""
    print("Python BFS Maze Solver")
    print("-" * 40)
    
    # Read maze
    print("Reading maze from maze.txt...")
    try:
        maze_data = read_maze('maze.txt')
        print(f"Maze loaded: {maze_data['size'][0]}x{maze_data['size'][1]}")
        print(f"  Rat at: {maze_data['rat_pos']}")
        print(f"  Cat at: {maze_data['cat_pos']}")
        print(f"  Doors: {len(maze_data['doors'])}")
        print(f"  Traps: {len(maze_data['traps'])}")
    except FileNotFoundError:
        print("Error: maze.txt not found!")
        print("   Please export a maze from the JavaScript app first.")
        return
    except Exception as e:
        print(f"Error reading maze: {e}")
        return
    
    # Solve maze
    print("\nSolving maze with BFS algorithm...")
    solution = bfs_solve(maze_data)
    
    if solution:
        print(f"Solution found!")
        print(f"  Path length: {solution['length']} moves")
        print(f"  Total cost: {solution['cost']} (with {solution['traps_hit']} trap penalties)")
        print(f"  Nodes visited: {solution['visited']}")
        print(f"  Door reached: {solution['door']}")
    else:
        print("No solution found!")
        print("   The rat cannot reach any door (blocked by walls or cat)")
    
    # Write solution
    print("\nWriting solution to maze_solution.txt...")
    write_solution(solution, maze_data)
    print("Solution written successfully!")
    print("\nYou can now use the solution in your JavaScript app.")


if __name__ == '__main__':
    main()

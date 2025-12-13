const http = require('http');
const fs = require('fs').promises;
const path = require('path');
const { exec } = require('child_process');

const PORT = 3001;
const MAZE_FILE = path.join(__dirname, 'src', 'Algorithm', 'maze.txt');
const SOLUTION_FILE = path.join(__dirname, 'src', 'Algorithm', 'maze_solution.txt');
const PYTHON_SCRIPT = path.join(__dirname, 'src', 'Algorithm', 'bfs_solver.py');

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json'
};

const server = http.createServer(async (req, res) => {
    if (req.method === 'OPTIONS') {
        res.writeHead(200, corsHeaders);
        res.end();
        return;
    }

    const url = new URL(req.url, `http://localhost:${PORT}`);

    // Write maze file
    if (url.pathname === '/write-maze' && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => body += chunk);
        req.on('end', async () => {
            try {
                const { content } = JSON.parse(body);
                await fs.writeFile(MAZE_FILE, content, 'utf8');

                res.writeHead(200, corsHeaders);
                res.end(JSON.stringify({ success: true, path: MAZE_FILE }));
            } catch (error) {
                res.writeHead(500, corsHeaders);
                res.end(JSON.stringify({ success: false, error: error.message }));
            }
        });
    }

    // Run Python solver
    else if (url.pathname === '/solve' && req.method === 'POST') {
        try {
            exec(`python "${PYTHON_SCRIPT}"`, { cwd: path.dirname(PYTHON_SCRIPT) }, async (error, stdout, stderr) => {
                if (error) {
                    res.writeHead(500, corsHeaders);
                    res.end(JSON.stringify({ success: false, error: error.message }));
                    return;
                }

                if (stderr) console.error('Python stderr:', stderr);

                try {
                    const solution = await fs.readFile(SOLUTION_FILE, 'utf8');

                    res.writeHead(200, corsHeaders);
                    res.end(JSON.stringify({ success: true, solution }));
                } catch (readError) {
                    res.writeHead(500, corsHeaders);
                    res.end(JSON.stringify({ success: false, error: readError.message }));
                }
            });
        } catch (error) {
            res.writeHead(500, corsHeaders);
            res.end(JSON.stringify({ success: false, error: error.message }));
        }
    }

    else {
        res.writeHead(200, { 'Content-Type': 'text/plain' });
        res.end('Maze Solver Server\n\nEndpoints:\nPOST /write-maze\nPOST /solve\n\nOpen index.html in your browser!');
    }
});

server.listen(PORT, () => {
    console.log('Server running on http://localhost:' + PORT);
    console.log('Maze file: ' + MAZE_FILE);
    console.log('Solution: ' + SOLUTION_FILE);
    console.log('Python: ' + PYTHON_SCRIPT);
});

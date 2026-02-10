
// Axial neighbor offsets for a hexagonal grid
const NEIGHBORS = [
  { q: 1, r: 0 }, { q: 1, r: -1 }, { q: 0, r: -1 },
  { q: -1, r: 0 }, { q: -1, r: 1 }, { q: 0, r: 1 }
];

const HexLife = ({ size = 15, hexSize = 20 }) => {
  const [cells, setCells] = React.useState(new Map()); // Map of "q,r" -> true
  const [running, setRunning] = React.useState(false);
  const runningRef = React.useRef(running);
  const [flashColor, setFlashColor] = React.useState("rgba(255,255,255,0.03)");
  runningRef.current = running;


  // Axial to Pixel conversion for SVG rendering
  const getPixelCoords = (q, r) => {
    const x = hexSize * (Math.sqrt(3) * q + (Math.sqrt(3) / 2) * r);
    const y = hexSize * (1.5 * r);
    return { x, y };
  };

  const runSimulation = React.useCallback(() => {
    if (!runningRef.current) return;

    setCells((currentCells) => {
      const nextCells = new Map();
      const potentialCells = new Set();
      setFlashColor(`hsla(${Math.random() * 360}, 90%, 50%, 0.8)`);
      
      // Check live cells and their immediate dead neighbors
      currentCells.forEach((_, key) => {
        const [q, r] = key.split(',').map(Number);
        potentialCells.add(key);
        NEIGHBORS.forEach(off => potentialCells.add(`${q + off.q},${r + off.r}`));
      });

      potentialCells.forEach(key => {
        const [q, r] = key.split(',').map(Number);
        let liveNeighbors = 0;
        NEIGHBORS.forEach(off => {
          if (currentCells.has(`${q + off.q},${r + off.r}`)) liveNeighbors++;
        });

        const isAlive = currentCells.has(key);
        // B2 / S3,5 Rules
        if (isAlive && (liveNeighbors === 3 || liveNeighbors === 5)) {
          // Survival: Increment age
          const currentAge = currentCells.get(key) || 0;
          nextCells.set(key, currentAge + 1);
        } else if (!isAlive && liveNeighbors === 2) {
          // Birth: Set age to 0
          nextCells.set(key, 0);
        }
        
        // Dead cells that don't become alive are simply not added to nextCells

        // Original Conway's rules
        /*
        if (isAlive && (liveNeighbors === 2 || liveNeighbors === 3)) {
           nextCells.set(key, currentCells.get(key) + 1); // Increment age
        } else if (!isAlive && liveNeighbors === 3) {
           nextCells.set(key, 0); // New cell with age 0
        }
        */
      });
      return nextCells;
    });

    setTimeout(runSimulation, 500);
  }, []);

  const toggleCell = (q, r) => {
    const key = `${q},${r}`;
    const newCells = new Map(cells);
    if (newCells.has(key)) newCells.delete(key);
    else newCells.set(key, true);
    setCells(newCells);
  };

  const getCellColor = (age) => {
    if (age === undefined) return "#282c34"; // Dead cell color
    
    // HSL: 180 (cyan) is new, shifts toward 280 (purple) as it ages
    const hue = Math.min(280, 180 + age * 10); 
    const lightness = Math.max(30, 60 - age * 2); 
    return `hsl(${hue}, 80%, ${lightness}%)`;
  };


  // Generate grid for initial display
  const grid = [];
  for (let q = -size; q <= size; q++) {
    for (let r = Math.max(-size, -q - size); r <= Math.min(size, -q + size); r++) {
      grid.push({ q, r });
    }
  }

  return (
    <div>
      <button onClick={() => { setRunning(!running); if (!running) { runningRef.current = true; runSimulation(); }}}>
        {running ? "Stop" : "Start"}
      </button>
      <button onClick={() => setCells(new Map())}>Clear</button>
      
      <svg width="600" height="600" viewBox="-300 -300 600 600">
        {grid.map(({ q, r }) => {
          const { x, y } = getPixelCoords(q, r);
          //const isAlive = cells.has(`${q},${r}`);
          const age = cells.get(`${q},${r}`);
          const fillColor = getCellColor(age);
          return (
            <polygon
              key={`${q},${r}`}
              points="17.3,-10 17.3,10 0,20 -17.3,10 -17.3,-10 0,-20" // Pointy-top hex
              transform={`translate(${x}, ${y})`}
              fill={fillColor}
              //fill={isAlive ? flashColor : "#282c34"}
              stroke="#444"
              onClick={() => toggleCell(q, r)}
              style={{ cursor: 'pointer' }}
            />
          );
        })}
      </svg>
    </div>
  );
};


// Render the component
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<HexLife />);
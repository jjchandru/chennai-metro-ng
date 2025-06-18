const fs = require('fs');
// const { parse } = require('csv-parse/lib/sync');
const { parse } = require('csv-parse/sync');

const csv = fs.readFileSync('chennai-metro-data.csv', 'utf8');
const records = parse(csv, { columns: true, skip_empty_lines: true });

const nodes = [];
const nodeIdSet = new Set(); // Track unique node ids
const nodeMap = {}; // id -> node
const edges = [];

// 1. Create nodes
for (const row of records) {
  // No special handling for Wimco Nagar Depot Metro; treat like any other station
  const platforms = row.platform ? row.platform.split('/') : [''];
  for (const platform of platforms) {
    // If line is Inter, append ' - Inter' to id
    let id = `${row.station} - ${platform} - ${row.level}`;
    if (row.line === 'Inter') {
      id += ' - Inter';
    }
    if (!nodeIdSet.has(id)) { // Only add if not already present
      const node = {
        id,
        station: row.station,
        stationTamil: row.stationTamil, // Add tamil station name
        line: row.line,
        direction: row.direction,
        sequence: Number(row.sequence) || null,
        platform,
        level: row.level,
        type: row.type,
        isTerminal: row.isTerminal === 'TRUE'
      };
      nodes.push(node);
      nodeIdSet.add(id);
      // For Inter, add ' - Inter' to nodeMap key as well
      const mapKey = row.line === 'Inter'
        ? `${row.line}-${row.direction}-${row.sequence}-${platform} - Inter`
        : `${row.line}-${row.direction}-${row.sequence}-${platform}`;
      nodeMap[mapKey] = node;
    } else {
      // Still update nodeMap for edge creation
      const mapKey = row.line === 'Inter'
        ? `${row.line}-${row.direction}-${row.sequence}-${platform} - Inter`
        : `${row.line}-${row.direction}-${row.sequence}-${platform}`;
      nodeMap[mapKey] = nodes.find(n => n.id === id);
    }
  }
}

// 2. Create train edges (between consecutive nodes in the same line/direction)
for (let i = 0; i < records.length - 1; i++) {
  const row = records[i];
  const nextRow = records[i + 1];
  // Only link if same line and direction, and sequences are consecutive
  if (
    row.line === nextRow.line &&
    row.direction === nextRow.direction &&
    Number(row.sequence) + 1 === Number(nextRow.sequence)
  ) {
    const fromPlatforms = row.platform ? row.platform.split('/') : [''];
    const toPlatforms = nextRow.platform ? nextRow.platform.split('/') : [''];
    for (const fromPlatform of fromPlatforms) {
      for (const toPlatform of toPlatforms) {
        const fromKey = row.line === 'Inter'
          ? `${row.line}-${row.direction}-${row.sequence}-${fromPlatform} - Inter`
          : `${row.line}-${row.direction}-${row.sequence}-${fromPlatform}`;
        const toKey = nextRow.line === 'Inter'
          ? `${nextRow.line}-${nextRow.direction}-${nextRow.sequence}-${toPlatform} - Inter`
          : `${nextRow.line}-${nextRow.direction}-${nextRow.sequence}-${toPlatform}`;
        if (nodeMap[fromKey] && nodeMap[toKey]) {
          edges.push({
            from: nodeMap[fromKey].id,
            to: nodeMap[toKey].id,
            mode: 'train',
            line: row.line,
            direction: row.direction,
            duration: Number(nextRow.duration) || null,
            terminalStation: row.terminalStation || '',
            terminalStationTamil: row.terminalStationTamil || '' // Add tamil terminal station name
          });
        }
      }
    }
  }
}

// 3. Include transits from transits.json into edges
const transits = JSON.parse(fs.readFileSync('transits.json', 'utf8'));
for (const transit of transits) {
  edges.push({
    from: transit.from,
    to: transit.to,
    mode: transit.mode,
    line: transit.line || '',
    direction: transit.direction || '',
    duration: transit.duration || null,
    terminalStation: '',
    terminalStationTamil: '' // No tamil terminal for transit edges
  });
}

// 4. Output
fs.writeFileSync('nodes.json', JSON.stringify(nodes, null, 2));
fs.writeFileSync('edges.json', JSON.stringify(edges, null, 2));
console.log('Generated nodes.json and edges.json');
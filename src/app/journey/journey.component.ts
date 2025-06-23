import { Component, Input, OnInit, OnChanges, SimpleChanges, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { SeoService } from '../seo.service';

interface MetroNode {
  id: string;
  station: string;
  stationTamil?: string;
  line: string;
  direction: string;
  sequence: number | null;
  platform: string;
  level: string;
  type: string;
  isTerminal: boolean;
}

interface MetroEdge {
  from: string;
  to: string;
  mode: string;
  line: string;
  direction: string;
  duration: number;
  terminalStation?: string;
  terminalStationTamil?: string;
}

interface JourneyStep {
  node: MetroNode;
  edgeFromPrev?: { mode: string };
}

interface JourneyPlanEntry {
  station: string;
  stationTamil?: string;
  line: string;
  isFrom: boolean;
  isTo: boolean;
  terminalStation: string;
  terminalStationTamil?: string;
  isTransit: boolean;
  transitSteps: string[];
  platform: string;
  level: string;
}

@Component({
  selector: 'app-journey',
  templateUrl: './journey.component.html',
  styleUrls: ['./journey.component.css']
})
export class JourneyComponent implements OnInit, OnChanges {
  @Input() fromStation: string | null = null;
  @Input() toStation: string | null = null;
  @Input() language: 'en' | 'ta' = 'en';
  nodes: MetroNode[] = [];
  edges: MetroEdge[] = [];
  journeySteps: JourneyStep[] = [];
  journeyPlan: JourneyPlanEntry[] = [];
  loading = false;

  constructor(private http: HttpClient, @Inject(PLATFORM_ID) private platformId: Object, private seoService: SeoService) {}

  ngOnInit(): void {
    this.seoService.setDefaultSEO();
    this.loadGraph();
  }

  ngOnChanges(changes: SimpleChanges): void {
    /*if (changes['language']) {
      console.log('Language changed to:', this.language);
    }*/
    // Clear journeyPlan if either fromStation or toStation is an empty string
    if (this.fromStation === '' || this.toStation === '') {
      this.journeyPlan = [];
      return;
    }
    if (this.nodes.length && this.edges.length && this.fromStation && this.toStation) {
      this.planJourney();
    }
  }

  private updateSEOForJourney() {
    if (isPlatformBrowser(this.platformId)) {
      const fromStation = this.journeyPlan.find(entry => entry.isFrom);
      const toStation = this.journeyPlan.find(entry => entry.isTo);
      //console.log('Updating SEO for journey:', fromStation, toStation);
      if (fromStation && toStation) {
        this.seoService.updateForRoute(fromStation.station, toStation.station);
      }
    }
  }

  loadGraph() {
    this.loading = true;
    
    // Only load data in browser, not during prerendering
    if (isPlatformBrowser(this.platformId)) {
      this.http.get<MetroNode[]>('assets/nodes.json').subscribe(nodes => {
        this.nodes = nodes.filter(n => n.station && n.platform && n.level && n.id);
        this.http.get<MetroEdge[]>('assets/edges.json').subscribe(edges => {
          this.edges = edges.filter(e => e.from && e.to && e.mode);
          this.loading = false;
          if (this.fromStation && this.toStation) {
            this.planJourney();
          }
        });
      });
    } else {
      // During prerendering, use empty arrays
      this.nodes = [];
      this.edges = [];
      this.loading = false;
    }
  }

  planJourney() {
    // Find all possible start/end nodes for the selected stations
    const startNodes = this.nodes.filter(n => n.station === this.fromStation);
    const endNodes = this.nodes.filter(n => n.station === this.toStation);
    // Debug: print start and end nodes for analysis
    // console.log('Start nodes:', startNodes);
    // console.log('End nodes:', endNodes);
    if (!startNodes.length || !endNodes.length) {
      this.journeySteps = [];
      this.journeyPlan = [];
      return;
    }
    // Use Dijkstra's algorithm for shortest path (by duration)
    const { path } = this.findShortestPath(startNodes, endNodes);
    //console.log('Journey path:', JSON.stringify(path));
    this.journeyPlan = this.convertToJourneyPlan(path); // Pass full JourneyStep[]
    
    // Update SEO after journey plan is created
    if (this.journeyPlan.length > 0) {
      //console.log('Journey plan created:', this.journeyPlan);
      this.updateSEOForJourney();
    }
  }

  // Helper: convert level string to number for comparison
  private levelToNumber(level: string): number {
    if (level.startsWith('L')) return parseInt(level.substring(1));
    if (level === 'G') return 0;
    if (level.startsWith('B')) return -parseInt(level.substring(1));
    return 0;
  }

  // Helper: get all possible terminal stations for a line/direction using edge traversal
  private getTerminalStation(line: string, direction: string): string {
    // Build a map from node id to node for quick lookup
    const nodeMap = new Map<string, MetroNode>();
    this.nodes.forEach(n => nodeMap.set(n.id, n));
    // Build a map from node id to outgoing train edges
    const edgeMap = new Map<string, MetroEdge[]>();
    this.edges.forEach(e => {
      if (!edgeMap.has(e.from)) edgeMap.set(e.from, []);
      edgeMap.get(e.from)!.push(e);
    });
    // Find all starting nodes for this line/direction
    const startNodes = this.nodes.filter(n => n.line === line && n.direction === direction);
    const terminals = new Set<string>();
    // Traverse from each start node
    for (const start of startNodes) {
      const visited = new Set<string>();
      const stack: string[] = [start.id];
      while (stack.length) {
        const currentId = stack.pop()!;
        if (visited.has(currentId)) continue;
        visited.add(currentId);
        const outgoing = (edgeMap.get(currentId) || []).filter(e => e.mode === 'train' && e.line === line && e.direction === direction);
        if (outgoing.length === 0) {
          // No further train edges: terminal
          const node = nodeMap.get(currentId);
          if (node) terminals.add(node.station);
        } else {
          for (const edge of outgoing) {
            stack.push(edge.to);
          }
        }
      }
    }
    return Array.from(terminals).join(', ');
  }

  // Helper: build transit steps for the starting station
  private buildStartStationTransitSteps(platform: string, level: string, terminalStation: string, terminalStationTamil: string): string[] {
    const steps: string[] = [];
    // Determine up/down and number of levels
    let upOrDown = '';
    let levels = 0;
    if (this.language === 'en') {
      if (level.startsWith('L')) {
        upOrDown = 'up';
        levels = parseInt(level.substring(1));
      } else if (level.startsWith('B')) {
        upOrDown = 'down';
        levels = parseInt(level.substring(1));
      } else if (level === 'G') {
        upOrDown = '';
        levels = 0;
      }
    } else {
      if (level.startsWith('L')) {
        upOrDown = 'மேலே';
        levels = parseInt(level.substring(1));
      } else if (level.startsWith('B')) {
        upOrDown = 'கீழே';
        levels = parseInt(level.substring(1));
      } else if (level === 'G') {
        upOrDown = '';
        levels = 0;
      }
    }
    if (this.language === 'en') {
      if (levels > 0 && upOrDown) {
        steps.push(`From ticket counter, go ${upOrDown} ${levels === 1 ? 'one level' : levels + ' levels'} to <b>Platform ${platform.replace(/^P/, '')}</b>`);
      }
      steps.push(`Check next train destination in platform monitor and board train heading to <b>${terminalStation}</b>.`);
    } else {
      if (levels > 0 && upOrDown) {
        steps.push(`டிக்கெட் பெற்றதும், ${upOrDown} ${levels === 1 ? 'ஒரு தளம்' : levels + ' தளங்கள்'} <b>பிளாட்பார்ம் ${platform.replace(/^P/, '')}</b> செல்லவும்`);
      }
      steps.push(`பிளாட்பார்மில் உள்ள டிவியில், அடுத்த ரயில் <b>${terminalStationTamil}</b> செல்கிறதா என்று பார்த்து அந்த ரயிலில் பயணிக்க வேண்டும்.`);
    }
    return steps;
  }

  // Main conversion logic
  private convertToJourneyPlan(steps: JourneyStep[]): JourneyPlanEntry[] {
    if (!steps.length) return [];
    const result: JourneyPlanEntry[] = [];
    let i = 0;
    while (i < steps.length) {
      const step = steps[i];
      const node = step.node;
      // Start station
      if (i === 0) {
        // If edgeFromPrev is null, get terminalStation from steps[i+1].edgeFromPrev
        let terminalStation = '';
        let terminalStationTamil = '';
        if (steps[i + 1] && steps[i + 1].edgeFromPrev && (steps[i + 1].edgeFromPrev as any).terminalStation) {
          terminalStation = (steps[i + 1].edgeFromPrev as any).terminalStation || '';
          terminalStationTamil = (steps[i + 1].edgeFromPrev as any).terminalStationTamil || '';
        }
        result.push({
          station: node.station,
          stationTamil: node.stationTamil || '',
          line: node.line,
          isFrom: true,
          isTo: false,
          terminalStation,
          terminalStationTamil,
          isTransit: false,
          transitSteps: this.buildStartStationTransitSteps(node.platform, node.level, terminalStation, terminalStationTamil),
          platform: node.platform,
          level: node.level
        });
        i++;
        continue;
      }
      // End station
      if (i === steps.length - 1) {
        result.push({
          station: node.station,
          stationTamil: node.stationTamil || '',
          line: node.line,
          isFrom: false,
          isTo: true,
          terminalStation: '',
          terminalStationTamil: '',
          isTransit: false,
          transitSteps: [],
          platform: node.platform,
          level: node.level
        });
        i++;
        continue;
      }
      // Check for train arrival followed by transit at the same station
      if (
        step.edgeFromPrev?.mode === 'train' &&
        steps[i + 1] &&
        node.station === steps[i + 1].node.station &&
        steps[i + 1].edgeFromPrev?.mode !== 'train'
      ) {
        // Gather all consecutive transit steps at this station
        const transitStepsArr: JourneyStep[] = [];
        let j = i + 1;
        while (
          j < steps.length &&
          steps[j].node.station === node.station &&
          steps[j].edgeFromPrev?.mode !== 'train'
        ) {
          transitStepsArr.push(steps[j]);
          j++;
        }
        // For transit, get terminalStation from steps[j].edgeFromPrev
        let transitTerminal = '';
        let transitTerminalTamil = '';
        if (steps[j] && steps[j].edgeFromPrev && (steps[j].edgeFromPrev as any).terminalStation) {
          transitTerminal = (steps[j].edgeFromPrev as any).terminalStation || '';
          transitTerminalTamil = (steps[j].edgeFromPrev as any).terminalStationTamil || '';
        }
        const transitSteps: string[] = this.buildTransitSteps(transitStepsArr, node.station, step, transitTerminal, transitTerminalTamil);
        result.push({
          station: node.station,
          stationTamil: node.stationTamil || '',
          line: node.line,
          isFrom: false,
          isTo: false,
          terminalStation: transitTerminal,
          terminalStationTamil: transitTerminalTamil,
          isTransit: true,
          transitSteps,
          platform: node.platform,
          level: node.level
        });
        i = j;
        continue;
      }
      // Normal station (train step)
      let terminalStation = '';
      let terminalStationTamil = '';
      if (step.edgeFromPrev && (step.edgeFromPrev as any).terminalStation) {
        terminalStation = (step.edgeFromPrev as any).terminalStation || '';
        terminalStationTamil = (step.edgeFromPrev as any).terminalStationTamil || '';
      } else if (steps[i + 1] && steps[i + 1].edgeFromPrev && (steps[i + 1].edgeFromPrev as any).terminalStation) {
        terminalStation = (steps[i + 1].edgeFromPrev as any).terminalStation || '';
        terminalStationTamil = (steps[i + 1].edgeFromPrev as any).terminalStationTamil || '';
      }
      result.push({
        station: node.station,
        stationTamil: node.stationTamil || '',
        line: node.line,
        isFrom: false,
        isTo: false,
        terminalStation,
        terminalStationTamil,
        isTransit: false,
        transitSteps: [],
        platform: node.platform,
        level: node.level
      });
      i++;
    }
    return result;
  }

  // Build transit steps: use edge.mode for step type
  private buildTransitSteps(transitStepsArr: JourneyStep[], station: string, prevTrainStep: JourneyStep, transitTerminal: string, transitTerminalTamil: string): string[] {
    const steps: string[] = [];
    // Arrival message
    if (transitStepsArr.length > 0) {
      const arrivalNode = prevTrainStep.node;
      if (this.language === 'ta') {
        let taLevel = '';
        if (arrivalNode.level === 'G') {
          taLevel = 'தரை தளம்';
        } else if (arrivalNode.level.startsWith('B')) {
          taLevel = `கீழ் தளம் ${arrivalNode.level.substring(1)}`;
        } else if (arrivalNode.level.startsWith('L')) {
          taLevel = `மேல் தளம் ${arrivalNode.level.substring(1)}`;
        } else {
          taLevel = arrivalNode.level; // fallback
        }
        steps.push(`நீங்கள் <b>பிளாட்பார்ம் ${arrivalNode.platform.replace(/^P/, '')}</b> <b>${taLevel}</b> இல் வருகை தருவீர்கள்.`);
      }
      else {
        let enLevel = '';
        if (arrivalNode.level === 'G') {
          enLevel = 'Ground Floor';
        } else if (arrivalNode.level.startsWith('B')) {
          enLevel = `Basement ${arrivalNode.level.substring(1)}`;
        } else if (arrivalNode.level.startsWith('L')) {
          enLevel = `Level ${arrivalNode.level.substring(1)}`;
        } else {
          enLevel = arrivalNode.level; // fallback
        }
        steps.push(`You will arrive in <b>Platform ${arrivalNode.platform.replace(/^P/, '')}</b> <b>${enLevel}</b>.`);
      }
    }
    let i = 0;
    let prevLevel = prevTrainStep.node.level; // Track the starting level for up/down logic
    let prevPlatform = prevTrainStep.node.platform;
    while (i < transitStepsArr.length) {
      const step = transitStepsArr[i];
      const node = step.node;
      const mode = step.edgeFromPrev ? step.edgeFromPrev.mode : '';
      // Combine consecutive level changes (stairs/lift/escalator)
      if (mode === 'stairs') {
        let startLevel = prevLevel;
        let startPlatform = prevPlatform;
        let j = i + 1;
        let stairsCount = 1;
        let endLevel = node.level;
        let endPlatform = node.platform;
        while (
          j < transitStepsArr.length &&
          transitStepsArr[j].edgeFromPrev?.mode === 'stairs' &&
          this.levelToNumber(transitStepsArr[j].node.level) !== this.levelToNumber(transitStepsArr[j - 1].node.level)
        ) {
          stairsCount++;
          endLevel = transitStepsArr[j].node.level;
          endPlatform = transitStepsArr[j].node.platform;
          j++;
        }
        const isGround = endLevel === 'G';
        const endLevelDisplay = isGround ? 'Ground Floor' : endLevel.replace(/^L|^B/, '');
        let upOrDown = this.levelToNumber(endLevel) > this.levelToNumber(startLevel) ? 'up' : 'down';
        if (this.language === 'ta') {
          upOrDown = upOrDown === 'up' ? 'மேலே' : 'கீழே';
        }
        let floorsText = '';
        if (this.language === 'en') {
          if (stairsCount === 1) floorsText = 'one level';
          else if (stairsCount === 2) floorsText = 'two levels';
          else floorsText = stairsCount + ' levels';
          if (isGround) {
            steps.push(`Go ${upOrDown} ${floorsText} to <b>${endPlatform.replace(/^P/, '')}</b> <b>Ground Floor</b>.`);
          } else {
            steps.push(`Go ${upOrDown} ${floorsText} to <b>Platform ${endPlatform.replace(/^P/, '')}</b>`);
          }
        } else {
          if (stairsCount === 1) floorsText = 'ஒரு தளம்';
          else if (stairsCount === 2) floorsText = 'இரண்டு தளங்கள்';
          else floorsText = stairsCount + ' தளங்கள்';
          if (isGround) {
            steps.push(`${upOrDown} ${floorsText}, <b>${endPlatform.replace(/^P/, '')}</b> <b>தரை தளம்</b> செல்ல வேண்டும்.`);
          } else {
            steps.push(`${upOrDown} ${floorsText}, <b>பிளாட்பார்ம் ${endPlatform.replace(/^P/, '')}</b> செல்ல வேண்டும்.`);
          }
        }
        prevLevel = endLevel;
        prevPlatform = endPlatform;
        i = j;
        continue;
      }
      // Walk step (do not combine)
      if (mode === 'walk' && this.language === 'en') {
        steps.push(`Walk to <b>${node.platform}</b> <b>${node.level === 'G' ? 'Ground Floor' : node.level.replace(/^L|^B/, '')}</b>.`);
        prevLevel = node.level;
        prevPlatform = node.platform;
        i++;
        continue;
      } else if (mode === 'walk' && this.language === 'ta') {
        steps.push(`நடந்து <b>${node.platform}</b> <b>${node.level === 'G' ? 'தரை தளம்' : node.level.replace(/^L|^B/, '')}</b> செல்ல வேண்டும்.`);
        prevLevel = node.level;
        prevPlatform = node.platform;
        i++;
        continue;
      }
      // Fallback for any other mode
      steps.push(`Proceed to <b>${station}</b> <b>${node.platform}</b> <b>${node.level === 'G' ? 'Ground Floor' : node.level.replace(/^L|^B/, '')}</b>.`);
      prevLevel = node.level;
      prevPlatform = node.platform;
      i++;
    }
    if (this.language === 'en') {
      steps.push(`Check next train destination in platform monitor and board train heading to <b>${transitTerminal}</b>.`);
    } else {
      steps.push(`பிளாட்பார்மில் உள்ள டிவியில், அடுத்த ரயில் <b>${transitTerminalTamil}</b> செல்கிறதா என்று பார்த்து அந்த ரயிலில் பயணிக்க வேண்டும்.`);
    }
    return steps;
  }

  findShortestPath(starts: MetroNode[], ends: MetroNode[]): { path: JourneyStep[] } {
    // Dijkstra's algorithm
    const nodeMap = new Map<string, MetroNode>();
    this.nodes.forEach(n => nodeMap.set(n.id, n));
    const edgeMap = new Map<string, MetroEdge[]>();
    this.edges.forEach(e => {
      if (!edgeMap.has(e.from)) edgeMap.set(e.from, []);
      edgeMap.get(e.from)!.push(e);
    });
    const visited = new Set<string>();
    const queue: Array<{ id: string; cost: number; path: JourneyStep[] }> = [];
    for (const start of starts) {
      queue.push({ id: start.id, cost: 0, path: [{ node: start }] });
    }
    // Debug: print every edge navigated by Dijkstra
    while (queue.length) {
      queue.sort((a, b) => a.cost - b.cost);
      const { id, cost, path } = queue.shift()!;
      if (visited.has(id)) continue;
      visited.add(id);
      if (ends.some(e => e.id === id)) {
        return { path };
      }
      const currentNode = nodeMap.get(id)!;
      // Add 15 minutes if current node is a terminal (and not a destination)
      let extraWait = 0;
      if (currentNode.isTerminal && !ends.some(e => e.id === id)) {
        extraWait = 15;
      }
      const edges = edgeMap.get(id) || [];
      for (const edge of edges) {
        if (!visited.has(edge.to) && nodeMap.has(edge.to)) {
          // Print the edge being navigated (values only, space-separated)
          /*console.log(
            `${edge.from} -> ${edge.to} ${edge.mode} ${edge.line} ${edge.direction} ${edge.duration}`
          );*/
          queue.push({
            id: edge.to,
            cost: cost + (edge.duration || 1) + extraWait,
            path: [...path, { node: nodeMap.get(edge.to)!, edgeFromPrev: edge }]
          });
        }
      }
    }
    return { path: [] };
  }

  getLineColor(line: string): string {
    if (line === 'Blue') return '#0074D9';
    if (line === 'Green') return '#1e7e34';
    if (line === 'Inter') return '#00BCD4'; // Cyan for interchanges
    return '#888';
  }

  getModeIcon(mode: string): string {
    if (mode === 'stairs') return 'bi bi-elevator';
    if (mode === 'walk') return 'bi bi-person-walking';
    if (mode === 'train') return 'bi bi-train-front';
    return 'bi bi-dot';
  }

  // Get terminal station for a given train edge
  getTerminalForEdge(edge: MetroEdge): string {
    // console.log('Finding terminal for edge:', edge);
    // Find all nodes on this line/direction
    const lineNodes = this.nodes.filter(n => n.line === edge.line && n.direction === edge.direction);
    if (!lineNodes.length) return '';
    // Terminal is the station with isTerminal true
    const terminalNode = lineNodes.find(n => n.isTerminal);
    return terminalNode ? terminalNode.station : '';
  }

  // Get platform for a node
  getPlatform(node: MetroNode): string {
    return node.platform;
  }

  // Format platform number without 'P' prefix
  formatPlatform(node: MetroNode): string {
    return node.platform.replace(/^P/, '');
  }

  // Helper to group consecutive transit steps for the same station
  getTransitStepsForStation(index: number): JourneyStep[] {
    const steps: JourneyStep[] = [];
    const journey = this.journeySteps;
    if (!journey[index] || !journey[index].edgeFromPrev || journey[index].edgeFromPrev?.mode === 'train') return steps;
    const station = journey[index].node.station;
    let i = index;
    // Go forward to collect all consecutive transit steps for this station
    while (
      i < journey.length &&
      journey[i] &&
      journey[i].edgeFromPrev !== undefined &&
      journey[i].edgeFromPrev?.mode !== undefined &&
      journey[i].edgeFromPrev?.mode !== 'train' &&
      journey[i].node.station === station
    ) {
      steps.push(journey[i]);
      i++;
    }
    return steps;
  }

  // Helper for template: returns the mode or undefined
  getEdgeMode(step: JourneyStep): string {
    return step && step.edgeFromPrev && step.edgeFromPrev.mode !== undefined ? step.edgeFromPrev.mode : '';
  }
}

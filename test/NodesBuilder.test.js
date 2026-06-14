import * as d3 from 'd3';
import NodesBuilder from '../src/NodesBuilder.js';
import Node from '../src/Node.js';
import state from '../src/GlobalState.js';

// Mock the global state
jest.mock('../src/GlobalState.js', () => ({
  nodes: [],
  style: {
    nodeWidth: 100,
    nodeHeight: 50,
    nodeBackground: 'blue',
    nodeForeground: 'black',
    fontFamily: 'Arial',
    fontSize: '12px',
    fontColor: 'white',
  },
  padding: 10,
  width: 800,
}));

describe('NodesBuilder', () => {
  let nodesBuilder;
  let rootGroup;

  beforeEach(() => {
    // Set up a fake SVG container in JSDOM
    const svg = d3.select(document.body).append('svg');
    rootGroup = svg.append('g');

    // Reset state and create a new builder for each test
    state.nodes = [];
    nodesBuilder = new NodesBuilder(800); // svg width
  });

  afterEach(() => {
    // Clean up the DOM
    document.body.innerHTML = '';
  });

  it('should be created', () => {
    expect(nodesBuilder).toBeDefined();
  });
  
  describe('Building Nodes', () => {
    beforeEach(() => {
      const nodesData = [
        { id: 'node1', name: 'Node 1', x: 10, y: 20 },
        { id: 'node2', name: 'Node 2', x: 150, y: 100 },
      ];
      // The builder expects instances of Node
      state.nodes = nodesData.map(d => new Node(d));
      nodesBuilder.build(rootGroup);
    });

    it('should create a container for nodes', () => {
      const nodesContainer = rootGroup.select('g.nodes');
      expect(nodesContainer.empty()).toBe(false);
    });

    it('should create a group for each node', () => {
      const nodeGroups = rootGroup.selectAll('g.nodes > g');
      expect(nodeGroups.size()).toBe(2);
    });

    it('should create a rectangle for each node group', () => {
      const rects = rootGroup.selectAll('g.nodes > g > rect');
      expect(rects.size()).toBe(2);
      
      const firstRect = rects.nodes()[0];
      expect(firstRect.getAttribute('width')).toBe('100'); // from state
      expect(firstRect.getAttribute('height')).toBe('50'); // from state
      expect(firstRect.getAttribute('x')).toBe('10');
      expect(firstRect.getAttribute('y')).toBe('20');
      expect(firstRect.getAttribute('fill')).toBe('blue');
    });

    it('should create a text label for each node group', () => {
      const texts = rootGroup.selectAll('g.nodes > g > text');
      expect(texts.size()).toBe(2);

      const firstText = texts.nodes()[0];
      expect(firstText.textContent).toBe('Node 1');
      expect(firstText.getAttribute('x')).toBe('10');
      expect(firstText.getAttribute('y')).toBe('20');
      expect(firstText.getAttribute('font-family')).toBe('Arial');
      expect(firstText.getAttribute('cursor')).toBe('text');
      expect(firstText.getAttribute('pointer-events')).toBe('all');
      expect(firstText.style.userSelect).toBe('text');
    });

    it('should truncate long node names and keep the full name in title', () => {
      const longName = 'VeryLongClassNameThatShouldBeTruncatedForDisplay';
      document.body.innerHTML = '';
      const svg = d3.select(document.body).append('svg');
      rootGroup = svg.append('g');
      state.nodes = [new Node({ id: 'long-node', name: longName, x: 10, y: 20 })];
      nodesBuilder.build(rootGroup);

      const text = rootGroup.select('g.nodes > g > text');
      const title = rootGroup.select('g.nodes > g > title');

      expect(text.text()).toBe(`${longName.substring(0, 30)}...`);
      expect(title.text()).toBe(longName);
    });
  });

  describe('Updating Nodes', () => {
    it('should update node positions on update()', () => {
        const nodesData = [{ id: 'node1', name: 'Node 1', x: 10, y: 20 }];
        state.nodes = nodesData.map(d => new Node(d));
        nodesBuilder.build(rootGroup);

        // Change the node's position
        state.nodes[0].setPosition(300, 400);
        nodesBuilder.update();

        const rect = rootGroup.select('rect');
        expect(rect.attr('x')).toBe('300');
        expect(rect.attr('y')).toBe('400');
        
        const text = rootGroup.select('text');
        expect(text.attr('x')).toBe('300');
        expect(text.attr('y')).toBe('400');
    });
  });

});

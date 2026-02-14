import * as d3 from 'd3';
import LinksBuilder from '../src/LinksBuilder.js';
import Link from '../src/Link.js';
import Node from '../src/Node.js';
import state from '../src/GlobalState.js';

// Mock the global state
jest.mock('../src/GlobalState.js', () => ({
  nodes: [],
  links: [],
  style: {
    nodeForeground: 'black',
    nodeWidth: 100, // need for node creation
    nodeHeight: 50, // need for node creation
  },
}));

describe('LinksBuilder', () => {
  let linksBuilder;
  let rootGroup;

  beforeEach(() => {
    // Set up a fake SVG container in JSDOM
    const svg = d3.select(document.body).append('svg');
    rootGroup = svg.append('g');

    // Reset state and create a new builder
    state.nodes = [];
    state.links = [];
    linksBuilder = new LinksBuilder();

    // Create some nodes and links for testing
    const node1 = new Node({ id: 'node1', name: 'Node 1', x: 0, y: 100, width: 100, height: 50 });
    const node2 = new Node({ id: 'node2', name: 'Node 2', x: 300, y: 100, width: 100, height: 50 });
    state.nodes.push(node1, node2);

    const link1 = new Link({ source: 'node1', target: 'node2', type: 'Association' });
    const link2 = new Link({ source: 'node2', target: 'node1', type: 'Realization' });
    state.links.push(link1, link2);
  });

  afterEach(() => {
    // Clean up the DOM
    document.body.innerHTML = '';
  });

  it('should be created', () => {
    expect(linksBuilder).toBeDefined();
  });

  describe('Building Links', () => {
    beforeEach(() => {
      linksBuilder.build(rootGroup);
    });

    it('should create a container for links', () => {
      const linksContainer = rootGroup.select('g.links');
      expect(linksContainer.empty()).toBe(false);
    });

    it('should create arrow markers', () => {
      const standardArrow = rootGroup.select('marker#standard-arrow');
      const inheritanceArrow = rootGroup.select('marker#inheritance-arrow');
      expect(standardArrow.empty()).toBe(false);
      expect(inheritanceArrow.empty()).toBe(false);
    });

    it('should create a line for each link', () => {
      const lines = rootGroup.selectAll('g.links > line');
      expect(lines.size()).toBe(2);
    });

    it('should set the correct attributes for the lines', () => {
      const lines = rootGroup.selectAll('g.links > line').nodes();
      const line1 = lines[0];
      const line2 = lines[1];

      // Test marker-end
      expect(line1.getAttribute('marker-end')).toBe('url(#standard-arrow)');
      expect(line2.getAttribute('marker-end')).toBe('url(#inheritance-arrow)');
      
      // Test stroke-dasharray for Realization
      expect(line1.getAttribute('stroke-dasharray')).toBeNull();
      expect(line2.getAttribute('stroke-dasharray')).toBe('10, 10');

      // Test coordinates (they are calculated, so just check they are set)
      expect(line1.getAttribute('x1')).not.toBeNull();
      expect(line1.getAttribute('y1')).not.toBeNull();
      expect(line1.getAttribute('x2')).not.toBeNull();
      expect(line1.getAttribute('y2')).not.toBeNull();
    });
  });

  describe('Updating Links', () => {
    it('should update link positions on update()', () => {
      linksBuilder.build(rootGroup);
      
      const line = rootGroup.select('line');
      const oldX1 = line.attr('x1');
      const oldY1 = line.attr('y1');

      // Move a node
      state.nodes[0].setPosition(50, 150);
      linksBuilder.update();

      const newX1 = line.attr('x1');
      const newY1 = line.attr('y1');

      expect(newX1).not.toBe(oldX1);
      expect(newY1).not.toBe(oldY1);
    });
  });
});
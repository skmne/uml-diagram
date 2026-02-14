import * as d3 from 'd3';
import Diagram from '../src/Diagram.js';
import state from '../src/GlobalState.js';
import drag from '../src/drag.js'; // Will be the mock
import Zoom from '../src/zoom.js'; // Will be the mock

// Mock dependencies
jest.mock('../src/drag.js', () => jest.fn(() => jest.fn())); // Return a dummy function for d3.call
jest.mock('../src/zoom.js', () => jest.fn().mockImplementation(() => {
  return { /* mock zoom methods if needed */ };
}));
jest.mock('../src/GlobalState.js', () => ({
  nodes: [],
  links: [],
  style: { 
      /* initial styles */
      nodeWidth: 100,
      nodeHeight: 50,
  },
  width: 0,
  height: 0,
}));

describe('Diagram', () => {
  let diagram;
  let svgElement;

  beforeEach(() => {
    // Set up a fake SVG container in JSDOM
    svgElement = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svgElement.setAttribute('width', '800');
    svgElement.setAttribute('height', '600');
    document.body.appendChild(svgElement);

    // Reset state and mocks
    state.nodes = [];
    state.links = [];
    drag.mockClear();
    Zoom.mockClear();

    // Create a new Diagram instance
    diagram = new Diagram(svgElement);
  });

  afterEach(() => {
    // Clean up the DOM
    document.body.innerHTML = '';
  });

  it('should be created and initialize zoom', () => {
    expect(diagram).toBeDefined();
    expect(Zoom).toHaveBeenCalledTimes(1);
  });

  describe('Data Handling and Building', () => {
    const testData = {
      nodes: [{ id: 'n1', name: 'Node 1' }, { id: 'n2', name: 'Node 2' }],
      links: [{ source: 'n1', target: 'n2' }],
    };

    it('should set data and create Node/Link instances', () => {
      diagram.setData(testData);
      expect(state.nodes.length).toBe(2);
      expect(state.links.length).toBe(1);
      expect(state.nodes[0].id).toBe('n1');
      expect(state.links[0].source).toBe('n1');
    });

    it('should build the diagram structure in SVG', () => {
      diagram.setData(testData);
      diagram.build();
      
      const rootGroup = d3.select(svgElement).select('g');
      expect(rootGroup.empty()).toBe(false);

      const nodeGroups = rootGroup.selectAll('g.nodes > g');
      expect(nodeGroups.size()).toBe(2);
      
      const linkLines = rootGroup.selectAll('g.links > line');
      expect(linkLines.size()).toBe(1);
      
      // Verify that drag was applied
      expect(drag).toHaveBeenCalledTimes(1);
    });
  });
  
  describe('Item Manipulation', () => {
    const initialData = {
        nodes: [{ id: 'n1', name: 'Node 1' }, { id: 'n2', name: 'Node 2' }],
        links: [{ source: 'n1', target: 'n2' }],
    };

    beforeEach(()=>{
        diagram.setData(initialData);
        diagram.build();
    });

    it('should add items to the diagram', () => {
        diagram.addItems({
            nodes: [{ id: 'n3', name: 'Node 3' }],
            links: [{ source: 'n2', target: 'n3' }],
        });

        const nodeGroups = d3.select(svgElement).selectAll('g.nodes > g');
        expect(nodeGroups.size()).toBe(3);

        const linkLines = d3.select(svgElement).selectAll('g.links > line');
        expect(linkLines.size()).toBe(2);
    });

    it('should remove items from the diagram', () => {
        diagram.removeItems(['n1']); // remove node n1 and any links connected to it

        const nodeGroups = d3.select(svgElement).selectAll('g.nodes > g');
        expect(nodeGroups.size()).toBe(1);
        expect(nodeGroups.data()[0].id).toBe('n2');

        const linkLines = d3.select(svgElement).selectAll('g.links > line');
        expect(linkLines.size()).toBe(0);
    });
  });

  describe('Styling', () => {
    it('should update state styles with setStyle', () => {
        const newStyle = {
            nodeBackground: 'red',
            fontSize: '16px',
        };
        diagram.setStyle(newStyle);

        expect(state.style.nodeBackground).toBe('red');
        expect(state.style.fontSize).toBe('16px');
        // check that others are not changed
        expect(state.style.nodeWidth).toBe(100);
    });
  });
});
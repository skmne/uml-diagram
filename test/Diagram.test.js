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

    it('should return nodes and links with getData', () => {
      diagram.setData({
        nodes: [
          { id: 'n1', name: 'Node 1', x: 10, y: 20, width: 120, height: 60 },
          { id: 'n2', name: 'Node 2', x: 200, y: 300 },
        ],
        links: [{ source: 'n1', target: 'n2', type: 'Association' }],
      });

      expect(diagram.getData()).toEqual({
        nodes: [
          { id: 'n1', name: 'Node 1', x: 10, y: 20, width: 120, height: 60 },
          { id: 'n2', name: 'Node 2', x: 200, y: 300, width: 100, height: 50 },
        ],
        links: [{ source: 'n1', target: 'n2', type: 'Association' }],
      });
    });

    it('should return copies instead of internal state references', () => {
      diagram.setData({
        nodes: [{ id: 'n1', name: 'Node 1', x: 10, y: 20 }],
        links: [{ source: 'n1', target: 'n1', type: 'Association' }],
      });

      const data = diagram.getData();
      data.nodes[0].x = 999;
      data.links[0].source = 'changed';
      data.nodes.push({ id: 'external', name: 'External', x: 0, y: 0, width: 1, height: 1 });
      data.links.push({ source: 'external', target: 'n1', type: 'External' });

      expect(state.nodes).toHaveLength(1);
      expect(state.links).toHaveLength(1);
      expect(state.nodes[0].x).toBe(10);
      expect(state.links[0].source).toBe('n1');
    });

    it('should return updated node coordinates from state', () => {
      diagram.setData({
        nodes: [{ id: 'n1', name: 'Node 1', x: 10, y: 20 }],
        links: [],
      });

      state.nodes[0].x = 300;
      state.nodes[0].y = 400;

      expect(diagram.getData().nodes[0]).toMatchObject({
        id: 'n1',
        x: 300,
        y: 400,
      });
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

  describe('Events', () => {
    beforeEach(() => {
      diagram.setData({
        nodes: [{ id: 'n1', name: 'Node 1', x: 10, y: 20 }],
        links: [],
      });
      diagram.build();
    });

    it('should call layoutChanged listeners with current data', () => {
      const listener = jest.fn();
      diagram.on('layoutChanged', listener);

      diagram.addItems({
        nodes: [{ id: 'n2', name: 'Node 2', x: 100, y: 120 }],
        links: [{ source: 'n1', target: 'n2', type: 'Association' }],
      });

      expect(listener).toHaveBeenCalledTimes(1);
      expect(listener).toHaveBeenCalledWith({
        nodes: [
          { id: 'n1', name: 'Node 1', x: 10, y: 20, width: 100, height: 50 },
          { id: 'n2', name: 'Node 2', x: 100, y: 120, width: 100, height: 50 },
        ],
        links: [{ source: 'n1', target: 'n2', type: 'Association' }],
      });
    });

    it('should stop calling listeners after unsubscribe', () => {
      const listener = jest.fn();
      const unsubscribe = diagram.on('layoutChanged', listener);

      diagram.addItems({
        nodes: [{ id: 'n2', name: 'Node 2', x: 100, y: 120 }],
        links: [],
      });
      unsubscribe();
      diagram.removeItems(['n2']);

      expect(listener).toHaveBeenCalledTimes(1);
    });

    it('should pass copies to layoutChanged listeners', () => {
      const listener = jest.fn((data) => {
        data.nodes[0].x = 999;
        data.nodes.push({ id: 'external', name: 'External', x: 0, y: 0, width: 1, height: 1 });
      });
      diagram.on('layoutChanged', listener);

      diagram.addItems({
        nodes: [{ id: 'n2', name: 'Node 2', x: 100, y: 120 }],
        links: [],
      });

      expect(state.nodes).toHaveLength(2);
      expect(state.nodes[0].x).toBe(10);
    });

    it('should call nodeMoved and layoutChanged with current data after a node move', () => {
      const nodeMovedListener = jest.fn();
      const layoutChangedListener = jest.fn();
      diagram.on('nodeMoved', nodeMovedListener);
      diagram.on('layoutChanged', layoutChangedListener);

      state.nodes[0].x = 300;
      state.nodes[0].y = 400;
      diagram.notifyNodeMoved(state.nodes[0]);

      expect(nodeMovedListener).toHaveBeenCalledWith({
        node: { id: 'n1', name: 'Node 1', x: 300, y: 400, width: 100, height: 50 },
        data: {
          nodes: [{ id: 'n1', name: 'Node 1', x: 300, y: 400, width: 100, height: 50 }],
          links: [],
        },
      });
      expect(layoutChangedListener).toHaveBeenCalledWith({
        nodes: [{ id: 'n1', name: 'Node 1', x: 300, y: 400, width: 100, height: 50 }],
        links: [],
      });
    });

    it('should call nodeContextMenu listeners with node data', () => {
      const listener = jest.fn();
      const event = {
        preventDefault: jest.fn(),
        clientX: 100,
        clientY: 200,
      };
      diagram.on('nodeContextMenu', listener);

      diagram.notifyNodeContextMenu(event, state.nodes[0]);

      expect(event.preventDefault).toHaveBeenCalledTimes(1);
      expect(listener).toHaveBeenCalledWith({
        node: { id: 'n1', name: 'Node 1', x: 10, y: 20, width: 100, height: 50 },
        data: {
          nodes: [{ id: 'n1', name: 'Node 1', x: 10, y: 20, width: 100, height: 50 }],
          links: [],
        },
        event,
      });
    });

    it('should not prevent the default context menu without nodeContextMenu listeners', () => {
      const event = {
        preventDefault: jest.fn(),
      };

      diagram.notifyNodeContextMenu(event, state.nodes[0]);

      expect(event.preventDefault).not.toHaveBeenCalled();
    });

    it('should stop calling nodeContextMenu listeners after unsubscribe', () => {
      const listener = jest.fn();
      const unsubscribe = diagram.on('nodeContextMenu', listener);

      diagram.notifyNodeContextMenu({ preventDefault: jest.fn() }, state.nodes[0]);
      unsubscribe();
      diagram.notifyNodeContextMenu({ preventDefault: jest.fn() }, state.nodes[0]);

      expect(listener).toHaveBeenCalledTimes(1);
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

    it('should apply style changes to an already rendered diagram', () => {
        diagram.setData({
            nodes: [
                { id: 'n1', name: 'Node 1', x: 10, y: 20 },
                { id: 'n2', name: 'Node 2', x: 200, y: 20 },
            ],
            links: [{ source: 'n1', target: 'n2', type: 'Association' }],
        });
        diagram.build();

        diagram.setStyle({
            nodeForeground: '#112233',
            nodeBackground: '#ffffff',
            fontColor: '#445566',
            fontFamily: 'Georgia',
            fontSize: '18px',
        });

        const rect = d3.select(svgElement).select('rect');
        const text = d3.select(svgElement).select('text');
        const line = d3.select(svgElement).select('line');
        const standardArrowPath = d3.select(svgElement).select('marker#standard-arrow path');

        expect(rect.attr('fill')).toBe('#ffffff');
        expect(rect.attr('stroke')).toBe('#112233');
        expect(text.attr('fill')).toBe('#445566');
        expect(text.attr('font-family')).toBe('Georgia');
        expect(text.attr('font-size')).toBe('18px');
        expect(line.attr('stroke')).toBe('#112233');
        expect(standardArrowPath.attr('fill')).toBe('#112233');
    });

    it('should export SVG with temporary colors without changing rendered style', () => {
        diagram.setData({
            nodes: [
                { id: 'n1', name: 'Node 1', x: 10, y: 20 },
                { id: 'n2', name: 'Node 2', x: 200, y: 20 },
            ],
            links: [{ source: 'n1', target: 'n2', type: 'Association' }],
        });
        diagram.setStyle({
            nodeForeground: '#ffffff',
            nodeBackground: '#111111',
            fontColor: '#ffffff',
        });
        diagram.build();

        const exportedSvg = diagram.exportSvg({
            background: '#ffffff',
            nodeForeground: '#111111',
            nodeBackground: '#ffffff',
            fontColor: '#111111',
        });

        expect(exportedSvg).toContain('data-uml-export-background="true"');
        expect(exportedSvg).toContain('fill="#ffffff"');
        expect(exportedSvg).toContain('stroke="#111111"');
        expect(exportedSvg).toContain('fill="#111111"');

        const rect = d3.select(svgElement).select('rect');
        const text = d3.select(svgElement).select('text');
        const backgroundRect = d3.select(svgElement).select('rect[data-uml-export-background="true"]');

        expect(rect.attr('fill')).toBe('#111111');
        expect(rect.attr('stroke')).toBe('#ffffff');
        expect(text.attr('fill')).toBe('#ffffff');
        expect(backgroundRect.empty()).toBe(true);
    });
  });
});

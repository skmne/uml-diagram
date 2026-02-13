import Link from './Link.js';
import Node from './Node.js';
import state from './GlobalState.js';
import Vector from './Vector.js';

// Mock the global state
jest.mock('./GlobalState.js', () => ({
  nodes: [],
  style: { nodeWidth: 100, nodeHeight: 50 }, // Add default style
  padding: 10,
  width: 800,
}));


describe('Link', () => {
  let node1, node2;

  beforeEach(() => {
    // Reset the mock state
    state.nodes = [];

    // Create mock nodes using the actual Node class
    const nodeObj1 = { id: 'node1', name: 'Node 1', x: 0, y: 100 };
    const nodeObj2 = { id: 'node2', name: 'Node 2', x: 300, y: 100 };
    
    node1 = new Node(nodeObj1);
    node2 = new Node(nodeObj2);

    state.nodes.push(node1, node2);
  });

  it('should correctly initialize with source and target IDs', () => {
    const link = new Link({ source: 'node1', target: 'node2', type: 'Association' });
    expect(link.source).toBe('node1');
    expect(link.target).toBe('node2');
    expect(link.type).toBe('Association');
  });

  it('should find the correct node instances from the global state', () => {
    const link = new Link({ source: 'node1', target: 'node2' });
    // This is tested indirectly. If it fails, getSourceVector will throw.
    // A more direct test would require exposing the private nodes, which is not ideal.
    expect(() => link.getSourceVector()).not.toThrow();
  });

  describe('Link Vector Calculations', () => {
    it('should calculate source vector for a horizontal link', () => {
      // Node1 at (0, 100), Node2 at (300, 100)
      const link = new Link({ source: 'node1', target: 'node2' });
      const sourceVector = link.getSourceVector();

      // Since target is to the right, source point is on the right edge of node1
      expect(sourceVector.x).toBe(node1.x + node1.width); // 0 + 100 = 100
      // Y should be centered on the node's side
      expect(sourceVector.y).toBe(node1.y + node1.height / 2); // 100 + 25 = 125
    });

    it('should calculate target vector for a horizontal link', () => {
        // Node1 at (0, 100), Node2 at (300, 100)
        const link = new Link({ source: 'node1', target: 'node2' });
        const targetVector = link.getTargetVector();
        
        const sourceVec = link.getSourceVector();
        const line = new Vector(targetVector.x - sourceVec.x, targetVector.y - sourceVec.y);

        // Raw target connection point
        const targetConnectionX = node2.x; // left edge
        const targetConnectionY = node2.y + node2.height/2;

        const rawLineLength = new Vector(targetConnectionX-sourceVec.x, targetConnectionY-sourceVec.y).getLength();
        
        // The arrowSize is 10 (private, but we know it from the source)
        expect(line.getLength()).toBeCloseTo(rawLineLength - 10);
    });

    it('should calculate source vector for a vertical link', () => {
        // Position node2 below node1
        node2.setPosition(0, 300);
        const link = new Link({ source: 'node1', target: 'node2' });
        const sourceVector = link.getSourceVector();

        // Since target is below, source point is on the bottom edge of node1
        expect(sourceVector.x).toBe(node1.x + node1.width / 2); // 50
        expect(sourceVector.y).toBe(node1.y + node1.height);    // 100 + 50 = 150
    });
  });
});
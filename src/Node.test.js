import Node from './Node.js';
import state from './GlobalState.js';

jest.mock('./GlobalState.js', () => ({
  style: {
    nodeWidth: 100,
    nodeHeight: 50,
  },
  nodes: [],
  links: [],
  padding: 10,
  width: 800,
}));

describe('Node', () => {
  beforeEach(() => {
    // Reset the mock state before each test
    state.nodes = [];
    state.links = [];
  });

  it('should create a node with specified properties', () => {
    const nodeObj = { id: 'node1', name: 'Node 1', x: 10, y: 20, width: 120, height: 60 };
    const node = new Node(nodeObj);
    expect(node.id).toBe('node1');
    expect(node.name).toBe('Node 1');
    expect(node.x).toBe(10);
    expect(node.y).toBe(20);
    expect(node.width).toBe(120);
    expect(node.height).toBe(60);
  });

  it('should use default dimensions from state if not provided', () => {
    const nodeObj = { id: 'node2', name: 'Node 2', x: 10, y: 20 };
    const node = new Node(nodeObj);
    expect(node.width).toBe(100); // from mock state
    expect(node.height).toBe(50); // from mock state
  });

  it('should call setInitPosition when x or y is not provided', () => {
    // We can spy on the setInitPosition method to check if it's called.
    const setInitPositionSpy = jest.spyOn(Node.prototype, 'setInitPosition').mockImplementation(() => {});
    const nodeObj = { id: 'node3', name: 'Node 3' };
    new Node(nodeObj);
    expect(setInitPositionSpy).toHaveBeenCalled();
    setInitPositionSpy.mockRestore(); // clean up the spy
  });

  it('should set position correctly with setPosition', () => {
    const nodeObj = { id: 'node4', name: 'Node 4', x: 0, y: 0 };
    const node = new Node(nodeObj);
    node.setPosition(100, 200);
    expect(node.x).toBe(100);
    expect(node.y).toBe(200);
  });

  describe('Collision Detection', () => {
    it('should detect rectangle collision', () => {
      const nodeObj1 = { id: 'node5', name: 'Node 5', x: 0, y: 0, width: 100, height: 50 };
      const node1 = new Node(nodeObj1);
      state.nodes.push(node1);
      const node2 = new Node({ id: 'node6', name: 'Node 6', x: 10, y: 10 });
      // The hasRectangleCollision is called inside the constructor via setInitPosition,
      // so we need to check the result after construction.
      // Let's test the method directly.
      expect(node2.hasRectangleCollision(10, 10, 100, 50)).toBe(true);
      expect(node2.hasRectangleCollision(200, 200, 100, 50)).toBe(false);
    });

    it('should place a new node without collision', () => {
        const nodeObj1 = { id: 'node7', name: 'Node 7', x: 0, y: 0, width: 100, height: 50 };
        state.nodes.push(new Node(nodeObj1));
        const node2 = new Node({ id: 'node8', name: 'Node 8' });
        // The first node is at (0,0). The second should be placed next to it.
        // width (100) + padding (10) = 110
        expect(node2.x).toBe(110);
        expect(node2.y).toBe(0);
    });
  });
});

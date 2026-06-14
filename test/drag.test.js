import drag from '../src/drag.js';

describe('drag', () => {
  it('should notify about a node move only when dragging ends', () => {
    const diagram = {
      update: jest.fn(),
      notifyNodeMoved: jest.fn(),
    };
    const node = { id: 'n1', x: 10, y: 20 };
    const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    group.appendChild(rect);
    document.body.appendChild(group);

    const dragBehavior = drag(diagram);
    const dragged = dragBehavior.on('drag');
    const dragended = dragBehavior.on('end');

    dragged.call(rect, { x: 300, y: 400 }, node);

    expect(node.x).toBe(300);
    expect(node.y).toBe(400);
    expect(diagram.update).toHaveBeenCalledTimes(1);
    expect(diagram.notifyNodeMoved).not.toHaveBeenCalled();

    dragended.call(rect, {}, node);

    expect(diagram.notifyNodeMoved).toHaveBeenCalledTimes(1);
    expect(diagram.notifyNodeMoved).toHaveBeenCalledWith(node);
  });
});

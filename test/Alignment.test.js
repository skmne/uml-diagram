import { select } from 'd3-selection';
import Alignment, { snapPosition } from '../src/Alignment.js';
import state from '../src/GlobalState.js';

const moving = { id: 'moving', x: 0, y: 0, width: 100, height: 40 };
const target = { id: 'target', x: 300, y: 200, width: 200, height: 80 };
const snap = (position, peers = [target], threshold = 6) =>
  snapPosition(moving, position, [moving, ...peers], { x: threshold, y: threshold });

test('snaps left/right edges and centers with unequal node sizes', () => {
  expect(snap({ x: 304, y: 400 }).x).toBe(300);
  expect(snap({ x: 353, y: 400 }).x).toBe(350);
  expect(snap({ x: 397, y: 400 }).x).toBe(400);
  expect(snap({ x: 504, y: 400 }).x).toBe(500); // Opposing edges align too.
});

test('snaps top/bottom edges and centers, including both axes together', () => {
  expect(snap({ x: 700, y: 203 }).y).toBe(200);
  expect(snap({ x: 700, y: 224 }).y).toBe(220);
  expect(snap({ x: 700, y: 244 }).y).toBe(240);
  expect(snap({ x: 354, y: 223 })).toMatchObject({ x: 350, y: 220 });
  expect(snap({ x: 354, y: 223 }).guides).toHaveLength(2);
});

test('uses the nearest candidate and ignores self, even when a copy is passed', () => {
  expect(snap({ x: 303, y: 400 }, [target, { ...target, id: 'closer', x: 304 }]).x).toBe(304);
  expect(snapPosition({ ...moving }, { x: 3, y: 3 }, [moving], { x: 6, y: 6 }))
    .toEqual({ x: 3, y: 3, guides: [] });
});

test('keeps free coordinates outside the threshold, with inclusive boundary and no model mutations', () => {
  const before = { ...moving };
  expect(snap({ x: 307, y: 400 })).toEqual({ x: 307, y: 400, guides: [] });
  expect(snap({ x: 306, y: 400 }).x).toBe(300);
  expect(snap({ x: 304, y: 400 }, [target], 0).x).toBe(304);
  expect(moving).toEqual(before);
  expect(target.x).toBe(300);
});

describe('guide rendering', () => {
  let svg, root;
  beforeEach(() => {
    document.body.innerHTML = '<svg width="800" height="600"><g></g></svg>';
    svg = document.querySelector('svg');
    root = select(svg).select('g');
    state.nodes = [moving, target];
  });

  test('threshold is in screen pixels, including zoom and CSS scaling', () => {
    const alignment = new Alignment(svg);
    alignment.setRoot(root);
    root.node().getScreenCTM = () => ({ a: 2, b: 0, c: 0, d: 2 });
    expect(alignment.move(moving, 304, 400).x).toBe(304); // 8 screen px.
    expect(alignment.move(moving, 303, 400).x).toBe(300); // 6 screen px.
    root.node().getScreenCTM = () => ({ a: 0.5, b: 0, c: 0, d: 0.5 });
    expect(alignment.move(moving, 311, 400).x).toBe(300);
  });

  test('guides are outside the content root, use its transform, and disappear when bypassed or ended', () => {
    const alignment = new Alignment(svg);
    root.attr('transform', 'translate(10,20) scale(2)');
    alignment.setRoot(root);
    alignment.move(moving, 304, 400);
    const guides = svg.querySelector('[data-uml-alignment-guides]');
    expect(guides.parentNode).toBe(svg);
    expect(guides.getAttribute('transform')).toBe('translate(10,20) scale(2)');
    expect(guides.getAttribute('pointer-events')).toBe('none');
    expect(guides.querySelector('line').getAttribute('vector-effect')).toBe('non-scaling-stroke');
    expect(alignment.move(moving, 304, 400, true)).toEqual({ x: 304, y: 400 });
    expect(svg.querySelector('[data-uml-alignment-guides]')).toBeNull();
    alignment.move(moving, 304, 400);
    alignment.clear();
    expect(svg.querySelector('[data-uml-alignment-guides]')).toBeNull();
  });

  test('can disable snapping or configure its tolerance', () => {
    const disabled = new Alignment(svg, { snapToNodes: false });
    disabled.setRoot(root);
    expect(disabled.move(moving, 304, 400)).toEqual({ x: 304, y: 400 });
    const narrow = new Alignment(svg, { snapThreshold: 2 });
    narrow.setRoot(root);
    expect(narrow.move(moving, 303, 400).x).toBe(303);
    expect(narrow.move(moving, 302, 400).x).toBe(300);
  });
});

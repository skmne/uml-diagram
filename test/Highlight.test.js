import Diagram from '../src/Diagram.js';
import state from '../src/GlobalState.js';
import { AddItemsOptions } from '../src/index.js';

jest.mock('../src/zoom.js', () => jest.fn());
jest.mock('../src/drag.js', () => jest.fn(() => jest.fn()));

const association = { source: 'Service', target: 'pkg.Logger', type: 'Directed Association' };
const inheritance = { ...association, type: 'Inheritance' };
const incoming = { source: 'Client', target: 'Service', type: 'Realization' };
const reverse = { source: 'pkg.Logger', target: 'Service', type: 'Directed Association' };
const defaults = { ...state.style };
let diagram, svg;
const rects = () => [...svg.querySelectorAll('.nodes rect')];
const lines = () => [...svg.querySelectorAll('.links line')];

beforeEach(() => {
  state.nodes = [];
  state.links = [];
  state.style = { ...defaults };
  document.body.innerHTML = '<svg width="800" height="600"></svg>';
  svg = document.querySelector('svg');
  diagram = new Diagram(svg, { highlightIncidentLinksOnClick: true });
  diagram.setData({
    nodes: ['Service', 'pkg.Logger', 'Client'].map((id, i) => ({ id, name: 'Same label', x: i * 230, y: 50 })),
    links: [association, inheritance, incoming, reverse],
  });
  diagram.build();
});

test('selects by IDs, deduplicates, replaces, ignores unknowns and clears empty input', () => {
  const listener = jest.fn();
  const off = diagram.on('highlightChanged', listener);
  diagram.setHighlight({ nodeIds: ['Service', 'Service', 'missing'], links: [association, association, { ...association, type: 'missing' }] });
  expect(diagram.getHighlight()).toEqual({ nodeIds: ['Service'], links: [association] });
  expect(rects().map(rect => rect.style.stroke)).toEqual(['#2563eb', '', '']);
  expect(lines().map(line => line.style.stroke)).toEqual(['#2563eb', '', '', '']);
  diagram.setHighlight({ links: [inheritance] });
  expect(diagram.getHighlight()).toEqual({ nodeIds: [], links: [inheritance] });
  diagram.setHighlight();
  diagram.clearHighlight();
  expect(listener).toHaveBeenCalledTimes(3);
  expect(listener).toHaveBeenLastCalledWith({ nodeIds: [], links: [], reason: 'api' });
  off();
  diagram.setHighlight({ nodeIds: ['Client'] });
  expect(listener).toHaveBeenCalledTimes(3);
});

test('incident selection includes both directions and every type, without neighbors', () => {
  diagram.setHighlight({ nodeIds: ['Service'], includeIncidentLinks: true });
  expect(diagram.getHighlight()).toEqual({ nodeIds: ['Service'], links: [association, inheritance, incoming, reverse] });
  expect(rects().filter(rect => rect.style.stroke)).toHaveLength(1);
});

test('set equality ignores order, and snapshots/event payloads are independent', () => {
  const listener = jest.fn();
  diagram.on('highlightChanged', payload => {
    payload.nodeIds.push('bad');
    payload.links[0].type = 'bad';
  });
  diagram.on('highlightChanged', listener);
  diagram.setHighlight({ nodeIds: ['Service', 'Client'], links: [association, inheritance] });
  const snapshot = diagram.getHighlight();
  snapshot.nodeIds.length = 0;
  snapshot.links[0].source = 'bad';
  diagram.setHighlight({ nodeIds: ['Client', 'Service'], links: [inheritance, association] });
  expect(listener).toHaveBeenCalledTimes(1);
  expect(listener.mock.calls[0][0].links).toEqual([association, inheritance]);
  expect(diagram.getHighlight().nodeIds).toEqual(['Service', 'Client']);
});

test('restores exact inline/per-item and default attributes and isolates arrowheads', () => {
  const rect = rects()[0];
  rect.setAttribute('style', 'stroke: purple; stroke-width: 2; fill: pink;');
  const line = lines()[0];
  line.setAttribute('style', 'stroke: orange; stroke-width: 2;');
  const before = svg.innerHTML;
  diagram.setHighlight({ nodeIds: ['Service'], links: [association, incoming] });
  expect(rect.style.strokeWidth).toBe('3');
  expect(line.getAttribute('marker-end')).toBe('url(#standard-arrow)');
  expect(line.style.markerEnd).toMatch(/uml-highlight-/);
  expect(lines()[3].style.markerEnd).toBe('');
  expect(svg.querySelector('#standard-arrow path').getAttribute('fill')).toBe(defaults.nodeForeground);
  const markers = [...svg.querySelectorAll('[data-uml-highlight-marker]')];
  expect(markers).toHaveLength(2);
  expect(markers[0].querySelector('path').style.fill).toBe('#2563eb');
  expect(markers[1].querySelector('path').style.stroke).toBe('#2563eb');
  expect(markers[1].querySelector('path').getAttribute('fill')).toBe('none');
  diagram.clearHighlight();
  expect(svg.innerHTML).toBe(before);
});

test('theme changes remain applied on clearing; highlight fill can be disabled', () => {
  diagram.setHighlight({ nodeIds: ['Service'], links: [association] });
  diagram.setStyle({ nodeForeground: 'white', nodeBackground: 'black',
    highlightNodeOutline: 'var(--accent)', highlightNodeFill: 'var(--tint)',
    highlightLinkColor: 'var(--accent)', highlightStrokeWidth: 4 });
  expect(rects()[0].style.stroke).toBe('var(--accent)');
  expect(rects()[0].style.fill).toBe('var(--tint)');
  expect(lines()[0].style.strokeWidth).toBe('4');
  diagram.setStyle({ highlightNodeFill: null });
  expect(rects()[0].style.fill).toBe('');
  diagram.clearHighlight();
  expect(rects()[0].getAttribute('stroke')).toBe('white');
  expect(rects()[0].getAttribute('fill')).toBe('black');
  expect(lines()[0].getAttribute('stroke')).toBe('white');
});

test('survives redraw/build/update/addition and prunes removals exactly once', () => {
  diagram.setHighlight({ nodeIds: ['Service', 'Client'], links: [association] });
  const listener = jest.fn();
  diagram.on('highlightChanged', listener);
  diagram.recreateDiagram();
  diagram.build();
  diagram.update();
  diagram.addItems({ nodes: [{ id: 'Added', name: 'Added', x: 0, y: 200 }], links: [] });
  expect(rects().map(rect => rect.style.stroke)).toEqual(['#2563eb', '', '#2563eb', '']);
  expect(listener).not.toHaveBeenCalled();
  diagram.removeItems(['pkg.Logger']);
  expect(listener).toHaveBeenLastCalledWith({ nodeIds: ['Service', 'Client'], links: [], reason: 'removal' });
  diagram.removeItems(['Service']);
  expect(listener).toHaveBeenCalledTimes(2);
  expect(diagram.getHighlight()).toEqual({ nodeIds: ['Client'], links: [] });
});

test('incident links are a snapshot; adding does not implicitly highlight anything', () => {
  diagram.setHighlight({ nodeIds: ['Service'], includeIncidentLinks: true });
  const previous = diagram.getHighlight();
  diagram.addItems({ nodes: [{ id: 'Added', name: 'Added', x: 0, y: 200 }],
    links: [{ source: 'Added', target: 'Service', type: 'Inheritance' }] });
  expect(diagram.getHighlight()).toEqual(previous);
  expect(lines().at(-1).style.stroke).toBe('');
});

test('highlighting never mutates model/layout or emits layout events', () => {
  const before = diagram.getData();
  const model = state.nodes.map(node => ({ ...node }));
  const layout = jest.fn();
  diagram.on('layoutChanged', layout);
  diagram.setHighlight({ nodeIds: ['Service'], includeIncidentLinks: true });
  diagram.clearHighlight();
  expect(diagram.getData()).toEqual(before);
  expect(state.nodes.map(node => ({ ...node }))).toEqual(model);
  expect(layout).not.toHaveBeenCalled();
  diagram.setHighlight({ nodeIds: ['Service'] });
  diagram.addItems({ nodes: [], links: [] });
  expect(layout).toHaveBeenLastCalledWith(before);
});

test('exports original styling without highlights and never mutates the live SVG', () => {
  rects()[0].style.stroke = 'purple';
  const normal = diagram.exportSvg();
  diagram.setHighlight({ nodeIds: ['Service'], includeIncidentLinks: true });
  const before = svg.outerHTML;
  const observer = new MutationObserver(() => {});
  observer.observe(svg, { subtree: true, attributes: true, childList: true });
  expect(diagram.exportSvg()).toBe(normal);
  diagram.exportSvg({ nodeBackground: 'white', nodeForeground: 'black', background: 'white' });
  expect(observer.takeRecords()).toEqual([]);
  expect(svg.outerHTML).toBe(before);
  observer.disconnect();
  expect(diagram.getHighlight().nodeIds).toEqual(['Service']);
});

test('can select before build', () => {
  const fresh = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  const other = new Diagram(fresh);
  other.setHighlight({ nodeIds: ['Service'] });
  other.build();
  expect(fresh.querySelector('rect').style.stroke).toBe('#2563eb');
  expect(diagram.getHighlight()).toEqual({ nodeIds: [], links: [] });
});

const click = (target, options = {}) => {
  for (const type of ['pointerdown', 'pointerup', 'click']) {
    target.dispatchEvent(new MouseEvent(type, { bubbles: true, clientX: 50, clientY: 50, ...options }));
  }
};

test.each([undefined, {}, { highlightIncidentLinksOnClick: false }])('node clicks leave incident links unselected with options %p', options => {
  const otherSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  document.body.appendChild(otherSvg);
  const other = new Diagram(otherSvg, options);
  other.build();
  const node = otherSvg.querySelector('.nodes rect');
  click(node);
  expect(other.getHighlight()).toEqual({ nodeIds: ['Service'], links: [] });
  click(otherSvg.querySelector('.links line'), { shiftKey: true });
  click(node, { shiftKey: true });
  expect(other.getHighlight()).toEqual({ nodeIds: [], links: [association] });
  // The instance option does not affect explicit API selection or other instances.
  other.setHighlight({ nodeIds: ['Service'], includeIncidentLinks: true });
  expect(other.getHighlight().links).toHaveLength(4);
  click(rects()[0]);
  expect(diagram.getHighlight().links).toHaveLength(4);
});

test('node clicks include incident links; Shift+click toggles directed link types independently', () => {
  const listener = jest.fn();
  diagram.on('highlightChanged', listener);
  click(rects()[0]);
  expect(diagram.getHighlight()).toEqual({ nodeIds: ['Service'], links: [association, inheritance, incoming, reverse] });
  click(rects()[0]);
  expect(listener).toHaveBeenCalledTimes(1);
  click(lines()[2]);
  expect(diagram.getHighlight()).toEqual({ nodeIds: [], links: [incoming] });
  diagram.setHighlight({ nodeIds: ['Service'] });
  click(rects()[1], { shiftKey: true });
  expect(diagram.getHighlight()).toEqual({ nodeIds: ['Service', 'pkg.Logger'], links: [association, inheritance, reverse] });
  diagram.setHighlight({ nodeIds: ['Service', 'pkg.Logger'] });
  click(lines()[0], { shiftKey: true });
  click(lines()[1], { shiftKey: true });
  click(lines()[3], { shiftKey: true });
  expect(diagram.getHighlight()).toEqual({ nodeIds: ['Service', 'pkg.Logger'], links: [association, inheritance, reverse] });
  click(lines()[0], { shiftKey: true });
  click(rects()[0], { shiftKey: true });
  expect(diagram.getHighlight()).toEqual({ nodeIds: ['pkg.Logger'], links: [inheritance, reverse] });
  click(lines()[2]);
  expect(diagram.getHighlight()).toEqual({ nodeIds: [], links: [incoming] });
  expect(listener).toHaveBeenLastCalledWith({ nodeIds: [], links: [incoming], reason: 'click' });
});

test('deselecting a node removes its incident links but keeps links touching remaining selected nodes', () => {
  click(rects()[0]);
  click(rects()[1], { shiftKey: true });
  click(rects()[0], { shiftKey: true });
  expect(diagram.getHighlight()).toEqual({ nodeIds: ['pkg.Logger'], links: [association, inheritance, reverse] });
  click(rects()[1], { shiftKey: true });
  expect(diagram.getHighlight()).toEqual({ nodeIds: [], links: [] });
});

test('clicks on text select its node; modified background and cancelled gestures preserve selection', () => {
  click(svg.querySelector('.nodes text'));
  const selected = diagram.getHighlight();
  click(svg, { shiftKey: true });
  click(lines()[0], { ctrlKey: true });
  click(lines()[0], { metaKey: true });
  click(lines()[0], { altKey: true });
  click(rects()[1], { button: 2 });
  rects()[1].dispatchEvent(new MouseEvent('pointerdown', { bubbles: true }));
  rects()[1].dispatchEvent(new MouseEvent('pointermove', { bubbles: true, clientX: 20 }));
  rects()[1].dispatchEvent(new MouseEvent('click', { bubbles: true }));
  expect(diagram.getHighlight()).toEqual(selected);
  click(svg);
  expect(diagram.getHighlight()).toEqual({ nodeIds: [], links: [] });
});

test('addItems accepts an options class and highlights only new identities, replacing selection', () => {
  const options = new AddItemsOptions({ highlight: true });
  expect(Diagram.AddItemsOptions).toBe(AddItemsOptions);
  const newLink = { source: 'Added', target: 'Service', type: 'Directed Association' };
  const listener = jest.fn();
  const layout = jest.fn();
  diagram.setHighlight({ nodeIds: ['Client'] });
  diagram.on('highlightChanged', listener);
  diagram.on('layoutChanged', layout);
  diagram.addItems({ nodes: [{ id: 'Added', name: 'Added', x: 0, y: 200 }], links: [association, newLink] }, options);
  expect(diagram.getHighlight()).toEqual({ nodeIds: ['Added'], links: [newLink] });
  expect(listener).toHaveBeenCalledTimes(1);
  expect(listener).toHaveBeenLastCalledWith({ nodeIds: ['Added'], links: [newLink], reason: 'api' });
  expect(layout).toHaveBeenCalledTimes(1);
  expect(layout).toHaveBeenLastCalledWith(diagram.getData());
  expect(diagram.getData().nodes.at(-1)).not.toHaveProperty('highlight');
  expect(options.highlight).toBe(true);
});

test('addItems options default to false and empty highlighted additions preserve the selection', () => {
  diagram.setHighlight({ nodeIds: ['Service'] });
  const listener = jest.fn();
  diagram.on('highlightChanged', listener);
  expect(new AddItemsOptions().highlight).toBe(false);
  for (const options of [undefined, {}, { highlight: false }, new AddItemsOptions(), { highlight: true }]) {
    diagram.addItems({ nodes: [], links: [] }, options);
  }
  diagram.addItems({ nodes: [{ id: 'Added', name: 'Added', x: 0, y: 200 }], links: [] }, { highlight: false });
  expect(diagram.getHighlight()).toEqual({ nodeIds: ['Service'], links: [] });
  expect(listener).not.toHaveBeenCalled();
});

test('addItems can highlight a new link type between existing nodes using plain options', () => {
  const link = { ...association, type: 'Aggregation' };
  diagram.addItems({ nodes: [], links: [link] }, { highlight: true });
  expect(diagram.getHighlight()).toEqual({ nodeIds: [], links: [link] });
});

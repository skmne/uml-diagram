const { test, expect } = require('@playwright/test');
const createServer = require('./server.cjs');
let server, baseURL;
test.beforeAll(async () => {
  server = createServer();
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  baseURL = `http://127.0.0.1:${server.address().port}`;
});
test.afterAll(async () => {
  server.closeAllConnections();
  await new Promise(resolve => server.close(resolve));
});
test.beforeEach(async ({ page }) => {
  await page.goto(`${baseURL}/examples/basic-usage.html`);
  await page.evaluate(async () => { window.diagram = (await import('/examples/basic-usage.js')).diagram; });
  await expect(page.locator('#highlight-classes option').first()).toBeAttached();
  await page.evaluate(() => {
    diagram.removeItems(diagram.getData().nodes.map(node => node.id));
    diagram.addItems({ nodes: [
      { id: 'Mover', name: 'Mover', x: 300, y: 70, width: 120, height: 40 },
      { id: 'Target', name: 'Target', x: 600, y: 180, width: 200, height: 60 },
    ], links: [{ source: 'Mover', target: 'Target', type: 'Directed Association' }] });
    diagram.setHighlight({ nodeIds: ['Mover'], includeIncidentLinks: true });
    window.moves = [];
    window.layouts = [];
    diagram.on('nodeMoved', event => window.moves.push(event));
    diagram.on('layoutChanged', event => window.layouts.push(event));
  });
});

const position = page => page.evaluate(() => diagram.getData().nodes.find(node => node.id === 'Mover'));
async function startDrag(page) {
  const point = await page.locator('.nodes > g').filter({ has: page.locator('text').filter({ hasText: /^Mover$/ }) }).locator('rect').evaluate(rect => {
    const point = new DOMPoint(rect.x.baseVal.value + 10, rect.y.baseVal.value + 10).matrixTransform(rect.getScreenCTM());
    return { x: point.x, y: point.y };
  });
  await page.mouse.move(point.x, point.y);
  await page.mouse.down();
}
async function moveTo(page, x, y) {
  const point = await page.locator('#uml-diagram > g').first().evaluate((root, p) => {
    const point = new DOMPoint(p.x, p.y).matrixTransform(root.getScreenCTM());
    return { x: point.x, y: point.y };
  }, { x: x + 10, y: y + 10 });
  await page.mouse.move(point.x, point.y, { steps: 6 });
}

test('snaps a dragged node, shows guides, exports without them and emits final snapped coordinates', async ({ page }) => {
  await startDrag(page);
  await moveTo(page, 604, 304);
  expect(await position(page)).toMatchObject({ x: 600, y: 304 });
  const guide = page.locator('[data-uml-alignment-guides]');
  await expect(guide).toBeAttached();
  await expect(guide.locator('line')).toHaveAttribute('x1', '600');
  const exported = await page.evaluate(() => diagram.exportSvg());
  expect(exported).not.toContain('data-uml-alignment-guides');
  await expect(guide).toBeAttached();
  expect(await page.evaluate(() => window.layouts.length)).toBe(0);
  await page.mouse.up();
  await expect(guide).toHaveCount(0);
  expect(await page.evaluate(() => window.moves.map(event => event.node.x))).toEqual([600]);
  expect(await page.evaluate(() => window.layouts.length)).toBe(1);
  expect(await page.evaluate(() => diagram.getHighlight().nodeIds)).toEqual(['Mover']);
  expect(await page.evaluate(() => diagram.getData().nodes.find(node => node.id === 'Target').x)).toBe(600);
});

test('aligns centers of unequal nodes and releases the snap outside tolerance or with Alt', async ({ page }) => {
  await startDrag(page);
  await moveTo(page, 644, 320);
  expect(await position(page)).toMatchObject({ x: 640, y: 320 });
  await moveTo(page, 652, 320);
  expect(await position(page)).toMatchObject({ x: 652, y: 320 });
  await expect(page.locator('[data-uml-alignment-guides]')).toHaveCount(0);
  await page.keyboard.down('Alt');
  await moveTo(page, 604, 304);
  expect(await position(page)).toMatchObject({ x: 604, y: 304 });
  await expect(page.locator('[data-uml-alignment-guides]')).toHaveCount(0);
  await page.keyboard.up('Alt');
  await moveTo(page, 603, 304);
  expect(await position(page)).toMatchObject({ x: 600, y: 304 });
  await page.mouse.up();
});

test('uses a six-screen-pixel threshold after zooming', async ({ page }) => {
  await page.evaluate(() => diagram.getZoom().zoomOut());
  await expect(page.locator('#uml-diagram > g').first()).toHaveAttribute('transform', /scale\(0\.5\)/);
  await startDrag(page);
  await moveTo(page, 610, 304); // 10 model units = 5 screen px.
  expect(await position(page)).toMatchObject({ x: 600, y: 304 });
  await page.mouse.up();
  await expect(page.locator('[data-uml-alignment-guides]')).toHaveCount(0);
});

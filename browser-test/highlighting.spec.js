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
  // A small deterministic graph keeps pointer coordinates clear of the floating controls.
  await page.evaluate(() => {
    diagram.removeItems(diagram.getData().nodes.map(node => node.id));
    diagram.addItems({ nodes: [{ id: 'Service', name: 'Service', x: 320, y: 60 },
      { id: 'pkg.Logger', name: 'Logger', x: 700, y: 60 }],
      links: [{ source: 'Service', target: 'pkg.Logger', type: 'Directed Association' }] });
  });
});

const selectService = page => page.evaluate(() => diagram.setHighlight({ nodeIds: ['Service'], includeIncidentLinks: true }));
const selection = page => page.evaluate(() => diagram.getHighlight());

test('basic usage highlights the actual new links and arrowheads from both add controls', async ({ page }) => {
  await page.goto(`${baseURL}/examples/basic-usage.html`);
  await page.evaluate(async () => { window.diagram = (await import('/examples/basic-usage.js')).diagram; });
  await expect(page.locator('#highlight-classes option').first()).toBeAttached();
  for (const control of ['#add', '#addLong']) {
    await page.locator(control).click();
    const highlighted = await selection(page);
    expect(highlighted.links).toHaveLength(1);
    expect(highlighted.links[0].target).toBe(highlighted.nodeIds[0]);
    await expect(page.locator('.links line').last()).toHaveCSS('stroke', 'rgb(37, 99, 235)');
    await expect(page.locator('.links line').last()).toHaveCSS('stroke-width', '3px');
    await expect(page.locator('[data-uml-highlight-marker] path')).toHaveCSS('fill', 'rgb(37, 99, 235)');
  }
});

test('external controls, node/link selection, context menu, drag, pan, zoom, then background clear', async ({ page }) => {
  await page.locator('#add').click();
  expect((await selection(page)).nodeIds).toEqual(['TestClass1']);
  expect((await selection(page)).links).toHaveLength(1);
  await page.locator('#highlight-classes').selectOption('Service');
  expect((await selection(page)).nodeIds).toEqual(['Service']);
  const sidebarSelection = await selection(page);
  const rect = page.locator('.nodes > g').filter({ has: page.locator('text').filter({ hasText: /^Service$/ }) }).locator('rect');
  const box = await rect.boundingBox();
  // Avoid the text so this tests the real d3-drag handlers too.
  await page.mouse.click(box.x + 10, box.y + 10);
  expect(await selection(page)).toEqual(sidebarSelection);
  await page.mouse.click(box.x + 10, box.y + 10, { button: 'right' });
  expect(await selection(page)).toEqual(sidebarSelection);
  const line = await page.locator('.links line').first().evaluate(element => {
    const point = new DOMPoint((element.x1.baseVal.value + element.x2.baseVal.value) / 2,
      (element.y1.baseVal.value + element.y2.baseVal.value) / 2).matrixTransform(element.getScreenCTM());
    return { x: point.x, y: point.y };
  });
  await page.keyboard.down('Shift');
  await page.mouse.click(line.x, line.y);
  await page.keyboard.up('Shift');
  const selected = { nodeIds: ['Service'], links: [{ source: 'Service', target: 'TestClass1', type: 'Directed Association' }] };
  expect(await selection(page)).toEqual(selected);
  await page.mouse.move(box.x + 10, box.y + 10);
  await page.mouse.down();
  await page.mouse.move(box.x + 50, box.y + 40, { steps: 8 });
  await page.mouse.up();
  expect(await selection(page)).toEqual(selected);
  await expect(rect).toHaveCSS('stroke-width', '3px');
  const canvas = await page.locator('#uml-diagram').boundingBox();
  const x = canvas.x + 650, y = canvas.y + 420;
  await page.mouse.move(x, y);
  await page.mouse.down();
  await page.mouse.move(x + 50, y + 25, { steps: 8 });
  await page.mouse.up();
  expect(await selection(page)).toEqual(selected);
  await page.mouse.wheel(0, -120);
  await expect(page.locator('#uml-diagram > g')).toHaveAttribute('transform', /scale\(1\./);
  expect(await selection(page)).toEqual(selected);
  await page.mouse.click(x, y, { delay: 50 });
  expect(await selection(page)).toEqual({ nodeIds: [], links: [] });
  await expect(rect).toHaveCSS('stroke-width', '1px');
});

test('pan returning to its starting point is not a click; next real click clears', async ({ page }) => {
  await selectService(page);
  const box = await page.locator('#uml-diagram').boundingBox();
  const x = box.x + 600, y = box.y + 400;
  await page.mouse.move(x, y);
  await page.mouse.down();
  await page.mouse.move(x + 40, y + 40, { steps: 5 });
  await page.mouse.move(x, y, { steps: 5 });
  await page.mouse.up();
  expect((await selection(page)).nodeIds).toEqual(['Service']);
  await page.mouse.click(x, y, { delay: 50 });
  expect((await selection(page)).nodeIds).toEqual([]);
});

test('computed CSS variables, dark theme, isolated arrows and mutation-free export', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'light' });
  await page.evaluate(() => {
    diagram.addItems({ nodes: [{ id: 'Other', name: 'Other', x: 420, y: 220 }],
      links: [{ source: 'Service', target: 'Other', type: 'Directed Association' }] });
  });
  await page.locator('#highlight-classes').selectOption('pkg.Logger');
  await expect(page.locator('.links line').first()).toHaveCSS('stroke', 'rgb(37, 99, 235)');
  await expect(page.locator('[data-uml-highlight-marker] path')).toHaveCSS('fill', 'rgb(37, 99, 235)');
  await expect(page.locator('.links line').last()).toHaveCSS('stroke', 'rgb(15, 15, 15)');
  await page.emulateMedia({ colorScheme: 'dark' });
  await expect(page.locator('.links line').first()).toHaveCSS('stroke', 'rgb(147, 197, 253)');
  await expect(page.locator('[data-uml-highlight-marker] path')).toHaveCSS('fill', 'rgb(147, 197, 253)');
  const result = await page.evaluate(() => {
    const svg = document.querySelector('#uml-diagram');
    const observer = new MutationObserver(() => {});
    observer.observe(svg, { subtree: true, attributes: true, childList: true });
    const exported = diagram.exportSvg({ nodeForeground: 'black', background: 'white' });
    const mutations = observer.takeRecords().length;
    observer.disconnect();
    return { exported, mutations };
  });
  expect(result.mutations).toBe(0);
  expect(result.exported).not.toContain('uml-highlight-');
  expect(result.exported).not.toContain('var(--highlight-accent)');
  await expect(page.locator('.links line').first()).toHaveCSS('stroke-width', '3px');
  await page.evaluate(() => diagram.clearHighlight());
  await expect(page.locator('.links line').first()).toHaveCSS('stroke', 'rgb(15, 15, 15)');
});

test('Shift toggles a mixed selection; ordinary clicks replace without layout events', async ({ page }) => {
  await page.evaluate(() => {
    window.layoutEvents = 0;
    window.highlightEvents = [];
    diagram.on('layoutChanged', () => window.layoutEvents++);
    diagram.on('highlightChanged', event => window.highlightEvents.push(event));
  });
  const node = name => page.locator('.nodes > g').filter({ has: page.locator('text').filter({ hasText: new RegExp(`^${name}$`) }) }).locator('rect');
  await node('Service').click({ position: { x: 10, y: 10 } });
  await expect(page.locator('.links line')).toHaveCSS('stroke', 'rgb(37, 99, 235)');
  await expect(page.locator('[data-uml-highlight-marker] path')).toHaveCSS('fill', 'rgb(37, 99, 235)');
  await node('Logger').click({ position: { x: 10, y: 10 }, modifiers: ['Shift'] });
  expect((await selection(page)).nodeIds).toEqual(['Service', 'pkg.Logger']);
  const point = await page.locator('.links line').evaluate(element => {
    const p = new DOMPoint((element.x1.baseVal.value + element.x2.baseVal.value) / 2,
      (element.y1.baseVal.value + element.y2.baseVal.value) / 2).matrixTransform(element.getScreenCTM());
    return { x: p.x, y: p.y };
  });
  await page.keyboard.down('Shift');
  await page.mouse.click(point.x, point.y);
  expect((await selection(page)).links).toHaveLength(0);
  await page.mouse.click(point.x, point.y);
  expect((await selection(page)).links).toHaveLength(1);
  await page.keyboard.up('Shift');
  await node('Logger').click({ position: { x: 10, y: 10 }, modifiers: ['Shift'] });
  expect((await selection(page)).nodeIds).toEqual(['Service']);
  await page.mouse.click(point.x, point.y);
  expect((await selection(page)).nodeIds).toEqual([]);
  expect((await selection(page)).links).toHaveLength(1);
  await page.locator('.nodes text').filter({ hasText: /^Service$/ }).click();
  expect(await selection(page)).toEqual({ nodeIds: ['Service'], links: [{ source: 'Service', target: 'pkg.Logger', type: 'Directed Association' }] });
  expect(await page.evaluate(() => window.layoutEvents)).toBe(0);
  expect(await page.evaluate(() => window.highlightEvents.map(event => event.reason))).toEqual(Array(7).fill('click'));
  await expect(page.locator('#highlight-classes option:checked')).toHaveAttribute('value', 'Service');
});

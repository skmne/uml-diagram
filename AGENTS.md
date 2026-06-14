# Codex Notes

Quick project map for future work in this repository.

## Project

`@alesik/uml-diagram` is a small JavaScript library for rendering interactive UML class diagrams with D3 and SVG.

Entry points:

- `src/index.js` exports `Diagram` as default and named export.
- `src/Diagram.js` is the main public class.
- `webpack.config.js` builds `dist/main.js` as a UMD library named `UMLDiagram`.

## Runtime Architecture

Shared state lives in `src/GlobalState.js` as a module-level singleton:

- `state.nodes`: array of `Node` instances.
- `state.links`: array of `Link` instances.
- `state.style`: diagram styling and default node dimensions.
- `state.width` / `state.height`: set from the SVG element by `Diagram`.

Important consequence: `Diagram` instances currently share this singleton state. Be careful with tests and features that assume instance-local data.

## Main Classes

`src/Diagram.js`

- Constructor receives an SVG element, wraps it with `d3-selection`, stores SVG size in `GlobalState`, creates `NodesBuilder`, and creates `Zoom`.
- Public methods currently include:
  - `setData(data)`: appends new `Node` and `Link` instances into global state.
  - `addItems(data)`: calls `setData()` and recreates rendered nodes/links.
  - `removeItems(itemIds)`: removes nodes and connected links from state, then recreates rendering.
  - `build()`: creates the root SVG group, builds nodes, links, drag behavior.
  - `update()`: updates node and link positions in SVG.
  - `setStyle(style)`: mutates `state.style`.
  - `getZoom()`: returns the `Zoom` instance.

`src/Node.js`

- Stores `id`, `name`, `width`, and `height` as private fields with public getters.
- Stores `x` and `y` as public mutable fields.
- If `x` or `y` is missing in constructor input, `setInitPosition()` assigns an auto-position using current `state.nodes` and `state.links`.

`src/Link.js`

- Stores `source`, `target`, and `type` as public fields.
- Resolves private source/target `Node` references from `state.nodes` in the constructor.
- Computes line endpoint vectors dynamically from current node coordinates.

## Rendering Flow

1. User creates `new Diagram(svgElement)`.
2. User calls `setStyle()` and/or `setData()`.
3. User calls `build()`.
4. `NodesBuilder` renders node groups, rectangles, text, and titles from `state.nodes`.
5. `LinksBuilder` renders lines and arrow markers from `state.links`.
6. `drag(this)` attaches D3 drag behavior to rectangles.
7. During drag, `src/drag.js` mutates the bound node data directly:
   - `d.x = event.x`
   - `d.y = event.y`
   - then calls `diagram.update()`.

This means the authoritative current layout is the `Node` instances in `state.nodes`.

## Data Shapes

Input node shape documented in README:

```js
{
  id,
  name,
  namespace,
  width,
  height,
  x,
  y,
  group
}
```

Current `Node` model preserves:

- `id`
- `name`
- `x`
- `y`
- `width`
- `height`

It does not currently preserve `namespace` or `group`.

Input link shape:

```js
{
  source,
  target,
  type
}
```

Current `Link` model preserves all three as public fields.

## Tests

Jest with jsdom is configured in `jest.config.js`.

Commands:

- `npm test`
- `npm run build`
- `npm run build:dev`

Existing tests live under `test/`:

- `Diagram.test.js`
- `Node.test.js`
- `Link.test.js`
- `NodesBuilder.test.js`
- `LinksBuilder.test.js`
- `Vector.test.js`

Tests commonly mock `src/GlobalState.js`, `src/drag.js`, and `src/zoom.js`.

## Style Notes

- Source uses ES modules.
- Indentation in `src/` is tabs in many files.
- Tests mostly use two-space indentation and single quotes.
- Keep public input formats for `setData`, `addItems`, and `removeItems` unchanged.
- Prefer adding getters to `Node`/`Link` instead of reaching into private fields.

## Likely Next Task: Public Diagram Data Export

To add `Diagram#getData()` safely:

- Implement it in `src/Diagram.js`.
- Return a plain object:

```js
{
  nodes: state.nodes.map(...),
  links: state.links.map(...)
}
```

- Return fresh objects and arrays, never `state.nodes`, `state.links`, or model instances.
- Node output should include at least:
  - `id`
  - `name`
  - `x`
  - `y`
  - `width`
  - `height`
- Link output should include:
  - `source`
  - `target`
  - `type`
- Add tests in `test/Diagram.test.js` for:
  - returned nodes and links shape,
  - copies instead of internal references,
  - updated `node.x`/`node.y` reflected after state mutation.
- Update README API Reference with `getData()` and mention that `x`/`y` are current coordinates after drag-and-drop.


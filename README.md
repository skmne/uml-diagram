# UML Diagram Library

A lightweight, interactive JavaScript library for rendering UML class diagrams using D3.js and SVG.

## Features

- 🎨 **Interactive Diagrams** - Zoom, pan, and drag nodes
- 🎯 **Flexible Styling** - Customize colors, fonts, and node sizes
- 📦 **Lightweight** - Minimal dependencies
- 🔧 **Easy Integration** - Works with vanilla JS, modules, or bundlers
- 🎮 **Keyboard Controls** - WASD navigation, spacebar to center

## Installation

```bash
npm install @alesik/uml-diagram
```

Or via CDN (when published):
```html
<script src="https://unpkg.com/@alesik/uml-diagram/dist/main.js"></script>
```

## Quick Start

### HTML + Script Tag

```html
<svg id="uml-diagram" width="800" height="600"></svg>
<script src="./node_modules/@alesik/uml-diagram/dist/main.js"></script>
<script>
  const svgElement = document.querySelector("#uml-diagram");
  const diagram = new UMLDiagram.default(svgElement);
  
  diagram.setStyle({
    nodeForeground: "#333",
    nodeBackground: "#fff",
    fontFamily: "Arial, sans-serif",
    fontSize: "12px",
    nodeWidth: 200,
  });
  
  diagram.build();
</script>
```

### ES Modules

```javascript
import Diagram from '@alesik/uml-diagram';

const svgElement = document.querySelector("#uml-diagram");
const diagram = new Diagram(svgElement);

diagram.setStyle({
  nodeForeground: "#333",
  nodeBackground: "#fff",
  fontFamily: "Arial, sans-serif",
  fontSize: "12px",
  nodeWidth: 200,
});

diagram.build();
```

## API Reference

### Constructor

```javascript
const diagram = new Diagram(svgElement);
```

- `svgElement` - An SVG DOM element where the diagram will be rendered

### Methods

#### `setStyle(style)`

Configure the visual appearance of the diagram.
You can also call this after `build()` to update the rendered SVG before exporting it.

```javascript
diagram.setStyle({
  nodeForeground: "#0f0f0f",      // Node border color
  nodeBackground: "#bfcace",      // Node background color
  fontFamily: "Arial, sans-serif", // Font family
  fontSize: "12px",               // Font size
  fontColor: "#0f0f0f",          // Text color
  nodeWidth: 200,                // Default node width
  nodeHeight: 50,                // Default node height
});
```

#### `build()`

Build and render the diagram. Call this after setting up the diagram.

```javascript
diagram.build();
```

#### `setData(data)`

Set the diagram data (nodes and links).

```javascript
diagram.setData({
  nodes: [
    {
      id: "Class1",
      name: "MyClass",
      namespace: null,
      width: 200,
      height: 100,
    },
  ],
  links: [
    {
      source: "Class1",
      target: "Class2",
      type: "Inheritance",
    },
  ],
});
```

#### `getData()`

Get a snapshot of the current diagram data.

The returned object contains copies of nodes and links, so changing it will not mutate the internal diagram state. Node `x` and `y` values reflect the current coordinates, including positions changed by drag-and-drop.

```javascript
const data = diagram.getData();
console.log(data.nodes.map(node => ({ id: node.id, x: node.x, y: node.y })));
```

Returns:

```typescript
{
  nodes: [
    {
      id: string;
      name: string;
      x: number;
      y: number;
      width: number;
      height: number;
    },
  ];
  links: [
    {
      source: string;
      target: string;
      type: string;
    },
  ];
}
```

#### `exportSvg(style)`

Export the diagram SVG as a string. By default, export fits the SVG `viewBox`, `width`, and `height` to the full diagram content, so nodes outside the current viewport and the current zoom/pan transform do not crop the exported SVG.

Pass optional export-only colors to serialize the diagram differently from the on-screen theme.

The export style is temporary: the rendered diagram is restored after the SVG string is created.

```javascript
const svgString = diagram.exportSvg({
  background: "#ffffff",
  nodeForeground: "#111111",
  nodeBackground: "#ffffff",
  fontColor: "#111111",
  fitContent: true,
  padding: 24,
});
```

This is useful when the diagram is displayed as light elements on a dark background, but exported as dark elements on a light background.

`fitContent` defaults to `true`. Use `padding` to control the margin around the exported content. To export the current SVG viewport instead, pass `fitContent: false`.

Print-friendly export example:

```javascript
const svg = diagram.exportSvg({
  background: "#ffffff",
  nodeForeground: "#111111",
  nodeBackground: "#ffffff",
  fontColor: "#111111",
  padding: 24,
});
```

#### `addItems(data)`

Add new nodes and links to the existing diagram.

```javascript
diagram.addItems({
  nodes: [{ id: "NewClass", name: "NewClass" }],
  links: [{ source: "Class1", target: "NewClass", type: "Association" }],
});
```

#### `on(eventName, listener)`

Subscribe to diagram events. Returns an unsubscribe function.

Supported events:

- `"layoutChanged"` - emitted after a drag-and-drop move ends, and after `addItems()` or `removeItems()` changes the diagram.
- `"nodeMoved"` - emitted after a single node drag-and-drop move ends.
- `"nodeContextMenu"` - emitted after right-clicking a node.

```javascript
const unsubscribe = diagram.on("layoutChanged", (data) => {
  saveLayout(data.nodes.map(node => ({
    id: node.id,
    x: node.x,
    y: node.y
  })));
});

unsubscribe();
```

`layoutChanged` listeners receive the same data shape as `getData()`. The event is emitted after drag ends, not on every drag tick.

```javascript
diagram.on("nodeMoved", ({ node, data }) => {
  console.log(node.id, node.x, node.y);
  console.log(data.nodes);
});

diagram.on("nodeContextMenu", ({ node, data, event }) => {
  console.log(node.id, node);
  console.log(data.nodes);
  console.log(event.clientX, event.clientY);
});
```

#### `removeItems(itemIds)`

Remove nodes and their associated links.

```javascript
diagram.removeItems(["Class1", "Class2"]);
```

#### `getZoom()`

Get the zoom controller for programmatic zoom/pan operations.

```javascript
const zoom = diagram.getZoom();
zoom.zoomIn();
zoom.zoomOut();
zoom.resetZoom();
zoom.panLeft();
zoom.panRight();
zoom.panUp();
zoom.panDown();
zoom.center();
```

## Data Format

### Node

```typescript
{
  id: string;           // Unique identifier (required)
  name: string;         // Display name (required)
  namespace?: string;   // Optional namespace
  width?: number;       // Node width (default: from style)
  height?: number;      // Node height (default: from style)
  x?: number;           // Initial X coordinate (optional - auto-placed if not provided)
  y?: number;           // Initial Y coordinate (optional - auto-placed if not provided)
  group?: number;       // Optional grouping
}
```

**Initial Coordinates**: You can specify `x` and `y` coordinates to control node placement. If not provided, the library uses an improved auto-placement algorithm that minimizes line crossings by organizing nodes in layers based on their connections.

### Link

```typescript
{
  source: string;       // Source node ID (required)
  target: string;      // Target node ID (required)
  type: string;        // Link type: "Inheritance", "Realization", "Association", etc.
}
```

## Examples

See the `examples/` directory for complete working examples:

- `basic-usage.html` - Basic setup and usage

![more examples](image.png)

## Development

```bash
# Install dependencies
npm install

# Build for development
npm run build:dev

# Build for production
npm run build

# Watch mode
npm run watch
```

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Dependencies

- **d3** (^7.0.0) - For SVG manipulation and interactions
- **lodash** (^4.17.21) - Utility functions

## License

MIT License - see [LICENSE](LICENSE) file for details.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Changelog

### 0.1.0
- Initial release
- Basic UML diagram rendering
- Interactive zoom and pan
- Node drag and drop
- Customizable styling

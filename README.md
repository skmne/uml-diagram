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
npm install @skmne/uml-diagram
```

Or via CDN (when published):
```html
<script src="https://unpkg.com/@skmne/uml-diagram/dist/main.js"></script>
```

## Quick Start

### HTML + Script Tag

```html
<svg id="uml-diagram" width="800" height="600"></svg>
<script src="./node_modules/@skmne/uml-diagram/dist/main.js"></script>
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
import Diagram from '@skmne/uml-diagram';

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

#### `addItems(data)`

Add new nodes and links to the existing diagram.

```javascript
diagram.addItems({
  nodes: [{ id: "NewClass", name: "NewClass" }],
  links: [{ source: "Class1", target: "NewClass", type: "Association" }],
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
- More examples coming soon...

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

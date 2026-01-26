# Examples

This directory contains example usage of the UML Diagram library.

## Files

- **`basic-usage.html`** - Main example page with Java project structure
- **`basic-usage.js`** - JavaScript code that initializes and uses the diagram
- **`data-structures.js`** - **Main data file** containing project structures (recommended)
- **`java-project-data.js`** - Legacy ES module format (for backward compatibility)
- **`java-project-data.json`** - JSON format (fallback option)

## Using Custom Data Structures

### Option 1: Modify `data-structures.js` (Recommended)

Edit `examples/data-structures.js` to add your own project structure:

```javascript
export const myCustomStructure = {
	name: "My Project",
	description: "Description of my project",
	
	nodes: [
		{
			id: "MyClass",
			name: "MyClass",
			namespace: "com.example.mypackage",
			width: 220,
			height: 80,
			layer: "custom", // optional
		},
		// ... more nodes
	],
	
	links: [
		{
			source: "MyClass",
			target: "AnotherClass",
			type: "Inheritance", // or "Realization", "Directed Association"
		},
		// ... more links
	],
};
```

Then update `basic-usage.js` to use your structure:

```javascript
const module = await import("./data-structures.js");
const structure = module.myCustomStructure;
```

### Option 2: Use JSON File

Create a JSON file with your structure:

```json
{
	"nodes": [...],
	"links": [...]
}
```

And load it in `basic-usage.js`:

```javascript
const response = await fetch("./my-structure.json");
const data = await response.json();
```

## Link Types

Supported link types:
- **`Inheritance`** - Class extends another class (solid line with triangle)
- **`Realization`** - Class implements interface (dashed line with triangle)
- **`Directed Association`** - Class uses another class (solid line with arrow)

## Node Properties

- **`id`** (required) - Unique identifier
- **`name`** (required) - Display name of the class
- **`namespace`** (optional) - Package/namespace path
- **`width`** (optional) - Node width in pixels
- **`height`** (optional) - Node height in pixels
- **`layer`** (optional) - For grouping/organization (not used in rendering yet)

## Running Examples

1. Make sure the library is built:
   ```bash
   npm run build
   ```

2. Open `basic-usage.html` in a browser or use a local server:
   ```bash
   # Python
   python -m http.server 8000
   
   # Node.js
   npx http-server -p 8000
   ```

3. Navigate to `http://localhost:8000/examples/basic-usage.html`

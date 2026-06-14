// Example: Basic usage of UML Diagram library
// This demonstrates how to initialize and use the diagram library

var header = document.getElementById("header").getBoundingClientRect();
var svgContainer = document.getElementById("container").getBoundingClientRect();
var width = svgContainer.width;
var height = svgContainer.height - header.height;
const svgElement = document.querySelector("#uml-diagram");

setSvgSize(svgElement, width, height);
window.addEventListener(
	"resize",
	(event) => {
		header = document.getElementById("header").getBoundingClientRect();
		svgContainer = document.getElementById("container").getBoundingClientRect();
		width = svgContainer.width;
		height = svgContainer.height - header.height;
		setSvgSize(svgElement, width, height);
	},
	true
);

function setSvgSize(svgElement, width, height) {
	if (svgElement) {
		svgElement.setAttribute("width", width);
		svgElement.setAttribute("height", height);
	}
}

// Initialize the diagram
// When using from npm: import Diagram from '@alesik/uml-diagram';
// For this example, we use the UMD build:
const Diagram = UMLDiagram;
const diagram = new Diagram(svgElement);
const lastEventElement = document.getElementById("last-event");
const stateOutputElement = document.getElementById("state-output");

// Configure styling
diagram.setStyle({
	nodeForeground: "var(--vscode-editor-foreground)",
	nodeBackground: "var(--vscode-editor-background)",
	fontFamily: "var(--vscode-font-family)",
	fontSize: "12px",
	fontColor: "var(--vscode-editor-foreground)",
	nodeWidth: 200,
});

// Load project data from separate data structure file
async function loadProjectData() {
	try {
		// Try to load from new structured file first
		const module = await import("./data-structures.js");
		// Use the default Java Spring Boot structure
		const structure = module.javaSpringBootStructure || module.javaProjectData;
		// Return only nodes and links (remove metadata)
		return {
			nodes: structure.nodes || [],
			links: structure.links || [],
		};
	} catch (error) {
		return { nodes: [], links: [] };
	}
}

// Initialize diagram with Java project data
async function initializeDiagram() {
	const projectData = await loadProjectData();
	diagram.setData(projectData);
	diagram.build();
	renderDiagramState("initial data", diagram.getData());
}

// Initialize and display Java project structure on page load
initializeDiagram();

diagram.on("layoutChanged", (data) => {
	renderDiagramState("layoutChanged", data);
	console.log("layoutChanged", data);
});

diagram.on("nodeMoved", ({ node, data }) => {
	renderDiagramState(`nodeMoved: ${node.id}`, data);
	console.log("nodeMoved", node, data);
});

diagram.on("nodeContextMenu", ({ node, data, event }) => {
	renderDiagramState(`nodeContextMenu: ${node.id}`, data);
	console.log("nodeContextMenu", node, data, {
		x: event.clientX,
		y: event.clientY,
	});
});

function renderDiagramState(eventName, data) {
	lastEventElement.textContent = eventName;
	stateOutputElement.textContent = JSON.stringify(
		{
			nodes: data.nodes.map((node) => ({
				id: node.id,
				x: node.x,
				y: node.y,
				width: node.width,
				height: node.height,
			})),
			links: data.links,
		},
		null,
		2
	);
}

// Example: Add items to the diagram (for testing)
document.getElementById("add").addEventListener("click", () => {
	const newData = {
		nodes: [
			{
				namespace: "com.example.test",
				name: "TestClass",
				id: "TestClass",
				width: 220,
				height: 80,
			},
		],
		links: [],
	};
	diagram.addItems(newData);
});

document.getElementById("addLong").addEventListener("click", () => {
	const newData = {
		nodes: [
			{
				namespace: "com.example.longnames",
				name: "VeryLongClassNameThatShouldBeTruncatedForDisplayAndSelectableInTheDiagram",
				id: "VeryLongClassNameThatShouldBeTruncatedForDisplayAndSelectableInTheDiagram",
				width: 260,
				height: 80,
			},
		],
		links: [],
	};
	diagram.addItems(newData);
});

// Example: Remove items from the diagram
document.getElementById("remove").addEventListener("click", () => {
	// Remove last added test class if exists
	diagram.removeItems([
		"TestClass",
		"VeryLongClassNameThatShouldBeTruncatedForDisplayAndSelectableInTheDiagram",
	]);
});

// Zoom controls
document.getElementById("zoomIn").addEventListener("click", () => {
	diagram.getZoom().zoomIn();
});

document.getElementById("zoomOut").addEventListener("click", () => {
	diagram.getZoom().zoomOut();
});

document.getElementById("resetZoom").addEventListener("click", () => {
	diagram.getZoom().resetZoom();
});

// Keyboard navigation (WASD + Space)
document.addEventListener("keydown", function (event) {
	switch (event.keyCode) {
		case 65: // 'A' - Pan left
			diagram.getZoom().panLeft();
			break;
		case 83: // 'S' - Pan down
			diagram.getZoom().panDown();
			break;
		case 68: // 'D' - Pan right
			diagram.getZoom().panRight();
			break;
		case 87: // 'W' - Pan up
			diagram.getZoom().panUp();
			break;
		case 32: // Spacebar - Center
			diagram.getZoom().center();
			break;
	}
});

// Export functionality
document.getElementById("export").addEventListener("click", () => {
	const svgString = diagram.exportSvg(getExportStyle());
	const blob = new Blob([svgString], { type: "image/svg+xml;charset=utf-8" });
	const link = document.createElement("a");
	link.href = URL.createObjectURL(blob);
	link.download = "uml-diagram.svg";
	link.click();
});

function getExportStyle() {
	return {
		background: document.getElementById("exportBackground").value,
		nodeForeground: document.getElementById("exportForeground").value,
		nodeBackground: document.getElementById("exportNodeBackground").value,
		fontColor: document.getElementById("exportFontColor").value,
	};
}

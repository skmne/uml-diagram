import { select } from "d3-selection";
import NodesBuilder from "./NodesBuilder.js";
import LinksBuilder from "./LinksBuilder.js";
import drag from "./drag.js";
import Zoom from "./zoom.js";

import state from "./GlobalState.js";
import Link from "./Link.js";
import Node from "./Node.js";

class Diagram {
	#nodesBuilder;
	#linksBuilder;
	#svg;
	#width; //default value
	#height;
	#zoom;
	#svgElement;
	#listeners = {
		layoutChanged: new Set(),
		nodeMoved: new Set(),
	};
	constructor(svgElement) {
		this.#svgElement = svgElement;
		this.#svg = select(svgElement);
		this.#width = svgElement.getAttribute("width");
		this.#height = svgElement.getAttribute("height");
		state.width = this.#width;
		state.height = this.#height;
		this.#nodesBuilder = new NodesBuilder(this.#width);
		this.#zoom = new Zoom(this.#svg, this.#width, this.#height);
	}
	addItems(newData) {
		this.setData(newData);
		this.recreateDiagram();
		this.#emitLayoutChanged();
	}

	removeItems(itemIds) {
		state.nodes = state.nodes.filter((node) => !itemIds.includes(node.id));
		state.links = state.links.filter((link) => {
			return !(itemIds.includes(link.source) || itemIds.includes(link.target));
		});
		this.recreateDiagram();
		this.#emitLayoutChanged();
	}

	recreateDiagram() {
		this.#nodesBuilder.createNodes();
		this.#linksBuilder.createLinks();
		this.#nodesBuilder.setDragRectangle(drag(this));
	}

	setData(data) {
		for (const node of data.nodes) {
			state.nodes.push(new Node(node));
		}
		for (const link of data.links) {
			state.links.push(new Link(link));
		}
	}

	getData() {
		return {
			nodes: state.nodes.map((node) => this.#createNodeData(node)),
			links: state.links.map((link) => ({
				source: link.source,
				target: link.target,
				type: link.type,
			})),
		};
	}

	on(eventName, listener) {
		const listeners = this.#listeners[eventName];
		if (!listeners) {
			throw new Error(`Unsupported diagram event: ${eventName}`);
		}
		if (typeof listener !== "function") {
			throw new TypeError("Diagram event listener must be a function");
		}

		listeners.add(listener);
		return () => {
			listeners.delete(listener);
		};
	}

	notifyNodeMoved(node) {
		this.#emit("nodeMoved", () => ({
			node: this.#createNodeData(node),
			data: this.getData(),
		}));
		this.#emitLayoutChanged();
	}

	setStyle(style) {
		state.style.nodeForeground = style.nodeForeground
			? this.#converCSSVarToValue(style.nodeForeground)
			: state.style.nodeForeground;
		state.style.nodeBackground = style.nodeBackground
			? this.#converCSSVarToValue(style.nodeBackground)
			: state.style.nodeBackground;
		state.style.fontFamily = style.fontFamily
			? this.#converCSSVarToValue(style.fontFamily)
			: state.style.fontFamily;
		state.style.fontSize = style.fontSize ? this.#converCSSVarToValue(style.fontSize) : state.style.fontSize;
		state.style.fontColor = style.fontColor
			? this.#converCSSVarToValue(style.fontColor)
			: state.style.fontColor;
		state.style.nodeWidth = style.nodeWidth ? style.nodeWidth : state.style.nodeWidth;
		state.style.nodeHeight = style.nodeHeight ? style.nodeHeight : state.style.nodeHeight;
		this.#updateRenderedStyle();

		// state.style.nodeBackground = getComputedStyle(document.documentElement, null).getPropertyValue(
		// 	state.style.nodeBackground
		// );
	}

	#converCSSVarToValue(source) {
		const cssVars = source.match(/var\(\D+?\)/gim);
		if (cssVars) {
			cssVars.forEach((item) => {
				let cssValue = getComputedStyle(document.documentElement).getPropertyValue(
					item.substring(4, item.length - 1)
				);
				source = source.replace(item, cssValue);
			});
		}
		return source;
	}

	build() {
		const rootGroupContainer = this.#createGroupContainer(this.#svg);
		this.#nodesBuilder.build(rootGroupContainer);
		this.#nodesBuilder.setDragRectangle(drag(this));
		this.#linksBuilder = new LinksBuilder();
		this.#linksBuilder.build(rootGroupContainer);

		// this.#generateSimulation(state.nodes);
	}

	update() {
		this.#nodesBuilder.update();
		this.#linksBuilder.update();
	}

	getZoom() {
		return this.#zoom;
	}

	exportSvg(style = {}) {
		style = style || {};
		const originalStyle = this.#getStyleSnapshot();
		const exportBackground = style.background || style.svgBackground;
		const hasExportStyle = Object.keys(style).length > 0;
		if (hasExportStyle) {
			this.setStyle(style);
		}
		const backgroundRect = exportBackground ? this.#createExportBackground(exportBackground) : null;

		try {
			return new XMLSerializer().serializeToString(this.#svgElement);
		} finally {
			if (backgroundRect) {
				backgroundRect.remove();
			}
			if (hasExportStyle) {
				this.setStyle(originalStyle);
			}
		}
	}

	#emitLayoutChanged() {
		this.#emit("layoutChanged", () => this.getData());
	}

	#emit(eventName, createPayload) {
		this.#listeners[eventName].forEach((listener) => {
			listener(createPayload());
		});
	}

	#createNodeData(node) {
		return {
			id: node.id,
			name: node.name,
			x: node.x,
			y: node.y,
			width: node.width,
			height: node.height,
		};
	}

	#createGroupContainer(svg) {
		return svg.append("g");
	}

	#getRectangleRadius() {
		return Math.sqrt(Math.pow(state.style.nodeWidth, 2) + Math.pow(state.style.nodeHeight, 2));
	}

	#getStyleSnapshot() {
		return { ...state.style };
	}

	#createExportBackground(background) {
		return this.#svg
			.insert("rect", ":first-child")
			.attr("data-uml-export-background", "true")
			.attr("x", 0)
			.attr("y", 0)
			.attr("width", this.#width)
			.attr("height", this.#height)
			.attr("fill", this.#converCSSVarToValue(background));
	}

	#updateRenderedStyle() {
		this.#nodesBuilder.updateStyle();
		if (this.#linksBuilder) {
			this.#linksBuilder.updateStyle();
		}
	}
}
function ticked(diagram) {
	return () => {
		diagram.update();
	};
}

export default Diagram;

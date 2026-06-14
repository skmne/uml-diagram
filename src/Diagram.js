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
	#rootGroup;
	#listeners = {
		layoutChanged: new Set(),
		nodeMoved: new Set(),
		nodeContextMenu: new Set(),
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
		this.#nodesBuilder.setNodeContextMenu((event, node) => this.notifyNodeContextMenu(event, node));
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

	notifyNodeContextMenu(event, node) {
		if (this.#listeners.nodeContextMenu.size === 0) {
			return;
		}
		event.preventDefault();
		this.#emit("nodeContextMenu", () => ({
			node: this.#createNodeData(node),
			data: this.getData(),
			event,
		}));
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
		this.#rootGroup = rootGroupContainer;
		this.#nodesBuilder.build(rootGroupContainer);
		this.#nodesBuilder.setNodeContextMenu((event, node) => this.notifyNodeContextMenu(event, node));
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
		const originalSvgAttributes = this.#getSvgAttributesSnapshot();
		const rootGroup = this.#getRootGroup();
		const originalRootTransform = rootGroup ? rootGroup.attr("transform") : null;
		const exportBackground = style.background || style.svgBackground;
		const hasExportStyle = Object.keys(style).length > 0;
		const fitContent = style.fitContent !== false;
		if (hasExportStyle) {
			this.setStyle(style);
		}
		let backgroundRect = null;

		try {
			const exportArea = fitContent
				? this.#fitSvgToContent(rootGroup, this.#getExportPadding(style))
				: this.#getCurrentViewportArea();
			backgroundRect = exportBackground ? this.#createExportBackground(exportBackground, exportArea) : null;
			return new XMLSerializer().serializeToString(this.#svgElement);
		} finally {
			if (backgroundRect) {
				backgroundRect.remove();
			}
			if (rootGroup) {
				rootGroup.attr("transform", originalRootTransform);
			}
			this.#restoreSvgAttributes(originalSvgAttributes);
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

	#getSvgAttributesSnapshot() {
		return {
			width: this.#svg.attr("width"),
			height: this.#svg.attr("height"),
			viewBox: this.#svg.attr("viewBox"),
		};
	}

	#restoreSvgAttributes(attributes) {
		Object.entries(attributes).forEach(([name, value]) => {
			this.#svg.attr(name, value);
		});
	}

	#getRootGroup() {
		if (this.#rootGroup) {
			return this.#rootGroup;
		}

		const rootGroup = this.#svg.select("g");
		return rootGroup.empty() ? null : rootGroup;
	}

	#getExportPadding(style) {
		if (style.padding === undefined || style.padding === null) {
			return 24;
		}

		const padding = Number(style.padding);
		return Number.isFinite(padding) ? Math.max(0, padding) : 24;
	}

	#fitSvgToContent(rootGroup, padding) {
		if (!rootGroup) {
			return this.#getCurrentViewportArea();
		}

		rootGroup.attr("transform", null);
		const rootNode = rootGroup.node();
		if (!rootNode || typeof rootNode.getBBox !== "function") {
			return this.#getCurrentViewportArea();
		}

		let box;
		try {
			box = rootNode.getBBox();
		} catch {
			return this.#getCurrentViewportArea();
		}
		if (![box.x, box.y, box.width, box.height].every(Number.isFinite)) {
			return this.#getCurrentViewportArea();
		}

		const exportArea = {
			x: box.x - padding,
			y: box.y - padding,
			width: box.width + padding * 2,
			height: box.height + padding * 2,
		};
		this.#svg
			.attr("width", exportArea.width)
			.attr("height", exportArea.height)
			.attr("viewBox", `${exportArea.x} ${exportArea.y} ${exportArea.width} ${exportArea.height}`);

		return exportArea;
	}

	#getCurrentViewportArea() {
		const viewBox = this.#svg.attr("viewBox");
		if (viewBox) {
			const values = viewBox.split(/\s+/).map(Number);
			if (values.length === 4 && values.every(Number.isFinite)) {
				return {
					x: values[0],
					y: values[1],
					width: values[2],
					height: values[3],
				};
			}
		}

		return {
			x: 0,
			y: 0,
			width: Number(this.#svg.attr("width") || this.#width),
			height: Number(this.#svg.attr("height") || this.#height),
		};
	}

	#createExportBackground(background, exportArea) {
		return this.#svg
			.insert("rect", ":first-child")
			.attr("data-uml-export-background", "true")
			.attr("x", exportArea.x)
			.attr("y", exportArea.y)
			.attr("width", exportArea.width)
			.attr("height", exportArea.height)
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

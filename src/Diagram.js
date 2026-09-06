import { select } from "d3-selection";
import NodesBuilder from "./NodesBuilder.js";
import LinksBuilder from "./LinksBuilder.js";
import drag from "./drag.js";
import Zoom from "./zoom.js";

import state from "./GlobalState.js";
import Link from "./Link.js";
import Node from "./Node.js";
import Highlight, { highlightDefaults, linkKey } from "./Highlight.js";
import AddItemsOptions from "./AddItemsOptions.js";

class Diagram {
	static AddItemsOptions = AddItemsOptions;
	#nodesBuilder;
	#linksBuilder;
	#svg;
	#width; //default value
	#height;
	#zoom;
	#svgElement;
	#rootGroup;
	#highlight;
	#listeners = {
		highlightChanged: new Set(),
		layoutChanged: new Set(),
		nodeMoved: new Set(),
		nodeContextMenu: new Set(),
	};
	constructor(svgElement, options = {}) {
		this.#svgElement = svgElement;
		this.#svg = select(svgElement);
		this.#width = svgElement.getAttribute("width");
		this.#height = svgElement.getAttribute("height");
		state.width = this.#width;
		state.height = this.#height;
		this.#nodesBuilder = new NodesBuilder(this.#width);
		this.#zoom = new Zoom(this.#svg, this.#width, this.#height);
		this.#highlight = new Highlight(svgElement, (reason) => {
			this.#emit("highlightChanged", () => ({ ...this.getHighlight(), reason }));
		}, options?.highlightIncidentLinksOnClick === true);
	}

	setHighlight(selection = {}) {
		this.#highlight.set(selection);
	}

	clearHighlight() {
		this.#highlight.set({});
	}

	getHighlight() {
		return this.#highlight.get();
	}
	addItems(newData, options = {}) {
		let addedHighlight;
		if (options?.highlight === true) {
			const knownNodes = new Set(state.nodes.map((node) => node.id));
			const knownLinks = new Set(state.links.map(linkKey));
			addedHighlight = {
				nodeIds: newData.nodes.filter((node) => !knownNodes.has(node.id)).map((node) => node.id),
				links: newData.links.filter((link) => !knownLinks.has(linkKey(link))),
			};
		}
		this.setData(newData);
		this.recreateDiagram();
		if (addedHighlight && (addedHighlight.nodeIds.length || addedHighlight.links.length)) {
			this.setHighlight(addedHighlight);
		}
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
		this.#highlight.restore();
		this.#nodesBuilder.createNodes();
		this.#nodesBuilder.setNodeContextMenu((event, node) => this.notifyNodeContextMenu(event, node));
		this.#linksBuilder.createLinks();
		this.#nodesBuilder.setDragRectangle(drag(this));
		this.#highlight.set(this.getHighlight(), "removal");
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
		this.#highlight.restore();
		for (const key of Object.keys(highlightDefaults)) {
			if (Object.prototype.hasOwnProperty.call(style, key)) state.style[key] = style[key];
		}
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
		this.#highlight.render();

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
		this.#highlight.restore();
		if (this.#rootGroup) this.#rootGroup.remove();
		const rootGroupContainer = this.#createGroupContainer(this.#svg);
		this.#rootGroup = rootGroupContainer;
		this.#nodesBuilder.build(rootGroupContainer);
		this.#nodesBuilder.setNodeContextMenu((event, node) => this.notifyNodeContextMenu(event, node));
		this.#nodesBuilder.setDragRectangle(drag(this));
		this.#linksBuilder = new LinksBuilder();
		this.#linksBuilder.build(rootGroupContainer);
		this.#highlight.set(this.getHighlight(), "removal");

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
		const clone = this.#svgElement.cloneNode(true);
		this.#highlight.stripFromClone(clone);
		const svg = select(clone);
		const rootGroup = this.#getRootGroup();
		let area = this.#getCurrentViewportArea();
		if (style.fitContent !== false && rootGroup) {
			svg.select("g").attr("transform", null);
			try {
				// getBBox uses local coordinates, irrespective of the group's pan/zoom transform.
				const box = rootGroup.node().getBBox();
				if ([box.x, box.y, box.width, box.height].every(Number.isFinite)) {
					const padding = this.#getExportPadding(style);
					area = { x: box.x - padding, y: box.y - padding,
						width: box.width + padding * 2, height: box.height + padding * 2 };
					svg.attr("width", area.width).attr("height", area.height)
						.attr("viewBox", `${area.x} ${area.y} ${area.width} ${area.height}`);
				}
			} catch {
				// Detached or non-browser SVG implementations may not support getBBox.
			}
		}
		const overrides = [
			["g.nodes > g > rect", "stroke", "nodeForeground"],
			["g.nodes > g > rect", "fill", "nodeBackground"],
			["g.links > line", "stroke", "nodeForeground"],
			["marker#standard-arrow path", "fill", "nodeForeground"],
			["marker#inheritance-arrow path", "stroke", "nodeForeground"],
			["g.nodes text", "fill", "fontColor"],
			["g.nodes text", "font-family", "fontFamily"],
			["g.nodes text", "font-size", "fontSize"],
		];
		for (const [selector, attribute, key] of overrides) {
			if (style[key]) svg.selectAll(selector).attr(attribute, this.#converCSSVarToValue(style[key]));
		}
		const background = style.background || style.svgBackground;
		if (background) {
			const rect = svg.insert("rect", ":first-child").attr("data-uml-export-background", "true")
				.attr("fill", this.#converCSSVarToValue(background));
			Object.entries(area).forEach(([key, value]) => rect.attr(key, value));
		}
		return new XMLSerializer().serializeToString(clone);
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

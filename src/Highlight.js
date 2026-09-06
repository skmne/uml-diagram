import state from "./GlobalState.js";

export const linkKey = ({ source, target, type }) => JSON.stringify([source, target, type]);
const copyLink = ({ source, target, type }) => ({ source, target, type });
export const highlightDefaults = {
	highlightNodeOutline: "#2563eb",
	highlightNodeFill: null,
	highlightLinkColor: "#2563eb",
	highlightStrokeWidth: 3,
};
let nextMarkerId = 0;

// Presentation overrides only: model objects and their original SVG attributes stay intact.
export default class Highlight {
	#svg;
	#changed;
	#nodeIds = new Set();
	#links = new Map();
	#originals = new Map();
	#markers = [];
	#highlightIncidentLinksOnClick;

	constructor(svg, changed, highlightIncidentLinksOnClick = false) {
		this.#svg = svg;
		this.#changed = changed;
		this.#highlightIncidentLinksOnClick = highlightIncidentLinksOnClick;
		let gesture = null;
		const background = (target) => target === svg;
		const itemAt = (target) => {
			const item = target.closest?.("g.nodes > g, g.links > line");
			return item && svg.contains(item) && item.__data__ ? item : null;
		};
		svg.addEventListener("pointerdown", (event) => {
			if (event.isPrimary === false && gesture) gesture.cancelled = true;
			else gesture = { id: event.pointerId, x: event.clientX, y: event.clientY,
				item: itemAt(event.target),
				cancelled: event.button !== 0 || (!background(event.target) && !itemAt(event.target)) };
		}, true);
		svg.addEventListener("pointerleave", () => { if (gesture) gesture.cancelled = true; });
		svg.addEventListener("wheel", () => { if (gesture) gesture.cancelled = true; }, { passive: true });
		svg.addEventListener("pointermove", (event) => {
			if (gesture && (event.clientX !== gesture.x || event.clientY !== gesture.y)) {
				gesture.cancelled = true;
			}
		}, true);
		svg.addEventListener("pointerup", (event) => {
			if (gesture && (event.pointerId !== gesture.id || event.clientX !== gesture.x || event.clientY !== gesture.y)) {
				gesture.cancelled = true;
			}
		}, true);
		svg.addEventListener("pointercancel", () => { gesture = null; }, true);
		svg.addEventListener("click", (event) => {
			const completed = gesture;
			gesture = null;
			if (!completed || completed.cancelled || event.defaultPrevented || event.button ||
				event.ctrlKey || event.metaKey || event.altKey) return;
			const item = itemAt(event.target);
			if (item && item === completed.item) {
				this.#selectItem(item, event.shiftKey);
			} else if (!completed.item && background(event.target) && !event.shiftKey) {
				this.set({}, "background");
			}
		});
	}

	#selectItem(element, toggle) {
		const selection = toggle ? this.get() : { nodeIds: [], links: [] };
		const data = element.__data__;
		if (element.matches("g.links > line")) {
			const key = linkKey(data);
			if (toggle && this.#links.has(key)) selection.links = selection.links.filter((link) => linkKey(link) !== key);
			else selection.links.push(copyLink(data));
		} else {
			const incident = (link) => link.source === data.id || link.target === data.id;
			if (toggle && this.#nodeIds.has(data.id)) {
				selection.nodeIds = selection.nodeIds.filter((id) => id !== data.id);
				if (this.#highlightIncidentLinksOnClick) {
					const remainingNodes = new Set(selection.nodeIds);
					selection.links = selection.links.filter((link) => !incident(link) ||
						remainingNodes.has(link.source) || remainingNodes.has(link.target));
				}
			} else {
				selection.nodeIds.push(data.id);
				if (this.#highlightIncidentLinksOnClick) selection.links.push(...state.links.filter(incident).map(copyLink));
			}
		}
		this.set(selection, "click");
	}

	get() {
		return { nodeIds: [...this.#nodeIds], links: [...this.#links.values()].map(copyLink) };
	}

	set(input = {}, reason = "api") {
		const requestedNodes = new Set(input?.nodeIds || []);
		const nodeIds = new Set(state.nodes.filter((node) => requestedNodes.has(node.id)).map((node) => node.id));
		const requestedLinks = new Set((input?.links || []).filter(Boolean).map(linkKey));
		const links = new Map(state.links.filter((link) => requestedLinks.has(linkKey(link)) ||
			(input?.includeIncidentLinks && (nodeIds.has(link.source) || nodeIds.has(link.target))))
			.map((link) => [linkKey(link), copyLink(link)]));
		const changed = nodeIds.size !== this.#nodeIds.size || links.size !== this.#links.size ||
			[...nodeIds].some((id) => !this.#nodeIds.has(id)) || [...links.keys()].some((key) => !this.#links.has(key));
		this.#nodeIds = nodeIds;
		this.#links = links;
		this.render();
		if (changed) this.#changed(reason);
	}

	restore() {
		for (const [element, style] of this.#originals) {
			if (style === null) element.removeAttribute("style");
			else element.setAttribute("style", style);
		}
		this.#originals.clear();
		this.#markers.forEach((marker) => marker.remove());
		this.#markers = [];
	}

	// Copy original inline styles into the corresponding clone elements, without touching the screen.
	stripFromClone(clone) {
		const originals = this.#svg.querySelectorAll("*");
		const copies = clone.querySelectorAll("*");
		originals.forEach((element, index) => {
			if (!this.#originals.has(element)) return;
			const style = this.#originals.get(element);
			if (style === null) copies[index].removeAttribute("style");
			else copies[index].setAttribute("style", style);
		});
		clone.querySelectorAll("[data-uml-highlight-marker]").forEach((marker) => marker.remove());
	}

	render() {
		this.restore();
		const style = { ...highlightDefaults, ...state.style };
		const override = (element, properties) => {
			this.#originals.set(element, element.getAttribute("style"));
			Object.entries(properties).forEach(([name, value]) => element.style.setProperty(name, value, "important"));
		};
		this.#svg.querySelectorAll("g.nodes > g > rect").forEach((rect) => {
			if (!this.#nodeIds.has(rect.__data__?.id)) return;
			const properties = { stroke: style.highlightNodeOutline, "stroke-width": style.highlightStrokeWidth };
			if (style.highlightNodeFill != null) properties.fill = style.highlightNodeFill;
			override(rect, properties);
		});
		const markers = new Map();
		this.#svg.querySelectorAll("g.links > line").forEach((line) => {
			if (!line.__data__ || !this.#links.has(linkKey(line.__data__))) return;
			const properties = { stroke: style.highlightLinkColor, "stroke-width": style.highlightStrokeWidth };
			const reference = line.style.getPropertyValue("marker-end") || line.getAttribute("marker-end");
			const id = reference?.match(/#([^\s)"']+)/)?.[1];
			const original = [...this.#svg.querySelectorAll("marker")].find((marker) => marker.id === id);
			if (original) {
				if (!markers.has(id)) {
					const marker = original.cloneNode(true);
					marker.id = `uml-highlight-${++nextMarkerId}`;
					marker.setAttribute("data-uml-highlight-marker", "true");
					// Keep the existing arrow geometry when the highlighted line becomes thicker.
					marker.setAttribute("markerUnits", "userSpaceOnUse");
					marker.querySelectorAll("path").forEach((path) => {
						const hollow = path.getAttribute("fill") === "none";
						path.style.setProperty(hollow ? "stroke" : "fill", style.highlightLinkColor, "important");
					});
					original.parentNode.appendChild(marker);
					this.#markers.push(marker);
					markers.set(id, marker.id);
				}
				properties["marker-end"] = `url(#${markers.get(id)})`;
			}
			override(line, properties);
		});
	}
}

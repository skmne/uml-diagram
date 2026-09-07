import { select } from "d3-selection";
import state from "./GlobalState.js";

// Input coordinates are the unsnapped pointer position, never the previous snapped position.
export function snapPosition(node, position, nodes, threshold) {
	const peers = nodes.filter((peer) => peer !== node && peer.id !== node.id);
	const result = { ...position, guides: [] };
	for (const [axis, size, crossAxis, crossSize] of [["x", "width", "y", "height"], ["y", "height", "x", "width"]]) {
		let best = null;
		for (const peer of peers) {
			for (const ownAnchor of [0, 0.5, 1]) {
				for (const peerAnchor of [0, 0.5, 1]) {
					const coordinate = peer[axis] + peer[size] * peerAnchor;
					const delta = coordinate - (position[axis] + node[size] * ownAnchor);
					const distance = Math.abs(delta);
					const sameAnchor = ownAnchor === peerAnchor;
					if (distance <= threshold[axis] && (!best || distance < best.distance ||
						(distance === best.distance && sameAnchor && !best.sameAnchor))) {
						best = { delta, distance, sameAnchor, coordinate, peer };
					}
				}
			}
		}
		if (best) {
			result[axis] += best.delta;
			result.guides.push({ axis, coordinate: best.coordinate,
				start: Math.min(position[crossAxis], best.peer[crossAxis]),
				end: Math.max(position[crossAxis] + node[crossSize], best.peer[crossAxis] + best.peer[crossSize]) });
		}
	}
	// Extend through the final snapped rectangle when both axes snapped at once.
	for (const guide of result.guides) {
		const axis = guide.axis === "x" ? "y" : "x";
		const size = guide.axis === "x" ? "height" : "width";
		guide.start = Math.min(guide.start, result[axis]);
		guide.end = Math.max(guide.end, result[axis] + node[size]);
	}
	return result;
}

export default class Alignment {
	#svg;
	#root;
	#guides;
	#enabled;
	#threshold;

	constructor(svg, options = {}) {
		this.#svg = svg;
		this.#enabled = options?.snapToNodes !== false;
		const threshold = options?.snapThreshold;
		this.#threshold = Number.isFinite(threshold) && threshold >= 0 ? threshold : 6;
	}

	setRoot(root) {
		this.clear();
		this.#root = root;
	}

	move(node, x, y, bypass = false) {
		this.clear();
		if (!this.#enabled || bypass || !this.#root) return { x, y };
		const matrix = this.#root.node().getScreenCTM?.();
		const scaleX = matrix ? Math.hypot(matrix.a, matrix.b) : 1;
		const scaleY = matrix ? Math.hypot(matrix.c, matrix.d) : 1;
		if (!scaleX || !scaleY) return { x, y };
		const result = snapPosition(node, { x, y }, state.nodes,
			{ x: this.#threshold / scaleX, y: this.#threshold / scaleY });
		if (result.guides.length) {
			// A sibling of the diagram root: guides never affect its export bounding box.
			this.#guides = select(this.#svg).append("g")
				.attr("data-uml-alignment-guides", "true")
				.attr("transform", this.#root.attr("transform"))
				.attr("pointer-events", "none").attr("aria-hidden", "true");
			this.#guides.selectAll("line").data(result.guides).join("line")
				.attr("x1", (guide) => guide.axis === "x" ? guide.coordinate : guide.start)
				.attr("x2", (guide) => guide.axis === "x" ? guide.coordinate : guide.end)
				.attr("y1", (guide) => guide.axis === "y" ? guide.coordinate : guide.start)
				.attr("y2", (guide) => guide.axis === "y" ? guide.coordinate : guide.end)
				.attr("stroke", state.style.alignmentGuideColor || "#e11d8d")
				.attr("stroke-width", 1).attr("stroke-dasharray", "4 3")
				.attr("vector-effect", "non-scaling-stroke");
		}
		return { x: result.x, y: result.y };
	}

	clear() {
		this.#guides?.remove();
		this.#guides = null;
	}
}

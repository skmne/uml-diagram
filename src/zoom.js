import { zoom as d3Zoom } from "d3-zoom";

export default class Zoom {
	#width;
	#height;
	#zoom;
	#svg;
	constructor(svg, width, height) {
		this.#svg = svg;
		this.#width = width;
		this.#height = height;
		this.#zoom = d3Zoom()
			.scaleExtent([0.25, 10])
			.filter((event) => {
				if (event.target?.closest?.("text")) {
					return false;
				}
				return (!event.ctrlKey || event.type === "wheel") && !event.button;
			})
			.on("zoom", (e) => {
				this.#svg.select("g").attr("transform", e.transform);
			})
			.on("start", () => {
				this.#svg.style("cursor", "move");
			})
			.on("end", () => {
				this.#svg.style("cursor", "pointer");
			});
		this.#svg.call(this.#zoom);
	}

	zoomIn() {
		this.#svg.transition().call(this.#zoom.scaleBy, 2);
	}
	zoomOut() {
		this.#svg.transition().call(this.#zoom.scaleBy, 0.5);
	}

	resetZoom() {
		this.#svg.transition().call(this.#zoom.scaleTo, 1);
	}

	center() {
		this.#svg.transition().call(this.#zoom.translateTo, 0.5 * this.#width, 0.5 * this.#height);
	}

	panLeft() {
		this.#svg.transition().duration(50).call(this.#zoom.translateBy, -10, 0);
	}

	panRight() {
		this.#svg.transition().duration(50).call(this.#zoom.translateBy, 10, 0);
	}

	panUp() {
		this.#svg.transition().duration(50).call(this.#zoom.translateBy, 0, -10);
	}

	panDown() {
		this.#svg.transition().duration(50).call(this.#zoom.translateBy, 0, 10);
	}
}

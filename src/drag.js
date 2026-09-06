import { drag as d3Drag } from "d3-drag";
import { select } from "d3-selection";

export default function drag(diagram) {
	const moved = new WeakSet();
	function dragged(event, d) {
		const mouseX = event.x;
		const mouseY = event.y;
		if (mouseX !== d.x || mouseY !== d.y) moved.add(this);

		// const offsetX = mouseX - d.x;
		// const offsetY = mouseY - d.y;

		select(this.parentNode)
			.raise()
			.attr("x", (d.x = mouseX))
			.attr("y", (d.y = mouseY));

		diagram.update();
	}

	function dragended(event, d) {
		if (moved.delete(this)) diagram.notifyNodeMoved(d);
	}

	return d3Drag().on("drag", dragged).on("end", dragended);
}

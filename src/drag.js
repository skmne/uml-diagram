import { drag as d3Drag } from "d3-drag";
import { select } from "d3-selection";

export default function drag(diagram, alignment) {
	const moved = new WeakSet();
	function dragged(event, d) {
		const position = alignment ? alignment.move(d, event.x, event.y, event.sourceEvent?.altKey) : event;
		const mouseX = position.x;
		const mouseY = position.y;
		if (mouseX !== d.x || mouseY !== d.y) moved.add(this);

		select(this.parentNode)
			.raise()
			.attr("x", (d.x = mouseX))
			.attr("y", (d.y = mouseY));

		diagram.update();
	}

	function dragended(event, d) {
		alignment?.clear();
		if (moved.delete(this)) diagram.notifyNodeMoved(d);
	}

	return d3Drag().on("drag", dragged).on("end", dragended);
}

import { drag as d3Drag } from "d3-drag";
import { select } from "d3-selection";

export default function drag(diagram) {
	function dragstarted(event) {
		select(this).attr("stroke", "var(--vscode-editorLink-activeForeground)");
	}

	function dragged(event, d) {
		const mouseX = event.x;
		const mouseY = event.y;

		// const offsetX = mouseX - d.x;
		// const offsetY = mouseY - d.y;

		select(this.parentNode)
			.raise()
			.attr("x", (d.x = mouseX))
			.attr("y", (d.y = mouseY));

		diagram.update();
	}

	function dragended(event, d) {
		select(this).attr("stroke", "var(--vscode-editor-foreground)");
		diagram.notifyNodeMoved(d);
	}

	return d3Drag().on("start", dragstarted).on("drag", dragged).on("end", dragended);
}

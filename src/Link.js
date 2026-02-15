import Vector from "./Vector.js";
import state from "./GlobalState.js";

export default class Link {
	#sourceNode;
	#targetNode;
	#arrowSize = 10;

	constructor(link) {
		this.source = link.source;
		this.target = link.target;
		this.type = link.type;

		this.#sourceNode = this.#getNodeByKey(link.source);
		this.#targetNode = this.#getNodeByKey(link.target);
	}

	getSourceVector() {
		return new Vector(this.#sourceX(), this.#sourceY());
	}

	getTargetVector() {
		const sourceVector = this.getSourceVector();
		const currentVector = new Vector(
			this.#targetX() - sourceVector.getX(),
			this.#targetY() - sourceVector.getY()
		);
		const normalizedVector = currentVector.normalized();
		normalizedVector.multipleVectorByScalar(currentVector.getLength() - this.#arrowSize);

		const targetVector = new Vector(
			sourceVector.getX() + normalizedVector.getX(),
			sourceVector.getY() + normalizedVector.getY()
		);

		return targetVector;
	}

	#sourceX() {
		const sourceCenterX = this.#sourceNode.x + this.#sourceNode.width / 2;
		const sourceCenterY = this.#sourceNode.y + this.#sourceNode.height / 2;
		const targetCenterX = this.#targetNode.x + this.#targetNode.width / 2;
		const targetCenterY = this.#targetNode.y + this.#targetNode.height / 2;

		const dx = targetCenterX - sourceCenterX;
		const dy = targetCenterY - sourceCenterY;

		// Determine which side of the source rectangle to use
		if (Math.abs(dx) > Math.abs(dy)) {
			// Horizontal connection is dominant
			if (dx > 0) {
				// Target is to the right - use right side center
				return this.#sourceNode.x + this.#sourceNode.width;
			} else {
				// Target is to the left - use left side center
				return this.#sourceNode.x;
			}
		} else {
			// Vertical connection is dominant - use horizontal center
			return sourceCenterX;
		}
	}

	#targetX() {
		const sourceCenterX = this.#sourceNode.x + this.#sourceNode.width / 2;
		const sourceCenterY = this.#sourceNode.y + this.#sourceNode.height / 2;
		const targetCenterX = this.#targetNode.x + this.#targetNode.width / 2;
		const targetCenterY = this.#targetNode.y + this.#targetNode.height / 2;

		const dx = targetCenterX - sourceCenterX;
		const dy = targetCenterY - sourceCenterY;

		// Determine which side of the target rectangle to use
		if (Math.abs(dx) > Math.abs(dy)) {
			// Horizontal connection is dominant
			if (dx > 0) {
				// Source is to the left - use left side center
				return this.#targetNode.x;
			} else {
				// Source is to the right - use right side center
				return this.#targetNode.x + this.#targetNode.width;
			}
		} else {
			// Vertical connection is dominant - use horizontal center
			return targetCenterX;
		}
	}

	#sourceY() {
		const sourceCenterX = this.#sourceNode.x + this.#sourceNode.width / 2;
		const sourceCenterY = this.#sourceNode.y + this.#sourceNode.height / 2;
		const targetCenterX = this.#targetNode.x + this.#targetNode.width / 2;
		const targetCenterY = this.#targetNode.y + this.#targetNode.height / 2;

		const dx = targetCenterX - sourceCenterX;
		const dy = targetCenterY - sourceCenterY;

		// Determine which side of the source rectangle to use
		if (Math.abs(dy) > Math.abs(dx)) {
			// Vertical connection is dominant
			if (dy > 0) {
				// Target is below - use bottom side center
				return this.#sourceNode.y + this.#sourceNode.height;
			} else {
				// Target is above - use top side center
				return this.#sourceNode.y;
			}
		} else {
			// Horizontal connection is dominant - use vertical center
			return sourceCenterY;
		}
	}

	#targetY() {
		const sourceCenterX = this.#sourceNode.x + this.#sourceNode.width / 2;
		const sourceCenterY = this.#sourceNode.y + this.#sourceNode.height / 2;
		const targetCenterX = this.#targetNode.x + this.#targetNode.width / 2;
		const targetCenterY = this.#targetNode.y + this.#targetNode.height / 2;

		const dx = targetCenterX - sourceCenterX;
		const dy = targetCenterY - sourceCenterY;

		// Determine which side of the target rectangle to use
		if (Math.abs(dy) > Math.abs(dx)) {
			// Vertical connection is dominant
			if (dy > 0) {
				// Source is above - use top side center
				return this.#targetNode.y;
			} else {
				// Source is below - use bottom side center
				return this.#targetNode.y + this.#targetNode.height;
			}
		} else {
			// Horizontal connection is dominant - use vertical center
			return targetCenterY;
		}
	}

	#getNodeByKey(nodeKey) {
		const currentNode = state.nodes.find((item) => item.id === nodeKey);
		return currentNode;
	}
}

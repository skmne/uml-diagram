/** Optional UI behavior for Diagram.addItems. Plain objects are also accepted. */
export default class AddItemsOptions {
	constructor({ highlight = false } = {}) {
		this.highlight = highlight;
	}
}

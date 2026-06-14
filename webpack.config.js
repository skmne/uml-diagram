import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default {
	entry: "./src/index.js",
	output: {
		filename: "main.js",
		path: path.resolve(__dirname, "dist"),
		library: {
			name: "UMLDiagram",
			type: "umd",
			export: "default",
		},
		globalObject: "this",
		clean: true,
	},
	mode: "production",
	devtool: false,
	externals: {
		// Mark d3 as external if you want users to provide their own version
		// Uncomment if you want to bundle d3:
		// d3: "d3",
	},
};

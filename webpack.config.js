var path = require('path');

module.exports = {
	entry: "./client.js",
	output: {
		path: path.join(__dirname, 'static'),
		filename: "bundle.js"
	},
	module: {
		loaders: [
			{ test: /\.js$/, loader: "babel" },
			{ test: /\.json$/, loader: "json" }
		]
	}
};

exports.onCreateWebpackConfig = ({ stage, loaders, actions }) => {
	if (stage === 'build-html') {
		actions.setWebpackConfig({
			module: {
				rules: [
					{
						test: /react-append-to-body/,
						use: loaders.null(),
					},
					{
						test: /firebase/,
						use: loaders.null(),
					}
				],
			},
		});
	}
};
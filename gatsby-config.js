require('dotenv').config({
	path: `.env`,
});

const config = require('./config');

module.exports = {
	siteMetadata: {
		siteName: 'Using TypeScript Example',
		exampleUrl:
			'https://github.com/gatsbyjs/gatsby/tree/master/examples/using-typescript',
	},
	plugins: [
		// 'gatsby-plugin-typescript' is automatically included in gatsby
		// You only need to explicitly define it here if you need to configure
		// specific options in it
		'gatsby-plugin-sass',
		{
			resolve: 'gatsby-source-portfolio',
			options: config,
		},
	],
};

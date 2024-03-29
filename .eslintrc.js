module.exports = {
	parser: `@typescript-eslint/parser`,
	extends: [
		'plugin:@typescript-eslint/recommended',
		'prettier/@typescript-eslint',
		'plugin:react/recommended',
	],
	plugins: ['@typescript-eslint', 'react-hooks'],
	parserOptions: {
		ecmaVersion: 2018, // Allows for the parsing of modern ECMAScript features
		sourceType: 'module', // Allows for the use of imports
	},
	env: {
		browser: true,
		node: true,
	},
	rules: {
		'ban-ts-ignore': 0,
		'@typescript-eslint/ban-ts-ignore': 0,
		'@typescript-eslint/interface-name-prefix': 0,
		'react/prop-types': [0],
		'@typescript-eslint/no-empty-interface': 0,
		'@typescript-eslint/camelcase': 0,
		'@typescript-eslint/no-var-requires': 0,
		'@typescript-eslint/explicit-function-return-type': 0,
		'react-hooks/exhaustive-deps': [
			'error',
			{
				additionalHooks: '(useKeyboardClickCallback|useTrackHandler)',
			},
		],
	},
	settings: {
		react: {
			version: 'detect',
		},
	},
};

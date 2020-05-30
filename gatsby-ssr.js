import wrapWithProvider from './wrap-with-provider';
import React from 'react';

const favicon = require('./src/images/favicon.ico');

export const wrapRootElement = wrapWithProvider;

export const onRenderBody = ({ setHeadComponents }) => {
	setHeadComponents([
		<title key='title'>Dollar Jockey</title>,
		<link key='favicon' rel='shortcut icon' href={favicon} type='image/png' />,
		<script
			src="https://kit.fontawesome.com/0bccacb939.js"
			crossOrigin="anonymous"
			key='script'
		></script>
	]);
};
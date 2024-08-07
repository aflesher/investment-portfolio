import wrapWithProvider from './wrap-with-provider';
import React from 'react';

export const wrapRootElement = wrapWithProvider;

export const onRenderBody = ({ setHeadComponents }) => {
	setHeadComponents([
		<title key='title'>Investments</title>,
		<script
			src='https://kit.fontawesome.com/0bccacb939.js'
			crossOrigin='anonymous'
			key='script'
		></script>,
	]);
};

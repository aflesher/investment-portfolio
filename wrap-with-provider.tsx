import React from 'react';
import { Provider } from 'react-redux';

import createStore, { SET_USER_ACTION } from './src/store/store';
const config = require('./config');

// eslint-disable-next-line react/display-name,react/prop-types
export default ({ element }): JSX.Element => {
	// Instantiating store in `wrapRootElement` handler ensures:
	//  - there is fresh store for each SSR page
	//  - it will be called only once in browser, when React mounts
	const store = createStore();

	import('firebase').then(firebase => {
		firebase.initializeApp({
			apiKey: config.firebase.apiKey,
			authDomain: config.firebase.authDomain,
			projectId: config.firebase.projectId
		});
		
		firebase.auth().onAuthStateChanged(user => store.dispatch({type: SET_USER_ACTION, payload: user}));
	});
	return <Provider store={store}>{element}</Provider>;
};
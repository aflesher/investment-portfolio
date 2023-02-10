import React from 'react';
import { Provider } from 'react-redux';

import createStore, {
	SET_USER_ACTION,
	SET_FIREBASE,
	SET_GOAL_STATUSES,
} from './src/store/store';
const config = require('./config');

// eslint-disable-next-line react/display-name,react/prop-types
export default ({ element }): JSX.Element => {
	// Instantiating store in `wrapRootElement` handler ensures:
	//  - there is fresh store for each SSR page
	//  - it will be called only once in browser, when React mounts
	const store = createStore();

	import('firebase/compat/app').then((firebase) => {
		console.log('firebase loaded');
		if (!firebase || !firebase.default.initializeApp) {
			return;
		}

		firebase.default.initializeApp({
			apiKey: config.firebase.apiKey,
			authDomain: config.firebase.authDomain,
			projectId: config.firebase.projectId,
			storageBucket: 'gs://dollar-jockey-5d690.appspot.com',
		});

		Promise.all([
			import('firebase/compat/auth'),
			import('firebase/compat/firestore'),
			import('firebase/compat/storage'),
		]).then(async () => {
			firebase.default.auth().onAuthStateChanged((user) => {
				store.dispatch({ type: SET_USER_ACTION, payload: user });
				store.dispatch({ type: SET_FIREBASE, payload: firebase.default });
			});

			const db = firebase.default.firestore();
			const docs = await (await db.collection('goalStatus').get()).docs;
			const goalStatuses = docs.map((d) => ({ ...d.data() }));
			store.dispatch({ type: SET_GOAL_STATUSES, payload: goalStatuses });
		});
	});
	return <Provider store={store}>{element}</Provider>;
};

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

	import('firebase/app').then((firebase) => {
		if (!firebase || !firebase.initializeApp) {
			return;
		}

		firebase.initializeApp({
			apiKey: config.firebase.apiKey,
			authDomain: config.firebase.authDomain,
			projectId: config.firebase.projectId,
		});

		import('firebase/auth').then(async () => {
			firebase.auth().onAuthStateChanged((user) => {
				store.dispatch({ type: SET_USER_ACTION, payload: user });
				store.dispatch({ type: SET_FIREBASE, payload: firebase });
			});

			const db = firebase.firestore();
			const docs = await (await db.collection('goalStatus').get()).docs;
			const goalStatuses = docs.map((d) => ({ ...d.data() }));
			store.dispatch({ type: SET_GOAL_STATUSES, payload: goalStatuses });
		});
	});
	return <Provider store={store}>{element}</Provider>;
};

import React, { PropsWithChildren, useContext, useState } from 'react';

import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
import 'firebase/compat/firestore';
import 'firebase/compat/storage';
import { createContext } from 'react';

const config = require('../../config.js');

firebase.initializeApp({
	apiKey: config.firebase.apiKey,
	authDomain: config.firebase.authDomain,
	projectId: config.firebase.projectId,
	storageBucket: 'gs://dollar-jockey-5d690.appspot.com',
});

const firestore = firebase.firestore();
const storage = firebase.storage();

const FirebaseContext = createContext<{
	user: firebase.User | null;
	firestore: firebase.firestore.Firestore;
	storage: firebase.storage.Storage;
}>({ user: null, firestore, storage });

export default function UserProvider({ children }: PropsWithChildren) {
	const [user, setUser] = useState<null | firebase.User>(null);
	firebase.auth().onAuthStateChanged((u) => {
		setUser(u);
	});

	return (
		<FirebaseContext.Provider value={{ user, firestore, storage }}>
			{children}
		</FirebaseContext.Provider>
	);
}

export const useFirebase = () => {
	return useContext(FirebaseContext);
};

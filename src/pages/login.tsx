import React, { useEffect } from 'react';
import firebase from 'firebase/compat/app';
import * as firebaseui from 'firebaseui';
import Layout from '../components/layout';
import { useFirebase } from '../providers/firebaseProvider';

export default function Login() {
	const { user } = useFirebase();

	useEffect(() => {
		if (firebase) {
			const uiConfig = {
				// Popup signin flow rather than redirect flow.
				signInFlow: 'popup',
				// We will display Google and Facebook as auth providers.
				signInOptions: [firebase.auth.GoogleAuthProvider.PROVIDER_ID],
				callbacks: {
					// Avoid redirects after sign-in.
					signInSuccessWithAuthResult: () => false,
				},
			};

			if (!user) {
				const ui = new firebaseui.auth.AuthUI(firebase.auth());
				ui.start('#firebaseui-auth-container', uiConfig);
			}
		}
	}, [firebase, user]);

	return (
		<Layout>
			{!!user ? (
				<div>Already signed in</div>
			) : (
				<div id='firebaseui-auth-container'></div>
			)}
		</Layout>
	);
}

import React, { useEffect } from 'react';
import firebase from 'firebase/compat/app';
import { connect } from 'react-redux';
import * as firebaseui from 'firebaseui';
import { IStoreState } from '../store/store';
import Layout from '../components/layout';

interface ISignInStateProps {
	user: firebase.User | null | undefined;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	firebase: any;
}

const mapStateToProps = ({
	user,
	firebase,
}: IStoreState): ISignInStateProps => ({
	user,
	firebase,
});

const SignIn: React.FC<ISignInStateProps> = ({ user, firebase }) => {
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
};

export default connect(mapStateToProps, null)(SignIn);

import { createStore as reduxCreateStore, Store } from 'redux';
import { Currency } from '../utils/enum';
import firebase from 'firebase/compat/app';
import { FirebaseStorage, getStorage } from 'firebase/storage';

export const SET_CURRENCY_ACTION = 'SET_CURRENCY_ACTION';
export const SET_USER_ACTION = 'SET_USER_ACTION';
export const SET_SHOW_SIDEBAR = 'SET_SHOW_SIDEBAR';
export const SET_FIREBASE = 'SET_FIREBASE';
export const SET_GOAL_STATUS = 'SET_GOAL_STATUS';
export const SET_GOAL_STATUSES = 'SET_GOAL_STATUSES';

export interface IStoreAction {
	type: string;
	payload:
		| Currency
		| firebase.User
		| null
		| boolean
		| IGoalStatus
		| IGoalStatus[]
		| firebase.app.App;
}

export interface IGoalStatus {
	text: string;
	achieved: boolean;
}

export interface IStoreState {
	currency: Currency;
	user: firebase.User | null | undefined;
	showSidebar: boolean;
	firebase: firebase.app.App | undefined;
	firestore: firebase.firestore.Firestore | undefined;
	storage: firebase.storage.Storage | undefined;
	goalStatuses: IGoalStatus[];
}

const initialState: IStoreState = {
	currency: Currency.cad,
	user: undefined,
	showSidebar: true,
	firebase: undefined,
	firestore: undefined,
	storage: undefined,
	goalStatuses: [],
};

const reducer = (
	state: IStoreState | undefined,
	action: IStoreAction
): IStoreState => {
	if (!state) {
		return initialState;
	}

	switch (action.type) {
		case SET_CURRENCY_ACTION:
			const currency = action.payload as Currency;
			return { ...state, currency };
		case SET_USER_ACTION:
			const user = action.payload as firebase.User | null;
			return { ...state, user };
		case SET_SHOW_SIDEBAR:
			const showSidebar = action.payload as boolean;
			return { ...state, showSidebar };
		case SET_FIREBASE:
			const firebase = action.payload as firebase.app.App;
			const firestore = firebase.firestore();
			const storage = firebase.storage();

			return { ...state, firebase, firestore, storage };
		case SET_GOAL_STATUS:
			const status = action.payload as IGoalStatus;
			const goalStatuses = [
				...state.goalStatuses.filter((q) => q.text !== status.text),
				status,
			];
			return { ...state, goalStatuses };
		case SET_GOAL_STATUSES:
			const statuses = action.payload as IGoalStatus[];
			return { ...state, goalStatuses: statuses };
	}
	return state;
};

const createStore = (): Store => reduxCreateStore(reducer, initialState);

export default createStore;

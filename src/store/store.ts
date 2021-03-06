import { createStore as reduxCreateStore, Store } from 'redux';
import { Currency } from '../utils/enum';
import * as firebase from 'firebase/app';

export const SET_CURRENCY_ACTION = 'SET_CURRENCY_ACTION';
export const SET_USER_ACTION = 'SET_USER_ACTION';
export const SET_SHOW_SIDEBAR = 'SET_SHOW_SIDEBAR';
export const SET_FIREBASE = 'SET_FIREBASE';

export interface IStoreAction {
	type: string,
	payload: Currency | firebase.User | null | boolean
}

export interface IStoreState {
	currency: Currency,
	user: firebase.User | null | undefined,
	showSidebar: boolean,
	firebase: firebase.app.App | undefined
}

const initialState: IStoreState = {
	currency: Currency.cad,
	user: undefined,
	showSidebar: true,
	firebase: undefined
};

const reducer = (state: IStoreState | undefined, action: IStoreAction): IStoreState => {
	if (!state) {
		return initialState;
	}

	switch (action.type) {
	case SET_CURRENCY_ACTION:
		const currency = action.payload as Currency;
		return { ...state, currency };
	case SET_USER_ACTION:
		const user = action.payload as firebase.User | null;
		return {...state, user};
	case SET_SHOW_SIDEBAR:
		const showSidebar = action.payload as boolean;
		return {...state, showSidebar};
	case SET_FIREBASE:
		const firebase = action.payload as any;
		return {...state, firebase};
	}
	return state;
};

const createStore = (): Store => reduxCreateStore(reducer, initialState);

export default createStore;
// @ts-ignore
import { createStore as reduxCreateStore, Store } from 'redux';
import { Currency } from '../utils/enum';
// @ts-ignore
import * as firebase from 'firebase';

export const SET_CURRENCY_ACTION = 'SET_CURRENCY_ACTION';
export const SET_USER_ACTION = 'SET_USER_ACTION';
export const SET_SHOW_SIDEBAR = 'SET_SHOW_SIDEBAR';

export interface IStoreAction {
	type: string,
	payload: Currency | firebase.User | null | boolean
}

export interface IStoreState {
	currency: Currency,
	user: firebase.User | null | undefined,
	showSidebar: boolean
}

const initialState: IStoreState = {
	currency: Currency.cad,
	user: undefined,
	showSidebar: true
};

const reducer = (state: IStoreState, action: IStoreAction): IStoreState => {
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
	}
	return state;
};

const createStore = (): Store => reduxCreateStore(reducer, initialState);

export default createStore;
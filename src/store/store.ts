import { createStore as reduxCreateStore } from 'redux';
import { Currency } from '../utils/enum';

export const SET_CURRENCY_ACTION = 'SET_CURRENCY_ACTION';
export const SET_AUTHENICATED_ACTION = 'SET_AUTHENICATED_ACTION';
export const SET_SHOW_SIDEBAR = 'SET_SHOW_SIDEBAR';

export interface IStoreAction {
	type: string,
	payload: Currency | boolean
}

export interface IStoreState {
	currency: Currency,
	authenticated: boolean,
	showSidebar: boolean
}

const initialState: IStoreState = {
	currency: Currency.cad,
	authenticated: false,
	showSidebar: true
};

const reducer = (state: IStoreState, action: IStoreAction): IStoreState => {
	switch (action.type) {
	case SET_CURRENCY_ACTION:
		const currency = action.payload as Currency;
		return { ...state, currency };
	case SET_AUTHENICATED_ACTION:
		const authenticated = action.payload as boolean;
		return {...state, authenticated};
	case SET_SHOW_SIDEBAR:
		const showSidebar = action.payload as boolean;
		return {...state, showSidebar};
	}
	return state;
};

const createStore = (): void => reduxCreateStore(reducer, initialState);

export default createStore;
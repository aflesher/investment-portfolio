/* eslint @typescript-eslint/no-use-before-define: off */
//https://login.questrade.com/oauth2/token?grant_type=refresh_token&refresh_token=
import _ from 'lodash';
import axios, { AxiosResponse } from 'axios';
import Cryptr from 'cryptr';
import moment from 'moment';

import * as util from '../util';
import * as firebase from '../firebase';
import { Currency } from '../../../../src/utils/enum';
import { IAccount } from '../../../../declarations/account';

const loginUrl = 'https://login.questrade.com/oauth2/token';
const accountsRoute = 'v1/accounts';

let apiUrl = '';
let accessToken = '';
let cryptr: Cryptr;

let endTime: Date | null = null;

const initDeferredPromise = util.deferredPromise();

// use this to replace refresh token
const overrideLoginToken = ''; // 'Xe43mfqe5YDXwLuAliYDv2WF84juOMl60';

export interface IQuestradeOrder {
	id: number;
	symbol: string;
	symbolId: number;
	orderType: QuestradeOrderType;
	accountId: number;
	totalQuantity: number;
	openQuantity: number;
	filledQuantity: number;
	limitPrice: number;
	stopPrice: number;
	avgExecPrice: number;
	side: QuestradeOrderSide;
}

export const getAccounts = (): IAccount[] => [
	{
		accountId: '26418215',
		name: 'questrade-margin',
		type: 'margin',
		isTaxable: true,
		displayName: 'Questrade Margin',
		balances: [],
	},
	{
		accountId: '51443858',
		name: 'questrade-tfsa',
		type: 'tfsa',
		isTaxable: false,
		displayName: 'Questrade TFSA',
		balances: [],
	},
	{
		accountId: '51637118',
		name: 'questrade-rrsp',
		type: 'rrsp',
		isTaxable: false,
		displayName: 'Questrade RRSP',
		balances: [],
	},
];

const getLoginInfo = async (): Promise<void> => {
	const auth = await firebase.getQuestradeAuth();

	if (new Date().getTime() > auth.expiryTime || overrideLoginToken) {
		const refreshToken = overrideLoginToken || cryptr.decrypt(auth.refreshToken);
		await login(refreshToken);
	} else {
		apiUrl = auth.apiUrl;
		accessToken = cryptr.decrypt(auth.accessToken);
	}
};

export const init = async (cryptSecret: string): Promise<void> => {
	cryptr = new Cryptr(cryptSecret);
	await getLoginInfo();
	await getAccounts();
	initDeferredPromise.resolve();
};

const updateLoginInfo = async (
	refreshToken: string,
	expiry: number
): Promise<void> => {
	const eRefreshToken = cryptr.encrypt(refreshToken);
	const eAccessToken = cryptr.encrypt(accessToken);
	const expiryTime = new Date().getTime() + expiry * 1000;

	await firebase.setQuestradeAuth(
		eRefreshToken,
		eAccessToken,
		expiryTime,
		apiUrl
	);
};

const login = async (refreshToken: string): Promise<void> => {
	const resp = await axios
		.get(loginUrl, {
			params: {
				grant_type: 'refresh_token',
				refresh_token: refreshToken,
			},
		})
		.catch(console.log);

	if (!resp) {
		return;
	}

	apiUrl = resp.data.api_server;
	accessToken = resp.data.access_token;

	await updateLoginInfo(resp.data.refresh_token, resp.data.expires_in);
};

const authRequest = async (
	route: string,
	params?: object
): Promise<AxiosResponse | void> => {
	return await axios
		.get(`${apiUrl}${route}`, {
			headers: {
				Authorization: `Bearer ${accessToken}`,
			},
			params,
		})
		.catch(console.log);
};

export interface IQuestradePosition {
	symbol: string;
	symbolId: number;
	openQuantity: number;
	closedQuantity: number;
	currentMarketValue: number;
	currentPrice: number;
	averageEntryPrice: number;
	closedPnl: number;
	openPnl: number;
	totalCost: number;
	isRealTime: boolean;
	isUnderReorg: boolean;
}

export interface IQuestradeActivity {
	tradeDate: Date;
	transactionDate: Date;
	settlementDate: Date;
	action: string;
	symbol: string;
	symbolId: number;
	description: string;
	currency: 'USD' | 'CAD';
	quantity: number;
	price: number;
	grossAmount: number;
	commission: number;
	netAmount: number;
	type: string;
	accountId: number;
}

export const getActivities = async (): Promise<{
	activities: IQuestradeActivity[];
	complete: boolean;
}> => {
	await initDeferredPromise.promise;

	// here's the problem
	if (!endTime) {
		const endDate = await firebase.getQuestradeActivityDate();
		endTime = new Date(endDate);
	}
	const startTime = moment(endTime).add(-1, 'day').toDate();
	endTime = moment(startTime).add(30, 'day').toDate();
	let complete = false;
	if (endTime && endTime >= new Date()) {
		endTime = new Date();
		complete = true;
	}

	// console.log('times', startTime, endTime);
	const accounts = getAccounts();

	const accountIds = accounts.map(({ accountId: id }) => id);
	const resps = await Promise.all(
		accountIds.map(
			async (accountId) =>
				await authRequest(`${accountsRoute}/${accountId}/activities`, {
					startTime,
					endTime,
				})
		)
	);

	const activitiesByAcount: IQuestradeActivity[][] = _(resps)
		.map('data')
		.map('activities')
		.value();
	for (let i = 0; i < activitiesByAcount.length; i++) {
		const activities = activitiesByAcount[i];
		const accountId = accountIds[i];
		activities.forEach((activity) => {
			activity.accountId = Number(accountId);
		});
	}
	const activities = _.flatten(activitiesByAcount);

	await firebase.setQuestradeActivityDate(endTime || new Date());

	return { activities, complete };
};

export interface IQuestradeQuote {
	symbol: string;
	symbolId: number;
	tier: string;
	bidPrice: number;
	bidSize: number;
	askPrice: number;
	askSize: number;
	astTradeTrHrs: number;
	lastTradePrice: number;
	lastTradeSize: number;
	lastTradeTick: string;
	volumne: number;
	openPrice: number;
	highPrice: number;
	lowPrice: number;
	delay: boolean;
	isHalted: boolean;
	lastTradePriceTrHrs: number;
}

export const getQuotes = async (
	symbolIds: number[]
): Promise<IQuestradeQuote[]> => {
	await initDeferredPromise.promise;

	const resp = await authRequest(`v1/markets/quotes?ids=${symbolIds.join(',')}`);
	if (!resp) {
		return Promise.resolve([]);
	}

	const quotes: IQuestradeQuote[] = resp.data.quotes;
	quotes.forEach((q) => (q.symbol = q.symbol.toLocaleLowerCase()));

	return quotes;
};

export interface IQuestradeCompany {
	symbol: string;
	symbolId: number;
	currency: 'CAD' | 'USD';
	pe: number;
	yield: number;
	dividend: number;
	marketCap: number;
	exchange: string;
	prevDayClosePrice: number;
	highPrice52: number;
	lowPrice52: number;
	description: string;
	listingExchange;
}

export const getCompanies = async (
	symbolIds: number[]
): Promise<IQuestradeCompany[]> => {
	await initDeferredPromise.promise;

	const resp = await authRequest(`v1/symbols?ids=${symbolIds.join(',')}`);
	if (!resp) {
		return [];
	}

	const symbols: IQuestradeCompany[] = resp.data.symbols;
	symbols.forEach((q) => (q.symbol = q.symbol.toLocaleLowerCase()));

	return symbols;
};

interface IBalance {
	currency: Currency;
	cash: number;
	combined: boolean;
}

export interface ICashQuestrade {
	currency: Currency;
	amount: number;
	accountId: number;
	accountName: string;
}

interface IQuestradeBalance {
	buyingPower: number;
	cash: number;
	currency: 'CAD' | 'USD';
	isRealTime: true;
	maintenanceExcess: number;
	marketValue: number;
	totalEquity: number;
}

interface IQuestradeBalanceResponse {
	combinedBalances: IQuestradeBalance[];
	perCurrencyBalances: IQuestradeBalance[];
	sodCombinedBalances: IQuestradeBalance[];
	sodPerCurrencyBalances: IQuestradeBalance[];
}

const getCashForAccount = async (accountId): Promise<ICashQuestrade[]> => {
	await initDeferredPromise.promise;
	const response = ((await authRequest(
		`${accountsRoute}/${accountId}/balances`
	)) as unknown) as AxiosResponse<IQuestradeBalanceResponse>;
	const accounts = getAccounts();
	return response.data.perCurrencyBalances.map(({ currency, cash }) => ({
		currency: currency === 'USD' ? Currency.usd : Currency.cad,
		amount: cash,
		accountId: Number(accountId),
		accountName:
			accounts.find(({ accountId: id }) => id === accountId)?.name || '',
	}));
};

export const getCash = async (): Promise<ICashQuestrade[]> => {
	await initDeferredPromise.promise;
	const accountIds = getAccounts().map(({ accountId: id }) => id);
	const cash = await Promise.all(
		accountIds.map((accountId) => getCashForAccount(accountId))
	);

	return _.flatten(cash);
};

export const findSymbolId = async (symbol: string): Promise<number> => {
	await initDeferredPromise.promise;
	const resp = await authRequest(`v1/symbols/search?prefix=${symbol}`);
	if (!resp) {
		return 0;
	}
	const symbols: IQuestradeCompany[] = resp.data.symbols;
	const stock = _.first(symbols);
	return (stock && stock.symbolId) || 0;
};

export enum QuestradeOrderType {
	Market = 'Market',
	Limit = 'Limit',
	Stop = 'Stop',
	StopLimit = 'StopLimit',
	LimitOnOpen = 'LimitOnOpen',
	LimitOnClose = 'LimitOnClose',
}

export enum QuestradeOrderSide {
	Buy = 'Buy',
	Sell = 'Sell',
	BTO = 'BTO',
}

const getActiveOrdersForMonth = async (
	startTime: Date,
	endTime: Date
): Promise<IQuestradeOrder[]> => {
	await initDeferredPromise.promise;
	const accounts = getAccounts();

	const accountIds = accounts.map(({ accountId: id }) => id);
	const resps = await Promise.all(
		accountIds.map(
			async (accountId) =>
				await authRequest(`${accountsRoute}/${accountId}/orders`, {
					startTime,
					endTime,
					stateFilter: 'Open',
				})
		)
	);

	const ordersByAccount = _(resps).map('data').map('orders').value();
	for (let i = 0; i < ordersByAccount.length; i++) {
		const orders = ordersByAccount[i];
		const accountId = accountIds[i];
		orders.forEach((order) => {
			order.accountId = accountId;
		});
	}

	const orders: IQuestradeOrder[] = _(ordersByAccount)
		.flatten()
		.filter({ state: 'Accepted' })
		.value();

	orders.forEach((q) => (q.symbol = q.symbol.toLocaleLowerCase()));

	return orders;
};

export const getOrders = async (): Promise<IQuestradeOrder[]> => {
	console.log('questrade.getActiveOrders (start)'.grey);
	await initDeferredPromise.promise;
	const orders1 = await getActiveOrdersForMonth(
		moment().subtract(1, 'month').toDate(),
		new Date()
	);
	const orders2 = await getActiveOrdersForMonth(
		moment().subtract(2, 'month').toDate(),
		moment().subtract(1, 'month').toDate()
	);
	const orders3 = await getActiveOrdersForMonth(
		moment().subtract(3, 'month').toDate(),
		moment().subtract(2, 'month').toDate()
	);

	const orders: IQuestradeOrder[] = _(orders1)
		.concat(orders2, orders3)
		.uniqBy('id')
		.value();

	orders.forEach((q) => (q.symbol = q.symbol.toLocaleLowerCase()));

	console.log('questrade.getActiveOrders (end)'.grey);
	return orders;
};

/* eslint @typescript-eslint/no-use-before-define: off */
//https://login.questrade.com/oauth2/token?grant_type=refresh_token&refresh_token=
import _ from 'lodash';
import axios, { AxiosResponse } from 'axios';
import Cryptr from 'cryptr';
import moment from 'moment';

import * as util from './util';
import * as firebase from './firebase';
import { Currency } from '../../../src/utils/enum';
import { ICash } from '../../../src/utils/cash';

const loginUrl = 'https://login.questrade.com/oauth2/token';
const accountsRoute = 'v1/accounts';

let apiUrl = '';
let accessToken = '';
let cryptr: Cryptr;
let accounts: string[] = [];

let endTime: Date | null = null;

const ACCOUNT_LOOKUP = {
	26418215: 'Margin',
	51443858: 'TFSA',
	51637118: 'RRSP',
};

const initDeferredPromise = util.deferredPromise();

// use this to replace refresh token
const overrideLoginToken = ''; // 'h5kAC9rZI3k277QR6FrG25zSCwz4ftgO0';

const filteredPositions = ['ele.vn', 'trst.to'];

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

const getAccounts = async (): Promise<string[]> => {
	const resp = await authRequest(accountsRoute);
	if (!resp) {
		return [];
	}
	accounts = resp.data.accounts;
	return accounts;
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

// this is flawed. Think of a scenario where a position is open in two different
// accounts then closed in one. The average entry price would be represented by the open position and
// not the combined trades of both accounts
const mergePositions = (
	positions: IQuestradePosition[]
): IQuestradePosition[] => {
	const positionsMap = _.groupBy(positions, 'symbol');
	_.forEach(positionsMap, (symbolPositions, symbol) => {
		const position = symbolPositions.shift();
		if (!position) {
			return;
		}
		symbolPositions.forEach((symbolPosition) => {
			position.currentMarketValue += symbolPosition.currentMarketValue;
			position.totalCost += symbolPosition.totalCost;
			position.openQuantity += symbolPosition.openQuantity;
			position.averageEntryPrice = position.totalCost / position.openQuantity;
			position.openPnl += symbolPosition.openPnl;
		});
		// @ts-ignore
		positionsMap[symbol] = position;
	});

	return _(positionsMap).values().flatten().value();
};

/*
 [{data: { positions: []}}, {data: {positions: []}}]
*/

export const getPositions = async (): Promise<IQuestradePosition[]> => {
	console.log('questrade.getPositions (start)'.grey);
	await initDeferredPromise.promise;

	const accountIds = _.map(accounts, 'number');
	const resps = await Promise.all(
		accountIds.map(
			async (accountId) =>
				await authRequest(`${accountsRoute}/${accountId}/positions`)
		)
	);

	const datas = _.map(resps, 'data');
	const positions: IQuestradePosition[] = _(datas)
		.map('positions')
		.flatten()
		.filter('openQuantity')
		.value();

	const mergedPositions = mergePositions(positions);
	mergedPositions.forEach((q) => (q.symbol = q.symbol.toLocaleLowerCase()));

	const results = _.filter(
		mergedPositions,
		(q) => !filteredPositions.includes(q.symbol)
	);
	console.log('questrade.getPositions (end)'.grey);
	return results;
};

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

	const accountIds = _.map(accounts, 'number');
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
			activity.accountId = accountId;
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

export interface IQuestradeSymbol {
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

export const getSymbols = async (
	symbolIds: number[]
): Promise<IQuestradeSymbol[]> => {
	await initDeferredPromise.promise;

	const resp = await authRequest(`v1/symbols?ids=${symbolIds.join(',')}`);
	if (!resp) {
		return [];
	}

	const symbols: IQuestradeSymbol[] = resp.data.symbols;
	symbols.forEach((q) => (q.symbol = q.symbol.toLocaleLowerCase()));

	return symbols;
};

interface IBalance {
	currency: Currency;
	cash: number;
	combined: boolean;
}

export const getBalances = async (): Promise<IBalance[]> => {
	const accountIds = _.map(accounts, 'number');
	const resps = await Promise.all(
		accountIds.map(
			async (accountId) =>
				await authRequest(`${accountsRoute}/${accountId}/balances`)
		)
	);

	const datas = _.map(resps, 'data');
	const balancesPerCurrency = _(datas)
		.map('perCurrencyBalances')
		.flatten()
		.value();

	const cad = {
		currency: Currency.cad,
		cash: _(balancesPerCurrency).filter({ currency: 'CAD' }).sumBy('cash'),
		combined: false,
	};
	const usd = {
		currency: Currency.usd,
		cash: _(balancesPerCurrency).filter({ currency: 'USD' }).sumBy('cash'),
		combined: false,
	};

	return [cad, usd];
};

export interface ICashQuestrade
	extends Omit<ICash, 'amountCad' | 'amountUsd'> {}

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
	const response = ((await authRequest(
		`${accountsRoute}/${accountId}/balances`
	)) as unknown) as AxiosResponse<IQuestradeBalanceResponse>;
	return response.data.perCurrencyBalances.map(({ currency, cash }) => ({
		currency: currency === 'USD' ? Currency.usd : Currency.cad,
		amount: cash,
		accountId: Number(accountId),
		accountName: ACCOUNT_LOOKUP[accountId],
	}));
};

export const getCash = async (): Promise<ICashQuestrade[]> => {
	const accountIds = _.map(accounts, 'number');
	const cash = await Promise.all(
		accountIds.map((accountId) => getCashForAccount(accountId))
	);

	return _.flatten(cash);
};

export const findSymbolId = async (symbol: string): Promise<number> => {
	const resp = await authRequest(`v1/symbols/search?prefix=${symbol}`);
	if (!resp) {
		return 0;
	}
	const symbols: IQuestradeSymbol[] = resp.data.symbols;
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

const getActiveOrdersForMonth = async (
	startTime: Date,
	endTime: Date
): Promise<IQuestradeOrder[]> => {
	await initDeferredPromise.promise;

	const accountIds = _.map(accounts, 'number');
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

export const getActiveOrders = async (): Promise<IQuestradeOrder[]> => {
	console.log('questrade.getActiveOrders (start)'.grey);
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

export const getAccountName = (accountId: number): string => {
	return ACCOUNT_LOOKUP[accountId] || 'Unknown';
};

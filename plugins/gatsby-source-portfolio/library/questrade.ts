//https://login.questrade.com/oauth2/token?grant_type=refresh_token&refresh_token=
import _ from 'lodash';
import axios, { AxiosResponse } from 'axios';
import Cryptr from 'cryptr';
import moment from 'moment-timezone';

import * as util from './util';
import * as firebase from './firebase';
import { IPosition } from '../../../src/utils/position';
import { ITrade } from '../../../src/utils/trade';
import { IQuote } from '../../../src/utils/quote';
import { Currency } from '../../../src/utils/enum';

const loginUrl = 'https://login.questrade.com/oauth2/token';
const accountsRoute = 'v1/accounts';

var apiUrl;
var accessToken;
var cryptr;
let accounts: string[] = [];

var endTime = null;

const ACCOUNT_LOOKUP = {
	26418215: 'Margin',
	51443858: 'TFSA',
	51637118: 'RRSP'
};

const initDeferredPromise = util.deferredPromise();

// use this to replace refresh token
const overrideLoginToken = null; // 'h5kAC9rZI3k277QR6FrG25zSCwz4ftgO0';

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

const init = async (cryptSecret: string): Promise<void> => {
	cryptr = new Cryptr(cryptSecret);
	await getLoginInfo();
	await getAccounts();
	initDeferredPromise.resolve();
};

const updateLoginInfo = async (refreshToken: string, expiry: number): Promise<void> => {
	const eRefreshToken = cryptr.encrypt(refreshToken);
	const eAccessToken = cryptr.encrypt(accessToken);
	const expiryTime = (new Date()).getTime() + (expiry * 1000);

	await firebase.setQuestradeAuth(eRefreshToken, eAccessToken, expiryTime, apiUrl);
};

const login = async (refreshToken: string): Promise<void> => {
	const resp = await axios.get(loginUrl, {
		params: {
			'grant_type': 'refresh_token',
			'refresh_token': refreshToken
		}
	}).catch(console.log);

	if (!resp) {
		return;
	}

	apiUrl = resp.data.api_server;
	accessToken = resp.data.access_token;

	await updateLoginInfo(resp.data.refresh_token, resp.data.expires_in);
};

const authRequest = async (route: string, params?: object): Promise<AxiosResponse | void> => {
	return await axios.get(`${apiUrl}${route}`, {
		headers: {
			Authorization: `Bearer ${accessToken}`
		},
		params
	}).catch(console.log);
};

const getAccounts = async (): Promise<string[]> => {
	const resp = await authRequest(accountsRoute);
	if (!resp) {
		return [];
	}
	accounts = resp.data.accounts;
	return accounts;
};

const mergePositions = (positions: IPosition[]): IPosition[] => {
	const positionsMap = _.groupBy(positions, 'symbol');
	_.forEach(positionsMap, (symbolPositions, symbol) => {
		const position = symbolPositions.shift();
		symbolPositions.forEach(symbolPosition => {
			position.currentMarketValue += symbolPosition.currentMarketValue;
			position.totalCost += symbolPosition.totalCost;
			position.quantity += symbolPosition.quantity;
			position.averageEntryPrice = position.totalCost / position.quantity;
			position.openQuantity += symbolPosition.openQuantity;
			position.openPnl += symbolPosition.openPnl;
		});
		positionsMap[symbol] = position;
	});

	return _(positionsMap).values().flatten().value();
};

/*
 [{data: { positions: []}}, {data: {positions: []}}]
*/
const getPositions = async (): Promise<IPosition[]> => {
	await initDeferredPromise.promise;

	const accountIds = _.map(accounts, 'number');
	const resps = await Promise.all(
		accountIds.map(
			async accountId =>
				await authRequest(`${accountsRoute}/${accountId}/positions`)
		)
	);

	const datas = _.map(resps, 'data');
	const positions = _(datas)
		.map('positions')
		.flatten()
		.filter('openQuantity')
		.value();
	
	positions.forEach(position => {
		position.currency = position.symbol.indexOf('.') !== -1 ? 'cad' : 'usd';
		position.quantity = position.openQuantity;
		position.symbol = position.symbol.toLowerCase();
		position.type = 'stock';
		_.unset(position, 'isRealTime');
		_.unset(position, 'isUnderReorg');
	});

	return mergePositions(positions);
};

const getActivities = async (): Promise<{activities: ITrade[], complete: boolean}> => {
	await initDeferredPromise.promise;

	// here's the problem
	endTime = endTime || await firebase.getQuestradeActivityDate();
	const startTime = moment(endTime).add(-1, 'day').toDate();
	endTime = moment(startTime).add(30, 'day').toDate();
	let complete = false;
	if (endTime >= new Date()) {
		endTime = new Date();
		complete = true;
	}

	console.log('times', startTime, endTime);

	const accountIds = _.map(accounts, 'number');
	const resps = await Promise.all(
		accountIds.map(
			async accountId =>
				await authRequest(
					`${accountsRoute}/${accountId}/activities`,
					{
						startTime,
						endTime
					}
				)
		)
	);

	const activitiesByAcount = _(resps).map('data').map('activities').value();
	for (let i = 0; i < activitiesByAcount.length; i++) {
		const activities = activitiesByAcount[i];
		const accountId = accountIds[i];
		activities.forEach(activity => {
			activity.accountId = accountId;
		});
	}
	const activities = _.flatten(activitiesByAcount);

	await firebase.setQuestradeActivityDate(endTime);

	return {activities, complete};
};

const getQuotes = async (symbolIds: string[]): Promise<IQuote> => {
	await initDeferredPromise.promise;

	const resp = await authRequest(`v1/markets/quotes?ids=${symbolIds.join(',')}`);
	
	const quotes = resp.data.quotes;

	return quotes.map(quote => {
		return {
			price: quote.lastTradePriceTrHrs,
			afterHoursPrice: quote.lastTradePrice,
			symbol: quote.symbol.toLowerCase(),
			symbolId: quote.symbolId,
			currency: quote.symbol.indexOf('.') !== -1 ? 'cad' : 'usd',
			type: 'stock'
		};
	});
};

interface ISymbol {
	symbol: string,
	symbolId: string,
	currency: Currency,
	pe: number,
	yield: number,
	dividend: number,
	marketCap: number,
	name: string,
	exchange: string,
	prevDayClosePrice: number,
	highPrice52: number,
	lowPrice52: number
}

const getSymbols = async (symbolIds: string[]): Promise<ISymbol[]> => {
	await initDeferredPromise.promise;

	const resp = await authRequest(`v1/symbols?ids=${symbolIds.join(',')}`);

	const symbols = resp.data.symbols;

	return symbols.map(symbol => {
		return {
			symbol: symbol.symbol.toLowerCase(),
			symbolId: symbol.symbolId,
			currency: symbol.symbol.indexOf('.') !== -1 ? 'cad' : 'usd',
			pe: symbol.pe,
			yield: symbol.yield,
			dividend: symbol.dividend,
			marketCap: symbol.marketCap,
			name: symbol.description,
			exchange: symbol.listingExchange,
			prevDayClosePrice: symbol.prevDayClosePrice,
			highPrice52: symbol.highPrice52,
			lowPrice52: symbol.lowPrice52
		};
	});
};

interface IBalance {
	currency: Currency,
	cash: number,
	combined: boolean
}

const getBalances = async (): Promise<IBalance[]> => {
	const accountIds = _.map(accounts, 'number');
	const resps = await Promise.all(
		accountIds.map(
			async accountId =>
				await authRequest(`${accountsRoute}/${accountId}/balances`)
		)
	);

	const datas = _.map(resps, 'data');
	const balancesPerCurrency = _(datas).map('perCurrencyBalances').flatten().value();

	const cad = {
		currency: Currency.cad,
		cash: _(balancesPerCurrency).filter({currency: 'CAD'}).sumBy('cash'),
		combined: false
	};
	const usd = {
		currency: Currency.usd,
		cash: _(balancesPerCurrency).filter({currency: 'USD'}).sumBy('cash'),
		combined: false
	};

	return [cad, usd];
};

const findSymbolId = async (symbol: string): Promise<string> => {
	const resp = await authRequest(`v1/symbols/search?prefix=${symbol}`);
	if (!resp) {
		return '';
	}
	const symbols: ISymbol[] = resp.data.symbols;
	const stock = _.first(symbols);
	return stock && stock.symbolId || null;
};

const getActiveOrdersForMonth = async (startTime, endTime) => {
	await initDeferredPromise.promise;

	const accountIds = _.map(accounts, 'number');
	const resps = await Promise.all(
		accountIds.map(
			async accountId =>
				await authRequest(
					`${accountsRoute}/${accountId}/orders`,
					{
						startTime,
						endTime,
						stateFilter: 'Open'
					}
				)
		)
	);

	const ordersByAccount = _(resps).map('data').map('orders').value();
	for (let i = 0; i < ordersByAccount.length; i++) {
		const orders = ordersByAccount[i];
		const accountId = accountIds[i];
		orders.forEach(order => {
			order.accountId = accountId;
		});
	}

	const orders = _(ordersByAccount)
		.flatten()
		.filter({state: 'Accepted'})
		.map(_order => {
			var order = _.pick(_order, [
				'id',
				'symbol',
				'symbolId',
				'openQuantity',
				'totalQuantity',
				'filledQuantity',
				'orderType',
				'limitPrice',
				'stopPrice',
				'avgExecPrice',
				'side',
				'accountId'
			]);

			order.symbol = order.symbol.toLowerCase();
			order.action = order.side.toLowerCase();
			order.orderType = order.orderType.toLowerCase();
			order.type = 'stock';
			order.accountName = getAccountName(order.accountId);
			return order;
		})
		.value();

	return orders;
};

const getActiveOrders = async () => {
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

	const orders = _(orders1)
		.concat(orders2, orders3)
		.uniqBy('id')
		.map(o => _.omit(o, 'id'))
		.value();

	if (!orders.length) {
		orders.push({
			symbol: 'dis',
			symboldId: 16142,
			openQuantity: 0,
			totalQuantity: 0,
			filledQuantity: 0,
			orderType: 'limit',
			limitPrice: 200,
			stopPrice: 0,
			avgExecPrice: 0,
			side: 'none',
			accoundId: 0,
			type: 'stock',
			accountName: 'none',
			action: 'sell'
		});
	}

	return orders;
};

const getAccountName = accountId => {
	return ACCOUNT_LOOKUP[accountId] || 'Unknown';
};

module.exports = {
	init,
	getPositions,
	getActivities,
	getQuotes,
	getSymbols,
	getBalances,
	login,
	findSymbolId,
	getActiveOrders
};
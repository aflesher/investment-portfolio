import { deferredPromise } from 'library/util';
import * as api from './api';
import { getExchangeRates } from 'library/exchange';
import moment from 'moment-timezone';
import { ITradeV2 } from '../../../../declarations/trade';
import * as cloud from './cloud';
import { mapOrder, mapTrade } from './mapping';
import { IOrderV2 } from '../../../../declarations';

const initDeferredPromise = deferredPromise();

export const init = async (key: string, secret: string) => {
	await api.init(key, secret);
	initDeferredPromise.resolve();
};

const data = (async () => {
	await initDeferredPromise.promise;

	const orders = await api.getOpenOrders();
	const balances = await api.getBalances();
	const fetchedTrades = await api.getTrades();
	cloud.sync(fetchedTrades);
	const trades = cloud.getTrades();

	return { orders, balances, trades };
})();

export const getTrades = async (): Promise<ITradeV2[]> => {
	const { trades } = await data;
	const exchangeRates = await getExchangeRates();

	return trades.map((trade) => {
		const timestamp = Number(trade.time) * 1000;
		const usdToCadRate = exchangeRates[moment(timestamp).format('YYYY-MM-DD')];

		return mapTrade(trade, usdToCadRate);
	});
};

export const getOrders = async (): Promise<IOrderV2[]> => {
	const { orders } = await data;
	const exchangeRates = await getExchangeRates();
	const usdToCadRate = exchangeRates[moment().format('YYYY-MM-DD')];

	return orders.map((order) => {
		return mapOrder(order, usdToCadRate);
	});
};

export const getBalances = async () => {
	const { balances } = await data;

	return {
		usd: balances.usd,
		cad: balances.cad,
	};
};

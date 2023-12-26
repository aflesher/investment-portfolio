import { deferredPromise } from '../util';
import * as api from './api';
import { getExchangeRates, getTodaysRate } from '../exchange';
import moment from 'moment-timezone';
import { ITradeV2 } from '../../../../declarations/trade';
import * as cloud from './cloud';
import { mapOrder, mapTrade } from './mapping';
import { IOrderV2 } from '../../../../declarations';
import { IAccount } from '../../../../declarations/account';
import { Currency } from '../../../../src/utils/enum';

const initDeferredPromise = deferredPromise();
const dataDeferredPromise = deferredPromise<{
	orders: api.KrakenOpenOrder[];
	balances: { usd: number; cad: number };
	trades: api.KrakenTrade[];
}>();

export const init = async (key: string, secret: string) => {
	await api.init(key, secret);
	initDeferredPromise.resolve();

	const orders = await api.getOpenOrders();
	const balances = await api.getBalances();
	const fetchedTrades = await api.getTrades();
	await cloud.sync(fetchedTrades);
	const trades = cloud.getTrades();

	dataDeferredPromise.resolve({ orders, balances, trades });
};

export const getTrades = async (): Promise<ITradeV2[]> => {
	const { trades } = await dataDeferredPromise.promise;
	const exchangeRates = await getExchangeRates();

	return trades.map((trade) => {
		const timestamp = Number(trade.time) * 1000;
		const usdToCadRate = exchangeRates[moment(timestamp).format('YYYY-MM-DD')];

		return mapTrade(trade, usdToCadRate);
	});
};

export const getOrders = async (): Promise<IOrderV2[]> => {
	const { orders } = await dataDeferredPromise.promise;
	const exchangeRates = await getExchangeRates();
	const usdToCadRate = exchangeRates[moment().format('YYYY-MM-DD')];

	return orders.map((order) => {
		return mapOrder(order, usdToCadRate);
	});
};

export const getAccount = async (): Promise<IAccount> => {
	const { balances } = await dataDeferredPromise.promise;
	const usdToCadRate = await getTodaysRate();
	const cadToUsdRate = 1 / usdToCadRate;

	const account: IAccount = {
		accountId: 'kraken',
		name: 'Kraken',
		isTaxable: true,
		type: 'crypto',
		displayName: 'Kraken',
		balances: [
			{
				currency: Currency.cad,
				amount: balances.cad,
				amountCad: balances.cad,
				amountUsd: balances.cad * cadToUsdRate,
			},
			{
				currency: Currency.usd,
				amount: balances.usd,
				amountCad: balances.usd * usdToCadRate,
				amountUsd: balances.usd,
			},
		],
	};

	return account;
};

import { getExchangeRates, getTodaysRate } from '../exchange';
import {
	ITrade,
	IOrder,
	IQuote,
	IDividend,
	ICompany,
} from '../../../../declarations';
import * as cloud from './cloud';
import * as api from './api';
import {
	mapTrade,
	mapOrder,
	mapQuote,
	mapDividend,
	mapCompany,
	mapExecutedOrderToTrade,
} from './mapping';
import moment from 'moment-timezone';
import { deferredPromise } from '../util';
import * as firebase from '../firebase';
import { Currency } from '../../../../src/utils/enum';
import { IAccount } from '../../../../declarations/account';
import { getMappedSymbolIds } from './data';
export { findSymbolId } from './api';

const initDeferredPromise = deferredPromise();

export const init = async (cryptSecret: string) => {
	console.log('questrade.init (start)'.gray);
	await api.init(cryptSecret);
	await cloud.sync();
	initDeferredPromise.resolve();
	console.log('questrade.init (end)'.gray);
};

export const getTrades = async (): Promise<ITrade[]> => {
	await initDeferredPromise.promise;
	const exchangeRates = await getExchangeRates();
	const todaysRate = await getTodaysRate();

	const existingTrades = cloud
		.getTrades()
		.map((trade) =>
			mapTrade(
				trade,
				exchangeRates[moment(trade.date).format('YYYY-MM-DD')] || 1.3
			)
		);
	const todaysTrades = (await api.getExecutedOrders()).map((order) =>
		mapExecutedOrderToTrade(order, todaysRate)
	);

	const trades = [...existingTrades, ...todaysTrades];
	console.log(`questrade trades: ${trades.length}`);
	return trades;
};

export const getOrders = async (): Promise<IOrder[]> => {
	await initDeferredPromise.promise;
	const [apiOrders, usdToCadRate] = await Promise.all([
		api.getOrders(),
		getTodaysRate(),
	]);

	return apiOrders.map((order) => mapOrder(order, usdToCadRate));
};

export const getQuotes = async (symbolIds: number[]): Promise<IQuote[]> => {
	await initDeferredPromise.promise;
	const mappedSymbolIds = getMappedSymbolIds();
	symbolIds = symbolIds.map(
		(id) =>
			mappedSymbolIds.find(({ original }) => original === id)?.replacement || id
	);
	const [quotes, usdToCadRate] = await Promise.all([
		api.getQuotes(symbolIds),
		getTodaysRate(),
	]);

	console.log(`questrade quotes: ${quotes.length}`);

	return quotes.map((quote) => {
		return mapQuote(quote, usdToCadRate);
	});
};

export const getDividends = async (): Promise<IDividend[]> => {
	await initDeferredPromise.promise;
	const exchangeRates = await getExchangeRates();

	const dividends = cloud
		.getDividends()
		.map((dividend) =>
			mapDividend(
				dividend,
				exchangeRates[moment(dividend.date).format('YYYY-MM-DD')]
			)
		);
	return dividends;
};

export const getCompanies = async (
	symbolIds: number[]
): Promise<ICompany[]> => {
	await initDeferredPromise.promise;
	const [companies, hisaStocks] = await Promise.all([
		api.getCompanies(symbolIds),
		firebase.getHisaStocks(),
	]);

	console.log(`questrade companies: ${companies.length}`);

	return companies.map((company) =>
		mapCompany(
			company,
			hisaStocks.map((s) => s.symbol)
		)
	);
};

export const getAccounts = async (): Promise<IAccount[]> => {
	const [accounts, balances, usdToCadRate] = await Promise.all([
		api.getAccounts(),
		api.getCash(),
		getTodaysRate(),
	]);
	const cadToUsdRate = 1 / usdToCadRate;
	balances.forEach((balance) => {
		const account = accounts.find(
			(a) => Number(a.accountId) === balance.accountId
		);
		if (!account) {
			console.error('account not found', balance.accountId);
			return;
		}

		const usdRate = balance.currency === Currency.cad ? 1 : cadToUsdRate;
		const cadRate = balance.currency === Currency.usd ? 1 : usdToCadRate;
		account.balances.push({
			currency: balance.currency,
			amount: balance.amount,
			amountUsd: balance.amount * usdRate,
			amountCad: balance.amount * cadRate,
		});
	});

	return accounts;
};

export const querySymbol = async (
	symbol: string
): Promise<api.IQuestradeCompany[]> => {
	await initDeferredPromise.promise;
	return api.querySymbol(symbol);
};

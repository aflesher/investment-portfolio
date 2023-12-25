import { getExchangeRates, getTodaysRate } from '../exchange';
import {
	ITradeV2,
	IOrderV2,
	IQuote,
	IDividendV2,
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
} from './mapping';
import moment from 'moment-timezone';
import { deferredPromise } from '../util';
import * as firebase from '../firebase';
import { Currency } from '../../../../src/utils/enum';
import { IAccount } from '../../../../declarations/account';
export { findSymbolId } from './api';

const initDeferredPromise = deferredPromise();

export const init = async (cryptSecret: string) => {
	console.log('questrade.init (start)'.gray);
	await api.init(cryptSecret);
	await cloud.sync();
	initDeferredPromise.resolve();
	console.log('questrade.init (end)'.gray);
};

export const getTrades = async (): Promise<ITradeV2[]> => {
	await initDeferredPromise.promise;
	const exchangeRates = await getExchangeRates();

	const trades = cloud
		.getTrades()
		.map((trade) =>
			mapTrade(
				trade,
				exchangeRates[moment(trade.date).format('YYYY-MM-DD')] || 1.3
			)
		);

	return trades;
};

export const getOrders = async (): Promise<IOrderV2[]> => {
	await initDeferredPromise.promise;
	const [apiOrders, usdToCadRate] = await Promise.all([
		api.getOrders(),
		getTodaysRate(),
	]);

	return apiOrders.map((order) => mapOrder(order, usdToCadRate));
};

export const getQuotes = async (symbolIds: number[]): Promise<IQuote[]> => {
	await initDeferredPromise.promise;
	const [quotes, usdToCadRate] = await Promise.all([
		api.getQuotes(symbolIds),
		getTodaysRate(),
	]);

	return quotes.map((quote) => {
		return mapQuote(quote, usdToCadRate);
	});
};

export const getDividends = async (): Promise<IDividendV2[]> => {
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

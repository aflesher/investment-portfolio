import { getExchangeRates, getTodaysRate } from 'library/exchange';
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
import { deferredPromise } from 'library/util';
import * as firebase from 'library/firebase';

const initDeferredPromise = deferredPromise();

(async () => {
	await cloud.sync();
	initDeferredPromise.resolve();
})();

export const getTrades = async (): Promise<ITradeV2[]> => {
	await initDeferredPromise.promise;
	const exchangeRates = await getExchangeRates();

	const trades = cloud
		.getTrades()
		.map((trade) =>
			mapTrade(trade, exchangeRates[moment(trade.date).format('YYYY-MM-DD')])
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

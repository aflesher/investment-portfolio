import { getExchangeRates } from 'library/exchange';
import { ITradeV2, IOrderV2, IQuote } from '../../../../declarations';
import * as cloud from './cloud';
import * as api from './api';
import { mapTrade, mapOrder, mapQuote } from './mapping';
import moment from 'moment-timezone';

export const getTrades = async (): Promise<ITradeV2[]> => {
	await cloud.sync();
	const exchangeRates = await getExchangeRates();

	const trades = cloud
		.getTrades()
		.map((trade) =>
			mapTrade(trade, exchangeRates[moment(trade.date).format('YYYY-MM-DD')])
		);

	return trades;
};

export const getOrders = async (): Promise<IOrderV2[]> => {
	const [apiOrders, exchangeRates] = await Promise.all([
		api.getOrders(),
		getExchangeRates(),
	]);

	const usdToCadRate = exchangeRates[moment().format('YYYY-MM-DD')];

	return apiOrders.map((order) => mapOrder(order, usdToCadRate));
};

export const getQuotes = async (symbolIds: number[]): Promise<IQuote[]> => {
	const [quotes, exchangeRates] = await Promise.all([
		api.getQuotes(symbolIds),
		getExchangeRates(),
	]);

	const usdToCadRate = exchangeRates[moment().format('YYYY-MM-DD')];

	return quotes.map((quote) => {
		return mapQuote(quote, usdToCadRate);
	});
};

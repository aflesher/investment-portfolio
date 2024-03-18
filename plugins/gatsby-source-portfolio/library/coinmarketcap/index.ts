import { getTodaysRate } from '../exchange';
import { ICompany, IQuote } from '../../../../declarations';
import { AssetType, Currency } from '../../../../src/utils/enum';
import * as api from './api';
import { deferredPromise } from '../util';
export { init } from './api';

const dataDeferredPromise = deferredPromise<api.ICoinMarketCapQuote[]>();

const getAllTimeHigh = (symbol: string) => {
	switch (symbol) {
		case 'btc':
			return 73810;
		case 'eth':
			return 4356;
		case 'sol':
			return 216;
		case 'rune':
			return 20.8;
	}

	return 0;
};

const getCycleLow = (symbol: string) => {
	switch (symbol) {
		case 'btc':
			return 16217;
		case 'eth':
			return 1097;
		case 'sol':
			return 9.961;
		case 'rune':
			return 1.25;
	}

	return 0;
};

export const setSymbols = async (symbols: string[]) => {
	const slugs = api.symbolsToSlugs(symbols);
	const quotes = await api.getQuotes(slugs);
	dataDeferredPromise.resolve(quotes);
};

export const getQuotes = async (): Promise<IQuote[]> => {
	const [quotes, usdToCadRate] = await Promise.all([
		dataDeferredPromise.promise,
		getTodaysRate(),
	]);

	const currency: Currency = Currency.usd;
	const usdRate = 1;
	const cadRate = usdToCadRate;

	return quotes.map((quote) => ({
		symbol: quote.symbol,
		price: quote.price,
		priceCad: quote.price * cadRate,
		priceUsd: quote.price * usdRate,
		currency,
		type: AssetType.crypto,
		afterHoursPrice: quote.price,
		symbolId: undefined,
	}));
};

export const getCompanies = async (): Promise<ICompany[]> => {
	const quotes = await dataDeferredPromise.promise;

	return quotes.map((quote) => ({
		marketCap: quote.marketCap,
		symbol: quote.symbol,
		name: quote.name,
		exchange: 'CMC',
		pe: undefined,
		yield: 0,
		prevDayClosePrice: quote.prevDayClosePrice,
		type: AssetType.crypto,
		highPrice52: getAllTimeHigh(quote.symbol),
		lowPrice52: getCycleLow(quote.symbol),
		hisa: false,
	}));
};

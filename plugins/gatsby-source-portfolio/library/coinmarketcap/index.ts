import { getTodaysRate } from 'library/exchange';
import { ICompany, IQuote } from '../../../../declarations';
import { AssetType, Currency } from '../../../../src/utils/enum';
import * as api from './api';
import { deferredPromise } from 'library/util';
export { init } from './api';

const dataDeferredPromise = deferredPromise<api.ICoinMarketCapQuote[]>();

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
		highPrice52: 0,
		lowPrice52: 0,
		hisa: false,
	}));
};

import { getTodaysRate } from 'library/exchange';
import { IQuote } from '../../../../declarations';
import { AssetType, Currency } from '../../../../src/utils/enum';
import * as api from './api';

export const getQuotes = async (symbols: string[]): Promise<IQuote[]> => {
	const usdToCadRate = await getTodaysRate();

	const slugs = api.symbolsToSlugs(symbols);
	const quotes = await api.getQuotes(slugs);

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

export const getCompanies = async (symbols: string[]) => {};

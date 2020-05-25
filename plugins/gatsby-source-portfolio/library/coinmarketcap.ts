import axios from 'axios';
import _ from 'lodash';

import { IQuote } from  '../../../src/utils/quote';
import { Currency, AssetType } from '../../../src/utils/enum';

let api = '';
let apiKey = '';

export const init = (_api: string, _apiKey: string): void => {
	api = _api;
	apiKey = _apiKey;
};

export interface ICoinMarketCapQuote {
	price: number,
	symbol: string,
	name: string,
	marketCap: number,
	currency: Currency,
	prevDayClosePrice: number
}

export const quote = async (slugs: string[]): Promise<ICoinMarketCapQuote[]> => {
	const resp = await axios.get(`${api}/v1/cryptocurrency/quotes/latest`, {
		headers: {
			'X-CMC_PRO_API_KEY': apiKey,
			'Accept': 'application/json'
		},
		params: {
			convert: 'USD',
			slug: slugs.join(',')
		}
	}).catch(console.log);

	if (!resp) {
		return [];
	}

	const quotes = _.values(resp.data.data);

	return quotes.map(coin => {
		const quote = coin.quote.USD;
		return {
			price: quote.price,
			symbol: coin.symbol.toLowerCase(),
			name: coin.name,
			marketCap: quote.market_cap,
			currency: Currency.usd,
			type: AssetType.crypto,
			prevDayClosePrice: quote.price / (1 + (quote.percent_change_24h / 100.0)) 
		};
	});
};

export const symbolToSlug = (symbol: string): string => {
	const lookup = {
		btc: 'bitcoin',
		eth: 'ethereum',
		xmr: 'monero',
		neo: 'neo',
		nano: 'nano'
	};

	return lookup[symbol];
};

export const symbolsToSlugs = (symbols: string[]): string[] => {
	return symbols.map(symbolToSlug);
};

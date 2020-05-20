import _ from 'lodash';

import * as coinmarketcap from './library/coinmarketcap';
import * as exchange from './library/exchange';

import {
	getCryptoPositions,
	init as firebaseInit
} from './library/firebase';

const cryptoPositionsPromise = getCryptoPositions();
const getExchangePromise = exchange.getRate('usd', 'cad', new Date());

const cryptoSlugsPromise = (async (): Promise<string[]> => {
	const positions = await cryptoPositionsPromise;

	return _(positions)
		.map(p => p.symbol)
		.map(coinmarketcap.symbolToSlug)
		.value();
})();

const cryptoQuotesPromise = (async () => {
	const slugs = await cryptoSlugsPromise;

	return await coinmarketcap.quote(slugs);
})();

exports.sourceNodes = async ({ actions, createNodeId }, configOptions) => {
	firebaseInit(configOptions.firebase);

	const getQuoteNodes = async () => {
		const cryptoQuotes = await cryptoQuotesPromise;

		const usdToCadRate = await getExchangePromise;
		const cadToUsdRate = 1 / usdToCadRate;

		const quotes = _.concat(stockQuotes, cryptoQuotes);

		return quotes.map(quote => {
			quote = _.omit(quote, ['symbolId', 'marketCap', 'name', 'id', 'prevDayClosePrice']);
			quote.position___NODE = positionNodeIdsMap[quote.symbol] || null;
			quote.company___NODE = companyNodeIdsMap[quote.symbol] || null;
			quote.trades___NODE = tradeNodeIdsMap[quote.symbol] || [];
			quote.assessment___NODE = assessmentNodeIdsMap[quote.symbol] || null;
			const usdRate = quote.currency === 'usd' ? 1 : cadToUsdRate;
			const cadRate = quote.currency === 'cad' ? 1 : usdToCadRate;
			quote.priceUsd = quote.price * usdRate;
			quote.priceCad = quote.price * cadRate;

			let content = JSON.stringify(quote);
			_.defaults(
				quote, {
					id: getQuoteNodeId(quote.symbol),
					parent: null,
					children: [],
					internal: {
						type: 'Quote',
						content,
						contentDigest: hash(content)
					}
				}
			);

			return quote;
		});
	};


};
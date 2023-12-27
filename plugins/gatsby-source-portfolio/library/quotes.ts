import _ from 'lodash';
import { getQuotes as getStockQuotes } from './questrade';
import {
	getQuotes as getCryptoQuotes,
	setSymbols as setCryptoSymbols,
} from './coinmarketcap';
import { IAssessment, IOrder, IQuote, ITrade } from '../../../declarations';
import { AssetType } from '../../../src/utils/enum';

export const getQuotes = async (
	trades: ITrade[],
	orders: IOrder[],
	assessments: IAssessment[]
): Promise<IQuote[]> => {
	console.log('quotes.getQuotes (start)'.gray);
	const cryptoTradeSymbols = trades
		.filter((t) => t.type === 'crypto')
		.map((t) => t.symbol);
	const stockTradeSymbolIds = trades
		.filter((t) => t.type === 'stock')
		.map((t) => t.symbolId || 0);

	const cryptoOrderSymbols = orders
		.filter((o) => o.type === 'crypto')
		.map((o) => o.symbol);
	const stockOrderSymbolIds = orders
		.filter((o) => o.type === 'stock')
		.map((o) => o.symbolId || 0);

	const stockAssessmentSymbolIds = assessments
		.filter((q) => q.type === AssetType.stock)
		.map((a) => a.symbolId);
	const cryptoAssessmentSymbols = assessments
		.filter((q) => q.type === AssetType.crypto)
		.map((a) => a.symbol);

	const cryptoSymbols = _.uniq(
		[
			...cryptoTradeSymbols,
			...cryptoOrderSymbols,
			...cryptoAssessmentSymbols,
		].filter((s) => s)
	);
	const stockSymbolIds = _.uniq(
		[
			...stockTradeSymbolIds,
			...stockOrderSymbolIds,
			...stockAssessmentSymbolIds,
		].filter((s) => s)
	);

	setCryptoSymbols(cryptoSymbols);
	const cryptoQuotes = await getCryptoQuotes();
	const stockQuotes = await getStockQuotes(stockSymbolIds);

	console.log('quotes.getQuotes (end)'.gray);
	return [...cryptoQuotes, ...stockQuotes];
};

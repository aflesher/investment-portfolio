import { getQuotes as getStockQuotes } from './questrade';
import {
	getQuotes as getCryptoQuotes,
	setSymbols as setCryptoSymbols,
} from './coinmarketcap';
import { IOrderV2, IQuote, ITradeV2 } from '../../../declarations';

export const getQuotes = async (
	trades: ITradeV2[],
	orders: IOrderV2[]
): Promise<IQuote[]> => {
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

	const cryptoSymbols = [...cryptoTradeSymbols, ...cryptoOrderSymbols]
		.sort()
		.filter((s, i, a) => !i || s !== a[i - 1]);
	const stockSymbolIds = [...stockTradeSymbolIds, ...stockOrderSymbolIds]
		.sort()
		.filter((s, i, a) => !i || s !== a[i - 1]);

	setCryptoSymbols(cryptoSymbols);
	const cryptoQuotes = await getCryptoQuotes();
	const stockQuotes = await getStockQuotes(stockSymbolIds);

	return [...cryptoQuotes, ...stockQuotes];
};

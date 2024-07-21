import { ICompany, IQuote } from '../../../declarations';
import * as questrade from './questrade';
import * as coinmarketcap from './coinmarketcap';
import { SYMBOL_FILTER } from './filter';

export const getCompanies = async (quotes: IQuote[]): Promise<ICompany[]> => {
	console.log('companies.getCompanies (start)'.gray);
	const symbolIds = quotes
		.filter(
			(quote) =>
				quote.symbolId !== undefined && !SYMBOL_FILTER.includes(quote.symbol)
		)
		.map((quote) => quote.symbolId) as number[];
	const companies = await questrade.getCompanies(symbolIds);
	const cryptoCompanies = await coinmarketcap.getCompanies();

	console.log('companies.getCompanies (end)'.gray);
	return [...companies, ...cryptoCompanies];
};

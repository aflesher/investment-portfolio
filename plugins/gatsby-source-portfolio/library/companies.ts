import { ICompany } from '../../../declarations';
import * as questrade from './questrade';

export const getCompanies = async (
	trades: ITradeV2[],
	quotes: IQuote[]
): Promise<ICompany[]> => {
	return questrade.getCompanies(symbolIds);
};

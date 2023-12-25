import { IDividendV2 } from '../../../declarations';
import * as questrade from './questrade';

export const getDividends = async (): Promise<IDividendV2[]> => {
	console.log('dividends.getDividends (start)'.gray);
	const dividends = await questrade.getDividends();
	console.log('dividends.getDividends (end)'.gray);
	return dividends;
};

import { IDividend } from '../../../declarations';
import * as questrade from './questrade';

export const getDividends = async (): Promise<IDividend[]> => {
	console.log('dividends.getDividends (start)'.gray);
	const dividends = await questrade.getDividends();
	console.log('dividends.getDividends (end)'.gray);
	return dividends;
};

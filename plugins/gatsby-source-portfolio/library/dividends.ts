import { IDividend } from '../../../declarations';
import * as questrade from './questrade';

export const getDividends = async (): Promise<IDividend[]> => {
	console.log('dividends.getDividends (start)'.gray);
	let dividends = await questrade.getDividends();
	console.log('dividends.getDividends (end)'.gray);
	dividends = dividends.filter((d) => {
		if (isNaN(d.amount) || isNaN(d.amountCad) || isNaN(d.amountUsd)) {
			//console.error(`invalid dividend amount`, d);
			return false;
		}

		return true;
	});
	return dividends;
};

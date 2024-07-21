import { IDividend } from '../../../declarations';
import * as questrade from './questrade';
import * as kraken from './kraken';

export const getDividends = async (): Promise<IDividend[]> => {
	console.log('dividends.getDividends (start)'.gray);
	const [questradeDividends, krakenDividends] = await Promise.all([
		questrade.getDividends(),
		kraken.getDividends(),
	]);
	console.log('dividends.getDividends (end)'.gray);
	const dividends = [...questradeDividends, ...krakenDividends].filter((d) => {
		if (isNaN(d.amount) || isNaN(d.amountCad) || isNaN(d.amountUsd)) {
			//console.error(`invalid dividend amount`, d);
			return false;
		}

		return true;
	});
	return dividends;
};

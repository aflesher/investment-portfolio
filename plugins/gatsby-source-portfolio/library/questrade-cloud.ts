import _ from 'lodash';

import * as questrade from './questrade';
import * as cloud from './cloud';
import { IStockSplit } from '../../../src/utils/stock-split';

export const clear = async (): Promise<void> => {
	console.log('clear');
	await cloud.updateTrades();
	await cloud.updateDividends();
};

const addActivities = async (): Promise<boolean> => {
	const activitiesDetails = await questrade.getActivities();
	const activities = activitiesDetails.activities;

	// cloud.addDividend({
	// 	symbol: 'TCEHY',
	// 	symbolId: 38411,
	// 	tradeDate: new Date('2023/04/20'),
	// 	action: '',
	// 	transactionDate: new Date('2023/04/20'),
	// 	settlementDate: new Date('2023/04/20'),
	// 	description: 'dividend',
	// 	currency: 'USD',
	// 	quantity: 282,
	// 	price: 463.21,
	// 	grossAmount: 463.21,
	// 	commission: 0,
	// 	netAmount: 463.21,
	// 	type: 'Dividends',
	// 	accountId: '51637118' as any,
	// });

	// cloud.addDividend({
	// 	symbol: 'TCEHY',
	// 	symbolId: 38411,
	// 	tradeDate: new Date('2023/04/20'),
	// 	action: '',
	// 	transactionDate: new Date('2023/04/20'),
	// 	settlementDate: new Date('2023/04/20'),
	// 	description: 'dividend',
	// 	currency: 'USD',
	// 	quantity: 89,
	// 	price: 146.19,
	// 	grossAmount: 146.19,
	// 	commission: 0,
	// 	netAmount: 146.19,
	// 	type: 'Dividends',
	// 	accountId: '51443858' as any,
	// });

	_.forEach(activities, (activity) => {
		if (activity.type == 'Trades') {
			cloud.addTrade(activity);
		} else if (activity.type == 'Dividends') {
			cloud.addDividend(activity);
		} else if (activity.type == 'Dividend reinvestment') {
			cloud.addTrade(activity);
		} else {
			// Interest, Deposits, Other, Withdrawals Corporate actions
		}
	});

	return activitiesDetails.complete;
};

export const sync = async (
	stockSplitsPromise: Promise<IStockSplit[]>
): Promise<void> => {
	// await clear();
	console.log('questrade.sync (start)'.gray);
	await cloud.getTrades().catch(console.log);
	await cloud.getDividends().catch(console.log);
	const stockSplits = await stockSplitsPromise;
	cloud.applyStockSplits(stockSplits);

	let complete = false;
	while (!complete) {
		complete = await addActivities();
	}

	await cloud.updateTrades().catch(console.log);
	await cloud.updateDividends().catch(console.log);
	cloud.setProfitsAndLosses();
	console.log('questrade.sync (end)'.gray);
};

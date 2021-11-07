import _ from 'lodash';

import * as questrade from './questrade';
import * as cloud from './cloud';

export const clear = async (): Promise<void> => {
	console.log('clear');
	await cloud.updateTrades();
	await cloud.updateDividends();
};

const addActivities = async (): Promise<boolean> => {
	const activitiesDetails = await questrade.getActivities();
	const activities = activitiesDetails.activities;

	_.forEach(activities, activity => {
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

export const sync = async (): Promise<void> => {
	// await clear();
	await cloud.getTrades();
	await cloud.getDividends();

	let complete = false;
	while (!complete) {
		complete = await addActivities();
	}

	await cloud.updateTrades();
	await cloud.updateDividends();
	cloud.setProfitsAndLosses();
};

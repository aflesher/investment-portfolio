import { IAccount } from '../../../declarations/account';
import * as questrade from './questrade';
import * as kraken from './kraken';

export const getAccounts = async (): Promise<IAccount[]> => {
	console.log('companies.getAccounts (start)'.gray);
	const [questradeAccounts, krakenAccount] = await Promise.all([
		questrade.getAccounts(),
		kraken.getAccount(),
	]);

	console.log('companies.getAccounts (end)'.gray);
	return [...questradeAccounts, krakenAccount];
};

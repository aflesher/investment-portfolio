import { IAccount } from '../../../declarations/account';
import * as questrade from './questrade';
import * as kraken from './kraken';

export const getAccounts = async (): Promise<IAccount[]> => {
	const [questradeAccounts, krakenAccount] = await Promise.all([
		questrade.getAccounts(),
		kraken.getAccount(),
	]);

	return [...questradeAccounts, krakenAccount];
};

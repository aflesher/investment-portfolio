import { IAccount } from '../../../declarations/account';
import * as questrade from './questrade';
import * as kraken from './kraken';
import * as binance from './binance';

export const getAccounts = async (): Promise<IAccount[]> => {
	console.log('companies.getAccounts (start)'.gray);
	const [questradeAccounts, krakenAccount] = await Promise.all([
		questrade.getAccounts(),
		kraken.getAccount(),
	]);

	const binanceAccount = binance.getAccount();

	console.log('companies.getAccounts (end)'.gray);
	return [...questradeAccounts, krakenAccount, binanceAccount];
};

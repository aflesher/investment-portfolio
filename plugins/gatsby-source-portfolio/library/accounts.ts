import { IAccount } from '../../../declarations/account';
import * as questrade from './questrade';
import * as kraken from './kraken';
import * as binance from './binance';
import * as firebase from './firebase';

export const getAccounts = async (): Promise<IAccount[]> => {
	console.log('companies.getAccounts (start)'.gray);
	const [
		questradeAccounts,
		krakenAccount,
		firebaseAccounts,
	] = await Promise.all([
		questrade.getAccounts(),
		kraken.getAccount(),
		firebase.getAccounts(),
	]);

	const binanceAccount = binance.getAccount();
	console.log(firebaseAccounts);

	console.log('companies.getAccounts (end)'.gray);
	return [
		...questradeAccounts,
		krakenAccount,
		binanceAccount,
		...firebaseAccounts,
	];
};

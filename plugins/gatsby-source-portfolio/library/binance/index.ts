import { IAccount } from '../../../../declarations';
import { Currency } from '../../../../src/utils/enum';

export const getAccount = (): IAccount => {
	const account: IAccount = {
		accountId: 'binance',
		name: 'Binance',
		isTaxable: true,
		type: 'crypto',
		displayName: 'Binance',
		balances: [
			{
				currency: Currency.cad,
				amount: 0,
				amountCad: 0,
				amountUsd: 0,
			},
			{
				currency: Currency.usd,
				amount: 0,
				amountCad: 0,
				amountUsd: 0,
			},
		],
	};

	return account;
};

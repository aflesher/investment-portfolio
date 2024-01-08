import { Currency } from '../src/utils/enum';

export interface IBalance {
	currency: Currency;
	amount: number;
	amountCad: number;
	amountUsd: number;
}

export interface IAccount {
	accountId: string;
	name: string;
	isTaxable: boolean;
	type:
		| 'margin'
		| 'saving'
		| 'tfsa'
		| 'rrsp'
		| 'resp'
		| 'other'
		| 'crypto'
		| 'non-registered';
	displayName: string;
	balances: IBalance[];
}

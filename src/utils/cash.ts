import { Currency } from './enum';

export interface ICash {
	currency: Currency;
	amount: number;
	accountId: number;
	accountName: string;
	amountCad: number;
	amountUsd: number;
}

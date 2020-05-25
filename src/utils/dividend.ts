import { Currency } from './enum';

export interface IDividend {
	symbol: string,
	timestamp: number,
	amount: number,
	currency: Currency,
	accountId: number,
	amountUsd: number,
	amountCad: number
}
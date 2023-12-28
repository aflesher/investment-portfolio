import { Currency } from '../src/utils/enum';
import { IAccount } from './account';

export interface IOrder {
	symbol: string;
	openQuantity: number;
	totalQuantity: number;
	filledQuantity: number;
	orderType: string;
	limitPrice: number;
	stopPrice: number;
	avgExecPrice: number;
	side: string;
	action: string;
	type: string;
	account: IAccount;
	currency: Currency;
	limitPriceUsd: number;
	limitPriceCad: number;
	symbolId?: number;
}

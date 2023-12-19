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
	accountId: number;
	action: string;
	type: string;
	accountName: string;
	currency: Currency;
	limitPriceUsd: number;
	limitPriceCad: number;
}

export interface IOrderV2 {
	symbol: string;
	openQuantity: number;
	totalQuantity: number;
	filledQuantity: number;
	orderType: string;
	limitPrice: number;
	stopPrice: number;
	avgExecPrice: number;
	side: string;
	accountId: number;
	action: string;
	type: string;
	account: IAccount;
	currency: Currency;
	limitPriceUsd: number;
	limitPriceCad: number;
	symbolId?: number;
}

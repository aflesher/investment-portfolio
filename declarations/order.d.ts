import { Currency } from '../src/utils/enum';

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

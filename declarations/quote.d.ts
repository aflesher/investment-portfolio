import { AssetType, Currency } from '../src/utils/enum';

export interface IQuote {
	price: number;
	symbol: string;
	currency: Currency;
	type: AssetType;
	afterHoursPrice: number;
	priceCad: number;
	priceUsd: number;
	symbolId?: number;
}

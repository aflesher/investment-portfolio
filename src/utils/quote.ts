import { AssetType, Currency } from './enum';

export interface IQuote {
	price: number,
	symbol: string,
	name: string,
	marketCap: number,
	currency: Currency,
	type: AssetType,
	prevDayClosePrice: number
}
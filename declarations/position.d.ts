import { IAssessment } from './assessment';
import { Currency, AssetType } from '../src/utils/enum';
import { ICompany } from './company';
import { IQuote } from './quote';
import { ITrade } from './trade';
import { IAccount } from './account';

export interface IPosition {
	currency: Currency;
	totalCost: number;
	totalCostCad: number;
	totalCostUsd: number;
	currentMarketValue: number;
	currentMarketValueCad: number;
	currentMarketValueUsd: number;
	quantity: number;
	averageEntryPrice: number;
	symbol: string;
	type: AssetType;
	assessment?: IAssessment;
	company?: ICompany;
	quote?: IQuote;
	openPnl: number;
	openPnlUsd: number;
	openPnlCad: number;
	openingTrade?: ITrade;
	accountName?: string;
}

export interface ICryptoPosition
	extends Pick<
		IPosition,
		| 'currency'
		| 'type'
		| 'averageEntryPrice'
		| 'quantity'
		| 'symbol'
		| 'totalCostCad'
	> {
	averageEntryPriceCad: number;
	totalCostUsd: number;
}

export interface IPositionV2 {
	currency: Currency;
	totalCost: number;
	totalCostCad: number;
	totalCostUsd: number;
	currentMarketValue: number;
	currentMarketValueCad: number;
	currentMarketValueUsd: number;
	quantity: number;
	averageEntryPrice: number;
	averageEntryPriceCad: number;
	averageEntryPriceUsd: number;
	symbol: string;
	type: AssetType;
	assessment?: IAssessment;
	company?: ICompany;
	quote?: IQuote;
	openPnl: number;
	openPnlUsd: number;
	openPnlCad: number;
	openingTrade?: ITradeV2;
	account: IAccount;
	symbolId?: number;
}

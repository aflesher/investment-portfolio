import { IAssessment } from './assessment';
import { Currency, AssetType } from '../src/utils/enum';
import { ICompany } from './company';
import { IQuote } from './quote';

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
	openingTrade?: ITrade;
	accounts: {
		accountId: string;
		quantity: number;
	}[];
	symbolId?: number;
}

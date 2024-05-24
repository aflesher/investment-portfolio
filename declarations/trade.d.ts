import { ICompany } from './company';
import { IPosition } from './position';
import { IQuote } from './quote';
import { IAssessment } from './assessment';
import { Currency, AssetType } from '../src/utils/enum';

export interface ITrade {
	symbol: string;
	currency: Currency;
	price: number;
	priceUsd: number;
	priceCad: number;
	isSell: boolean;
	company?: ICompany;
	position?: IPosition;
	quote?: IQuote;
	assessment?: IAssessment;
	timestamp: number;
	pnl: number;
	pnlUsd: number;
	pnlCad: number;
	quantity: number;
	action: string;
	accountId: string;
	type: AssetType;
	symbolId?: number;
	taxable: boolean;
	accountPnl: number;
	accountPnlUsd: number;
	accountPnlCad: number;
}

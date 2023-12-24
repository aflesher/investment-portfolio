import { Currency } from '../src/utils/enum';
import { ICompany } from './company';
import { IPosition, IPositionV2 } from './position';
import { IQuote } from './quote';
import { IAssessment } from './assessment';
import { IAccount } from './account';

export interface IDividend {
	symbol: string;
	timestamp: number;
	amount: number;
	currency: Currency;
	accountId: number;
	amountUsd: number;
	amountCad: number;
	company?: ICompany;
	position?: IPosition;
	quote?: IQuote;
	assessment?: IAssessment;
}

export interface IDividendV2 {
	symbol: string;
	timestamp: number;
	amount: number;
	currency: Currency;
	account: IAccount;
	amountUsd: number;
	amountCad: number;
	company?: ICompany;
	position?: IPositionV2;
	quote?: IQuote;
	assessment?: IAssessment;
	symbolId?: number;
}

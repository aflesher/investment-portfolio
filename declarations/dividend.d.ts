import { Currency } from '../src/utils/enum';
import { ICompany } from './company';
import { IPosition } from './position';
import { IQuote } from './quote';
import { IAssessment } from './assessment';

export interface IDividend {
	symbol: string;
	timestamp: number;
	amount: number;
	currency: Currency;
	accountId: string;
	amountUsd: number;
	amountCad: number;
	company?: ICompany;
	position?: IPosition;
	quote?: IQuote;
	assessment?: IAssessment;
	symbolId?: number;
	reward?: number;
	allocation?: number;
}

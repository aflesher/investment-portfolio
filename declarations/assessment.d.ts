import { AssetType, RatingType } from '../src/utils/enum';

export interface IAssessment {
	checklist: { [key: string]: boolean };
	lastUpdated: Date;
	lastUpdatedTimestamp: number;
	minuses: string[];
	pluses: string[];
	notes: string[];
	questions: string[];
	symbol: string;
	symbolId: number;
	targetInvestment: number;
	targetPrice: number;
	targetInvestmentProgress: number;
	targetPriceProgress: number;
	type: AssetType;
	valuations: string[];
	rating: RatingType;
}

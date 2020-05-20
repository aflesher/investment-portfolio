import { AssetType } from './enum';

export interface IAssessment {
	checklist: {
		excessCash: boolean,
		fomo: boolean,
		othersBuying: boolean,
		valuation: boolean
	},
	lastUpdated: Date,
	lastUpdatedTimestamp: number,
	minuses: string[],
	pluses: string[],
	notes: string[],
	questions: string[],
	sector: string,
	symbol: string,
	symbolId: number,
	targetInvestment: number,
	targetPrice: number,
	targetShares?: number
	type: AssetType,
	valuations: string[]
}
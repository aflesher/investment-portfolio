import React from 'react';
import { ICompanyBannerStateProps } from '../company-banner/CompanyBanner';
import { IAssessment } from '../../../declarations/assessment';
import { IStoreState } from '../../store/store';
import AssessmentSummary from './Summary';
import AssessmentNotes from './Notes';

interface IAssessmentStateProps
	extends ICompanyBannerStateProps,
		Pick<
			IAssessment,
			| 'pluses'
			| 'minuses'
			| 'targetPrice'
			| 'valuations'
			| 'questions'
			| 'lastUpdatedTimestamp'
			| 'notes'
			| 'targetInvestment'
			| 'rating'
		>,
		Pick<IStoreState, 'storage'> {
	quotePrice: number;
	positionTotalCost: number;
	maxShares?: number;
	currentShares?: number;
}

const Assessment: React.FC<IAssessmentStateProps> = ({
	quotePrice,
	name,
	symbol,
	lastUpdatedTimestamp,
	positionTotalCost,
	targetPrice,
	pluses,
	minuses,
	valuations,
	questions,
	notes,
	targetInvestment,
	rating,
	maxShares,
	currentShares,
	storage,
}) => {
	return (
		<div>
			<AssessmentSummary
				quotePrice={quotePrice}
				name={name}
				symbol={symbol}
				lastUpdatedTimestamp={lastUpdatedTimestamp}
				positionTotalCost={positionTotalCost}
				targetInvestment={targetInvestment}
				targetPrice={targetPrice}
				pluses={pluses}
				minuses={minuses}
				valuations={valuations}
				questions={questions}
				rating={rating}
				maxShares={maxShares}
				currentShares={currentShares}
				storage={storage}
			/>
			<AssessmentNotes notes={notes} storage={storage} />
		</div>
	);
};

export default Assessment;

import React from 'react';
import numeral from 'numeral';
// @ts-ignore
import { Link } from 'gatsby';

import { formatDateShort } from '../../../utils/util';
import CompanyBanner, {
	ICompanyBannerStateProps,
} from '../../company-banner/CompanyBanner';
import { IAssessment } from '../../../../declarations/assessment';
import { IStoreState } from '../../../store/store';

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
			| 'targetInvestment'
			| 'rating'
		>,
		Pick<IStoreState, 'storage'> {
	quotePrice: number;
	positionTotalCost: number;
	maxShares?: number;
	currentShares?: number;
}

const AssessmentSummary: React.FC<IAssessmentStateProps> = ({
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
	targetInvestment,
	rating,
	maxShares,
	currentShares,
	storage,
}) => {
	return (
		<div className='border-t py-3 assessment'>
			{!!name && <CompanyBanner name={name} symbol={symbol} />}
			<div className='clearfix mt-2'>
				<div className='float-left text-uppercase'>
					<Link to={`/stock/${symbol}`}>{symbol}</Link>
					<span className='text-subtle ml-2 font-italic'>{rating}</span>
				</div>
				<div className='float-right'>{formatDateShort(lastUpdatedTimestamp)}</div>
			</div>
			<div className='d-large-none d-xl-none my-4'></div>
			{rating === 'buy' && (
				<div className='row'>
					<div className='col-4 text-right'>TARGET INVESTMENT</div>
					<div className='col-8'>
						<div style={{ width: '50%' }}>
							<div className='bar-graph bar-background blue-glow'>
								<div className='left-value'>$0.00</div>
								<div className='right-value'>
									{numeral(targetInvestment).format('$0,0.00')}
								</div>
								<div
									className='bar'
									style={{
										width: `${
											Math.min(positionTotalCost / targetInvestment, 1.5) * 100
										}%`,
									}}
								>
									<div className='right-value'>
										{numeral(positionTotalCost).format('$0,0.00')}
									</div>
									<div className='end-value'>
										{numeral(positionTotalCost / targetInvestment).format('0%')}
									</div>
								</div>
							</div>
						</div>
					</div>
				</div>
			)}
			{rating === 'sell' && (
				<div className='row'>
					<div className='col-4 text-right'>REMAINING SHARES</div>
					<div className='col-8'>
						<div style={{ width: '50%' }}>
							<div className='bar-graph bar-background negative'>
								<div className='left-value'>0</div>
								<div className='right-value'>{maxShares}</div>
								<div
									className='bar'
									style={{
										width: `${((currentShares || 0) / (maxShares || 0)) * 100}%`,
									}}
								>
									<div className='right-value'>{currentShares}</div>
									<div className='end-value'>
										{numeral((currentShares || 0) / (maxShares || 0)).format('0%')}
									</div>
								</div>
							</div>
						</div>
					</div>
				</div>
			)}
			{!!targetPrice && (
				<div className='row mt-4'>
					<div className='col-4 text-right'>TARGET PRICE</div>
					<div className='col-8'>
						<div style={{ width: '50%' }}>
							<div className='bar-graph bar-background blue-glow'>
								<div className='left-value'>$0.00</div>
								<div className='right-value'>
									{numeral(targetPrice).format('$0,0.00')}
								</div>
								<div
									className='bar'
									style={{
										width: `${Math.min((quotePrice / targetPrice) * 100, 120)}%`,
									}}
								>
									<div className='right-value'>
										{numeral(quotePrice || 0).format('$0,0.00')}
									</div>
									<div className='end-value'>
										{numeral(quotePrice / targetPrice).format('0%')}
									</div>
								</div>
							</div>
						</div>
					</div>
				</div>
			)}
			<div className='row my-3'>
				<div className='col-lg-6'>
					{pluses.map((plus, index) => (
						<div className='plus' key={`plus${index}`}>
							{plus}
						</div>
					))}
				</div>
				<div className='col-lg-6'>
					{minuses.map((minus, index) => (
						<div className='minus' key={`minus${index}`}>
							{minus}
						</div>
					))}
				</div>
			</div>
			<div className='row my-3'>
				<div className='col-lg-12'>
					{questions.map((question, index) => (
						<div className='question' key={`question${index}`}>
							{question}
						</div>
					))}
				</div>
			</div>
			<div>
				{valuations.map((valuation, index) => (
					<div className='my-2 p-3 notes' key={`valuation${index}`}>
						{valuation}
					</div>
				))}
			</div>
		</div>
	);
};

export default AssessmentSummary;

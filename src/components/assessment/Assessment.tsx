import React from 'react';
import numeral from 'numeral';
// @ts-ignore
import { Link } from 'gatsby';

import { formatDateShort } from '../../utils/util';
import CompanyBanner, { ICompanyBannerStateProps } from '../company-banner/CompanyBanner';

interface IAssessmentStateProps extends ICompanyBannerStateProps {
	targetInvestment: number,
	quotePrice: number,
	positionTotalCost: number,
	lastUpdatedTimestamp: number,
	targetPrice: number,
	pluses: string[],
	minuses: string[],
	valuations: string[],
	questions: string[],
	notes: string[]
};

const Assessment: React.FC<IAssessmentStateProps> = ({
	quotePrice, name, symbol, lastUpdatedTimestamp, positionTotalCost, targetPrice, pluses, minuses,
	valuations, questions, notes, targetInvestment
}) => {

	return (
		<div className='border-t py-3 assessment'>
			{!!name && <CompanyBanner
				name={name}
				symbol={symbol}
			/>}
			<div className='clearfix mt-2'>
				<div className='float-left text-uppercase'>
					<Link to={`/stock/${symbol}`}>
						{symbol}
					</Link>
				</div>
				<div className='float-right'>
					{formatDateShort(lastUpdatedTimestamp)}
				</div>
			</div>
			<div className='d-large-none d-xl-none my-4'></div>
			<div className='row'>
				<div className='col-4 text-right'>
					TARGET INVESTMENT
				</div>
				<div className='col-8'>
					{targetInvestment ? <div style={{width: '50%'}}>
						<div className='bar-graph bar-background blue-glow'>
							<div className='left-value'>$0.00</div>
							<div className='right-value'>
								{numeral(targetInvestment).format('$0,0.00')}
							</div>
							<div
								className='bar'
								style={{
									width:
									`${Math.min(positionTotalCost / targetInvestment, 1.5) * 100}%`
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
					</div> : <div>N/A</div>}
				</div>
			</div>
			<div className='row mt-4'>
				<div className='col-4 text-right'>
					TARGET PRICE
				</div>
				<div className='col-8'>
					{targetPrice ? <div style={{width: '50%'}}>
						<div className='bar-graph bar-background blue-glow'>
							<div className='left-value'>$0.00</div>
							<div className='right-value'>
								{numeral(targetPrice).format('$0,0.00')}
							</div>
							<div
								className='bar'
								style={{
									width:
									`${(quotePrice /targetPrice) * 100}%`
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
					</div> : <div>N/A</div>}
				</div>
			</div>
			<div className='row my-3'>
				<div className='col-lg-6'>
					{pluses.map((plus, index) =>
						<div className='plus' key={`plus${index}`}>
							{plus}
						</div>
					)}
				</div>
				<div className='col-lg-6'>
					{minuses.map((minus, index) =>
						<div className='minus' key={`minus${index}`}>
							{minus}
						</div>
					)}
				</div>
			</div>
			<div className='row my-3'>
				<div className='col-lg-12'>
					{questions.map((question, index) =>
						<div className='question' key={`question${index}`}>
							{question}
						</div>
					)}
				</div>
			</div>
			<div>
				{valuations.map((valuation, index) =>
					<div className='my-2 p-3 notes' key={`valuation${index}`}>
						{valuation}
					</div>)
				}
			</div>
			<div className='mt-4'>
				{notes.map((note, index) =>
					<div className='my-2 p-3 notes' key={`note${index}`}>
						{note}
					</div>)
				}
			</div>
		</div>
	);
};

export default Assessment;
import React from 'react';
import Paginate from 'react-paginate';
// @ts-ignore
import { graphql } from 'gatsby';
import _ from 'lodash';
import {Typeahead} from 'react-bootstrap-typeahead';

import Assessment from '../components/assessment/Assessment';
import Layout from '../components/layout';
import { Currency } from '../utils/enum';
import { dateInputFormat } from '../utils/util';

const ASSESSMENTS_PER_PAGE = 3;

interface IAssessmentsQuery {
	data: {
		allAssessment: {
			nodes: {
				symbol: string,
				market: string,
				pluses: string[],
				minuses: string[],
				targetPrice: number,
				targetShares: number,
				targetInvestment: number,
				notes: string[],
				lastUpdatedTimestamp: number,
				questions: string[],
				valuations: string[],
				position?: {
					quantity: number,
					totalCost: number,
				},
				quote?: {
					price: number,
					currency: Currency
				}
				company?: {
					name: string
					marketCap: number
				}
			}[]
		}
	}
}

const Assessments: React.FC<IAssessmentsQuery> = ({ data }) => {

	const [symbol, setSymbol] = React.useState('');
	const [page, setPage] = React.useState(0);
	const [startDate, setStartDate] = React.useState(new Date('2011-01-01'));
	const [endDate, setEndDate] = React.useState(new Date());

	const assessments = _.filter(data.allAssessment.nodes, assessment => {
		if (startDate && startDate > new Date(assessment.lastUpdatedTimestamp)) {
			return false;
		}

		if (endDate && endDate < new Date(assessment.lastUpdatedTimestamp)) {
			return false;
		}

		if (
			symbol &&
			!assessment.symbol.match(new RegExp(`^${symbol}.*`, 'gi'))
		) {
			return false;
		}
		
		return true;
	});

	const changeSymbol = (symbol: string):void => {
		setSymbol(symbol);
		setPage(0);
	};

	const handleStartDateChange = (event: React.ChangeEvent<HTMLInputElement>): void => {
		setStartDate(new Date(event.target.value));
		setPage(0);
	};

	const handleEndDateChange = (event: React.ChangeEvent<HTMLInputElement>): void => {
		setEndDate(new Date(event.target.value));
		setPage(0);
	};

	return (
		<Layout>
			<div className='p-4'>
				<div className='row'>
					
					<div className='col-lg-2'>
						<div className='form-group'>
							<label className='form-label'>
								Symbol
							</label>
							<div className='input-group'>
								<Typeahead
									onChange={(symbol): void => changeSymbol(symbol[0])}
									onInputChange={(symbol): void => changeSymbol(symbol)}
									options={_.map(assessments, q => q.symbol)}
									id='symbol'
								/>
							</div>
						</div>
					</div>

					<div className='d-none d-lg-block col-3'>
						<div className='form-group'>
							<label className='form-label'>
								After
							</label>
							<div className='input-group'>
								<input
									type='date'
									value={dateInputFormat(startDate)}
									onChange={(e): void => handleStartDateChange(e)}
									className='form-control'
								/>
							</div>
						</div>
					</div>

					<div className='d-none d-lg-block col-3'>
						<div className='form-group'>
							<label className='form-label'>
								Before
							</label>
							<div className='input-group'>
								<input
									type='date'
									value={dateInputFormat(endDate)}
									onChange={(e): void => handleEndDateChange(e)}
									className='form-control'
								/>
							</div>
						</div>
					</div>

				</div>
				<div className='row'>
					<div className='col-12'>
						<div className='paginate d-flex justify-content-center'>
							<Paginate
								pageCount={Math.ceil(assessments.length / ASSESSMENTS_PER_PAGE)}
								onPageChange={(resp): void => setPage(resp.selected)}
								nextLabel='>'
								previousLabel='<'
								forcePage={page}
								marginPagesDisplayed={3}
								pageRangeDisplayed={6}
							/>
						</div>
					</div>
				</div>
				{assessments
					.slice(page * ASSESSMENTS_PER_PAGE, (page * ASSESSMENTS_PER_PAGE) + ASSESSMENTS_PER_PAGE)
					.map(assessment => (
						<Assessment
							key={assessment.symbol}
							{ ...assessment }
							quotePrice={assessment.quote?.price || 0}
							positionTotalCost={assessment.position?.totalCost || 0}
							name={assessment.company?.name || '???'}
						/>
					))
				}
			</div>
		</Layout>
	);
};

export default Assessments;

export const pageQuery = graphql`
	query {
		allAssessment(
			sort: {fields: [lastUpdatedTimestamp], order: DESC}
			filter: {assessment: {eq: true}}
		) {
			nodes {
				assessment
				symbol
				market
				pluses
				minuses
				targetPrice
				targetShares
				targetInvestment
				notes
				lastUpdatedTimestamp
				questions
				valuations
				position {
					quantity
					totalCost
				}
				quote {
					price
					currency
				}
				company {
					name
					marketCap
				}
			}
		}
	}
	`;
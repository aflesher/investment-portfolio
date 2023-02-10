import React from 'react';
import { graphql } from 'gatsby';
import _ from 'lodash';
import { Typeahead } from 'react-bootstrap-typeahead';

import Assessment from '../components/assessment/Assessment';
import Layout from '../components/layout';
import { dateInputFormat, getMaxShares } from '../utils/util';
import { IAssessment } from '../utils/assessment';
import { ITrade } from '../utils/trade';
import { IPosition } from '../utils/position';
import { IQuote } from '../utils/quote';
import { ICompany } from '../utils/company';
import { connect } from 'react-redux';
import { IStoreState } from '../store/store';

interface IAssessmentTrade
	extends Pick<ITrade, 'quantity' | 'timestamp' | 'isSell'> {}
interface IAssessmentNode extends IAssessment {
	position?: Pick<IPosition, 'quantity' | 'totalCost'>;
	quote?: Pick<IQuote, 'price' | 'currency'>;
	company?: Pick<ICompany, 'name' | 'marketCap'>;
	trades: IAssessmentTrade[];
}

interface IAssessmentsQuery {
	data: {
		allAssessment: {
			nodes: IAssessmentNode[];
		};
	};
}

interface IAssessmentStateProps extends Pick<IStoreState, 'storage'> {}

const mapStateToProps = ({ storage }: IStoreState): IAssessmentStateProps => ({
	storage,
});

const Assessments: React.FC<IAssessmentsQuery & IAssessmentStateProps> = ({
	data,
	storage,
}) => {
	const [symbol, setSymbol] = React.useState('');
	const [startDate, setStartDate] = React.useState(new Date('2011-01-01'));
	const [endDate, setEndDate] = React.useState(new Date());

	const assessments = _.filter(data.allAssessment.nodes, (assessment) => {
		if (startDate && startDate > new Date(assessment.lastUpdatedTimestamp)) {
			return false;
		}

		if (endDate && endDate < new Date(assessment.lastUpdatedTimestamp)) {
			return false;
		}

		if (symbol && !assessment.symbol.match(new RegExp(`^${symbol}.*`, 'gi'))) {
			return false;
		}

		return true;
	});

	const changeSymbol = (symbol: string): void => {
		setSymbol(symbol);
	};

	const handleStartDateChange = (
		event: React.ChangeEvent<HTMLInputElement>
	): void => {
		setStartDate(new Date(event.target.value));
	};

	const handleEndDateChange = (
		event: React.ChangeEvent<HTMLInputElement>
	): void => {
		setEndDate(new Date(event.target.value));
	};

	console.log(storage, storage);

	return (
		<Layout>
			<div className='p-4'>
				<div className='row'>
					<div className='col-lg-2'>
						<div className='form-group'>
							<label className='form-label'>Symbol</label>
							<div className='input-group'>
								<Typeahead
									onChange={(symbol): void => changeSymbol(symbol[0])}
									onInputChange={(symbol): void => changeSymbol(symbol)}
									options={_.map(assessments, (q) => q.symbol)}
									id='symbol'
								/>
							</div>
						</div>
					</div>

					<div className='d-none d-lg-block col-3'>
						<div className='form-group'>
							<label className='form-label'>After</label>
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
							<label className='form-label'>Before</label>
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
				{assessments.map((assessment) => (
					<Assessment
						key={assessment.symbol}
						{...assessment}
						quotePrice={assessment.quote?.price || 0}
						positionTotalCost={assessment.position?.totalCost || 0}
						name={assessment.company?.name || '???'}
						maxShares={getMaxShares(assessment.trades)}
						currentShares={assessment.position?.quantity || 0}
						storage={storage}
					/>
				))}
			</div>
		</Layout>
	);
};

export default connect(mapStateToProps, null)(Assessments);

export const pageQuery = graphql`
	query {
		allAssessment(sort: { fields: [lastUpdatedTimestamp], order: DESC }) {
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
				rating
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
				trades {
					isSell
					quantity
					timestamp
				}
			}
		}
	}
`;

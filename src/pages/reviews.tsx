import React, { ReactElement, useCallback } from 'react';
import numeral from 'numeral';
import { graphql } from 'gatsby';
import crypto from 'crypto';
import { connect } from 'react-redux';
import Layout from '../components/layout';
import { IReview } from '../../declarations/review';
import { compareNumber } from '../utils/util';
import {
	IGoalStatus,
	IStoreAction,
	IStoreState,
	SET_GOAL_STATUS,
} from '../store/store';
import {
	IAccount,
	IAssessment,
	ICompany,
	IPosition,
	IQuote,
	ITrade,
} from '../../declarations';
import { getPortfolioAllocations } from '../utils/calculate';
import { PercentBar } from '../components/percent/PercentBar';

interface IPositionNode
	extends Pick<
		IPosition,
		| 'currency'
		| 'totalCostCad'
		| 'totalCostUsd'
		| 'currentMarketValueCad'
		| 'currentMarketValueUsd'
		| 'quantity'
		| 'averageEntryPrice'
		| 'symbol'
		| 'type'
	> {
	quote: Pick<IQuote, 'price' | 'priceCad' | 'priceUsd' | 'currency'>;
	company: Pick<
		ICompany,
		'pe' | 'yield' | 'prevDayClosePrice' | 'marketCap' | 'name' | 'hisa'
	>;
	assessment?: Pick<
		IAssessment,
		| 'targetInvestmentProgress'
		| 'targetPriceProgress'
		| 'targetInvestment'
		| 'rating'
		| 'checklist'
	>;
	trades: Pick<ITrade, 'timestamp' | 'isSell' | 'quantity'>[];
}

interface ITradeNode extends Pick<ITrade, 'symbol'> {}

interface IAssessmentNode
	extends Pick<IAssessment, 'lastUpdatedTimestamp' | 'symbol'> {
	company?: Pick<ICompany, 'marketCap'>;
}

interface IReviewQuery {
	data: {
		allReview: {
			nodes: IReview[];
		};
		allPosition: {
			nodes: IPositionNode[];
		};
		allAccount: {
			nodes: IAccount[];
		};
		allAssessment: {
			nodes: IAssessmentNode[];
		};
		allTrade: {
			nodes: ITradeNode[];
		};
	};
}

interface IReviewStateProps
	extends Pick<IStoreState, 'goalStatuses' | 'firestore'> {}

interface IReviewDispatchProps {
	setGoalStatus: (goalStatus: IGoalStatus) => void;
}

const mapStateToProps = ({
	goalStatuses,
	firestore,
}: IStoreState): IReviewStateProps => ({
	goalStatuses,
	firestore,
});

const mapDispatchToProps = (
	dispatch: (action: IStoreAction) => void
): IReviewDispatchProps => {
	return {
		setGoalStatus: (goalStatus: IGoalStatus): void =>
			dispatch({
				type: SET_GOAL_STATUS,
				payload: goalStatus,
			}),
	};
};

const MIDCAPS = ['rivn'];

const Reviews: React.FC<
	IReviewQuery & IReviewStateProps & IReviewDispatchProps
> = ({ data, goalStatuses, setGoalStatus, firestore }) => {
	const reviews = data.allReview.nodes
		.filter((q) => q.year < new Date().getFullYear())
		.sort((a, b) => compareNumber(b.year, a.year));

	const positions = data.allPosition.nodes;
	const accounts = data.allAccount.nodes;
	const assessments = data.allAssessment.nodes;
	const trades = data.allTrade.nodes;

	const goalId = (goal: string): string => {
		return crypto.createHash('md5').update(JSON.stringify(goal)).digest('hex');
	};

	const toggleGoal = async (text: string, achieved: boolean) => {
		if (!firestore) {
			return;
		}
		setGoalStatus({ text, achieved });
		const docs = await (await firestore.collection('goalStatus').get()).docs;
		const docRef =
			docs.find((doc) => (doc.data() as IGoalStatus).text === text)?.ref ||
			firestore.collection('goalStatus').doc();
		docRef.set({ text, achieved }, { merge: true });
	};

	const calculatePortfolioAllocationGoalProgress = useCallback(
		(text: string): null | number => {
			if (text !== '+33% stocks') {
				return null;
			}

			const { stock } = getPortfolioAllocations(positions, accounts);
			const goal = (0.33 - 0.23) * 100;
			const current = (stock - 0.23) * 100;

			return current / goal;
		},
		[positions, accounts]
	);

	const calculatePurchaseGoalProgress = useCallback(
		(
			text: string
		): null | {
			progress: number;
			values: { month: string; completed: boolean }[];
		} => {
			if (text !== 'Buy VOO every month') {
				return null;
			}

			const trades = positions.find((position) => position.symbol === 'voo')
				?.trades;
			if (!trades) {
				return null;
			}

			const filteredTrades = trades
				.filter((t) => new Date(t.timestamp).getFullYear() === 2024)
				.map((t) => new Date(t.timestamp).getMonth());

			const values = [...Array(12).keys()].map((month) => ({
				month: new Date(2024, month).toLocaleString('default', { month: 'long' }),
				completed: filteredTrades.includes(month),
			}));

			const progress = [...new Set(filteredTrades)].length / 12;

			return { progress, values };
		},
		[positions]
	);

	const calculateAssessmentGoals = useCallback(
		(text: string): null | { goal: number; values: string[] } => {
			if (text !== 'Do assessments for 5 midcap companies') {
				return null;
			}

			const midcaps = assessments.filter((assessment) => {
				const marketCap = assessment.company?.marketCap;
				return (
					(marketCap && marketCap < 10000000000) ||
					MIDCAPS.includes(assessment.symbol)
				);
			});

			const tradesSymbols = trades.map((q) => q.symbol);

			const recentAssessments = midcaps
				.filter(
					(assessment) =>
						assessment.lastUpdatedTimestamp > new Date('2024').getTime() &&
						!tradesSymbols.includes(assessment.symbol)
				)
				.map((q) => q.symbol);

			const goal = recentAssessments.length / 5;

			return { goal, values: recentAssessments };
		},
		[assessments, trades]
	);

	const calculateReassessmentGoals = useCallback(
		(
			text: string
		): null | {
			progress: number;
			values: { symbol: string; assessment: boolean }[];
		} => {
			if (text !== 'Re-evaluate every stock you own.') {
				return null;
			}

			const symbols = positions
				.filter((q) => !q.company.hisa)
				.map((position) => position.symbol);

			const reassessments = assessments.filter(
				(assessment) =>
					assessment.lastUpdatedTimestamp > new Date('2024').getTime() &&
					symbols.includes(assessment.symbol)
			);

			console.log('calculate');
			console.log(
				symbols.filter((s) => !reassessments.map((r) => r.symbol).includes(s))
			);

			const values = symbols.map((symbol) => ({ symbol, assessment: false }));
			reassessments.forEach((reassessment) => {
				const value = values.find((value) => value.symbol === reassessment.symbol);
				if (value) {
					value.assessment = true;
				}
			});

			const progress = reassessments.length / symbols.length;

			return { progress, values };
		},
		[assessments, positions]
	);

	const calculateGoalProgresses = useCallback(
		(text: string): null | ReactElement => {
			let goal = calculatePortfolioAllocationGoalProgress(text);
			if (!goal) {
				const result = calculatePurchaseGoalProgress(text);
				if (result !== null) {
					const { progress, values } = result;
					goal = progress;
					return (
						<div>
							<PercentBar percent={result.progress} />
							<div>
								{values.map(({ month, completed }) => (
									<>
										<span
											className={`text-uppercase text-small ${
												completed ? 'text-subtle' : ''
											}`}
											style={{ textDecorationLine: completed ? 'line-through' : 'none' }}
											key={month}
										>
											{month.substring(0, 3)}
										</span>{' '}
									</>
								))}
							</div>
						</div>
					);
				}
			}

			if (!goal) {
				const result = calculateAssessmentGoals(text);
				if (result !== null) {
					const { goal, values } = result;
					return (
						<div>
							<PercentBar percent={goal} />
							<div>
								{values.map((symbol) => (
									<>
										<span className={`text-uppercase text-small`} key={symbol}>
											${symbol}
										</span>{' '}
									</>
								))}
							</div>
						</div>
					);
				}
			}

			if (!goal) {
				const result = calculateReassessmentGoals(text);
				if (result !== null) {
					const { progress, values } = result;
					goal = progress;
					return (
						<div>
							<PercentBar percent={result.progress} />
							<div>
								{values.map(({ symbol, assessment }) => (
									<>
										<span
											className={`text-uppercase text-small ${
												assessment ? 'text-subtle' : ''
											}`}
											style={{ textDecorationLine: assessment ? 'line-through' : 'none' }}
											key={symbol}
										>
											${symbol}
										</span>{' '}
									</>
								))}
							</div>
						</div>
					);
				}
			}

			if (goal !== null) {
				return <PercentBar percent={goal} />;
			}

			return null;
		},
		[
			calculatePortfolioAllocationGoalProgress,
			calculatePurchaseGoalProgress,
			calculateAssessmentGoals,
			calculateReassessmentGoals,
		]
	);

	return (
		<Layout>
			<div className='p-4'>
				{reviews.map((review) => (
					<div
						className='mb-4 py-4'
						style={{ borderBottom: '3px solid #fefefe' }}
						key={review.year}
					>
						<div className='d-flex justify-content-between pb-1 border-b mb-3'>
							<div>
								<h2>{review.year}</h2>
							</div>
							<div className='text-right'>
								<h4>{review.grade}</h4>
							</div>
						</div>
						<div className='row mb-4'>
							<div className='col-4'>
								<h4 className='text-positive'>Start</h4>
								{review.start.map((start) => (
									<div className='py-2 border-b' key={start}>
										{start}
									</div>
								))}
							</div>
							<div className='col-4'>
								<h4 className='text-negative'>Stop</h4>
								{review.stop.map((stop) => (
									<div className='py-2 border-b' key={stop}>
										{stop}
									</div>
								))}
							</div>
							<div className='col-4'>
								<h4 className='text-neutral'>Continue</h4>
								{review.continue.map((c) => (
									<div className='py-2 border-b' key={c}>
										{c}
									</div>
								))}
							</div>
						</div>
						<h4 className='text-neutral'>Goals</h4>
						{review.goals.map((goal) => (
							<div className='py-2 border-b row' key={goalId(goal)}>
								<div className='col-6'>
									<div className='form-check'>
										<input
											type='checkbox'
											className='form-check-input'
											id={goalId(goal)}
											checked={
												goalStatuses.find(({ text }) => text === goal)?.achieved || false
											}
											onChange={(e) => toggleGoal(goal, e.target.checked)}
										/>
										<label className='form-check-label' htmlFor={goalId(goal)}>
											<span
												style={{
													textDecoration: goalStatuses.find(({ text }) => text === goal)
														?.achieved
														? 'line-through'
														: 'none',
												}}
											>
												{goal}
											</span>
										</label>
									</div>
								</div>
								<div className='col-6'>{calculateGoalProgresses(goal)}</div>
							</div>
						))}
						<div className='row mb-4 mt-4'>
							<div className='col-6'>
								<h4 className='text-positive'>Highlights</h4>
								{review.highlights.map((highlight) => (
									<div className='py-2 border-b' key={highlight}>
										{highlight}
									</div>
								))}
							</div>
							<div className='col-6'>
								<h4 className='text-negative'>Lowlights</h4>
								{review.lowlights.map((lowlight) => (
									<div className='py-2 border-b' key={lowlight}>
										{lowlight}
									</div>
								))}
							</div>
						</div>
						<div className='display-linebreak'>{review.comments}</div>
					</div>
				))}
			</div>
		</Layout>
	);
};

export default connect(mapStateToProps, mapDispatchToProps)(Reviews);

export const pageQuery = graphql`
	query {
		allReview {
			nodes {
				comments
				continue
				goals
				grade
				highlights
				lowlights
				start
				stop
				year
			}
		}
		allAccount {
			nodes {
				displayName
				accountId
				name
				isTaxable
				type
				balances {
					amount
					amountCad
					amountUsd
					currency
				}
			}
		}
		allAssessment(filter: { type: { eq: "stock" } }) {
			nodes {
				company {
					marketCap
				}
				lastUpdatedTimestamp
				symbol
			}
		}
		allPosition {
			nodes {
				currency
				totalCostCad
				totalCostUsd
				currentMarketValueCad
				currentMarketValueUsd
				quantity
				averageEntryPrice
				symbol
				type
				quote {
					price
					priceCad
					currency
				}
				company {
					pe
					yield
					prevDayClosePrice
					marketCap
					name
					hisa
				}
				assessment {
					targetInvestmentProgress
					targetPriceProgress
					targetInvestment
					rating
					checklist {
						pristine
					}
				}
				trades {
					quantity
					timestamp
					isSell
				}
			}
		}
		allTrade(filter: { timestamp: { lt: 1704067200000 } }) {
			nodes {
				symbol
			}
		}
	}
`;

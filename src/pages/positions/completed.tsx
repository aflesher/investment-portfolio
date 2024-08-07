import React, { useState, FC } from 'react';
import Paginate from 'react-paginate';
import _ from 'lodash';
import { graphql } from 'gatsby';
import Octicon, { TriangleDown, TriangleUp } from '@primer/octicons-react';

import CompletedPosition, {
	ICompletePositionStateProps,
} from '../../components/completed-position/CompletedPosition';
import { Currency, AssetType } from '../../utils/enum';
import Layout from '../../components/layout';
import { dateInputFormat } from '../../utils/util';

interface ICompletedPositionsQuery {
	data: {
		allTrade: {
			nodes: {
				quantity: number;
				price: number;
				action: string;
				symbol: string;
				timestamp: number;
				pnl: number;
				pnlCad: number;
				pnlUsd: number;
				assessment?: {
					targetPriceProgress: number;
					targetInvestmentProgress: number;
					type: AssetType;
				};
				company: {
					name: string;
					marketCap: number;
					prevDayClosePrice: number;
					symbol: string;
					yield: number;
				};
				quote: {
					price: number;
					priceUsd: number;
					priceCad: number;
					currency: Currency;
				};
				position?: {
					quantity: number;
					totalCost: number;
					totalCostUsd: number;
					totalCostCad: number;
					currentMarketValueCad: number;
					currentMarketValueUsd: number;
					averageEntryPrice: number;
					openPnl: number;
					openPnlCad: number;
				};
			}[];
		};
	};
}

const TRADE_SUMMARIES_PER_PAGE = 20;

enum OrderBy {
	symbol,
	shares,
	cost,
	proceeds,
	pnlPercentage,
	pnlAmount,
	openedDate,
	closedDate,
}

interface ICompletedPosition extends ICompletePositionStateProps {
	quantitySold: number;
}

const CompletedPositions: FC<ICompletedPositionsQuery> = ({ data }) => {
	let completedPositions: ICompletedPosition[] = [];
	const runningCompletedPositions: ICompletedPosition[] = [];

	const [filterSymbol, setFilterSymbol] = useState('');
	const [filterStartDate, setFilterStartDate] = useState(new Date('2011-01-01'));
	const [filterEndDate, setFilterEndDate] = useState(new Date());
	const [page, setPage] = useState(0);
	const [orderBy, setOrderBy] = useState(OrderBy.closedDate);
	const [orderAscending, setOrderAscending] = useState(false);

	data.allTrade.nodes.forEach((trade) => {
		let completedPosition:
			| ICompletedPosition
			| undefined = runningCompletedPositions.find(
			(q) => q.symbol === trade.symbol
		);
		if (!trade.company) {
			return;
		}
		if (!completedPosition) {
			completedPosition = {
				avgPricePaid: 0,
				quantityBought: 0,
				avgPriceSold: 0,
				quantitySold: 0,
				closedTimestamp: 0,
				openedTimestamp: 0,
				pnlCad: 0,
				pnlUsd: 0,
				...trade.quote,
				...trade.company,
				pnlPercentage: 0,
			};
			runningCompletedPositions.push(completedPosition);
		}

		if (trade.action == 'sell') {
			if (trade.quantity <= completedPosition.quantityBought) {
				completedPosition.avgPriceSold =
					(completedPosition.avgPriceSold * completedPosition.quantitySold +
						trade.price * trade.quantity) /
					(completedPosition.quantitySold + trade.quantity);
				completedPosition.quantitySold += trade.quantity;
				completedPosition.pnlCad += trade.pnlCad;
				completedPosition.pnlUsd += trade.pnlUsd;
			}
		} else {
			completedPosition.avgPricePaid =
				(completedPosition.avgPricePaid * completedPosition.quantityBought +
					trade.price * trade.quantity) /
				(completedPosition.quantityBought + trade.quantity);
			completedPosition.quantityBought += trade.quantity;
		}

		if (trade.timestamp > completedPosition.closedTimestamp) {
			completedPosition.closedTimestamp = trade.timestamp;
		}

		if (
			trade.timestamp < completedPosition.openedTimestamp ||
			!completedPosition.openedTimestamp
		) {
			completedPosition.openedTimestamp = trade.timestamp;
		}

		// position closed out
		if (completedPosition.quantitySold - completedPosition.quantityBought == 0) {
			completedPositions.push(completedPosition);
			// setting to null should allow new trade summary to be opened up
			_.remove(runningCompletedPositions, completedPosition);
		}
	});

	completedPositions.forEach((completedPosition) => {
		completedPosition.pnlPercentage =
			(completedPosition.avgPriceSold - completedPosition.avgPricePaid) /
			completedPosition.avgPricePaid;
	});

	const filteredCompletedPositions = completedPositions.filter((cp) => {
		if (!cp.quantityBought) {
			return false;
		}

		if (filterStartDate && filterStartDate > new Date(cp.closedTimestamp)) {
			return false;
		}

		if (filterEndDate && filterEndDate < new Date(cp.closedTimestamp)) {
			return false;
		}

		if (
			filterSymbol &&
			!cp.symbol.match(new RegExp(`^${filterSymbol}.*`, 'gi'))
		) {
			return false;
		}

		return true;
	});

	completedPositions = _.orderBy(
		filteredCompletedPositions,
		(cp) => {
			switch (orderBy) {
				case OrderBy.symbol:
					return cp.symbol;
				case OrderBy.shares:
					return cp.quantitySold;
				case OrderBy.closedDate:
					return cp.closedTimestamp;
			}
		},
		orderAscending ? 'asc' : 'desc'
	);

	const changeSortOrder = (newOrderBy: OrderBy) => {
		setOrderAscending(newOrderBy === orderBy ? !orderAscending : false);
		setOrderBy(newOrderBy);
	};

	return (
		<Layout>
			<div className='activity p-4'>
				<div className='row'>
					<div className='col-3'>
						<div className='form-group'>
							<label className='form-label'>Symbol</label>
							<div className='input-group'>
								<input
									type='text'
									value={filterSymbol}
									onChange={(e) => {
										setFilterSymbol(e.target.value);
										setPage(0);
									}}
									placeholder='symbol'
									className='form-control'
								/>
							</div>
						</div>
					</div>
					<div className='col-3'>
						<div className='form-group'>
							<label className='form-label'>Start</label>
							<div className='input-group'>
								<input
									type='date'
									value={dateInputFormat(filterStartDate)}
									onChange={(e) => {
										setFilterStartDate(new Date(e.target.value));
										setPage(0);
									}}
									className='form-control'
									max={dateInputFormat(new Date())}
									min={dateInputFormat(new Date('2011-01-01'))}
								/>
							</div>
						</div>
					</div>
					<div className='col-3'>
						<div className='form-group'>
							<label className='form-label'>End</label>
							<div className='input-group'>
								<input
									type='date'
									value={dateInputFormat(filterEndDate)}
									onChange={(e) => {
										setFilterEndDate(new Date(e.target.value));
										setPage(0);
									}}
									className='form-control'
									max={dateInputFormat(new Date())}
									min={dateInputFormat(new Date('2011-01-01'))}
								/>
							</div>
						</div>
					</div>
				</div>
				<div className='row'>
					<div className='col-12'>
						<div className='paginate d-flex justify-content-center'>
							<Paginate
								pageCount={Math.ceil(
									completedPositions.length / TRADE_SUMMARIES_PER_PAGE
								)}
								onPageChange={(resp) => setPage(resp.selected)}
								nextLabel='>'
								previousLabel='<'
								forcePage={page}
								marginPagesDisplayed={3}
								pageRangeDisplayed={8}
							/>
						</div>
					</div>
				</div>
				<table className='grid' style={{ width: '100%' }}>
					<tbody>
						<tr className='pb-1 completed-trades-header'>
							<td>
								{orderBy === OrderBy.symbol && (
									<Octicon icon={orderAscending ? TriangleUp : TriangleDown} />
								)}
								<a onClick={() => changeSortOrder(OrderBy.symbol)}>Symbol</a>
							</td>
							<td className='text-right'>
								{orderBy === OrderBy.shares && (
									<Octicon icon={orderAscending ? TriangleUp : TriangleDown} />
								)}
								<a onClick={() => changeSortOrder(OrderBy.shares)}>Shares</a>
							</td>

							<td className='text-right'>
								{orderBy === OrderBy.cost && (
									<Octicon icon={orderAscending ? TriangleUp : TriangleDown} />
								)}
								<a onClick={() => changeSortOrder(OrderBy.cost)}>Bought At</a>
							</td>

							<td className='text-right'>
								{orderBy === OrderBy.proceeds && (
									<Octicon icon={orderAscending ? TriangleUp : TriangleDown} />
								)}
								<a onClick={() => changeSortOrder(OrderBy.proceeds)}>Sold At</a>
							</td>
							<td className='text-right'>
								{orderBy === OrderBy.pnlPercentage && (
									<Octicon icon={orderAscending ? TriangleUp : TriangleDown} />
								)}
								<a onClick={() => changeSortOrder(OrderBy.pnlPercentage)}>P&L %</a>
							</td>
							<td className='text-right'>
								{orderBy === OrderBy.pnlAmount && (
									<Octicon icon={orderAscending ? TriangleUp : TriangleDown} />
								)}
								<a onClick={() => changeSortOrder(OrderBy.pnlAmount)}>P&L $</a>
							</td>
							<td className='text-right'>
								{orderBy === OrderBy.openedDate && (
									<Octicon icon={orderAscending ? TriangleUp : TriangleDown} />
								)}
								<a onClick={() => changeSortOrder(OrderBy.openedDate)}>Date Open</a>
							</td>
							<td className='text-right'>
								{orderBy === OrderBy.closedDate && (
									<Octicon icon={orderAscending ? TriangleUp : TriangleDown} />
								)}
								<a onClick={() => changeSortOrder(OrderBy.closedDate)}>Date Close</a>
							</td>
						</tr>
						{completedPositions.map((cp) => (
							<CompletedPosition key={`${cp.symbol}${cp.openedTimestamp}`} {...cp} />
						))}
					</tbody>
				</table>
			</div>
		</Layout>
	);
};

export default CompletedPositions;

export const pageQuery = graphql`
	query {
		allTrade(sort: { timestamp: ASC }) {
			nodes {
				quantity
				price
				action
				symbol
				timestamp
				pnl
				pnlCad
				pnlUsd
				assessment {
					targetPrice
					targetInvestment
				}
				company {
					name
					marketCap
					prevDayClosePrice
					symbol
					yield
				}
				quote {
					price
					priceUsd
					priceCad
					currency
				}
				position {
					quantity
					totalCost
					totalCostUsd
					totalCostCad
					currentMarketValueCad
					currentMarketValueUsd
					averageEntryPrice
					openPnl
					openPnlCad
				}
			}
		}
	}
`;

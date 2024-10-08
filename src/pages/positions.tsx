import React, { useContext } from 'react';
import { graphql } from 'gatsby';
import _ from 'lodash';
import numeral from 'numeral';

import Position from '../components/position/Position';
import Layout from '../components/layout';
import { Currency, AssetType } from '../utils/enum';
import { ITrade } from '../../declarations/trade';
import { getPercentSharesRemaining } from '../utils/util';
import { IOrder } from '../../declarations/order';
import { IPosition } from '../../declarations/position';
import { IQuote } from '../../declarations/quote';
import { ICompany } from '../../declarations/company';
import { IAssessment } from '../../declarations/assessment';
import { CurrencyContext } from '../context/currency.context';
import { IAccount } from '../../declarations';
import { getPortfolioAllocations } from '../utils/calculate';

export enum PositionsOrderBy {
	symbol,
	profits,
	position,
	orders,
	rating,
	pe,
	dividendYield,
	cashProfits,
}

interface IPositionNode
	extends Pick<
		IPosition,
		| 'currency'
		| 'totalCostCad'
		| 'totalCostUsd'
		| 'currentMarketValueCad'
		| 'currentMarketValueUsd'
		| 'openPnlCadCurrentRate'
		| 'openPnlUsd'
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

interface IPositionsQuery {
	data: {
		allPosition: {
			nodes: IPositionNode[];
		};
		allOrder: {
			nodes: Pick<IOrder, 'symbol' | 'action' | 'openQuantity' | 'limitPrice'>[];
		};
		allAccount: {
			nodes: IAccount[];
		};
	};
}

const addCurrencyToPositions = (
	usdCash: number,
	cadCash: number
): IPositionNode => {
	const position: IPositionNode = {
		currency: Currency.cad,
		totalCostCad: cadCash,
		totalCostUsd: usdCash,
		currentMarketValueCad: cadCash,
		currentMarketValueUsd: usdCash,
		openPnlCadCurrentRate: 0,
		openPnlUsd: 0,
		quantity: cadCash,
		averageEntryPrice: 1,
		symbol: 'CAD',
		type: AssetType.cash,
		quote: {
			price: 1,
			priceCad: 1,
			priceUsd: 1,
			currency: Currency.cad,
		},
		company: {
			pe: 1,
			yield: 0,
			prevDayClosePrice: 1,
			marketCap: 106930000000,
			name: 'Bank of Canada',
		},
		trades: [],
	};

	return position;
};

const Positions: React.FC<IPositionsQuery> = ({ data }) => {
	const [orderBy, setOrderBy] = React.useState(PositionsOrderBy.position);
	const [combined, setCombined] = React.useState(true);
	const [typeFilter, setTypeFilter] = React.useState<'all' | 'crypto' | 'stock'>(
		'all'
	);

	const currency = useContext(CurrencyContext);
	const accounts = data.allAccount.nodes;

	let cadCash = accounts
		.map((q) => q.balances)
		.flat()
		.filter((q) => q.currency === Currency.cad)
		.reduce((sum, q) => sum + q.amountCad, 0);
	let usdCash = accounts
		.map((q) => q.balances)
		.flat()
		.filter((q) => q.currency === Currency.usd)
		.reduce((sum, q) => sum + q.amountCad, 0);

	let positions = data.allPosition.nodes.filter(
		(q) =>
			typeFilter === 'all' ||
			(typeFilter === 'crypto' && q.type === 'crypto') ||
			(typeFilter === 'stock' && q.type === 'stock')
	);

	const allocations = getPortfolioAllocations(positions, accounts);

	if (combined) {
		cadCash += positions
			.filter((q) => q.company.hisa)
			.reduce(
				(sum, { currentMarketValueCad }) => sum + (currentMarketValueCad || 0),
				0
			);

		usdCash += positions
			.filter((q) => q.company.hisa)
			.reduce(
				(sum, { currentMarketValueUsd }) => sum + (currentMarketValueUsd || 0),
				0
			);

		positions = positions.filter((q) => !q.company.hisa);
	}

	positions.push(addCurrencyToPositions(usdCash, cadCash));

	const filterPosition = ({ type }: IPositionNode) =>
		typeFilter === 'all' ||
		(typeFilter === 'crypto' && type === 'crypto') ||
		(typeFilter === 'stock' && type === 'stock');

	const totalPositionValue = _.sumBy(
		positions.filter(filterPosition),
		(p) => p.currentMarketValueCad
	);

	const orders = data.allOrder.nodes;

	positions = _.orderBy(
		positions,
		(position) => {
			switch (orderBy) {
				case PositionsOrderBy.symbol:
					return position.symbol;
				case PositionsOrderBy.profits:
					return (
						(position.quote.price - position.averageEntryPrice) /
						position.averageEntryPrice
					);
				case PositionsOrderBy.position:
					return position.currentMarketValueCad / totalPositionValue;
				case PositionsOrderBy.orders:
					if (
						orders.find((q) => q.symbol === position.symbol && q.action === 'buy')
					) {
						return 1;
					}

					if (
						orders.find((q) => q.symbol === position.symbol && q.action === 'sell')
					) {
						return 2;
					}
					return 0;
				case PositionsOrderBy.rating:
					return position.assessment?.rating;
				case PositionsOrderBy.pe:
					return position.company.pe;
				case PositionsOrderBy.dividendYield:
					return position.company.yield;
				case PositionsOrderBy.cashProfits:
					return position.openPnlCadCurrentRate;
			}
		},
		orderBy == PositionsOrderBy.symbol ? 'asc' : 'desc'
	);

	const getRatingPercent = (positionNode: IPositionNode) => {
		const rating = positionNode.assessment?.rating || 'none';

		if (['none', 'hold'].includes(rating)) {
			return 0;
		}

		if (rating === 'sell') {
			return getPercentSharesRemaining(positionNode.quantity, positionNode.trades);
		}

		if (rating === 'buy') {
			return positionNode.assessment?.targetInvestmentProgress;
		}

		return 0;
	};

	const getBuyOrderPercent = (positionNode: IPositionNode) => {
		const filteredOrders = orders.filter(
			(q) => q.symbol === positionNode.symbol && q.action === 'buy'
		);

		if (!filteredOrders.length) {
			return 0;
		}

		const targetInvestment = positionNode.assessment?.targetInvestment;
		if (!targetInvestment) {
			return 0;
		}

		let percent = 0;
		filteredOrders.forEach((order) => {
			percent += (order.limitPrice * order.openQuantity) / targetInvestment;
		});

		return percent;
	};

	const getSellOrderPercent = (positionNode: IPositionNode) => {
		const filteredOrders = orders.filter(
			(q) => q.symbol === positionNode.symbol && q.action === 'sell'
		);

		if (!filteredOrders.length) {
			return 0;
		}

		let quantity = 0;
		filteredOrders.forEach((order) => {
			quantity += order.openQuantity;
		});

		return getPercentSharesRemaining(quantity, positionNode.trades);
	};

	return (
		<Layout>
			<div className='p-4'>
				<table className='grid'>
					<thead>
						<tr className='pb-1'>
							<th className='link' onClick={() => setOrderBy(PositionsOrderBy.symbol)}>
								SYMBOL
							</th>
							<th
								className='link'
								onClick={() => setOrderBy(PositionsOrderBy.profits)}
							>
								P&L
							</th>
							<th
								className='text-center link'
								onClick={() => setOrderBy(PositionsOrderBy.rating)}
							>
								RATING
							</th>
							<th
								className='text-center link'
								onClick={() => setOrderBy(PositionsOrderBy.orders)}
							>
								ORDERS
							</th>
							<th
								className='link'
								onClick={() => setOrderBy(PositionsOrderBy.position)}
							>
								%oP
							</th>
							<th
								className='text-right link'
								onClick={() => setOrderBy(PositionsOrderBy.cashProfits)}
							>
								$P&L
							</th>
						</tr>
					</thead>
					<tbody>
						{positions.map((position, index) => (
							<Position
								key={position.symbol}
								symbol={position.symbol}
								index={index + 1}
								valueCad={position.currentMarketValueCad}
								valueUsd={position.currentMarketValueUsd}
								costCad={position.totalCostCad}
								costUsd={position.totalCostUsd}
								percentageOfPortfolio={
									position.currentMarketValueCad / totalPositionValue
								}
								positionsOrderBy={orderBy}
								rating={position.assessment?.rating}
								ratingPercent={getRatingPercent(position)}
								buyOrderPercent={getBuyOrderPercent(position)}
								sellOrderPercent={getSellOrderPercent(position)}
								assetCurrency={position.currency}
								openPnlCad={position.openPnlCadCurrentRate}
								openPnlUsd={position.openPnlUsd}
							/>
						))}
						<tr>
							<td className='link' onClick={() => setCombined(!combined)}>
								{(combined && 'combined *') || 'not combined'}
							</td>
							<td
								className='link'
								onClick={() =>
									setTypeFilter((type) => {
										if (type === 'all') {
											return 'crypto';
										}
										if (type === 'crypto') {
											return 'stock';
										}
										return 'all';
									})
								}
							>
								{typeFilter}
							</td>
						</tr>
					</tbody>
				</table>
				<div>
					<div>Cash: {numeral(allocations.cash).format('0.00%')}</div>
					<div>Stocks: {numeral(allocations.stock).format('0.00%')}</div>
					<div>Crypto: {numeral(allocations.crypto).format('0.00%')}</div>
				</div>
			</div>
		</Layout>
	);
};

export default Positions;

export const pageQuery = graphql`
	query {
		allPosition {
			nodes {
				currency
				totalCostCad
				totalCostUsd
				currentMarketValueCad
				currentMarketValueUsd
				openPnlCadCurrentRate
				openPnlUsd
				quantity
				averageEntryPrice
				symbol
				type
				openPnlCadCurrentRate
				openPnlUsd
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
		allOrder {
			nodes {
				symbol
				limitPrice
				action
				openQuantity
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
	}
`;

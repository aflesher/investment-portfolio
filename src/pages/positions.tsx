import React from 'react';
import { graphql } from 'gatsby';
import _ from 'lodash';
import { connect, ResolveArrayThunks } from 'react-redux';

import Position from '../components/position/Position';
import Layout from '../components/layout';
import { Currency, AssetType, RatingType } from '../utils/enum';
import { IStoreState } from '../store/store';
import XE from '../components/xe/XE';
import { ICash } from '../utils/cash';
import { ITrade } from '../utils/trade';
import { getMaxShares, getPercentSharesRemaining } from '../utils/util';
import { IOrder } from '../utils/order';
import { IPosition } from '../utils/position';
import { IQuote } from '../utils/quote';
import { ICompany } from '../utils/company';
import { IAssessment } from '../utils/assessment';

export enum PositionsOrderBy {
	symbol,
	profits,
	position,
	orders,
	rating,
	investment,
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
		allCash: {
			nodes: ICash[];
		};
		allOrder: {
			nodes: Pick<IOrder, 'symbol' | 'action' | 'openQuantity' | 'limitPrice'>[];
		};
	};
}

interface IPositionStateProps {
	currency: Currency;
}

const mapStateToProps = ({ currency }: IStoreState): IPositionStateProps => ({
	currency,
});

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

const Positions: React.FC<IPositionsQuery & IPositionStateProps> = ({
	currency,
	data,
}) => {
	let usdCash = data.allCash.nodes.reduce(
		(sum, { amountUsd }) => sum + amountUsd,
		0
	);
	let cadCash = data.allCash.nodes.reduce(
		(sum, { amountCad }) => sum + amountCad,
		0
	);

	const positionNodes = data.allPosition.nodes.slice();

	const [orderBy, setOrderBy] = React.useState(PositionsOrderBy.position);
	const [combined, setCombined] = React.useState(false);

	if (combined) {
		cadCash += positionNodes
			.filter((q) => q.company.hisa)
			.reduce(
				(sum, { currentMarketValueCad }) => sum + (currentMarketValueCad || 0),
				0
			);

		usdCash += positionNodes
			.filter((q) => q.company.hisa)
			.reduce(
				(sum, { currentMarketValueUsd }) => sum + (currentMarketValueUsd || 0),
				0
			);
	}

	positionNodes.push(addCurrencyToPositions(usdCash, cadCash));

	const getTotalCostCad = (position: IPositionNode): number =>
		position.totalCostCad;

	const getCurrentValueCad = (position: IPositionNode): number =>
		position.currentMarketValueCad;

	const getTotalCostUsd = (position: IPositionNode): number =>
		position.totalCostUsd;

	const getCurrentValueUsd = (position: IPositionNode): number =>
		position.currentMarketValueUsd;

	const totalPositionValue = _.sumBy(
		positionNodes,
		(p) => p.currentMarketValueCad
	);
	const totalPositionCost = _.sumBy(positionNodes, (p) => p.totalCostCad);
	const totalPositionValueUsd = _.sumBy(
		positionNodes,
		(p) => p.currentMarketValueUsd
	);
	const totalPositionCostUsd = _.sumBy(positionNodes, (p) => p.totalCostUsd);

	const orders = data.allOrder.nodes;

	const positions = _.orderBy(
		positionNodes,
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
					return getCurrentValueCad(position) / totalPositionValue;
				case PositionsOrderBy.investment:
					return getTotalCostCad(position) / totalPositionCost;
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
					return getCurrentValueCad(position) - getTotalCostCad(position);
			}
		},
		orderBy == PositionsOrderBy.symbol ? 'asc' : 'desc'
	).filter((q) => !combined || !q.company.hisa);

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
							<th className=''>
								<span
									className='link'
									onClick={() => setOrderBy(PositionsOrderBy.investment)}
								>
									%oI
								</span>
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
								{...position}
								symbol={position.symbol}
								index={index + 1}
								valueCad={getCurrentValueCad(position)}
								valueUsd={getCurrentValueUsd(position)}
								costCad={getTotalCostCad(position)}
								costUsd={getTotalCostUsd(position)}
								previousClosePrice={position.company.prevDayClosePrice}
								price={position.quote.price}
								name={position.company.name}
								assetCurrency={position.currency}
								marketCap={position.company.marketCap}
								percentageOfPortfolio={
									getCurrentValueCad(position) / totalPositionValue
								}
								percentageOfInvestment={getTotalCostCad(position) / totalPositionCost}
								shareProgress={position.assessment?.targetInvestmentProgress || 0}
								priceProgress={position.assessment?.targetPriceProgress}
								activeCurrency={currency}
								quoteCurrency={position.quote.currency}
								symbolCharacter={''}
								positionsOrderBy={orderBy}
								rating={position.assessment?.rating}
								ratingPercent={getRatingPercent(position)}
								buyOrderPercent={getBuyOrderPercent(position)}
								sellOrderPercent={getSellOrderPercent(position)}
							/>
						))}
						<tr>
							<td colSpan={7} className='text-right'>
								<XE
									cad={totalPositionValue - totalPositionCost}
									usd={totalPositionValueUsd - totalPositionCostUsd}
									currency={currency}
								/>
							</td>
						</tr>
						<tr>
							<td className='link' onClick={() => setCombined(!combined)}>
								{(combined && 'combined *') || 'not combined'}
							</td>
						</tr>
					</tbody>
				</table>
			</div>
		</Layout>
	);
};

export default connect(mapStateToProps)(Positions);

export const pageQuery = graphql`
	query {
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
		allCash {
			nodes {
				accountId
				accountName
				amount
				amountCad
				amountUsd
				id
				currency
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
	}
`;

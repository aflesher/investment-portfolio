import React from 'react';
import { graphql } from 'gatsby';
import _ from 'lodash';
import { connect } from 'react-redux';
import numeral from 'numeral';

import Position from '../components/position/Position';
import Layout from '../components/layout';
import { Currency, AssetType, RatingType } from '../utils/enum';
import { IStoreState } from '../store/store';
import XE from '../components/xe/XE';
import { ICash } from '../utils/cash';
import { ITrade } from '../utils/trade';
import { getPercentSharesRemaining } from '../utils/util';
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
	const [orderBy, setOrderBy] = React.useState(PositionsOrderBy.position);
	const [combined, setCombined] = React.useState(true);
	const [typeFilter, setTypeFilter] = React.useState<'all' | 'crypto' | 'stock'>(
		'all'
	);

	let usdCash = data.allCash.nodes.reduce(
		(sum, { amountUsd }) => sum + amountUsd,
		0
	);
	let cadCash = data.allCash.nodes.reduce(
		(sum, { amountCad }) => sum + amountCad,
		0
	);

	let positions = data.allPosition.nodes.filter(
		(q) =>
			typeFilter === 'all' ||
			(typeFilter === 'crypto' && q.type === 'crypto') ||
			(typeFilter === 'stock' && q.type === 'stock')
	);

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

	const getTotalCostCad = (position: IPositionNode): number =>
		position.totalCostCad;

	const getCurrentValueCad = (position: IPositionNode): number =>
		position.currentMarketValueCad;

	const getTotalCostUsd = (position: IPositionNode): number =>
		position.totalCostUsd;

	const getCurrentValueUsd = (position: IPositionNode): number =>
		position.currentMarketValueUsd;

	const totalPositionValue = _.sumBy(
		positions.filter(filterPosition),
		(p) => p.currentMarketValueCad
	);
	const totalPositionCost = _.sumBy(
		positions.filter(filterPosition),
		(p) => p.totalCostCad
	);
	const totalPositionValueUsd = _.sumBy(
		positions.filter(filterPosition),
		(p) => p.currentMarketValueUsd
	);
	const totalPositionCostUsd = _.sumBy(
		positions.filter(filterPosition),
		(p) => p.totalCostUsd
	);

	const orders = data.allOrder.nodes;

	const cashTotalValue = positions
		.filter(({ type, company }) => type === AssetType.cash || company.hisa)
		.reduce((sum, { currentMarketValueCad }) => sum + currentMarketValueCad, 0);
	const stockTotalValue = positions
		.filter(({ type, company }) => type === AssetType.stock && !company.hisa)
		.reduce((sum, { currentMarketValueCad }) => sum + currentMarketValueCad, 0);
	const cryptoTotalValue = positions
		.filter(({ type }) => type === AssetType.crypto)
		.reduce((sum, { currentMarketValueCad }) => sum + currentMarketValueCad, 0);

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
					return getCurrentValueCad(position) / totalPositionValue;
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
					<div>
						Cash: {numeral(cashTotalValue / totalPositionValue).format('0.00%')}
					</div>
					<div>
						Stocks: {numeral(stockTotalValue / totalPositionValue).format('0.00%')}
					</div>
					<div>
						Crypto: {numeral(cryptoTotalValue / totalPositionValue).format('0.00%')}
					</div>
				</div>
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

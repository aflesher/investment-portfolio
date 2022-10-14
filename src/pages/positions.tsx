import React from 'react';
import { graphql } from 'gatsby';
import _ from 'lodash';
import { connect, ResolveArrayThunks } from 'react-redux';

import Position from '../components/position/Position';
import Layout from '../components/layout';
import { Currency, AssetType } from '../utils/enum';
import { IStoreState } from '../store/store';
import XE from '../components/xe/XE';
import { ICash } from '../utils/cash';

export enum PositionsOrderBy {
	symbol,
	profits,
	position,
	investment,
	pe,
	dividendYield,
	cashProfits,
}

interface IPositionNode {
	currency: Currency;
	totalCostCad: number;
	totalCostUsd: number;
	currentMarketValueCad: number;
	currentMarketValueUsd: number;
	quantity: number;
	averageEntryPrice: number;
	symbol: string;
	type: AssetType;
	quote: {
		price: number;
		priceCad: number;
		priceUsd: number;
		currency: Currency;
	};
	company: {
		pe: number;
		yield: number;
		prevDayClosePrice: number;
		marketCap: number;
		name: string;
	};
	assessment?: {
		targetInvestmentProgress: number;
		targetPriceProgress: number;
		checklist: {
			pristine: boolean | null;
		};
	};
	positions: {
		symbol: string;
		totalCostCad: number;
		totalCostUsd: number;
		currentMarketValueCad: number;
		currentMarketValueUsd: number;
	}[];
}

interface IPositionsQuery {
	data: {
		allPosition: {
			nodes: IPositionNode[];
		};
		allCash: {
			nodes: ICash[];
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
		positions: [],
	};

	return position;
};

const Positions: React.FC<IPositionsQuery & IPositionStateProps> = ({
	currency,
	data,
}) => {
	const usdCash = data.allCash.nodes.reduce(
		(sum, { amountUsd }) => sum + amountUsd,
		0
	);
	const cadCash = data.allCash.nodes.reduce(
		(sum, { amountCad }) => sum + amountCad,
		0
	);

	const positionNodes = data.allPosition.nodes.slice();
	positionNodes.push(addCurrencyToPositions(usdCash, cadCash));

	const [orderBy, setOrderBy] = React.useState(PositionsOrderBy.position);
	const [combined, setCombined] = React.useState(true);

	const getTotalCostCad = (position: IPositionNode): number =>
		position.totalCostCad +
		_.sumBy(position.positions, (p) => p.totalCostCad) * (combined ? 1 : 0);

	const getCurrentValueCad = (position: IPositionNode): number =>
		position.currentMarketValueCad +
		_.sumBy(position.positions, (p) => p.currentMarketValueCad) *
			(combined ? 1 : 0);

	const getTotalCostUsd = (position: IPositionNode): number =>
		position.totalCostUsd +
		_.sumBy(position.positions, (p) => p.totalCostUsd) * (combined ? 1 : 0);

	const getCurrentValueUsd = (position: IPositionNode): number =>
		position.currentMarketValueUsd +
		_.sumBy(position.positions, (p) => p.currentMarketValueUsd) *
			(combined ? 1 : 0);

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
	const filteredPositions = _(positionNodes)
		.map((p) => p.positions.map((q) => q.symbol))
		.flatten()
		.uniq()
		.value();

	const positions = _(positionNodes)
		.filter(
			(position) => !combined || !_.includes(filteredPositions, position.symbol)
		)
		.orderBy(
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
					case PositionsOrderBy.pe:
						return position.company.pe;
					case PositionsOrderBy.dividendYield:
						return position.company.yield;
					case PositionsOrderBy.cashProfits:
						return getCurrentValueCad(position) - getTotalCostCad(position);
				}
			},
			orderBy == PositionsOrderBy.symbol ? 'asc' : 'desc'
		)
		.value();

	return (
		<Layout>
			<div className='grid p-4'>
				<div className='row pb-1'>
					<div
						className='col-4 col-lg-3 offset-lg-1 link'
						onClick={() => setOrderBy(PositionsOrderBy.symbol)}
					>
						SYMBOL
					</div>
					<div
						className='col-4 col-lg-1 text-right link'
						onClick={() => setOrderBy(PositionsOrderBy.profits)}
					>
						P&L
					</div>
					<div
						className='col-2 text-right link'
						onClick={() => setOrderBy(PositionsOrderBy.position)}
					>
						%oP
					</div>
					<div className='col-2 text-right'>
						<span
							className='link'
							onClick={() => setOrderBy(PositionsOrderBy.investment)}
						>
							%oI
						</span>
					</div>
					<div
						className='d-none d-lg-block col-3 text-right link'
						onClick={() => setOrderBy(PositionsOrderBy.cashProfits)}
					>
						$P&L
					</div>
				</div>
				{positions.map((position, index) => (
					<Position
						key={position.symbol}
						{...position}
						symbol={position.symbol}
						isFullPosition={true}
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
						percentageOfPortfolio={getCurrentValueCad(position) / totalPositionValue}
						percentageOfInvestment={getTotalCostCad(position) / totalPositionCost}
						classes={['colored-row']}
						shareProgress={position.assessment?.targetInvestmentProgress || 0}
						priceProgress={position.assessment?.targetPriceProgress}
						activeCurrency={currency}
						quoteCurrency={position.quote.currency}
						symbolCharacter={combined && position.positions.length ? '*' : ''}
						positionsOrderBy={orderBy}
					/>
				))}
				<div className='row'>
					<div className='col-3 offset-9 text-right'>
						<XE
							cad={totalPositionValue - totalPositionCost}
							usd={totalPositionValueUsd - totalPositionCostUsd}
							currency={currency}
						/>
					</div>
				</div>
				<div>
					<div className='link' onClick={() => setCombined(!combined)}>
						{(combined && 'combined *') || 'not combined'}
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
				}
				assessment {
					targetInvestmentProgress
					targetPriceProgress
					checklist {
						pristine
					}
				}
				positions {
					symbol
					totalCostCad
					totalCostUsd
					currentMarketValueCad
					currentMarketValueUsd
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
	}
`;

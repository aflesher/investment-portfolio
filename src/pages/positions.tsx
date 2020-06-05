import React from 'react';
// @ts-ignore
import { graphql } from 'gatsby';
import _ from 'lodash';

import Position from '../components/position/Position';
import Layout from '../components/layout';
import { Currency, AssetType } from '../utils/enum';

enum PostionsOrderBy {
	symbol,
	profits,
	position,
	investment,
	pe,
	dividendYield
}

interface IPositionsQuery {
	data: {
		allPosition: {
			nodes: {
				currency: Currency,
				totalCostCad: number,
				totalCostUsd: number,
				currentMarketValueCad: number,
				currentMarketValueUsd: number,
				quantity: number,
				averageEntryPrice: number,
				symbol: string,
				type: AssetType,
				quote: {
					price: number,
					priceCad: number,
					priceUsd: number,
				}
				company: {
					pe: number,
					yield: number,
					prevDayClosePrice: number,
					marketCap: number,
					name: string
				}
				assessment: {
					targetPrice: number,
					targetShares: number
				}
			}[]
		}
	}
}

const Positions: React.FC<IPositionsQuery> = ({ data }) => {
	const [orderBy, setOrderBy] = React.useState(PostionsOrderBy.profits);

	const totalPositionValue = _.sumBy(data.allPosition.nodes, p => p.currentMarketValueCad);
	const totalPositionCost = _.sumBy(data.allPosition.nodes, p => p.totalCostCad);

	const positions = _.orderBy(data.allPosition.nodes, position => {
		switch (orderBy) {
		case PostionsOrderBy.symbol:
			return position.symbol;
		case PostionsOrderBy.profits:
			return (position.currentMarketValueCad - position.totalCostCad) /
				position.totalCostCad;
		case PostionsOrderBy.position:
			return position.currentMarketValueCad / totalPositionValue;
		case PostionsOrderBy.investment:
			return position.totalCostCad / totalPositionCost;
		case PostionsOrderBy.pe:
			return position.company.pe;
		case PostionsOrderBy.dividendYield:
			return position.company.yield;
		}
	}, orderBy == PostionsOrderBy.symbol ? 'asc' : 'desc');

	return (
		<Layout>
			<div className='grid p-4'>
				<div className='row pb-1'>
					<div
						className='col-4 col-lg-3 offset-lg-1 link'
						onClick={() => setOrderBy(PostionsOrderBy.symbol)}>
							SYMBOL
					</div>
					<div
						className='col-4 col-lg-2 text-right link'
						onClick={() => setOrderBy(PostionsOrderBy.profits)}>
							P&L
					</div>
					<div
						className='col-2 text-right link'
						onClick={() => setOrderBy(PostionsOrderBy.position)}>
							%oP
					</div>
					<div
						className='col-2 text-right link'
						onClick={() => setOrderBy(PostionsOrderBy.investment)}>
							%oI
					</div>
					<div
						className='d-none d-lg-block col-1 text-right link'
						onClick={() => setOrderBy(PostionsOrderBy.pe)}>
							PE
					</div>
					<div
						className='d-none d-lg-block col-1 text-right link'
						onClick={() => setOrderBy(PostionsOrderBy.dividendYield)}>
							Yield
					</div>
				</div>
				{positions.map((position, index) => (
					<Position
						key={position.symbol}
						{...position}
						isFullPosition={true}
						index={index + 1}
						valueCad={position.currentMarketValueCad}
						valueUsd={position.currentMarketValueUsd}
						costCad={position.totalCostCad}
						costUsd={position.totalCostUsd}
						previousClosePrice={position.company.prevDayClosePrice}
						price={position.quote.price}
						name={position.company.name}
						assetCurrency={position.currency}
						marketCap={position.company.marketCap}
						percentageOfPortfolio={position.currentMarketValueCad / totalPositionValue}
						percentageOfInvestment={position.totalCostCad / totalPositionCost}
						classes={['colored-row']}
					/>
				))}
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
				quantity
				averageEntryPrice
				symbol
				type
				quote {
					price
					priceCad
				}
				company {
					pe
					yield
					prevDayClosePrice
					marketCap
					name
				}
				assessment {
					targetPrice
					targetShares
				}
			}
		}
	}
	`;
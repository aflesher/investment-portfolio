import React from 'react';
import { graphql } from 'gatsby';
import _ from 'lodash';
import { connect, ResolveArrayThunks } from 'react-redux';

import Position from '../components/position/Position';
import Layout from '../components/layout';
import { Currency, AssetType } from '../utils/enum';
import { IStoreState } from '../store/store';
import XE from '../components/xe/XE';

export enum PositionsOrderBy {
	symbol,
	profits,
	position,
	investment,
	pe,
	dividendYield,
	cashProfits,
	rank,
	investmentRank
}

interface IPositionNode {
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
		currency: Currency
	}
	company: {
		pe: number,
		yield: number,
		prevDayClosePrice: number,
		marketCap: number,
		name: string
	}
	assessment?: {
		targetInvestmentProgress: number,
		targetPriceProgress: number,
		checklist: {
			pristine: boolean | null
		}
	}
	positions: {
		symbol: string,
		totalCostCad: number,
		totalCostUsd: number,
		currentMarketValueCad: number,
		currentMarketValueUsd: number
	}[]
}

interface IPositionsQuery {
	data: {
		allPosition: {
			nodes: IPositionNode[]
		}
	}
}

interface IPositionStateProps {
	currency: Currency
}

const mapStateToProps = ({ currency }: IStoreState): IPositionStateProps => ({
	currency
});

type Rank = 'rankPortfolio' | 'rankInvestment';

const getRanks = (type: Rank): string[] => {
	if (!window) {
		return [];
	}

	const symbols =  window.localStorage.getItem(type);
	if (!symbols) {
		return [];
	}

	return JSON.parse(symbols);
};

const cleanUpSymbols = (type: Rank, symbols: string[]): void => {
	const rankedSymbols = getRanks(type);
	const cleanedUpSymbols = _(rankedSymbols).intersection(symbols).concat(symbols).uniq().value();
	setRanks(type, cleanedUpSymbols);
}

const setRanks = (type: Rank, symbols: string[]): void => {
	if (!window) {
		return;
	}

	window.localStorage.setItem(type, JSON.stringify(symbols));
};

const increaseRank = (type: Rank, symbol: string, symbols: string[]): void => {
	const index = symbols.indexOf(symbol);
	if (index === -1) {
		return;
	}

	const replace = symbols[index - 1];
	symbols[index] = replace;
	symbols[index - 1] = symbol;

	setRanks(type, symbols);
};

const decreaseRank = (type: Rank, symbol: string, symbols: string[]): void => {
	const index = symbols.indexOf(symbol);
	if (index === -1) {
		return;
	}

	const replace = symbols[index + 1];
	symbols[index] = replace;
	symbols[index + 1] = symbol;

	setRanks(type, symbols);
};

const Positions: React.FC<IPositionsQuery & IPositionStateProps> = ({ currency, data }) => {
	const [orderBy, setOrderBy] = React.useState(PositionsOrderBy.profits);
	const [combined, setCombined] = React.useState(true);
	const [investmentRank, setInvestmentRank] = React.useState<string[]>([]);

	const getTotalCostCad = (position: IPositionNode): number => (
		position.totalCostCad + (_.sumBy(position.positions, p => p.totalCostCad) * (combined ? 1 :0))
	);
	
	const getCurrentValueCad = (position: IPositionNode): number => (
		position.currentMarketValueCad + (_.sumBy(position.positions, p => p.currentMarketValueCad) * (combined ? 1 :0))
	);
	
	const getTotalCostUsd = (position: IPositionNode): number => (
		position.totalCostUsd + (_.sumBy(position.positions, p => p.totalCostUsd) * (combined ? 1 :0))
	);
	
	const getCurrentValueUsd = (position: IPositionNode): number => (
		position.currentMarketValueUsd + (_.sumBy(position.positions, p => p.currentMarketValueUsd) * (combined ? 1 :0))
	);

	const totalPositionValue = _.sumBy(data.allPosition.nodes, p => p.currentMarketValueCad);
	const totalPositionCost = _.sumBy(data.allPosition.nodes, p => p.totalCostCad);
	const totalPositionValueUsd = _.sumBy(data.allPosition.nodes, p => p.currentMarketValueUsd);
	const totalPositionCostUsd = _.sumBy(data.allPosition.nodes, p => p.totalCostUsd);
	const filteredPositions = _(data.allPosition.nodes)
		.map(p => p.positions.map(q => q.symbol))
		.flatten()
		.uniq()
		.value();

	const positions = _(data.allPosition.nodes)
		.filter(position => !combined || !_.includes(filteredPositions, position.symbol))
		.orderBy(position => {
			switch (orderBy) {
			case PositionsOrderBy.symbol:
				return position.symbol;
			case PositionsOrderBy.profits:
				return (getCurrentValueCad(position) - getTotalCostCad(position)) /
				getTotalCostCad(position);
			case PositionsOrderBy.position:
				return getCurrentValueCad(position) / totalPositionValue;
			case PositionsOrderBy.investment:
				return getTotalCostCad(position) / totalPositionCost;
			case PositionsOrderBy.investmentRank:
				return investmentRank.indexOf(position.symbol) * -1;
			case PositionsOrderBy.pe:
				return position.company.pe;
			case PositionsOrderBy.dividendYield:
				return position.company.yield;
			case PositionsOrderBy.cashProfits:
				return getCurrentValueCad(position) - getTotalCostCad(position);
			}
		}, orderBy == PositionsOrderBy.symbol ? 'asc' : 'desc')
		.value();

	const rankPortfolio = ["btc","eth","sq","lulu","amd","amzn","pins","fb","ntdoy","tcehy","wwe","aw.un.to","urnm","bitf.vn","link","rune","avax","mana","bnb","gld","weed.to","spxs","gme","chal.cn"];
	
	if (!investmentRank.length) {
		cleanUpSymbols('rankInvestment', positions.map(q => q.symbol));
		setInvestmentRank(getRanks('rankInvestment'));
	}

	const increaseInvestmentRank = (symbol: string) => {
		increaseRank('rankInvestment', symbol, investmentRank);
		setInvestmentRank(getRanks('rankInvestment'));
	}

	const decreaseInvestmentRank = (symbol: string) => {
		decreaseRank('rankInvestment', symbol, investmentRank);
		setInvestmentRank(getRanks('rankInvestment'));
	}

	return (
		<Layout>
			<div className='grid p-4'>
				<div className='row pb-1'>
					<div
						className='col-4 col-lg-2 offset-lg-2 link'
						onClick={() => setOrderBy(PositionsOrderBy.symbol)}>
							SYMBOL
					</div>
					<div
						className='col-4 col-lg-1 text-right link'
						onClick={() => setOrderBy(PositionsOrderBy.profits)}>
							P&L
					</div>
					<div
						className='col-2 text-right link'
						onClick={() => setOrderBy(PositionsOrderBy.position)}>
							%oP
					</div>
					<div className='col-2 text-right'>
						<span className='link' onClick={() => setOrderBy(PositionsOrderBy.investment)}>
							%oI
						</span>&nbsp;
						<span className='link' onClick={() => setOrderBy(PositionsOrderBy.investmentRank)}>
							(R)
						</span>
					</div>
					<div
						className='d-none d-lg-block col-3 text-right link'
						onClick={() => setOrderBy(PositionsOrderBy.cashProfits)}>
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
						isPristine={!!position.assessment?.checklist.pristine}
						portfolioRank={rankPortfolio.indexOf(position.symbol) + 1}
						investmentRank={investmentRank.indexOf(position.symbol) + 1}
						positionsOrderBy={orderBy}
						increaseRank={() => { increaseInvestmentRank(position.symbol) }}
						decreaseRank={() => { decreaseInvestmentRank(position.symbol) }}
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
						{combined && 'combined *' || 'not combined'}
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
	}
	`;
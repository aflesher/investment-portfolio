import React from 'react';
import classNames from 'classnames';
import numeral from 'numeral';

import StockHover, { IStockQuoteStateProps } from '../stock-hover/StockHover';
import { Currency } from '../../utils/enum';
import XE from '../xe/XE';
import { IColor, interpolate, lerpColor } from '../../utils/util';
import { PositionsOrderBy } from '../../pages/positions';

export interface IPositionStateProps extends IStockQuoteStateProps {
	isFullPosition: boolean,
	classes?: string[],
	index: number,
	valueCad: number,
	costCad: number,
	valueUsd: number,
	costUsd: number,
	percentageOfPortfolio: number,
	percentageOfInvestment: number,
	pe?: number,
	dividendYield?: number,
	isPristine: boolean,
	portfolioRank?: number,
	investmentRank?: number,
	positionsOrderBy?: PositionsOrderBy
}

export interface IPositionDispatchProps {
	increaseRank?: () => void,
	decreaseRank?: () => void
}

const endColor: IColor = {
	red: 255,
	green: 0,
	blue: 0
}

const startColor: IColor = {
	red: 255,
	green: 255,
	blue: 255
}

const Position: React.FC<IPositionStateProps & IPositionDispatchProps> = (props) => {
	const {
		isFullPosition, activeCurrency, valueCad, costCad, valueUsd, costUsd, index,
		percentageOfInvestment, percentageOfPortfolio, classes, isPristine, investmentRank, portfolioRank, positionsOrderBy, quoteCurrency,
		increaseRank, decreaseRank
	} = props;
	const mainClasses = ['row', 'position'].concat(classes || []).join(' ');
	const pnl = quoteCurrency === Currency.cad ?
		(valueCad - costCad) / costCad :
		(valueUsd - costUsd) / costUsd;
	const investmentRankDiff = (investmentRank || 0) - index;
	const portfolioRankDiff = (portfolioRank || 0) - index;
	return (
		<div className={mainClasses}>
			<div className={classNames({
				'd-none': !isFullPosition,
				'col-1': isFullPosition && increaseRank && decreaseRank,
				'text-right': false,
				'text-subtle': true
			})}>
				<span><i className='fas fa-arrow-circle-up mr-1' onClick={increaseRank}></i></span>
				<span><i className='fas fa-arrow-circle-down mr-1' onClick={decreaseRank}></i></span>
			</div>
			<div className={classNames({
				'd-none': true,
				'd-lg-block': isFullPosition, 
				'col-1': isFullPosition,
				'text-right': true,
				'text-subtle': true
			})}>
				{index}
			</div>
			<div className={classNames({
				'col-4': true,
				'col-lg-2': isFullPosition,
				'pr-0': true
			})}>
				<div className='d-inline-block'>
					<StockHover
						{...props}
					/>
				</div>
				{isPristine && <span><i className='fas fa-award ml-2'></i></span>}
			</div>
			<div className={classNames({
				'col-lg-1': isFullPosition,
				'text-rtl': !isFullPosition && pnl >= 0,
				'col-4': true,
				'text-right': true,
				'text-positive': pnl >= 0,
				'text-negative': pnl < 0
			})}>
				{numeral(pnl).format('0,0.00%')}
			</div>
			<div className={classNames({
				'col-4': !isFullPosition,
				'col-2': isFullPosition,
				'text-right': true
			})}>
				{numeral(percentageOfPortfolio).format('0.0%')}
				{Boolean(portfolioRank && positionsOrderBy === PositionsOrderBy.position) &&
				<span className='ml-2 text-sub' style={{color: lerpColor(startColor, endColor, interpolate(0, 10, Math.abs(portfolioRankDiff)))}}>
					({numeral((portfolioRank || 0) - index).format('+0')})
				</span>}
			</div>
			<div className={classNames({
				'd-none': !isFullPosition,
				'col-2': isFullPosition,
				'text-right': true
			})}>
				{numeral(percentageOfInvestment).format('0.0%')}
				{Boolean(investmentRank && positionsOrderBy === PositionsOrderBy.investment) &&
				<span className='ml-2 text-sub' style={{color: lerpColor(startColor, endColor, interpolate(0, 10, Math.abs(investmentRankDiff)))}}>
					({numeral(investmentRankDiff).format('+0')})
				</span>}
			</div>
			<div className={classNames({
				'd-none': true,
				'col-3': true,
				'd-lg-block': isFullPosition,
				'text-right': true,
				'text-positive': pnl >= 0,
				'text-negative': pnl < 0
			})}>
				<XE
					cad={valueCad - costCad}
					usd={valueUsd - costUsd}
					currency={activeCurrency}
				/>
			</div>
		</div>
	);
};

export default Position;
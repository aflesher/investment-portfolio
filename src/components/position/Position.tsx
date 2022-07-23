import React from 'react';
import classNames from 'classnames';
import numeral from 'numeral';

import StockHover, { IStockQuoteStateProps } from '../stock-hover/StockHover';
import { Currency } from '../../utils/enum';
import XE from '../xe/XE';
import { IColor } from '../../utils/util';
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
	positionsOrderBy?: PositionsOrderBy
}

const Position: React.FC<IPositionStateProps> = (props) => {
	const {
		isFullPosition, activeCurrency, valueCad, costCad, valueUsd, costUsd, index,
		percentageOfInvestment, percentageOfPortfolio, classes, isPristine, positionsOrderBy, quoteCurrency
	} = props;
	const mainClasses = ['row', 'position'].concat(classes || []).join(' ');
	const pnl = quoteCurrency === Currency.cad ?
		(valueCad - costCad) / costCad :
		(valueUsd - costUsd) / costUsd;
	return (
		<div className={mainClasses}>
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
				'col-lg-2': isFullPosition,
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
			</div>
			<div className={classNames({
				'd-none': !isFullPosition,
				'col-2': isFullPosition,
				'text-right': true
			})}>
				{numeral(percentageOfInvestment).format('0.0%')}
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
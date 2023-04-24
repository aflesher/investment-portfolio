import React from 'react';
import classNames from 'classnames';
import numeral from 'numeral';

import StockHover, { IStockQuoteStateProps } from '../stock-hover/StockHover';
import { Currency, RatingType } from '../../utils/enum';
import XE from '../xe/XE';
import { PositionsOrderBy } from '../../pages/positions';
import { OBFUSCATE } from '../../utils/util';

export interface IPositionStateProps extends IStockQuoteStateProps {
	index: number;
	valueCad: number;
	costCad: number;
	valueUsd: number;
	costUsd: number;
	percentageOfPortfolio: number;
	percentageOfInvestment: number;
	pe?: number;
	dividendYield?: number;
	positionsOrderBy?: PositionsOrderBy;
	rating?: RatingType;
	ratingPercent?: number;
	buyOrderPercent?: number;
	sellOrderPercent?: number;
}

const Position: React.FC<IPositionStateProps> = (props) => {
	const {
		activeCurrency,
		valueCad,
		costCad,
		valueUsd,
		costUsd,
		index,
		percentageOfInvestment,
		percentageOfPortfolio,
		quoteCurrency,
		rating,
		ratingPercent,
		buyOrderPercent,
		sellOrderPercent,
	} = props;

	let pnl =
		quoteCurrency === Currency.cad
			? (valueCad - costCad) / costCad
			: (valueUsd - costUsd) / costUsd;

	if (Math.abs(pnl) < 0.0001) {
		pnl = 0;
	}
	return (
		<tr className='position colored-row'>
			<td className='pr-0'>
				<div className='d-inline-block'>
					<StockHover {...props} />
				</div>
			</td>
			<td
				className={classNames({
					'text-positive': pnl >= 0,
					'text-negative': pnl < 0,
				})}
			>
				{numeral(pnl).format('0,0.00%')}
			</td>
			<td className='text-center px-4' style={{ minWidth: 120 }}>
				{rating === 'sell' && (
					<div className='bar-graph bar-background negative'>
						<div
							className='bar'
							style={{ width: `${Math.min((ratingPercent || 0) * 100, 100)}%` }}
						></div>
						<div className='title'>{numeral(ratingPercent).format('0%')}</div>
					</div>
				)}
				{rating === 'buy' && (
					<div className='bar-graph bar-background blue-glow'>
						<div
							className='bar'
							style={{ width: `${Math.min((ratingPercent || 0) * 100, 100)}%` }}
						></div>
						<div className='title'>{numeral(ratingPercent).format('0%')}</div>
					</div>
				)}
				{rating === 'hold' && (
					<span className='text-subtle font-italic'>H O L D</span>
				)}
			</td>
			<td className='text-center px-4' style={{ minWidth: 120 }}>
				{!!sellOrderPercent && (
					<div className='bar-graph bar-background negative'>
						<div
							className='bar'
							style={{ width: `${Math.min(sellOrderPercent * 100, 100)}%` }}
						></div>
						<div className='title'>-{numeral(sellOrderPercent).format('0%')}</div>
					</div>
				)}
				{!!buyOrderPercent && (
					<div className='bar-graph bar-background blue-glow'>
						<div
							className='bar'
							style={{ width: `${Math.min(buyOrderPercent * 100, 100)}%` }}
						></div>
						<div className='title'>+{numeral(buyOrderPercent).format('0%')}</div>
					</div>
				)}
				{!sellOrderPercent &&
					!buyOrderPercent &&
					['buy', 'sell'].includes(rating || 'none') && (
						<span className='text-subtle font-italic'>N O N E</span>
					)}
			</td>
			<td>{numeral(percentageOfPortfolio).format('0.0%')}</td>
			<td>{numeral(percentageOfInvestment).format('0.0%')}</td>
			{!OBFUSCATE && (
				<td
					className={classNames({
						'text-right': true,
						'text-positive': pnl >= 0,
						'text-negative': pnl < 0,
					})}
				>
					<XE
						cad={valueCad - costCad}
						usd={valueUsd - costUsd}
						currency={activeCurrency}
					/>
				</td>
			)}
		</tr>
	);
};

export default Position;

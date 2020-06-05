import React from 'react';
import classNames from 'classnames';
import numeral from 'numeral';

import StockHover, { IStockQuoteStateProps } from '../stock-hover/StockHover';
import { Currency } from '../../utils/enum';
import { formatDateShort } from '../../utils/util';

export interface ICompletePositionStateProps extends IStockQuoteStateProps {
	quantityBought: number,
	avgPricePaid: number,
	avgPriceSold: number,
	pnlPercentage: number,
	pnlCad: number,
	pnlUsd: number,
	openedTimestamp: number,
	closedTimestamp: number
}

const CompletedPosition: React.FC<ICompletePositionStateProps> = ({
	symbol, price, previousClosePrice, name, assetCurrency, marketCap, quantity, costCad,
	costUsd, quantityBought, avgPricePaid, avgPriceSold, valueUsd, valueCad,
	activeCurrency, pnlCad, pnlUsd, pnlPercentage, openedTimestamp, closedTimestamp, shareProgress,
	priceProgress
}) => {
	return (
		<tr className='colored-row'>
			<td>
				<StockHover
					symbol={symbol}
					price={price}
					previousClosePrice={previousClosePrice}
					name={name}
					assetCurrency={assetCurrency}
					css={{'text-emphasis': true, 'font-weight-bold': true}}
					marketCap={marketCap}
					quantity={quantity}
					costCad={costCad}
					costUsd={costUsd}
					shareProgress={shareProgress}
					priceProgress={priceProgress}
					valueCad={valueCad}
					valueUsd={valueUsd}
					activeCurrency={activeCurrency}
				/>
			</td>
			<td className='text-right'>
				{quantityBought}
			</td>
			<td className='text-right'>
				{numeral(avgPricePaid).format('$0.00')}
			</td>
			<td className='text-right'>
				{numeral(avgPriceSold).format('$0.00')}
			</td>
			<td className={classNames({
				'text-positive': pnlPercentage >= 0,
				'text-negative': pnlPercentage < 0,
				'text-right': true
			})}>
				{numeral(pnlPercentage).format('0.00%')}
			</td>
			<td className={classNames({
				'text-positive': pnlPercentage >= 0,
				'text-negative': pnlPercentage < 0,
				'text-right': true
			})}>
				{numeral(activeCurrency === Currency.cad ? pnlCad : pnlUsd).format('$0,0.00')}
			</td>
			<td className='text-right'>
				{formatDateShort(openedTimestamp)}
			</td>
			<td className='text-right'>
				{formatDateShort(closedTimestamp)}
			</td>
		</tr>
	);
};

export default CompletedPosition;
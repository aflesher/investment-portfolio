import React from 'react';
import numeral from 'numeral';
// @ts-ignore
import { Link } from 'gatsby';

import XE from '../xe/XE';
import { IOrder } from '../../../declarations/order';
import { positiveNegativeText } from '../../utils/util';
import ColoredNumbers from '../colored-numbers/ColoredNumbers';
import {
	orderNewAvgPrice,
	orderPnL,
	orderPriceGap,
} from '../../utils/calculate';

interface IOrderStateProps
	extends Omit<
		IOrder,
		| 'totalQuantity'
		| 'orderType'
		| 'filledPrice'
		| 'avgExecPrice'
		| 'stopPrice'
		| 'type'
		| 'side'
		| 'filledQuantity'
	> {
	positionQuantity: number;
	quotePrice: number;
	positionCost: number;
	accountName: string;
}

const Order: React.FC<IOrderStateProps> = ({
	action,
	symbol,
	openQuantity,
	positionQuantity,
	limitPrice,
	limitPriceCad,
	limitPriceUsd,
	currency,
	accountName,
	quotePrice,
	positionCost,
	virtual,
}) => {
	const gap = orderPriceGap(quotePrice, limitPrice, action === 'sell');
	const curAvgPrice = positionCost / positionQuantity;

	const newAvgPrice = orderNewAvgPrice(
		positionQuantity,
		curAvgPrice,
		limitPrice,
		openQuantity,
		action === 'sell'
	);

	const gapColor = (gap: number): string => {
		const scale = Math.min(gap * 10, 1);
		const red = 9 + (255 - 9) * scale;
		const green = 246 + (255 - 246) * scale;
		const blue = 12 + (255 - 12) * scale;

		return `rgb(${red}, ${green}, ${blue})`;
	};
	const avgPriceDiff = (curAvgPrice - newAvgPrice) / curAvgPrice;
	const sx: any = {};
	if (virtual) {
		sx['background'] = '#000022';
	}

	return (
		<div className='border-top-normal' style={sx}>
			<div className='d-block d-sm-none'>
				<div className='row'>
					<div className='text-uppercase font-weight-bold col-6'>
						<span className={positiveNegativeText(action === 'buy')}>{action}</span>
						&nbsp;
						<Link to={`/stock/${symbol}`}>{symbol}</Link>
					</div>
					<div className='text-right col-6'>
						{numeral(openQuantity).format('0,0')}/
						{numeral(positionQuantity).format('0,0')}
					</div>
				</div>
				<div className='row'>
					<div className='col-6'>Limit: {numeral(limitPrice).format('$0,0.00')}</div>
					<div className='col-6 text-right'>
						Quote: {numeral(quotePrice).format('$0,0.00')}
					</div>
				</div>
				<div className='row'>
					<div className='col-6'>
						{action === 'buy' ? 'Cost' : 'Proceeds'}:&nbsp;
						<XE
							cad={openQuantity * limitPriceCad}
							usd={openQuantity * limitPriceUsd}
							currency={currency}
						/>
					</div>
					<div className='col-6 text-right'>
						Gap:{' '}
						<span className='font-weight-bold'>{numeral(gap).format('0.00%')}</span>
					</div>
				</div>
				<div className='row'>
					<div className='col-5 text-subtle'>{accountName}</div>
					<div className='col-7 text-right'>
						New Avg:&nbsp;
						{numeral(newAvgPrice).format('$0,0.00')}
						<span className='text-sub'>
							({numeral(positionCost / positionQuantity).format('$0,0.00')})
						</span>
					</div>
				</div>
			</div>

			<div className='d-none d-sm-block'>
				<div className='row'>
					<div className='text-uppercase font-weight-bold col-4'>
						<span className={positiveNegativeText(action === 'buy')}>{action}</span>
						&nbsp;
						<Link to={`/stock/${symbol}`}>{symbol}</Link>
					</div>
					<div className='col-4 text-subtle'>{accountName}</div>
					<div className='text-right col-4'>
						{numeral(openQuantity).format('0,0')}/
						{numeral(positionQuantity).format('0,0')}
					</div>
				</div>
				<div className='row'>
					<div className='col-4'>Limit: {numeral(limitPrice).format('$0,0.00')}</div>
					<div className='col-4'>Quote: {numeral(quotePrice).format('$0,0.00')}</div>
					<div className='col-4 text-right'>
						Gap:{' '}
						<span className='font-weight-bold' style={{ color: gapColor(gap) }}>
							{numeral(gap).format('0.00%')}
						</span>
					</div>
				</div>
				<div className='row'>
					<div className='col-4'>
						{action === 'buy' ? 'Cost' : 'Proceeds'}:&nbsp;
						<XE
							cad={openQuantity * limitPriceCad}
							usd={openQuantity * limitPriceUsd}
							currency={currency}
						/>
					</div>
					{action === 'buy' && (
						<div className='col-4'>
							New Avg Price:&nbsp;
							{numeral(newAvgPrice).format('$0,0.00')}
						</div>
					)}
					{action === 'sell' && (
						<div className='col-4'>
							P&L:&nbsp;
							<ColoredNumbers
								value={orderPnL(curAvgPrice, limitPrice, openQuantity)}
								type='dollar'
							/>
						</div>
					)}
					{action === 'buy' && (
						<div className='col-4 text-right text-sub'>
							Cur Avg Price:&nbsp;
							{numeral(curAvgPrice).format('$0,0.00')}
							<span>
								&nbsp;({newAvgPrice < curAvgPrice ? '-' : '+'}
								{numeral(avgPriceDiff).format('0.00%')})
							</span>
						</div>
					)}
				</div>
			</div>
		</div>
	);
};

export default Order;

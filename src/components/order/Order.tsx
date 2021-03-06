import React from 'react';
import numeral from 'numeral';
// @ts-ignore
import { Link } from 'gatsby';

import XE from '../xe/XE';
import { IOrder } from '../../utils/order';
import { positiveNegativeText } from '../../utils/util';

interface IOrderStateProps extends Omit<IOrder, 'totalQuantity' | 'orderType' | 'filledPrice' |
'avgExecPrice' | 'stopPrice' | 'type' | 'accountId' | 'side' | 'filledQuantity' > {
	positionQuantity: number,
	quotePrice: number,
	positionCost: number
}

const Order: React.FC<IOrderStateProps> = ({
	action, symbol, openQuantity, positionQuantity, limitPrice, limitPriceCad, limitPriceUsd,
	currency, accountName, quotePrice, positionCost
}) => {
	const gap = action == 'buy' ?
		(quotePrice - limitPrice) / quotePrice :
		(limitPrice - quotePrice) / limitPrice;

	const newAvgPrice = action == 'buy' && positionQuantity ?
		(positionCost + (limitPrice * openQuantity)) /
			(positionQuantity + openQuantity) :
		(action == 'buy' ? limitPrice : positionCost / positionQuantity);

	return (
		<div className='border-top-normal'>
			<div className='d-block d-sm-none'>
				<div className='row'>
					<div className='text-uppercase font-weight-bold col-6'>
						<span className={positiveNegativeText(action === 'buy')}>
							{action}
						</span>
						&nbsp;
						<Link to={`/stock/${symbol}`}>
							{symbol}
						</Link>
					</div>
					<div className='text-right col-6'>
						{numeral(openQuantity).format('0,0')}
						/
						{numeral(positionQuantity).format('0,0')}
					</div>
				</div>
				<div className='row'>
					<div className='col-6'>
						Limit: {numeral(limitPrice).format('$0,0.00')}
					</div>
					<div className='col-6 text-right'>
						Quote: {numeral(quotePrice).format('$0,0.00')}
					</div>
				</div>
				<div className='row'>
					<div className='col-6'>
						Cost:&nbsp;
						<XE
							cad={openQuantity * limitPriceCad}
							usd={openQuantity * limitPriceUsd}
							currency={currency}
						/>
					</div>
					<div className='col-6 text-right'>
						Gap: <span className='font-weight-bold'>
							{numeral(gap).format('0.00%')}
						</span>
					</div>
				</div>
				<div className='row'>
					<div className='col-5 text-subtle'>
						{accountName}
					</div>
					<div className='col-7 text-right'>
						New Avg:&nbsp;
						{numeral(newAvgPrice).format('$0,0.00')}
					</div>
				</div>
			</div>

			<div className='d-none d-sm-block'>
				<div className='row'>
					<div className='text-uppercase font-weight-bold col-4'>
						<span className={positiveNegativeText(action === 'buy')}>
							{action}
						</span>
						&nbsp;
						<Link to={`/stock/${symbol}`}>
							{symbol}
						</Link>
					</div>
					<div className='col-4 text-subtle'>
						{accountName}
					</div>
					<div className='text-right col-4'>
						{numeral(openQuantity).format('0,0')}
						/
						{numeral(positionQuantity).format('0,0')}
					</div>
				</div>
				<div className='row'>
					<div className='col-4'>
						Limit: {numeral(limitPrice).format('$0,0.00')}
					</div>
					<div className='col-4'>
						Quote: {numeral(quotePrice).format('$0,0.00')}
					</div>
					<div className='col-4 text-right'>
						Gap: <span className='font-weight-bold'>
							{numeral(gap).format('0.00%')}
						</span>
					</div>
				</div>
				<div className='row'>
					<div className='col-4'>
						Cost:&nbsp;
						<XE
							cad={openQuantity * limitPriceCad}
							usd={openQuantity * limitPriceUsd}
							currency={currency}
						/>
					</div>
					<div className='col-4'>
						New Avg Price:&nbsp;
						{numeral(newAvgPrice).format('$0,0.00')}
					</div>
				</div>
			</div>
		</div>
	);
};

export default Order;
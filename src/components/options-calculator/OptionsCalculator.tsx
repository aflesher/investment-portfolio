import React from 'react';
import numeral from 'numeral';

import XE from '../xe/XE';
import { Currency } from '../../utils/enum';

export interface IOptionsCalculatorStateProps
{

}

const OptionsCalculator: React.FC<IOptionsCalculatorStateProps> = (props) => {
	const [strikePriceString, setStrikePriceString] = React.useState('');
	const [priceString, setPriceString] = React.useState('');
	const [quantityString, setQuantityString] = React.useState('');
	const quantity = Number(quantityString || 0)
	const realQuantity = quantity * 100;

	const strikePrice = Number(strikePriceString || 0);
	const price = Number(priceString || 0);

	const breakEven = strikePrice + price;
	const cost = realQuantity * price;
	const twoXPrice = strikePrice + (price * 2);
	const fiveXPrice = strikePrice + (price * 5);
	const tenXPrice = strikePrice + (price * 10);
	const twentyXPrice = strikePrice + (price * 20);

	const twoXProceeds = price * realQuantity;
	const fiveXProceeds = price * realQuantity * 4;
	const tenXProceeds = price * realQuantity * 9;
	const twentyXProceeds = price * realQuantity * 19;

	return (
		<div className='m-2'>
			<div className='d-flex py-2 justify-content-between'>
				<div>
					<div className='input-group'>
						<div className='input-group-prepend'>
							<span className='input-group-text' id='price-addon'>
								$
							</span>
						</div>
						<input
							type='text'
							className='form-control'
							placeholder='Price'
							aria-label='Price'
							aria-describedby='price-addon'
							value={priceString}
							onChange={(e) => setPriceString(e.target.value)}
						/>
					</div>
				</div>
				<div>
					<div className='input-group'>
						<div className='input-group-prepend'>
							<span className='input-group-text' id='strike-price-addon'>
								$
							</span>
						</div>
						<input
							type='text'
							className='form-control'
							placeholder='Strike Price'
							aria-label='Strike Price'
							aria-describedby='strike-price-addon'
							value={strikePriceString}
							onChange={(e) => setStrikePriceString(e.target.value)}
						/>
					</div>
				</div>
				<div>
					<div className='input-group'>
						<div className='input-group-prepend'>
							<span className='input-group-text' id='quantity-addon'>
								#
							</span>
						</div>
						<input
							type='text'
							className='form-control'
							placeholder='Quantity'
							aria-label='Quantity'
							aria-describedby='quantity-addon'
							value={quantityString}
							onChange={(e) => setQuantityString(e.target.value)}
						/>
					</div>
				</div>
			</div>
			<div>
				<div>Projected Loss: <span className="text-negative">-{numeral(cost).format('$0,0.00')}</span></div>
				<div>Breakeven Price: <span>{numeral(breakEven).format('$0,0.00')}</span></div>
			</div>
			<table className="w-100 border-b">
				<tr className="border-b">
					<td className="w-20"></td>
					<td className="w-20">2x</td>
					<td className="w-20">5x</td>
					<td className="w-20">10x</td>
					<td className="w-20">20x</td>
				</tr>
				<tr>
					<td>Stock Price</td>
					<td>{numeral(twoXPrice).format('$0,0.00')}</td>
					<td>{numeral(fiveXPrice).format('$0,0.00')}</td>
					<td>{numeral(tenXPrice).format('$0,0.00')}</td>
					<td>{numeral(twentyXPrice).format('$0,0.00')}</td>
				</tr>
				<tr>
					<td>Returns</td>
					<td className='text-positive'>+{numeral(twoXProceeds).format('$0,0.00')}</td>
					<td className='text-positive'>+{numeral(fiveXProceeds).format('$0,0.00')}</td>
					<td className='text-positive'>+{numeral(tenXProceeds).format('$0,0.00')}</td>
					<td className='text-positive'>+{numeral(twentyXProceeds).format('$0,0.00')}</td>
				</tr>
			</table>
		</div>
	);
};

export default OptionsCalculator;
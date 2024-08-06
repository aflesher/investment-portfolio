import React, { useContext } from 'react';
import numeral from 'numeral';

import AssetSymbol, { IAssetHoverProps } from '../stock-hover/AssetSymbol';
import { Currency } from '../../utils/enum';
import { formatDateShort } from '../../utils/util';
import { CurrencyContext } from '../../context/currency.context';
import ColoredNumbers from '../colored-numbers/ColoredNumbers';

export interface ICompletePositionStateProps extends IAssetHoverProps {
	quantityBought: number;
	avgPricePaid: number;
	avgPriceSold: number;
	pnlPercentage: number;
	pnlCad: number;
	pnlUsd: number;
	openedTimestamp: number;
	closedTimestamp: number;
}

const CompletedPosition: React.FC<ICompletePositionStateProps> = ({
	symbol,
	quantityBought,
	avgPricePaid,
	avgPriceSold,
	pnlCad,
	pnlUsd,
	pnlPercentage,
	openedTimestamp,
	closedTimestamp,
}) => {
	const currency = useContext(CurrencyContext);
	return (
		<tr className='colored-row'>
			<td>
				<AssetSymbol symbol={symbol} />
			</td>
			<td className='text-right'>{quantityBought}</td>
			<td className='text-right'>{numeral(avgPricePaid).format('$0.00')}</td>
			<td className='text-right'>{numeral(avgPriceSold).format('$0.00')}</td>
			<td className='text-right'>
				<ColoredNumbers value={pnlPercentage} type='percent' />
			</td>
			<td className='text-right'>
				<ColoredNumbers
					value={currency === Currency.cad ? pnlCad : pnlUsd}
					type='dollar'
				/>
			</td>
			<td className='text-right'>{formatDateShort(openedTimestamp)}</td>
			<td className='text-right'>{formatDateShort(closedTimestamp)}</td>
		</tr>
	);
};

export default CompletedPosition;

import React, { useContext } from 'react';

import AssetSymbol from '../stock-hover/AssetSymbol';
import { IDividend } from '../../../declarations/dividend';
import XE from '../xe/XE';
import { formatDateShort } from '../../utils/util';
import { CurrencyContext } from '../../context/currency.context';

export interface IDividendStateProps
	extends Pick<IDividend, 'timestamp' | 'amountCad' | 'amountUsd' | 'symbol'> {}

const Dividend: React.FC<IDividendStateProps> = (props) => {
	const { timestamp, amountCad, amountUsd, symbol } = props;
	const currency = useContext(CurrencyContext);
	return (
		<div className='d-flex py-2 border-b'>
			<div>
				<AssetSymbol
					symbol={symbol}
					css={{ 'text-emphasis': true, 'font-weight-bold': true }}
				/>
			</div>
			<div className='ml-2 mr-auto'>
				(D)&nbsp;
				<XE cad={amountCad} usd={amountUsd} currency={currency} />
			</div>
			<div className='text-right text-sub'>{formatDateShort(timestamp)}</div>
		</div>
	);
};

export default Dividend;

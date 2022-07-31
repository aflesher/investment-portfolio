import React from 'react';

import StockHover, { IStockQuoteStateProps } from '../stock-hover/StockHover';
import { IDividend } from '../../utils/dividend';
import XE from '../xe/XE';
import { formatDateShort } from '../../utils/util';
import { Currency } from '../../utils/enum';

export interface IDividendStateProps
	extends IStockQuoteStateProps,
		Pick<IDividend, 'timestamp' | 'amountCad' | 'amountUsd' | 'currency'> {
	activeCurrency: Currency;
}

const Dividend: React.FC<IDividendStateProps> = (props) => {
	const { timestamp, amountCad, amountUsd, activeCurrency } = props;
	return (
		<div className='d-flex py-2 border-b'>
			<div>
				<StockHover
					{...props}
					css={{ 'text-emphasis': true, 'font-weight-bold': true }}
				/>
			</div>
			<div className='ml-2 mr-auto'>
				(D)&nbsp;
				<XE cad={amountCad} usd={amountUsd} currency={activeCurrency} />
			</div>
			<div className='text-right text-sub'>{formatDateShort(timestamp)}</div>
		</div>
	);
};

export default Dividend;

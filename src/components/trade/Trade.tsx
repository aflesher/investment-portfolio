import React from 'react';
import classNames from 'classnames';
import numeral from 'numeral';

import StockHover, { IStockQuoteStateProps } from '../stock-hover/StockHover';
import { ITrade } from '../../utils/trade';
import XE from '../xe/XE';
import { formatDateShort } from '../../utils/util';

export interface ITradeStateProps
	extends Omit<IStockQuoteStateProps, 'quantity'>,
		Pick<
			ITrade,
			| 'isSell'
			| 'quantity'
			| 'timestamp'
			| 'pnlCad'
			| 'pnlUsd'
			| 'currency'
			| 'accountName'
		> {
	tradePrice: number;
}

const Trade: React.FC<ITradeStateProps> = (props) => {
	const {
		symbol,
		isSell,
		quantity,
		timestamp,
		pnlCad,
		pnlUsd,
		currency,
		tradePrice,
		type,
		accountName,
	} = props;
	return (
		<div className='trade border-top-normal'>
			<div className='row'>
				<div className='col-8'>
					{symbol && (
						<div className='d-inline-block'>
							<StockHover
								{...props}
								css={{ 'text-emphasis': true, 'font-weight-bold': true }}
							/>
						</div>
					)}
					&nbsp;
					<span
						className={classNames({
							'text-positive': !isSell,
							'text-negative': isSell,
						})}
					>
						{isSell ? 'sold' : 'bought'}
					</span>
					&nbsp;
					<span>
						{type === 'crypto'
							? numeral(quantity).format('1,000.0000')
							: numeral(quantity).format('1,000')}
						{type === 'crypto' ? ' coins @' : ' shares @'}
						{numeral(tradePrice).format('$1,000.00')}
					</span>
				</div>
				<div className='col-4 text-sub text-right'>
					<span className='text-subtle'>{accountName}&nbsp;</span>
					{formatDateShort(timestamp)}
				</div>
			</div>
			{isSell && (
				<div className='ml-4'>
					<span className='mr-2' style={{ whiteSpace: 'nowrap' }}>
						P & L:
					</span>
					<span
						className={classNames({
							'text-positive': pnlCad >= 0,
							'text-negative': pnlCad < 0,
						})}
					>
						<XE cad={pnlCad} usd={pnlUsd} currency={currency} />
					</span>
				</div>
			)}
		</div>
	);
};

export default Trade;

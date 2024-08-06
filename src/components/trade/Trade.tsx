import React from 'react';
import classNames from 'classnames';
import numeral from 'numeral';

import AssetSymbol from '../stock-hover/AssetSymbol';
import { ITrade } from '../../../declarations/trade';
import XE from '../xe/XE';
import { formatDateShort } from '../../utils/util';

export interface ITradeStateProps
	extends Pick<
		ITrade,
		| 'isSell'
		| 'quantity'
		| 'timestamp'
		| 'pnlCad'
		| 'pnlUsd'
		| 'currency'
		| 'type'
		| 'symbol'
		| 'price'
	> {
	accountName: string;
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
		price,
		accountName,
		type,
	} = props;
	return (
		<div className='trade border-top-normal'>
			<div className='row'>
				<div className='col-8'>
					{symbol && (
						<div className='d-inline-block'>
							<AssetSymbol
								symbol={symbol}
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
						{numeral(price).format('$1,000.00')}
					</span>
					&nbsp;
					<span className='text-subtle'>
						({numeral(price * quantity).format('$1,000.00')})
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

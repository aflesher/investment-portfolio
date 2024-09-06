import React from 'react';
import classNames from 'classnames';
import numeral from 'numeral';

import AssetSymbol from '../stock-hover/AssetSymbol';
import { ITrade } from '../../../declarations/trade';
import XE from '../xe/XE';
import { formatDateShort } from '../../utils/util';
import Numeral from '../number/Number';
import { Currency } from '../../utils/enum';

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

const rowStyle = {
	display: 'flex',
};

const tradeDetailsStyle = {
	flexGrow: '1',
};

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
			<div style={rowStyle}>
				<div style={tradeDetailsStyle}>
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
					{isSell && (
						<>
							&nbsp;
							<span className='text-sub'>
								<Numeral
									value={currency === Currency.usd ? pnlUsd : pnlCad}
									type='dollar'
									config={{ showPlus: true }}
								/>
							</span>
						</>
					)}
				</div>
				<div className='text-sub text-right'>
					<span className='text-subtle'>{accountName}&nbsp;</span>
					{formatDateShort(timestamp)}
				</div>
			</div>
		</div>
	);
};

export default Trade;

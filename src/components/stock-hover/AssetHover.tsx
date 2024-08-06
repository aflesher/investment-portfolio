import React, { useContext, useMemo, useState } from 'react';
import { CurrencyContext } from '../../context/currency.context';
import { AssetPreviewContext } from '../../context/assetPreview.context';
import { AssetHoverContext } from '../../context/assetHover.context';
import classNames from 'classnames';
import { displayMarketCap } from '../../utils/util';
import XE from '../xe/XE';
import numeral from 'numeral';

export default function AssetHover() {
	const { symbol, style } = useContext(AssetHoverContext).value;

	const defaults = {
		name: 'unknown',
		type: 'stock',
		openPnlCad: 0,
		openPnlUsd: 0,
		currentMarketValueCad: 0,
		currentMarketValueUsd: 0,
		previousClosePrice: 0,
		price: 0,
		quoteCurrency: 'cad',
		marketCap: 0,
	};

	const activeCurrency = useContext(CurrencyContext);
	const assets = useContext(AssetPreviewContext);

	const asset = useMemo(() => assets.find((q) => q.symbol === symbol), [
		assets,
		symbol,
	]);

	const {
		previousClosePrice,
		price,
		name,
		marketCap,
		quantity,
		openPnlCad,
		openPnlUsd,
		currentMarketValueCad,
		currentMarketValueUsd,
		shareProgress,
		priceProgress,
		type,
		quoteCurrency,
	} = { ...defaults, ...asset };

	const profitsLosses = price - previousClosePrice;
	const isProfit = profitsLosses >= 0;
	const profitsLossesPercentage = Math.abs(profitsLosses) / price;
	const display = asset ? 'block' : 'none';

	return (
		<div style={{ ...style, position: 'fixed', zIndex: 1000, display }}>
			<div
				className={classNames({
					'hover-positive': isProfit,
					'hover-negative': !isProfit,
					'stock-hover': true,
				})}
			>
				<div className='p-2'>
					<div
						style={{ overflow: 'hidden', whiteSpace: 'nowrap', maxWidth: '300px' }}
						className='font-weight-bold text-emphasis'
					>
						{name}
					</div>
					<span>
						{numeral(price).format('$0,000.00')}&nbsp;
						{quoteCurrency.toUpperCase()}
					</span>
					&nbsp;
					<span
						className={classNames({
							'text-positive': isProfit,
							'text-negative': !isProfit,
							'text-sub': true,
						})}
					>
						{isProfit ? '+' : '-'}
						{numeral(Math.abs(profitsLosses)).format('$0,000.00')}&nbsp; (
						{numeral(profitsLossesPercentage).format('0.00%')})
					</span>
					<div className='text-sub pt-1 row'>
						<div className='col-6 text-nowrap'>
							Market Cap:&nbsp;
							<span className='font-weight-bold text-uppercase'>
								{displayMarketCap(marketCap)}
							</span>
						</div>
						<div className='col-6 text-nowrap'>
							{type == 'crypto' ? 'Coins' : 'Shares'}:&nbsp;
							<span className='font-weight-bold'>
								{numeral(quantity).format(type == 'crypto' ? '0,000.00' : '0,000')}
							</span>
						</div>
					</div>
					<div className='text-sub pt-1 row'>
						<div className='col-6 text-nowrap'>
							Position:&nbsp;
							<span className='font-weight-bold'>
								<XE
									cad={currentMarketValueCad}
									usd={currentMarketValueUsd}
									currency={activeCurrency}
								/>
							</span>
						</div>
						<div className='col-6 text-nowrap'>
							P and L:{' '}
							<span
								className={classNames({
									'font-weight-bold': true,
									'text-negative': openPnlCad < 0 && quantity,
									'text-positive': openPnlCad >= 0 && quantity,
								})}
							>
								{quantity ? (
									<XE cad={openPnlCad} usd={openPnlUsd} currency={activeCurrency} />
								) : (
									'N/A'
								)}
							</span>
						</div>
					</div>
					<div className='text-sub pt-1 row'>
						<div className='col-6 text-nowrap'>
							Holdings Prog.:&nbsp;
							<span className='font-weight-bold'>
								{shareProgress ? numeral(shareProgress).format('0%') : 'N/A'}
							</span>
						</div>
						<div className='col-6 text-nowrap'>
							Target Price:&nbsp;
							<span className='font-weight-bold'>
								{priceProgress ? numeral(priceProgress).format('0%') : 'N/A'}
							</span>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}

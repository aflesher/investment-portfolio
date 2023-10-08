import React, { useState, useContext } from 'react';
import classNames from 'classnames';
import numeral from 'numeral';
// @ts-ignore
import { componentWillAppendToBody } from 'react-append-to-body';
// @ts-ignore
import { Link } from 'gatsby';
import { displayMarketCap } from '../../utils/util';
import XE from '../xe/XE';
import { AssetPreviewContext } from '../../context/assetPreview.context';
import { CurrencyContext } from '../../context/currency.context';

export interface IAssetHoverProps {
	symbol: string;
	css?: object;
}

function HoverComponent({ children }: { children: JSX.Element }): JSX.Element {
	return <div>{children}</div>;
}

let AppendedHoverComponent: React.ElementType | null = null;

const StockHover: React.FC<IAssetHoverProps> = ({ symbol, css }) => {
	const marginTopAbove = '-145px';
	const marginTopBelow = '30px';

	const [hoverStyles, setHoverStyles] = useState<{
		display: string;
		top: number | string;
		left: number | string;
		marginTop?: number | string;
		right?: number | string;
	}>({
		display: 'none',
		top: 0,
		left: 0,
	});

	const defaults = {
		name: 'unknown',
		type: 'stock',
		valueCad: 0,
		valueUsd: 0,
		costCad: 0,
		costUsd: 0,
		previousClosePrice: 0,
		price: 0,
		quoteCurrency: 'cad',
		marketCap: 0,
	};

	const asset = useContext(AssetPreviewContext).find((q) => q.symbol === symbol);
	const activeCurrency = useContext(CurrencyContext);

	const {
		previousClosePrice,
		price,
		name,
		marketCap,
		quantity,
		costCad,
		costUsd,
		valueCad,
		valueUsd,
		shareProgress,
		priceProgress,
		type,
		quoteCurrency,
	} = { ...defaults, ...asset };

	React.useEffect(() => {
		AppendedHoverComponent = componentWillAppendToBody(HoverComponent);
	}, []);

	const stockQuoteRef = React.useRef<HTMLDivElement>();

	const onMouseEnter = (): void => {
		const rect = stockQuoteRef.current?.getBoundingClientRect();
		if (!rect) {
			return;
		}
		const useLeft = rect.left < document.body.offsetWidth - 400;
		const left = useLeft ? rect.left : 'auto';
		const right = useLeft ? 'auto' : 10;
		setHoverStyles({
			display: 'block',
			marginTop: rect.top < 140 ? marginTopBelow : marginTopAbove,
			left,
			right,
			top: rect.top,
		});
	};

	const onMouseLeave = (): void => {
		setHoverStyles({ ...hoverStyles, display: 'none' });
	};

	const profitsLosses = price - previousClosePrice;
	const isProfit = profitsLosses >= 0;
	const profitsLossesPercentage = Math.abs(profitsLosses) / price;

	return (
		// @ts-ignore
		<div ref={stockQuoteRef}>
			<Link
				to={`/stock/${symbol}`}
				className={classNames({
					hoverable: true,
					'text-uppercase': true,
					crypto: type == 'crypto',
					...css,
				})}
				onMouseEnter={onMouseEnter}
				onMouseLeave={onMouseLeave}
			>
				{symbol.substring(0, 8)}
			</Link>
			{AppendedHoverComponent ? (
				<AppendedHoverComponent>
					<div style={{ ...hoverStyles, position: 'fixed', zIndex: 1 }}>
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
											<XE cad={valueCad} usd={valueUsd} currency={activeCurrency} />
										</span>
									</div>
									<div className='col-6 text-nowrap'>
										P and L:{' '}
										<span
											className={classNames({
												'font-weight-bold': true,
												'text-negative': valueCad < costCad && quantity,
												'text-positive': valueCad >= costCad && quantity,
											})}
										>
											{quantity ? (
												<XE
													cad={valueCad - costCad}
													usd={valueUsd - costUsd}
													currency={activeCurrency}
												/>
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
				</AppendedHoverComponent>
			) : (
				<span></span>
			)}
		</div>
	);
};

export default StockHover;

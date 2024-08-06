import React, { useContext, useMemo } from 'react';
import classNames from 'classnames';
import { Link } from 'gatsby';
import { AssetPreviewContext } from '../../context/assetPreview.context';
import { AssetHoverContext } from '../../context/assetHover.context';

export interface IAssetHoverProps {
	symbol: string;
	css?: object;
}

const AssetSymbol = ({ symbol, css }: IAssetHoverProps) => {
	const { setValue } = useContext(AssetHoverContext);
	const marginTopAbove = '-145px';
	const marginTopBelow = '30px';

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

	const assets = useContext(AssetPreviewContext);
	const asset = useMemo(() => assets.find((q) => q.symbol === symbol), [assets]);

	const stockQuoteRef = React.useRef<HTMLDivElement>();

	const onMouseEnter = (): void => {
		const rect = stockQuoteRef.current?.getBoundingClientRect();
		if (!rect) {
			return;
		}
		const useLeft = rect.left < document.body.offsetWidth - 400;
		const left = useLeft ? rect.left : 'auto';
		const right = useLeft ? 'auto' : 10;
		setValue({
			symbol,
			style: {
				left,
				right,
				marginTop: rect.top < 140 ? marginTopBelow : marginTopAbove,
				top: rect.top,
			},
		});
	};

	const onMouseLeave = (): void => {
		setValue({ symbol: '', style: {} });
	};

	return (
		// @ts-ignore
		<div ref={stockQuoteRef}>
			<Link
				to={`/stock/${symbol}`}
				className={classNames({
					hoverable: true,
					'text-uppercase': true,
					crypto: asset?.type == 'crypto',
					...css,
				})}
				onMouseEnter={onMouseEnter}
				onMouseLeave={onMouseLeave}
			>
				{symbol.substring(0, 8)}
			</Link>
		</div>
	);
};

export default AssetSymbol;

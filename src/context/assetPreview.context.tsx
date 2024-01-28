import { createContext } from 'react';

export interface IAssetPreview {
	symbol: string;
	previousClosePrice: number;
	price: number;
	name: string;
	marketCap: number;
	quantity: number | undefined;
	css?: object;
	openPnlCad: number | undefined;
	openPnlUsd: number | undefined;
	currentMarketValueCad: number | undefined;
	currentMarketValueUsd: number | undefined;
	shareProgress: number | undefined;
	priceProgress: number | undefined;
	type: string;
	activeCurrency: string;
	quoteCurrency: string;
}

export const AssetPreviewContext = createContext<IAssetPreview[]>([]);

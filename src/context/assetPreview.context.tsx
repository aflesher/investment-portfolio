import { createContext } from 'react';

export interface IAssetPreview {
	symbol: string;
	previousClosePrice: number;
	price: number;
	name: string;
	marketCap: number;
	quantity: number | undefined;
	css?: object;
	costCad: number | undefined;
	costUsd: number | undefined;
	valueCad: number | undefined;
	valueUsd: number | undefined;
	shareProgress: number | undefined;
	priceProgress: number | undefined;
	type: string;
	activeCurrency: string;
	quoteCurrency: string;
}

export const AssetPreviewContext = createContext<IAssetPreview[]>([]);

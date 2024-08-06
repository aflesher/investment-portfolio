import React, { createContext, PropsWithChildren, useState } from 'react';

interface AssetHoverValue {
	symbol: string;
	style: {
		top?: number | string;
		left?: number | string;
		marginTop?: number | string;
		right?: number | string;
	};
}

export interface AssetHover {
	value: AssetHoverValue;
	setValue: (value: AssetHoverValue) => void;
}

export const AssetHoverContext = createContext<AssetHover>({
	value: { symbol: '', style: {} },
	setValue: (value: AssetHoverValue) => {},
});

export default function AssetHoverProvider({ children }: PropsWithChildren) {
	const [value, setValue] = useState<AssetHoverValue>({
		symbol: '',
		style: {},
	});

	return (
		<AssetHoverContext.Provider value={{ value, setValue }}>
			{children}
		</AssetHoverContext.Provider>
	);
}

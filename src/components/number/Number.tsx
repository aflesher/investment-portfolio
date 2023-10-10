import React, { FC } from 'react';
import numeral from 'numeral';
import Text, { ITextConfig } from '../text/Text';

export interface INumeralStateProps {
	value: number;
	type: 'dollar' | 'percent';
	config?: {
		showPlus?: boolean;
		noColors?: boolean;
	};
}

const Numeral: FC<INumeralStateProps> = ({ value, type, config }) => {
	const prefix = value > 0 && config?.showPlus ? '+' : '';
	const format = type === 'dollar' ? '$0,0.00' : '0,0.00%';
	const display = prefix + numeral(value).format(format);
	const textConfig: ITextConfig = {};

	if (!config?.noColors) {
		textConfig.color = value >= 0 ? 'positive' : 'negative';
	}

	return <Text config={textConfig}>{display}</Text>;
};

export default Numeral;

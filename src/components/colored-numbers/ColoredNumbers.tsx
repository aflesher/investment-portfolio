import React from 'react';
import numeral from 'numeral';

interface IColoredNumbersStateProps {
	hidePlus?: boolean;
	value: number;
	type: 'percent' | 'dollar';
}

const ColoredNumbers: React.FC<IColoredNumbersStateProps> = ({
	value,
	type,
	hidePlus,
}) => {
	if (type === 'dollar' && hidePlus == undefined) {
		hidePlus = true;
	}

	let format = '$0,0.00';
	if (type === 'percent') {
		format = '0,0.00%';
	}
	return (
		<span
			className={`${value >= 0 && 'text-positive'} ${
				value < 0 && 'text-negative'
			}`}
		>
			{value >= 0 && !hidePlus && '+'}
			{numeral(value).format(format)}
		</span>
	);
};

export default ColoredNumbers;

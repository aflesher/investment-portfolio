import React from 'react';
import numeral from 'numeral';

interface IPercentStateProps {
	percent: number;
	hidePlus?: boolean;
}

const Percent: React.FC<IPercentStateProps> = ({ percent, hidePlus }) => {
	return (
		<span
			className={`${percent >= 0 && 'text-positive'} ${
				percent < 0 && 'text-negative'
			}`}
		>
			{percent >= 0 && !hidePlus && '+'}
			{numeral(percent).format('0,0.00%')}
		</span>
	);
};

export default Percent;

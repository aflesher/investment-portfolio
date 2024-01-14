import React from 'react';
import numeral from 'numeral';

export const PercentBar = ({ percent }: { percent: number }) => {
	return (
		<div
			className={`bar-graph bar-background ${
				percent < 0 ? 'negative' : 'positive'
			}`}
		>
			<div
				className='bar'
				style={{
					width: `${percent * 100}%`,
				}}
			>
				<div className='end-value'>{numeral(percent).format('0%')}</div>
			</div>
		</div>
	);
};

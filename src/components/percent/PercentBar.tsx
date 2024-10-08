import React from 'react';
import numeral from 'numeral';

export const PercentBar = ({ percent }: { percent: number }) => {
	percent = Math.min(1, percent);
	return (
		<div
			className={`bar-graph bar-background ${
				percent < 0 ? 'negative' : 'positive'
			}`}
		>
			<div
				className='bar'
				style={{
					width: `${Math.abs(percent) * 100}%`,
				}}
			>
				<div className={`end-value ${percent > 0.8 ? 'inside' : ''}`}>
					{numeral(percent).format('0%')}
				</div>
			</div>
		</div>
	);
};

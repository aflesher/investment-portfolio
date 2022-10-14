import React from 'react';
import numeral from 'numeral';

export interface IBalanceStateProps {
	name: string;
	amountCad: number;
	amountUsd: number;
	combinedCad: number;
	combinedUsd: number;
}

const Balance: React.FC<IBalanceStateProps> = ({
	name,
	amountCad,
	amountUsd,
	combinedCad,
	combinedUsd,
}) => {
	const format = '$0,0.00';
	return (
		<div className='py-4 my-1 pl-4 border'>
			<div className='row text-emphasis'>
				<div className='col-6'>Account:</div>
				<div className='col-6'>{name}</div>
			</div>
			<div className='row'>
				<div className='col-6'>$CAD</div>
				<div className='col-6'>{numeral(amountCad).format(format)}</div>
			</div>
			<div className='row'>
				<div className='col-6'>$USD</div>
				<div className='col-6'>{numeral(amountUsd).format(format)}</div>
			</div>
			<div className='row text-subtle'>
				<div className='col-6'>$CAD COMB.</div>
				<div className='col-6'>{numeral(combinedCad).format(format)}</div>
			</div>
			<div className='row text-subtle'>
				<div className='col-6'>$USD COMB.</div>
				<div className='col-6'>{numeral(combinedUsd).format(format)}</div>
			</div>
		</div>
	);
};

export default Balance;

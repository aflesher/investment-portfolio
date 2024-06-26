import React from 'react';
import numeral from 'numeral';

export interface IBalanceStateProps {
	name: string;
	amountCad: number;
	amountUsd: number;
	cadHISA?: number;
	usdHISA?: number;
	combinedCadHISA?: number;
	combinedUsdHISA?: number;
	combinedCad: number;
	combinedUsd: number;
	ordersDeltaCad?: number;
	ordersDeltaUsd?: number;
}

const Balance: React.FC<IBalanceStateProps> = ({
	name,
	amountCad,
	amountUsd,
	cadHISA,
	usdHISA,
	combinedCadHISA,
	combinedUsdHISA,
	combinedCad,
	combinedUsd,
	ordersDeltaCad,
	ordersDeltaUsd,
}) => {
	const format = '$0,0.00';
	return (
		<div className='py-4 my-1 border container'>
			<div className='row text-emphasis border-b pb-1'>
				<div className='col-12 font-italic'>{name}</div>
			</div>
			<div className='row'>
				<div className='col-6'>$CAD</div>
				<div className='col-6'>{numeral(amountCad).format(format)}</div>
			</div>
			<div className='row'>
				<div className='col-6'>$USD</div>
				<div className='col-6'>{numeral(amountUsd).format(format)}</div>
			</div>
			{!!ordersDeltaCad && (
				<div className='row text-subtle'>
					<div className='col-6'>$CAD (-Orders)</div>
					<div className='col-6'>{numeral(ordersDeltaCad).format(format)}</div>
				</div>
			)}
			{!!ordersDeltaUsd && (
				<div className='row text-subtle'>
					<div className='col-6'>$USD (-Orders)</div>
					<div className='col-6'>{numeral(ordersDeltaUsd).format(format)}</div>
				</div>
			)}
			{!!cadHISA && (
				<div className='row'>
					<div className='col-6'>$CAD (HISA)</div>
					<div className='col-6'>{numeral(cadHISA).format(format)}</div>
				</div>
			)}
			{!!usdHISA && (
				<div className='row'>
					<div className='col-6'>$USD (HISA)</div>
					<div className='col-6'>{numeral(usdHISA).format(format)}</div>
				</div>
			)}
			{!!combinedCadHISA && (
				<div className='row'>
					<div className='col-6'>$CAD (C.H.)</div>
					<div className='col-6'>{numeral(combinedCadHISA).format(format)}</div>
				</div>
			)}
			{!!combinedUsdHISA && (
				<div className='row'>
					<div className='col-6'>$USD (C.H.)</div>
					<div className='col-6'>{numeral(combinedUsdHISA).format(format)}</div>
				</div>
			)}
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

import React from 'react';
import numeral from 'numeral';

export interface IXEStateProps {
	usd: number,
	cad: number,
	currency: string,
	hideCurrency?: boolean
}

const XE: React.FC<IXEStateProps> = ({ cad, usd, currency, hideCurrency }) => {
	const amount = currency === 'cad' ? cad : usd;
	
	return(
		<span>
			<span>{numeral(amount).format('$0,0.00')}</span>
			{!hideCurrency &&
				<span className='currency'>
					&nbsp;{currency.toUpperCase()}
				</span>
			}
		</span>
	);
};

export default XE;
import React from 'react';

import { faClassForSymbol } from '../../utils/util';

export interface ICompanyBannerStateProps {
	symbol: string,
	name: string,
	isNotBanner?: boolean,
}

const CompanyBanner: React.FC<ICompanyBannerStateProps> = ({ symbol, name, isNotBanner }) => (
	<div className={`${!isNotBanner && 'company-banner'} text-emphasis text-center ${symbol.replace(/\./g, '-').replace('link', 'crypto-link')}`}>
		<i className={faClassForSymbol(symbol)}></i>
		{name.split('').map(l => (<span>{l}</span>))}
		<div></div>
	</div>
);

export default CompanyBanner;
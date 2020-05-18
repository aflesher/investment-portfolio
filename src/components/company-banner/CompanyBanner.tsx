import React from 'react';

import { faClassForSymbol } from '../../utils/util';

export interface ICompanyBannerStateProps {
	symbol: string,
	name: string
}

const CompanyBanner: React.FC<ICompanyBannerStateProps> = ({ symbol, name }) => (
	<div className={`company-banner text-emphasis text-center ${symbol.replace(/\./g, '-')}`}>
		<i className={faClassForSymbol(symbol)}></i>
		{name}
		<div></div>
	</div>
);

export default CompanyBanner;
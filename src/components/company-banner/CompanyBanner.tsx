import { navigate } from 'gatsby';
import React from 'react';

import { faClassForSymbol, obfuscateCompany } from '../../utils/util';

export interface ICompanyBannerStateProps {
	symbol: string;
	name: string;
	isNotBanner?: boolean;
}

const CompanyBanner: React.FC<ICompanyBannerStateProps> = ({
	symbol,
	name,
	isNotBanner,
}) => (
	<div
		className={`${
			!isNotBanner && 'company-banner'
		} text-emphasis text-center ${symbol
			.replace(/\./g, '-')
			.replace('link', 'crypto-link')}`}
		onClick={() => navigate(`/stock/${symbol}`)}
	>
		<i className={faClassForSymbol(symbol)}></i>
		{obfuscateCompany(name)
			.split('')
			.map((l, index) => (
				<span key={`${l}${index}`}>{l}</span>
			))}
		<div></div>
	</div>
);

export default CompanyBanner;

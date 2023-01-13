import React from 'react';
import { graphql } from 'gatsby';
import { ICash } from '../utils/cash';
import Balance, { IBalanceStateProps } from '../components/balance/Balance';
import { Currency } from '../utils/enum';
import Layout from '../components/layout';

interface ICashQuery {
	data: {
		allCash: {
			nodes: ICash[];
		};
	};
}

const Cash: React.FC<ICashQuery> = ({ data }) => {
	const balances: IBalanceStateProps[] = [];

	data.allCash.nodes.forEach(
		({ accountName, currency, amount, amountCad, amountUsd }) => {
			let balance = balances.find((q) => q.name === accountName);
			if (!balance) {
				balance = {
					name: accountName,
					amountCad: 0,
					amountUsd: 0,
					combinedCad: 0,
					combinedUsd: 0,
				};
				balances.push(balance);
			}

			if (currency === Currency.cad) {
				balance.amountCad += amount;
			}

			if (currency === Currency.usd) {
				balance.amountUsd += amount;
			}

			balance.combinedCad += amountCad;
			balance.combinedUsd += amountUsd;
		}
	);

	const combinedBalances: IBalanceStateProps = {
		amountCad: balances.reduce((sum, { amountCad }) => sum + amountCad, 0),
		amountUsd: balances.reduce((sum, { amountUsd }) => sum + amountUsd, 0),
		combinedCad: balances.reduce((sum, { combinedCad }) => sum + combinedCad, 0),
		combinedUsd: balances.reduce((sum, { combinedUsd }) => sum + combinedUsd, 0),
		name: 'Combined',
	};

	balances.push(combinedBalances);

	return (
		<Layout>
			<div className='p-4'>
				<div className='row'>
					{balances.map((balance) => (
						<div className='col-4' key={balance.name}>
							<Balance {...balance} />
						</div>
					))}
				</div>
			</div>
		</Layout>
	);
};

export default Cash;

export const pageQuery = graphql`
	query {
		allCash {
			nodes {
				accountId
				accountName
				amount
				amountCad
				amountUsd
				id
				currency
			}
		}
	}
`;
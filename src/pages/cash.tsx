import React from 'react';
import { graphql } from 'gatsby';
import { ICash } from '../utils/cash';
import Balance, { IBalanceStateProps } from '../components/balance/Balance';
import { Currency } from '../utils/enum';
import Layout from '../components/layout';
import { IPosition } from '../utils/position';
import { ITrade } from '../utils/trade';
import { IQuote } from '../utils/quote';

interface ICashQueryTrade
	extends Pick<
		ITrade,
		'accountName' | 'quantity' | 'symbol' | 'isSell' | 'currency'
	> {}
interface IAccountPosition
	extends Pick<
		IPosition,
		| 'symbol'
		| 'currency'
		| 'quantity'
		| 'currentMarketValueCad'
		| 'currentMarketValueUsd'
	> {
	accountName: string;
}

interface IAccountPositionQuote
	extends Pick<
		IQuote,
		'symbol' | 'price' | 'priceCad' | 'priceUsd' | 'currency'
	> {}

interface ICashQuery {
	data: {
		allCash: {
			nodes: ICash[];
		};
		allTrade: {
			nodes: ICashQueryTrade[];
		};
		allQuote: {
			nodes: Pick<
				IQuote,
				'symbol' | 'price' | 'priceCad' | 'priceUsd' | 'currency'
			>[];
		};
	};
}

const Cash: React.FC<ICashQuery> = ({ data }) => {
	const balances: IBalanceStateProps[] = [];

	const getAccountPositions = (
		trades: ICashQueryTrade[],
		quotes: IAccountPositionQuote[]
	): IAccountPosition[] => {
		const positions: IAccountPosition[] = [];
		trades.forEach((trade) => {
			let position = positions.find(
				(q) => q.symbol === trade.symbol && q.accountName === trade.accountName
			);

			if (!position) {
				position = {
					symbol: trade.symbol,
					currency: trade.currency,
					quantity: 0,
					currentMarketValueCad: 0,
					currentMarketValueUsd: 0,
					accountName: trade.accountName,
				};
				positions.push(position);
			}

			const quote = quotes.find((q) => q.symbol === position!.symbol);
			if (!quote) {
				return;
			}

			if (trade.isSell) {
				position.quantity -= trade.quantity;
			} else {
				position.quantity += trade.quantity;
			}

			position.currentMarketValueCad = position.quantity * quote.priceCad;
			position.currentMarketValueUsd = position.quantity * quote.priceUsd;
		});

		return positions;
	};

	const accountPositions = getAccountPositions(
		data.allTrade.nodes,
		data.allQuote.nodes
	);

	data.allCash.nodes.forEach(
		({ accountName, currency, amount, amountCad, amountUsd }) => {
			let balance = balances.find((q) => q.name === accountName);
			if (!balance) {
				const cadHISA = accountPositions
					.filter(
						(q) => q.accountName === accountName && q.currency === Currency.cad
					)
					.reduce(
						(sum, { currentMarketValueCad }) => sum + currentMarketValueCad,
						0
					);
				const usdHISA = accountPositions
					.filter(
						(q) => q.accountName === accountName && q.currency === Currency.usd
					)
					.reduce(
						(sum, { currentMarketValueUsd }) => sum + currentMarketValueUsd,
						0
					);
				const combinedCadHISA = accountPositions
					.filter((q) => q.accountName == accountName)
					.reduce(
						(sum, { currentMarketValueCad }) => sum + currentMarketValueCad,
						0
					);
				const combinedUsdHISA = accountPositions
					.filter((q) => q.accountName == accountName)
					.reduce(
						(sum, { currentMarketValueUsd }) => sum + currentMarketValueUsd,
						0
					);
				balance = {
					name: accountName,
					amountCad: 0,
					amountUsd: 0,
					cadHISA,
					usdHISA,
					combinedCadHISA,
					combinedUsdHISA,
					combinedCad: combinedCadHISA,
					combinedUsd: combinedUsdHISA,
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
		amountCad: balances
			.filter((q) => q.name != 'EQ Bank')
			.reduce((sum, { amountCad }) => sum + amountCad, 0),
		amountUsd: balances
			.filter((q) => q.name != 'EQ Bank')
			.reduce((sum, { amountUsd }) => sum + amountUsd, 0),
		cadHISA: balances.reduce((sum, { cadHISA }) => sum + (cadHISA || 0), 0),
		usdHISA: balances.reduce((sum, { usdHISA }) => sum + (usdHISA || 0), 0),
		combinedCadHISA: balances.reduce(
			(sum, { combinedCadHISA }) => sum + (combinedCadHISA || 0),
			0
		),
		combinedUsdHISA: balances.reduce(
			(sum, { combinedUsdHISA }) => sum + (combinedUsdHISA || 0),
			0
		),
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
		allTrade(
			filter: {
				symbol: { regex: "/(cash.to)|(hsuv.u.to)|(hisa.to)|(hisu.u.to)/" }
			}
			sort: { fields: timestamp }
		) {
			nodes {
				accountName
				isSell
				quantity
				symbol
				currency
			}
		}
		allQuote(
			filter: {
				symbol: { regex: "/(cash.to)|(hsuv.u.to)|(hisa.to)|(hisu.u.to)/" }
			}
		) {
			nodes {
				price
				priceCad
				priceUsd
				symbol
				currency
			}
		}
	}
`;

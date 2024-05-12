import * as React from 'react';
import { connect } from 'react-redux';
import { StaticQuery, graphql } from 'gatsby';
import _ from 'lodash';
import firebase from 'firebase/compat/app';

import {
	IStoreState,
	IStoreAction,
	SET_USER_ACTION,
	SET_SHOW_SIDEBAR,
} from '../store/store';
import { Currency, AssetType } from '../utils/enum';
import SidebarLeft from './sidebar/SidebarLeft';
import SidebarRight, { ISidebarPosition } from './sidebar/SidebarRight';
import { ITradeStateProps } from './trade/Trade';
import { IDividendStateProps } from './dividend/Dividend';
import { AssetPreviewContext } from '../context/assetPreview.context';
import { IQuote } from '../../declarations/quote';
import { ICompany } from '../../declarations/company';
import { IPosition } from '../../declarations/position';
import { IAssessment } from '../../declarations/assessment';
import { CurrencyContext } from '../context/currency.context';
import { IDividend } from '../../declarations/dividend';
import { ITrade } from '../../declarations/trade';
import { IAccount } from '../../declarations';

interface ILayoutStateProps {
	user: firebase.User | null | undefined;
	showSidebar: boolean;
	userLoading: boolean;
}

interface ILayoutDispatchProps {
	setAuthenticated: (authenticated: boolean) => void;
	setShowSidebar: (showSidebar: boolean) => void;
}

const mapStateToProps = ({
	user,
	showSidebar,
	userLoading,
}: IStoreState): ILayoutStateProps => {
	return { user, showSidebar, userLoading };
};

const mapDispatchToProps = (
	dispatch: (action: IStoreAction) => void
): ILayoutDispatchProps => {
	return {
		setAuthenticated: (authenticated: boolean): void =>
			dispatch({
				type: SET_USER_ACTION,
				payload: authenticated,
			}),
		setShowSidebar: (showSidebar: boolean): void =>
			dispatch({
				type: SET_SHOW_SIDEBAR,
				payload: showSidebar,
			}),
	};
};

interface IQuoteNode
	extends Pick<
		IQuote,
		| 'symbol'
		| 'afterHoursPrice'
		| 'currency'
		| 'price'
		| 'priceCad'
		| 'priceUsd'
		| 'type'
	> {
	company?: Pick<ICompany, 'name' | 'prevDayClosePrice' | 'marketCap'>;
	position?: Pick<
		IPosition,
		| 'quantity'
		| 'openPnlCadCurrentRate'
		| 'openPnlUsd'
		| 'currentMarketValueCad'
		| 'currentMarketValueUsd'
	>;
	assessment?: Pick<
		IAssessment,
		'targetInvestmentProgress' | 'targetPriceProgress'
	>;
}

interface ILayoutGraphQL {
	allExchangeRate: {
		nodes: {
			rate: number;
		}[];
	};
	allPosition: {
		nodes: {
			symbol: string;
			currency: Currency;
			totalCostCad: number;
			totalCostUsd: number;
			currentMarketValueCad: number;
			currentMarketValueUsd: number;
			quantity: number;
			averageEntryPrice: number;
			type: AssetType;
			company: {
				prevDayClosePrice: number;
				marketCap: number;
				name: string;
			};
			quote: {
				price: number;
				priceCad: number;
				priceUsd: number;
				currency: Currency;
			};
			assessment?: {
				targetInvestmentProgress: number;
				targetPriceProgress: number;
			};
		}[];
	};
	allTrade: {
		nodes: Pick<
			ITrade,
			| 'isSell'
			| 'quantity'
			| 'timestamp'
			| 'pnlCad'
			| 'pnlUsd'
			| 'currency'
			| 'accountId'
			| 'type'
			| 'symbol'
			| 'price'
		>[];
	};
	allDividend: {
		nodes: Pick<IDividend, 'timestamp' | 'amountCad' | 'amountUsd' | 'symbol'>[];
	};
	allQuote: {
		nodes: IQuoteNode[];
	};
	allAccount: {
		nodes: IAccount[];
	};
}

const MainLayout: React.FC<ILayoutStateProps & ILayoutDispatchProps> = ({
	children,
	user,
	showSidebar,
	setShowSidebar,
	userLoading,
}) => (
	<StaticQuery
		query={graphql`
			query {
				allExchangeRate(
					limit: 1
					filter: { key: { eq: "USD_CAD" } }
					sort: { fields: [date], order: DESC }
				) {
					nodes {
						rate
					}
				}
				allPosition(filter: { company: { hisa: { eq: false } } }) {
					nodes {
						symbol
						currency
						openPnlCadCurrentRate
						openPnlUsd
						quantity
						averageEntryPrice
						type
						quote {
							price
							priceCad
							priceUsd
							currency
						}
						company {
							prevDayClosePrice
							marketCap
							name
						}
						assessment {
							targetInvestmentProgress
							targetPriceProgress
						}
					}
				}
				allTrade(sort: { fields: [timestamp], order: DESC }, limit: 7) {
					nodes {
						accountId
						quantity
						price
						action
						symbol
						timestamp
						pnl
						pnlCad
						pnlUsd
						currency
						type
						priceCad
						priceUsd
						isSell
					}
				}
				allDividend(limit: 7, sort: { fields: timestamp, order: DESC }) {
					nodes {
						amountCad
						amountUsd
						timestamp
						symbol
					}
				}
				allQuote {
					nodes {
						afterHoursPrice
						currency
						id
						price
						priceCad
						priceUsd
						symbol
						type
						position {
							quantity
							openPnlCadCurrentRate
							openPnlUsd
							currentMarketValueCad
							currentMarketValueUsd
						}
						assessment {
							targetInvestmentProgress
							targetPriceProgress
						}
						company {
							name
							prevDayClosePrice
							marketCap
						}
					}
				}
				allAccount {
					nodes {
						accountId
						displayName
						name
						isTaxable
						balances {
							amount
							amountCad
							amountUsd
							currency
						}
					}
				}
			}
		`}
		render={(queryData: ILayoutGraphQL): JSX.Element => {
			const [isCollapsed, setIsCollapsed] = React.useState(true);
			const [currency, setCurrency] = React.useState(Currency.cad);
			const usdCad = queryData.allExchangeRate.nodes[0]?.rate || 1;
			const cadUsd = 1 / usdCad;

			const positions: ISidebarPosition[] = queryData.allPosition.nodes.map(
				(position) => ({
					...position,
					quotePrice: position.quote.price,
					previousClosePrice: position.company.prevDayClosePrice,
				})
			);

			const accountLookup = _.keyBy(queryData.allAccount.nodes, 'accountId');
			const trades: ITradeStateProps[] = queryData.allTrade.nodes.map((trade) => ({
				...trade,
				accountName: accountLookup[trade.accountId]?.displayName,
			}));

			const dividends: IDividendStateProps[] = queryData.allDividend.nodes;

			const assetHovers = queryData.allQuote.nodes.map((quote) => ({
				symbol: quote.symbol,
				previousClosePrice: quote.company?.prevDayClosePrice || 0,
				price: quote.price,
				name: quote.company?.name || '',
				marketCap: quote.company?.marketCap || 0,
				quantity: quote.position?.quantity,
				openPnlCad: quote.position?.openPnlCadCurrentRate,
				openPnlUsd: quote.position?.openPnlUsd,
				currentMarketValueCad: quote.position?.currentMarketValueCad,
				currentMarketValueUsd: quote.position?.currentMarketValueUsd,
				shareProgress: quote.assessment?.targetInvestmentProgress,
				priceProgress: quote.assessment?.targetPriceProgress,
				type: quote.type,
				activeCurrency: Currency.cad,
				quoteCurrency: quote.currency,
			}));

			return (
				<div className='page-wrapper'>
					<AssetPreviewContext.Provider value={assetHovers}>
						<CurrencyContext.Provider value={currency}>
							<div className={`page ${isCollapsed && 'collapsed'}`}>
								<div
									className={`sidebar-left ${showSidebar && 'sidebar-open'} ${
										isCollapsed && 'collapsed'
									}`}
								>
									<div className='p-2'>
										<SidebarLeft
											currency={currency}
											onSetCurrency={setCurrency}
											usdCad={usdCad}
											cadUsd={cadUsd}
											authenticated={!!user || userLoading}
											isCollapsed={isCollapsed}
											onToggleCollapse={() => setIsCollapsed(!isCollapsed)}
										/>
									</div>
								</div>
								<div className='sidebar-right'>
									<div className='p-2'>
										<SidebarRight
											positions={positions}
											trades={trades}
											dividends={dividends}
										/>
									</div>
								</div>
								<div
									className='mobile-nav-link'
									onClick={(): void => setShowSidebar(!showSidebar)}
								></div>
								<div className='main-content'>{children}</div>
							</div>
						</CurrencyContext.Provider>
					</AssetPreviewContext.Provider>
				</div>
			);
		}}
	/>
);

export default connect(mapStateToProps, mapDispatchToProps)(MainLayout);

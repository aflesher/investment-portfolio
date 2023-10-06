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

interface ILayoutStateProps {
	user: firebase.User | null | undefined;
	showSidebar: boolean;
}

interface ILayoutDispatchProps {
	setAuthenticated: (authenticated: boolean) => void;
	setShowSidebar: (showSidebar: boolean) => void;
}

const mapStateToProps = ({
	user,
	showSidebar,
}: IStoreState): ILayoutStateProps => {
	return { user, showSidebar };
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
		| 'totalCostCad'
		| 'totalCostUsd'
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
		nodes: {
			accountId: number;
			quantity: number;
			price: number;
			action: string;
			symbol: string;
			timestamp: number;
			pnl: number;
			pnlCad: number;
			pnlUsd: number;
			currency: Currency;
			type: AssetType;
			priceCad: number;
			priceUsd: number;
			company: {
				name: string;
				marketCap: number;
				prevDayClosePrice: number;
				symbol: string;
				yield?: number;
			};
			quote: {
				price: number;
				priceUsd: number;
				priceCad: number;
				currency: Currency;
			};
			assessment?: {
				targetInvestmentProgress: number;
				targetPriceProgress: number;
				type: AssetType;
			};
			position?: {
				quantity: number;
				totalCost: number;
				totalCostUsd: number;
				totalCostCad: number;
				currentMarketValueCad: number;
				currentMarketValueUsd: number;
				averageEntryPrice: number;
				openPnl: number;
				openPnlCad: number;
				openPnlUsd: number;
			};
		}[];
	};
	allDividend: {
		nodes: {
			amountCad: number;
			amountUsd: number;
			currency: Currency;
			timestamp: number;
			company: {
				name: string;
				marketCap: number;
				prevDayClosePrice: number;
				symbol: string;
				yield?: number;
			};
			quote: {
				price: number;
				priceUsd: number;
				priceCad: number;
				currency: Currency;
			};
			assessment?: {
				targetInvestmentProgress: number;
				targetPriceProgress: number;
				type: AssetType;
			};
			position?: {
				quantity: number;
				totalCost: number;
				totalCostUsd: number;
				totalCostCad: number;
				currentMarketValueCad: number;
				currentMarketValueUsd: number;
				averageEntryPrice: number;
				openPnl: number;
				openPnlCad: number;
				openPnlUsd: number;
			};
		}[];
	};
	allQuote: {
		nodes: IQuoteNode[];
	};
}

const MainLayout: React.FC<ILayoutStateProps & ILayoutDispatchProps> = ({
	children,
	user,
	showSidebar,
	setShowSidebar,
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
						totalCostCad
						totalCostUsd
						currentMarketValueCad
						currentMarketValueUsd
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
						assessment {
							targetInvestmentProgress
							targetPriceProgress
							type
						}
						company {
							name
							marketCap
							prevDayClosePrice
							symbol
							yield
						}
						quote {
							price
							priceUsd
							priceCad
							currency
						}
						position {
							quantity
							totalCost
							totalCostUsd
							totalCostCad
							currentMarketValueCad
							currentMarketValueUsd
							averageEntryPrice
							openPnl
							openPnlCad
							openPnlUsd
						}
					}
				}
				allDividend(limit: 7, sort: { fields: timestamp, order: DESC }) {
					nodes {
						amountCad
						amountUsd
						currency
						timestamp
						assessment {
							targetInvestmentProgress
							targetPriceProgress
							type
						}
						company {
							name
							marketCap
							prevDayClosePrice
							symbol
							yield
						}
						quote {
							price
							priceUsd
							priceCad
							currency
						}
						position {
							quantity
							totalCost
							totalCostUsd
							totalCostCad
							currentMarketValueCad
							currentMarketValueUsd
							averageEntryPrice
							openPnl
							openPnlCad
							openPnlUsd
						}
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
							totalCostCad
							totalCostUsd
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
			}
		`}
		render={(queryData: ILayoutGraphQL): JSX.Element => {
			const [isCollapsed, setIsCollapsed] = React.useState(true);
			const [currency, setCurrency] = React.useState(Currency.cad);
			const usdCad = _.first(queryData.allExchangeRate.nodes)?.rate || 1;
			const cadUsd = 1 / usdCad;

			const portfolioValue: number = queryData.allPosition.nodes.reduce(
				(sum, { currentMarketValueCad }) => sum + currentMarketValueCad,
				0
			);

			const portfolioCost: number = _.sumBy(
				queryData.allPosition.nodes,
				(q) => q.totalCostCad
			);

			const positions: ISidebarPosition[] = queryData.allPosition.nodes.map(
				(position) => ({
					...position,
					quotePrice: position.quote.price,
					previousClosePrice: position.company.prevDayClosePrice,
				})
			);

			const trades: ITradeStateProps[] = queryData.allTrade.nodes.map((trade) => ({
				...trade,
				previousClosePrice: trade.company.prevDayClosePrice,
				name: trade.company.name,
				price: trade.quote.price,
				assetCurrency: trade.currency,
				marketCap: trade.company.marketCap,
				percentageOfInvestment: (trade.position?.totalCostCad || 0) / portfolioCost,
				percentageOfPortfolio:
					(trade.position?.currentMarketValueCad || 0) / portfolioValue,
				activeCurrency: currency,
				shareProgress: trade.assessment?.targetInvestmentProgress || 0,
				priceProgress: trade.assessment?.targetPriceProgress || 0,
				tradePrice: trade.price,
				valueCad: trade.position?.currentMarketValueCad || 0,
				valueUsd: trade.position?.currentMarketValueUsd || 0,
				costCad: trade.position?.totalCostCad || 0,
				costUsd: trade.position?.totalCostUsd || 0,
				isSell: trade.action === 'sell',
				type: trade.type,
				quoteCurrency: trade.quote.currency,
				accountName: '',
			}));

			const dividends: IDividendStateProps[] = queryData.allDividend.nodes.map(
				(dividend) => ({
					...dividend,
					previousClosePrice: dividend.company.prevDayClosePrice,
					name: dividend.company.name,
					price: dividend.quote.price,
					assetCurrency: dividend.currency,
					marketCap: dividend.company.marketCap,
					percentageOfInvestment:
						(dividend.position?.totalCostCad || 0) / portfolioCost,
					percentageOfPortfolio:
						(dividend.position?.currentMarketValueCad || 0) / portfolioValue,
					activeCurrency: currency,
					shareProgress: dividend.assessment?.targetInvestmentProgress || 0,
					priceProgress: dividend.assessment?.targetPriceProgress || 0,
					valueCad: dividend.position?.currentMarketValueCad || 0,
					valueUsd: dividend.position?.currentMarketValueUsd || 0,
					costCad: dividend.position?.totalCostCad || 0,
					costUsd: dividend.position?.totalCostUsd || 0,
					symbol: dividend.company.symbol,
					type: AssetType.stock,
					quantity: dividend.position?.quantity || 0,
					quoteCurrency: dividend.quote.currency,
				})
			);

			const assetHovers = queryData.allQuote.nodes.map((quote) => ({
				symbol: quote.symbol,
				previousClosePrice: quote.company?.prevDayClosePrice || 0,
				price: quote.price,
				name: quote.company?.name || '',
				marketCap: quote.company?.marketCap || 0,
				quantity: quote.position?.quantity,
				costCad: quote.position?.totalCostCad,
				costUsd: quote.position?.totalCostUsd,
				valueCad: quote.position?.currentMarketValueCad,
				valueUsd: quote.position?.currentMarketValueUsd,
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
											authenticated={!!user}
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

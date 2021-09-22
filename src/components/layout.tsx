import * as React from 'react';
import { connect } from 'react-redux';
import { StaticQuery, graphql } from 'gatsby';
import classNames from 'classnames';
import _ from 'lodash';
import * as firebase from 'firebase/app';

import {
	IStoreState,
	IStoreAction,
	SET_CURRENCY_ACTION,
	SET_USER_ACTION,
	SET_SHOW_SIDEBAR
} from '../store/store';
import { Currency, AssetType } from '../utils/enum';
import SidebarLeft from './sidebar/SidebarLeft';
import SidebarRight from './sidebar/SidebarRight';
import { IPositionStateProps } from './position/Position';
import { ITradeStateProps } from './trade/Trade';
import { IDividendStateProps } from './dividend/Dividend';
import { type } from 'os';

const headerImage = require('../images/header.png');
const headerSpacerImage = require('../images/header-spacer.png');

interface ILayoutStateProps {
	currency: Currency,
	user: firebase.User | null | undefined,
	showSidebar: boolean
}

interface ILayoutDispatchProps {
	setCurrency: (currency: Currency) => void,
	setAuthenticated: (authenticated: boolean) => void,
	setShowSidebar: (showSidebar: boolean) => void
}

const mapStateToProps = ({ currency, user, showSidebar }: IStoreState): ILayoutStateProps => {
	return { currency, user, showSidebar };
};

const mapDispatchToProps = (dispatch: (action: IStoreAction) => void): ILayoutDispatchProps => {
	return {
		setCurrency: (currency: Currency): void => dispatch({
			type: SET_CURRENCY_ACTION,
			payload: currency
		}),
		setAuthenticated: (authenticated: boolean): void => dispatch({
			type: SET_USER_ACTION,
			payload: authenticated
		}),
		setShowSidebar: (showSidebar: boolean): void => dispatch({
			type: SET_SHOW_SIDEBAR,
			payload: showSidebar
		})
	};
};

interface ILayoutGraphQL {
	allExchangeRate: {
		nodes: {
			rate: number
		}[]
	}
	allPosition: {
		nodes: {
			symbol: string,
			currency: Currency,
			totalCostCad: number,
			totalCostUsd: number,
			currentMarketValueCad: number,
			currentMarketValueUsd: number,
			quantity: number,
			averageEntryPrice: number
			type: AssetType,
			company: {
				prevDayClosePrice: number,
				marketCap: number,
				name: string
			},
			quote: {
				price: number,
				priceCad: number,
				priceUsd: number,
				currency: Currency
			},
			assessment?: {
				targetInvestmentProgress: number,
				targetPriceProgress: number
			}
		}[]
	}
	allTrade: {
		nodes: {
			accountId: number,
			quantity: number,
			price: number,
			action: string,
			symbol: string,
			timestamp: number,
			pnl: number,
			pnlCad: number,
			pnlUsd: number,
			currency: Currency,
			type: AssetType,
			priceCad: number,
			priceUsd: number,
			company: {
				name: string,
				marketCap: number,
				prevDayClosePrice: number,
				symbol: string,
				yield?: number
			}
			quote: {
				price: number,
				priceUsd: number,
				priceCad: number,
				currency: Currency
			},
			assessment?: {
				targetInvestmentProgress: number,
				targetPriceProgress: number,
				type: AssetType
			},
			position?: {
				quantity: number,
				totalCost: number,
				totalCostUsd: number,
				totalCostCad: number,
				currentMarketValueCad: number,
				currentMarketValueUsd: number,
				averageEntryPrice: number,
				openPnl: number,
				openPnlCad: number,
				openPnlUsd: number
			}
		}[]
	}
	allDividend: {
		nodes: {
			amountCad: number,
			amountUsd: number,
			currency: Currency,
			timestamp: number,
			company: {
				name: string,
				marketCap: number,
				prevDayClosePrice: number,
				symbol: string,
				yield?: number
			}
			quote: {
				price: number,
				priceUsd: number,
				priceCad: number,
				currency: Currency
			},
			assessment?: {
				targetInvestmentProgress: number,
				targetPriceProgress: number,
				type: AssetType
			},
			position?: {
				quantity: number,
				totalCost: number,
				totalCostUsd: number,
				totalCostCad: number,
				currentMarketValueCad: number,
				currentMarketValueUsd: number,
				averageEntryPrice: number,
				openPnl: number,
				openPnlCad: number,
				openPnlUsd: number
			}
		}[]
	}
}

const MainLayout: React.FC<ILayoutStateProps & ILayoutDispatchProps> = ({
	children, currency, user, showSidebar, setCurrency, setShowSidebar
}) => (
	<StaticQuery
		query={graphql`
			query {
				allExchangeRate(limit: 1, filter: {key: {eq: "USD_CAD"}}, sort: {fields: [date], order: DESC}) {
					nodes {
						rate
					}
				}
				allPosition {
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
				allTrade(sort: {fields: [timestamp], order: DESC}, limit: 5) {
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
				allDividend(limit: 5, sort: {fields: timestamp, order: DESC}) {
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
			}
		`}
		render={(queryData: ILayoutGraphQL):JSX.Element => {
			const usdCad = _.first(queryData.allExchangeRate.nodes)?.rate || 1;
			const cadUsd = 1 / usdCad;

			const portfolioValue: number = _.sumBy(
				queryData.allPosition.nodes,
				q => q.currentMarketValueCad
			);

			const portfolioCost: number = _.sumBy(
				queryData.allPosition.nodes,
				q => q.totalCostCad
			);

			const positions: IPositionStateProps[] = queryData.allPosition.nodes.map(position => (
				{
					...position,
					isFullPosition: false,
					valueCad: position.currentMarketValueCad,
					valueUsd: position.currentMarketValueUsd,
					costCad: position.totalCostCad,
					costUsd: position.totalCostUsd,
					index: 0,
					previousClosePrice: position.company.prevDayClosePrice,
					name: position.company.name,
					price: position.quote.price,
					assetCurrency: position.currency,
					marketCap: position.company.marketCap,
					percentageOfInvestment: position.totalCostCad / portfolioCost,
					percentageOfPortfolio: position.currentMarketValueCad / portfolioValue,
					activeCurrency: currency,
					shareProgress: position.assessment?.targetInvestmentProgress || 0,
					priceProgress: position.assessment?.targetPriceProgress || 0,
					quoteCurrency: position.quote.currency
				}
			));
		
			const trades: ITradeStateProps[] = queryData.allTrade.nodes.map(trade => (
				{
					...trade,
					previousClosePrice: trade.company.prevDayClosePrice,
					name: trade.company.name,
					price: trade.quote.price,
					assetCurrency: trade.currency,
					marketCap: trade.company.marketCap,
					percentageOfInvestment: (trade.position?.totalCostCad || 0) / portfolioCost,
					percentageOfPortfolio: (trade.position?.currentMarketValueCad || 0) / portfolioValue,
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
					quoteCurrency: trade.quote.currency
				}
			));

			const dividends: IDividendStateProps[] = queryData.allDividend.nodes.map(dividend => (
				{
					...dividend,
					previousClosePrice: dividend.company.prevDayClosePrice,
					name: dividend.company.name,
					price: dividend.quote.price,
					assetCurrency: dividend.currency,
					marketCap: dividend.company.marketCap,
					percentageOfInvestment: (dividend.position?.totalCostCad || 0) / portfolioCost,
					percentageOfPortfolio: (dividend.position?.currentMarketValueCad || 0) / portfolioValue,
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
					quoteCurrency: dividend.quote.currency
				}
			));

			return(
				<div className='page-wrapper'>
					<div className='page'>
						<div className={classNames({
							'sidebar-left': true,
							'sidebar-open': showSidebar
						})}>
							<div className='p-2'>
								<SidebarLeft
									currency={currency}
									onSetCurrency={setCurrency}
									usdCad={usdCad}
									cadUsd={cadUsd}
									authenticated={!!user}
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
						<div className='main-header'>
							<img src={headerImage} className='cover' />
							<img src={headerSpacerImage} className='cover' />
						</div>
						<div className='main-content'>
							{children}
						</div>
					</div>
				</div>
			);
		}}
	/>
);

export default connect(mapStateToProps, mapDispatchToProps)(MainLayout);

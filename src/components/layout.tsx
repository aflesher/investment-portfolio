import * as React from 'react';
import { connect } from 'react-redux';
// @ts-ignore
import { StaticQuery, graphql } from 'gatsby';
import classNames from 'classnames';
import _ from 'lodash';
//@ts-ignore
import * as firebase from 'firebase';

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
				priceUsd: number
			},
			assessment?: {
				targetInvestmentProgress: number,
				targetPriceProgress: number
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
					priceProgress: position.assessment?.targetPriceProgress || 0
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

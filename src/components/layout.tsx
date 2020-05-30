import * as React from 'react';
import { connect } from 'react-redux';
import { StaticQuery, graphql } from 'gatsby';
import classNames from 'classnames';
import _ from 'lodash';

import '../css/main.scss';
import {
	IStoreState,
	IStoreAction,
	SET_CURRENCY_ACTION,
	SET_AUTHENICATED_ACTION,
	SET_SHOW_SIDEBAR
} from '../store/store';
import { Currency } from '../utils/enum';
import SidebarLeft from './sidebar/SidebarLeft';

const headerImage = require('../images/header.png');
const headerSpacerImage = require('../images/header-spacer.png');

interface ILayoutStateProps {
	currency: Currency,
	authenticated: boolean,
	showSidebar: boolean
}

interface ILayoutDispatchProps {
	setCurrency: (currency: Currency) => void,
	setAuthenticated: (authenticated: boolean) => void,
	setShowSidebar: (showSidebar: boolean) => void
}

const mapStateToProps = ({ currency, authenticated, showSidebar }: IStoreState): ILayoutStateProps => {
	return { currency, authenticated, showSidebar };
};

const mapDispatchToProps = (dispatch: (action: IStoreAction) => void): ILayoutDispatchProps => {
	return {
		setCurrency: (currency: Currency): void => dispatch({
			type: SET_CURRENCY_ACTION,
			payload: currency
		}),
		setAuthenticated: (authenticated: boolean): void => dispatch({
			type: SET_AUTHENICATED_ACTION,
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
}

const MainLayout: React.FC<ILayoutStateProps & ILayoutDispatchProps> = ({
	children, currency, authenticated, showSidebar, setCurrency, setShowSidebar
}) => (
	<StaticQuery
		query={graphql`
			query {
				allExchangeRate(limit: 1, filter: {key: {eq: "USD_CAD"}}, sort: {fields: [date], order: DESC}) {
					nodes {
						rate
					}
				}
			}
		`}
		render={(queryData: ILayoutGraphQL):JSX.Element => {
			const usdCad = _.first(queryData.allExchangeRate.nodes)?.rate || 1;
			const cadUsd = 1 / usdCad;

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
									authenticated={authenticated}
								/>
							</div>
						</div>
						<div className='sidebar-right'>
							<div className='p-2'>
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

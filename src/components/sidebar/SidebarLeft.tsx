import React, { useState } from 'react';
// @ts-ignore
import { Link } from 'gatsby';
import classNames from 'classnames';
import numeral from 'numeral';
import { Currency } from '../../utils/enum';
import { OBFUSCATE } from '../../utils/util';

interface ISidebarLeftStateProps {
	usdCad: number;
	cadUsd: number;
	currency: Currency;
	authenticated: boolean;
	isCollapsed: boolean;
}

interface ISidebarLeftDispatchProps {
	onSetCurrency: (currency: Currency) => void;
	onToggleCollapse: () => void;
}

interface ILink {
	text: string;
	icon: string;
	route: string;
	addIcon?: boolean;
	spacer?: boolean;
	subLinks?: ILink[];
}

const LINKS: ILink[] = [
	{ text: 'Home', icon: 'fa-home', route: '/' },
	{ text: 'Trades', icon: 'fa-sync', route: '/trades' },
	{ text: 'Positions', icon: 'fa-chart-pie', route: '/positions' },
	{
		text: 'Closed Positions',
		icon: 'fa-check-square',
		route: '/positions/completed',
	},
	{ text: 'Dividends', icon: 'fa-donate', route: '/dividends' },
	{
		text: 'Assessments',
		icon: 'fa-balance-scale',
		route: '/assessments',
	},
	{ text: 'Orders', icon: 'fa-book', route: '/orders' },
	{ text: 'Calendar', icon: 'fa-calendar-alt', route: '/calendar' },
	{ text: 'Cash', icon: 'fa-money-bill-alt', route: '/cash' },
	{ text: 'Reviews', icon: 'fa-tasks', route: '/reviews' },
	{
		text: 'Create Assessment',
		icon: 'fa-balance-scale',
		route: '/admin/assessments',
		addIcon: true,
		spacer: true,
	},
	{
		text: 'Capital Gains',
		icon: 'fa-hand-holding-usd',
		route: '/admin/capital-gains',
	},
	{
		text: 'Year Review',
		icon: 'fa-tasks',
		route: '/admin/review',
		addIcon: true,
	},
	{ text: 'Financials', icon: 'fa-table', route: '/admin/financials' },
	{
		text: 'Crypto Trades',
		icon: 'fa-sync',
		route: '/admin/crypto-trades',
		addIcon: true,
	},
	{ text: 'Backup', icon: 'fa-file-download', route: '/admin/backup' },
];

const OBFUSCATED_LINKS = ['/cash'];

const SidebarLeft: React.FC<
	ISidebarLeftStateProps & ISidebarLeftDispatchProps
> = ({
	usdCad,
	cadUsd,
	currency,
	onSetCurrency,
	authenticated,
	isCollapsed,
	onToggleCollapse,
}) => {
	return (
		<div>
			<div className='nav-links text-uppercase'>
				{LINKS.filter((q) => !OBFUSCATE || !OBFUSCATED_LINKS.includes(q.route)).map(
					({ text, icon, route, addIcon, spacer }) => (
						<>
							{spacer && <div className='border-t my-2'></div>}
							<div style={{ position: 'relative' }} key={route}>
								<Link to={route}>
									{isCollapsed && (
										<>
											<span>
												<i className={`fas ${icon} mr-2`} title={text}></i>
											</span>
											{addIcon && (
												<span className='plus-icon'>
													<i className={`fas fa-plus mr-2 fa-xs`}></i>
												</span>
											)}
										</>
									)}
									{!isCollapsed && <span>{text}</span>}
								</Link>
							</div>
						</>
					)
				)}
				{!authenticated && (
					<div className='border-t mt-2 pt-2'>
						<Link to='/login'>Sign In</Link>
					</div>
				)}
				<div className='border-t mt-4 pt-4'>
					<div className='form-group'>
						<select
							value={currency}
							onChange={(e): void =>
								onSetCurrency(e.target.value === 'cad' ? Currency.cad : Currency.usd)
							}
							className='form-control'
						>
							<option value='cad'>CAD</option>
							<option value='usd'>USD</option>
						</select>
					</div>
					{currency == Currency.cad ? (
						<div className='text-sub text-subtle'>
							{!isCollapsed && <span>CAD:</span>} {numeral(usdCad).format('$0.000')}
						</div>
					) : (
						''
					)}
					{currency == Currency.usd ? (
						<div className='text-sub text-subtle'>
							{!isCollapsed && <span>USD:</span>} {numeral(cadUsd).format('$0.000')}
						</div>
					) : (
						''
					)}
				</div>
			</div>
		</div>
	);
};

export default SidebarLeft;

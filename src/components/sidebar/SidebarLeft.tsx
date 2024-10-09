import React from 'react';
// @ts-ignore
import { Link } from 'gatsby';
import numeral from 'numeral';
import { Currency } from '../../utils/enum';
import { useSidebar } from '../../providers/sidebarProvider';
import Icon from '../icon/Icon';

interface ISidebarLeftStateProps {
	usdCad: number;
	cadUsd: number;
	currency: Currency;
}

interface ISidebarLeftDispatchProps {
	onSetCurrency: (currency: Currency) => void;
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
	{ text: 'Balances', icon: 'fa-money-bill-alt', route: '/balances' },
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
	{ text: 'Backup', icon: 'fa-file-download', route: '/admin/backup' },
];

const SidebarLeft: React.FC<
	ISidebarLeftStateProps & ISidebarLeftDispatchProps
> = ({ usdCad, cadUsd, currency, onSetCurrency }) => {
	const { open, setOpen } = useSidebar();
	return (
		<div>
			<div>
				<button onClick={() => setOpen(!open)}>
					{open && <Icon icon='fa-caret-square-right' />}
					{!open && <Icon icon='fa-caret-square-left' />}
				</button>
			</div>
			<div className='nav-links text-uppercase'>
				{LINKS.map(({ text, icon, route, addIcon, spacer }) => (
					<div key={route}>
						{spacer && <div className='border-t my-2'></div>}
						<div style={{ position: 'relative' }} key={route}>
							<Link to={route}>
								{open && (
									<>
										<span className='mr-2'>
											<Icon icon={icon} title={text} />
										</span>
										{addIcon && (
											<span className='plus-icon mr-2'>
												<Icon icon='fa-plus' size='fa-xs' />
											</span>
										)}
									</>
								)}
								{!open && <span>{text}</span>}
							</Link>
						</div>
					</div>
				))}
				<div className='border-t mt-2 pt-2'>
					<Link to='/login'>Sign In</Link>
				</div>
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
							{!open && <span>CAD:</span>} {numeral(usdCad).format('$0.000')}
						</div>
					) : (
						''
					)}
					{currency == Currency.usd ? (
						<div className='text-sub text-subtle'>
							{!open && <span>USD:</span>} {numeral(cadUsd).format('$0.000')}
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

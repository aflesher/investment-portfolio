import React from 'react';
import { Link } from 'gatsby';
import classNames from 'classnames';
import numeral from 'numeral';
import { Currency } from '../../utils/enum';

interface ISidebarLeftStateProps {
	usdCad: number,
	cadUsd: number,
	currency: Currency,
	authenticated: boolean
}

interface ISidebarLeftDispatchProps {
	onSetCurrency: (currency: Currency) =>  void
}

const SidebarLeft: React.FC<ISidebarLeftStateProps & ISidebarLeftDispatchProps> = ({
	usdCad, cadUsd, currency, onSetCurrency, authenticated
}) => (
	<div>
		<div className='nav-links text-uppercase'>
			<div>
				<Link to='/'>Home</Link>
			</div>
			<div>
				<Link to='/trades'>Trades</Link>
			</div>
			<div>
				<Link to='/positions'>Positions</Link>
				<ul>
					<li><Link to='/positions'>Current</Link></li>
					<li><Link to='/positions/charts'>Charts</Link></li>
					<li><Link to='/positions/completed'>Completed</Link></li>
				</ul>
			</div>
			<div>
				<Link to='/dividends'>Dividends</Link>
			</div>
			<div>
				<Link to='/assessments'>Assessments</Link>
			</div>
			<div>
				<Link to='/orders'>Orders</Link>
			</div>
			<div>
				<Link to='/disclaimer'>Disclaimer</Link>
			</div>
			<div className='border-t mt-2 pt-2'>
				<div className={classNames({'d-none': !authenticated})}>
					<Link to='/admin/financials'>Admin</Link>
					<ul>
						<li><Link to='/admin/financials'>Financials</Link></li>
						<li><Link to='/admin/assessments'>Stock Assessment</Link></li>
						<li><Link to='/admin/capital-gains'>Capital Gains</Link></li>
						<li><Link to='/admin/review'>Year in Review</Link></li>
					</ul>
				</div>
				<div className={classNames({'d-none': authenticated})}>
					<Link to='/login'>Sign In</Link>
				</div>
			</div>
			<div className='border-t mt-4 pt-4'>
				<div className='form-group'>
					<select
						value={currency}
						onChange={(e): void => onSetCurrency(e.target.value === 'CAD' ? Currency.cad : Currency.usd)}
						className='form-control'
					>
						<option value='cad'>CAD</option>
						<option value='usd'>USD</option>
					</select>
				</div>
				{currency == Currency.cad ? <div className='text-sub text-subtle'>
					USD: {numeral(1).format('$0.00')}&nbsp;
					CAD: {numeral(usdCad).format('$0.000')}
				</div> : ''}
				{currency == Currency.usd ? <div className='text-sub text-subtle'>
					CAD: {numeral(1).format('$0.00')}&nbsp;
					USD: {numeral(cadUsd).format('$0.000')}
				</div> : ''}
			</div>
		</div>
	</div>
);

export default SidebarLeft;
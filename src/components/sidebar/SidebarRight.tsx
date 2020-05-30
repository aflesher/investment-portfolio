import React from 'react';
import classNames from 'classnames';
import _ from 'lodash';
import { Link } from 'gatsby';
import numeral from 'numeral';

import Position, { IPositionStateProps } from '../position/Position';

interface ISidebarRightStateProps {
	positions: IPositionStateProps[]
}

interface ISidebarRightDispatchProps {

}

enum PositionOrderBy {
	symbol = 1,
	profits = 2,
	position = 3
}

const SidebarRight: React.FC<ISidebarRightStateProps & ISidebarRightDispatchProps> = ({
	positions
}) => {
	const [orderBy, setOrderBy] = React.useState(PositionOrderBy.profits);
	const portfolioTotalValue = _.sumBy(positions, p => p.valueCad);
	const portfolioTotalCost = _.sumBy(positions, p => p.costCad);
	const inTheBlack = portfolioTotalValue > portfolioTotalCost;

	return (
		<div>
			<div className='positions'>
				<h3>Portfolio</h3>
				<div className='row'>
					<div
						className='col-4 link'
						onClick={(): void => setOrderBy(PositionOrderBy.symbol)}
					>
						SYMBOL
					</div>
					<div
						className='col-4 text-right link'
						onClick={(): void => setOrderBy(PositionOrderBy.profits)}
					>
						P&L
					</div>
					<div
						className='col-4 text-right link'
						onClick={(): void => setOrderBy(PositionOrderBy.position)}
					>
						%oP
					</div>
				</div>
				{_(positions)
					.orderBy(position => {
						switch (orderBy) {
						case PositionOrderBy.symbol:
							return position.symbol;
						case PositionOrderBy.profits:
							return (position.valueCad - position.costCad) / position.costCad;
						case PositionOrderBy.position:
							return position.valueCad / portfolioTotalValue;
						}
					}, orderBy == PositionOrderBy.symbol ? 'asc' : 'desc')
					.map((position, index) => (
						<Position
							key={position.symbol}
							index={index}
							{ ...position }
						/>
					))
					.value()
				}
			</div>
			<div className='totals text-right'>
				<div className='d-inline-block'>Open P & L</div>
				<div className={classNames({
					'd-inline-block': true,
					'text-positive': inTheBlack,
					'text-negative': !inTheBlack
				})}>
					{numeral(
						(portfolioTotalValue - portfolioTotalCost)
						/ portfolioTotalCost
					).format('0.00%')}
				</div>
			</div>

			<div className='pt-2'>
				<h3>
					Recent Trades
				</h3>
				<div>
				</div>
				<div className='text-right p-1'>
					<Link to='/activity'>View All Activity</Link>
				</div>
			</div>
		</div>
	);
};

export default SidebarRight;
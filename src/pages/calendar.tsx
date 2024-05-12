import Calendar from '../components/calendar/Calendar';
import { graphql } from 'gatsby';
import React from 'react';
import moment from 'moment-timezone';
import { times } from 'lodash';
import Layout from '../components/layout';

interface IQueryProps {
	data: {
		allEarningsDate: {
			nodes: {
				symbol: string;
				timestamp: number;
			}[];
		};
	};
}

const getMonth = (
	date: moment.Moment,
	earningsDate: { symbol: string; timestamp: number }[]
) => {
	const name = date.format('MMMM');
	const daysInMonth = date.daysInMonth();
	let currentDay = date.startOf('month');
	const days = times(daysInMonth, () => {
		const timestamp = currentDay.toDate().getTime();
		const earningsDates = earningsDate.filter((q) => q.timestamp === timestamp);
		const day = { timestamp, earningsDates };

		currentDay = currentDay.add(1, 'day');
		return day;
	});

	return { name, days };
};

const CalendarPage: React.FC<IQueryProps> = ({ data }) => {
	const earningsDate = data.allEarningsDate.nodes;
	// something is wrong here in the built version
	// the pre-rendered version of the page flashes the correct data
	// however, the getMonth function is returning the correct data
	const months = [
		getMonth(moment().subtract(1, 'month'), earningsDate),
		getMonth(moment(), earningsDate),
		getMonth(moment().add(1, 'month'), earningsDate),
		getMonth(moment().add(2, 'month'), earningsDate),
	];
	return (
		<Layout>
			<Calendar months={months} />
		</Layout>
	);
};

export default CalendarPage;

export const pageQuery = graphql`
	query {
		allEarningsDate {
			nodes {
				position {
					quantity
				}
				symbol
				timestamp
			}
		}
	}
`;

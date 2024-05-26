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
				date: string;
			}[];
		};
	};
}

const getMonth = (
	date: moment.Moment,
	earningsDate: { symbol: string; date: string }[]
) => {
	const name = date.format('MMMM');
	const daysInMonth = date.daysInMonth();
	let currentDay = date.startOf('month');

	// this issue cannot be solved the frontend. The timestamps are different
	// when doing a build vs develop. You'll have to change the nodes
	// to use strings instead of timestamps
	const days = times(daysInMonth, () => {
		const date = currentDay.format('YYYY-MM-DD');
		const earningsDates = earningsDate.filter((q) => q.date === date);
		const day = { date, earningsDates };

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
				date
			}
		}
	}
`;

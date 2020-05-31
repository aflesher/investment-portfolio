import React from 'react';
import _ from 'lodash';
import moment from 'moment-timezone';

interface IDateRangeStateProps {
	startDate?: Date,
	endDate?: Date
}

interface IDateRangeDispatchProps {
	onChange: (startDate: Date, endDate: Date) => void
}

const DateRange: React.FC<IDateRangeStateProps & IDateRangeDispatchProps> = ({
	startDate, endDate, onChange
}) => {
	const today = moment().startOf('day').toDate();
	const tonight = moment().endOf('day').toDate();
	const monday = moment().startOf('week').isoWeekday(1).toDate();
	const startOfMonth = moment().startOf('month').toDate();
	const newYears = moment().startOf('year').toDate();

	const dateOptions = [
		{name: 'Today', startDate: today, endDate: tonight},
		{name: 'This Week', startDate: monday, endDate: tonight},
		{name: 'This Month', startDate: startOfMonth, endDate: tonight},
		{name: 'This Year', startDate: newYears, endDate: tonight}
	];

	const options = dateOptions.map(option =>
		<option key={option.name} value={option.name}>{option.name}</option>
	);

	const option = _.find(dateOptions, option => 
		option.startDate.getTime() === startDate?.getTime() &&
			option.endDate.getTime() === endDate?.getTime()
	);

	const name = option?.name || '';

	if (!option) {
		options.unshift(<option key='null' value={name}></option>);
	}

	const handleOptionChange = (event: any): void => {
		const name = event.target.value;
		const option = _.find(dateOptions, {name});
		if (!option) {
			return;
		}
		onChange(option.startDate, option.endDate);
	};

	return (
		<select
			name='date-range'
			className='form-control'
			onChange={handleOptionChange}
			value={name}
		>
			{options}
		</select>
	);
};

export default DateRange;
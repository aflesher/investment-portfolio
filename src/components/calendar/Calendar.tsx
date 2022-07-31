import moment from 'moment-timezone';
import React from 'react';
import { IEarningsDate } from '../../utils/earnings-date';
import { times, flatMap, chunk } from 'lodash';
import CompanyBanner from '../company-banner/CompanyBanner';

interface ICalendarStateProps {
    months: {
        name: string;
        days: {
            timestamp: number,
            earningsDates: IEarningsDate[]
        }[]
    }[]
}

const Calendar: React.FC<ICalendarStateProps> = ({
    months
}) => {
    const [currentMonth, setCurrentMonth] = React.useState(1);
    const currentDay = moment().startOf('day').toDate().getTime();
    const month = months[currentMonth];
    const firstDay = moment(month.days[0].timestamp).utc().weekday();
    const lastDay = moment(month.days[month.days.length - 1].timestamp).utc().weekday();
    const paddingStart = firstDay;
    const paddingEnd = 6 - lastDay;
    const days = flatMap([times(paddingStart, () => ({ timestamp: 0, earningsDates: [] })), month.days, times(paddingEnd, () => ({ timestamp: 0, earningsDates: [] }))]);
    const weeks = chunk(days, 7);
    const noPreviousMonth = currentMonth === 0;
    const noNextMonth = currentMonth === months.length - 1;

    const replaceSymbol = (symbol: string): string => {
        if (symbol === 'cgc') {
            return 'weed.to';
        }

        if (symbol === 'bitf') {
            return 'bitf.to';
        }

        return symbol;
    }

    return <div className='ml-auto mr-auto pt-4 calendar'>
        <div className='text-center pb-4'>
            <span className={`mr-4 calendar-nav ${noPreviousMonth && 'disabled'}`} onClick={() => !noPreviousMonth && setCurrentMonth(currentMonth - 1)}>{'<<'}</span>
            {month.name}
            <span className={`ml-4 calendar-nav ${noNextMonth && 'disabled'}`} onClick={() => !noNextMonth && setCurrentMonth(currentMonth + 1)}>{'>>'}</span>
        </div>
        {weeks.map(week =>
            <div className='d-flex week'>
                {week.map(day => <div className={`day ${currentDay === day.timestamp && 'today'}`}>
                    {!!day.timestamp && <div className='date'>{ moment(day.timestamp).date() }</div>}
                    <div className='day-content'>
                        {day.earningsDates.map(({ symbol }) => <CompanyBanner symbol={replaceSymbol(symbol)} name={`$${symbol.toUpperCase().replace('.TO', '')}`} isNotBanner={true} />)}
                    </div>
                </div>)}
            </div>
        )}
    </div>;
};

export default Calendar;
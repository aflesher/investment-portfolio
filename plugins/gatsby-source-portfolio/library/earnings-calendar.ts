import axios from 'axios';
import parse from 'node-html-parser';

export interface IEarningsDate {
    timestamp: number,
    symbol: string,
}

const fetchZacks = async (symbol: string): Promise<IEarningsDate> => {
    const url = `https://www.zacks.com/stock/research/${symbol}/earnings-calendar`;
    const response = await axios.get(url);
    const root = parse(response.data);
    const element = root.querySelector('.key-expected-earnings-data-module');
    if (!element) {
        return { symbol, timestamp: 0 };
    }

    const dateElement = element.querySelector('tbody tr th');
    if (!dateElement) {
        return { symbol, timestamp: 0 };
    }
    const date = dateElement.innerText.substring(0, 10);
    return { symbol, timestamp: new Date(date).getTime() };
}

const filterZacks = (symbols: string[]): string[] => {
    if (symbols.find(q => q === 'bitf.to')) {
        symbols.push('bitf');
    }
    return symbols.filter(symbol => {
        if (symbol.indexOf('.') !== -1) {
            return false;
        }

        if (symbol.match(/\d+/)) {
            return false;
        }

        if (['otgly', 'spxs', 'gld'].includes(symbol)) {
            return false;
        }

        return true;
    });
}

export const scrapeCdProjektRed = async (): Promise<IEarningsDate> => {
    const response = await axios.get('https://www.cdprojekt.com/en/investors/events/');
    const root = parse(response.data);
    const calendarLine = root.querySelector('.calendar_line');
    const date = (calendarLine?.querySelectorAll('span')?.[1].innerText || '').trim();
    return { symbol: 'otgly', timestamp: new Date(date).getTime() };
}

export const scrapeZacks = (symbols: string[]): Promise<IEarningsDate[]> => {
    return Promise.all(filterZacks(symbols).map(symbol => fetchZacks(symbol)));
}

export const getEarningsDates = async (positionSymbols: string[]): Promise<IEarningsDate[]> => {
    const dates = await scrapeZacks(positionSymbols);
    if (positionSymbols.includes('otgly')) {
        const cdpr = await scrapeCdProjektRed();
        dates.push(cdpr);
    }

    return dates.filter(d => !!d.timestamp);
}
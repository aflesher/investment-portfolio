import axios from 'axios';
import parse from 'node-html-parser';
import moment from 'moment';
import Parser from 'rss-parser';

const rssParser = new Parser();

export interface IEarningsDate {
	timestamp: number;
	symbol: string;
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
};

const filterZacks = (symbols: string[]): string[] => {
	if (symbols.find((q) => q === 'bitf.to')) {
		symbols.push('bitf');
	}
	if (symbols.find((q) => q === 'weed.to')) {
		symbols.push('cgc');
	}
	return symbols.filter((symbol) => {
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
};

export const scrapeCdProjektRed = async (): Promise<IEarningsDate> => {
	const response = await axios.get(
		'https://www.cdprojekt.com/en/investors/events/'
	);
	const root = parse(response.data);
	const calendarLine = root.querySelector('.calendar_line');
	const date = (
		calendarLine?.querySelectorAll('span')?.[1].innerText || ''
	).trim();
	return {
		symbol: 'otgly',
		timestamp: moment(new Date(date).getTime()).startOf('day').toDate().getTime(),
	};
};

export const scrapeZacks = async (
	symbols: string[]
): Promise<IEarningsDate[]> => {
	const results = await Promise.all(
		filterZacks(symbols).map((symbol) => fetchZacks(symbol))
	).catch((e) => console.error('zacks failed'));

	return results || [];
};

const scapeSecondPageAAndW = async (
	url: string
): Promise<IEarningsDate | null> => {
	const response = await axios.get(url);
	const html: string = response.data;
	const date = html.match(/>(\w*,\s\w*\s\d{1,2},\s\d{4})</)?.[1];
	if (!date) {
		return null;
	}
	return { symbol: 'aw.un.to', timestamp: new Date(date).getTime() };
};

const rssHyundai = async (): Promise<IEarningsDate | null> => {
	const feed = await rssParser.parseURL(
		'https://www.hyundai.com/wsvc/ww/rss/ir.calendar.do'
	);

	const date = feed.items
		.find((item) => item.title?.match(/Business\sResults/gi))
		?.contentSnippet?.split('\n')
		?.find((q) => q.match(/(US|North\sAmerica)/))
		?.match(/\d{4}\.\d{2}\.\d{2}/)?.[0];

	if (!date) {
		return null;
	}

	return { symbol: 'hymtf', timestamp: new Date(date).getTime() };
};

export const scrapeAAndW = async (): Promise<IEarningsDate | null> => {
	const response = await axios.get(
		'https://awincomefund.mediaroom.com/index.php'
	);
	const html: string = response.data;
	const url = html.match(
		/<a\shref="(.*)">A.+W\sANNOUNCES\sTIMING(\s|\w|\d)*<\/a>/
	)?.[1];
	if (!url) {
		return null;
	}
	return scapeSecondPageAAndW(url);
};

export const getEarningsDates = async (
	positionSymbols: string[]
): Promise<IEarningsDate[]> => {
	const dates = await scrapeZacks(positionSymbols);
	if (positionSymbols.includes('otgly')) {
		const cdpr = await scrapeCdProjektRed();
		dates.push(cdpr);
	}

	if (positionSymbols.includes('aw.un.to')) {
		const aw = await scrapeAAndW();
		if (aw) {
			dates.push(aw);
		}
	}

	if (positionSymbols.includes('hymtf')) {
		const hymtf = await rssHyundai();
		if (hymtf) {
			dates.push(hymtf);
		}
	}

	return dates.filter((d) => !!d.timestamp);
};

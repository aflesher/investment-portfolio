import axios from 'axios';
import parse from 'node-html-parser';
import moment from 'moment';
import Parser from 'rss-parser';

const rssParser = new Parser();

export interface IEarningsDate {
	symbol: string;
	date: string;
}

const fetchZacks = async (symbol: string): Promise<IEarningsDate> => {
	const url = `https://www.zacks.com/stock/research/${symbol}/earnings-calendar`;
	const response = await axios.get(url);
	const root = parse(response.data);
	const element = root.querySelector('.key-expected-earnings-data-module');
	if (!element) {
		return { symbol, date: '' };
	}

	const dateElement = element.querySelector('tbody tr th');
	if (!dateElement) {
		return { symbol, date: '' };
	}
	const dateRaw = dateElement.innerText.substring(0, 10);
	console.log(`[ed] ${symbol}`, dateRaw);
	const date = moment(dateRaw, 'MM/DD/YYYY').format('YYYY-MM-DD');
	return { symbol, date };
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
	const calendarLines = root.querySelectorAll('.calendar_line');
	const calendarLine = calendarLines.find((q) =>
		q.innerHTML.match(/.*report\sfor\s(H|Q).*/)
	);
	const dateRaw = (
		calendarLine?.querySelectorAll('span')?.[1].innerText || ''
	).trim();
	console.log('[ed] otgly', dateRaw);
	const date = moment(dateRaw, 'MMM DD, YYYY').format('YYYY-MM-DD');
	return {
		symbol: 'otgly',
		date,
	};
};

export const scrapeZacks = async (
	symbols: string[]
): Promise<IEarningsDate[]> => {
	const results = await Promise.all(
		filterZacks(symbols).map((symbol) => fetchZacks(symbol))
	).catch(() => console.error('zacks failed'));

	return results || [];
};

const scapeSecondPageAAndW = async (
	url: string
): Promise<IEarningsDate | null> => {
	const response = await axios.get(url);
	const html: string = response.data;
	const dateRaw = html.match(/>(\w*,\s\w*\s\d{1,2},\s\d{4})</)?.[1];
	console.log('[ed] aw.un.to', dateRaw);
	if (!dateRaw) {
		return null;
	}
	const date = moment(dateRaw).format('YYYY-MM-DD');
	return { symbol: 'aw.un.to', date };
};

const rssHyundai = async (): Promise<IEarningsDate | null> => {
	const feed = await rssParser.parseURL(
		'https://www.hyundai.com/wsvc/ww/rss/ir.calendar.do'
	);

	const dateRaw = feed.items
		.find((item) => item.title?.match(/Business\sResults/gi))
		?.contentSnippet?.split('\n')
		?.find((q) => q.match(/(US|North\sAmerica)/))
		?.match(/\d{4}\.\d{2}\.\d{2}/)?.[0];

	console.log('[ed] hymtf', dateRaw);
	if (!dateRaw) {
		return null;
	}
	const date = moment(dateRaw).format('YYYY-MM-DD');

	return { symbol: 'hymtf', date };
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
	console.log(`getEarningsDates (start)`.gray);
	const dates = (await scrapeZacks(positionSymbols).catch(console.error)) || [];
	if (positionSymbols.includes('otgly')) {
		const cdpr = await scrapeCdProjektRed().catch(console.error);
		if (cdpr) {
			dates.push(cdpr);
		}
	}

	if (positionSymbols.includes('aw.un.to')) {
		const aw = await scrapeAAndW().catch(console.error);
		if (aw) {
			dates.push(aw);
		}
	}

	if (positionSymbols.includes('hymtf')) {
		const hymtf = await rssHyundai().catch(console.error);
		if (hymtf) {
			dates.push(hymtf);
		}
	}

	console.log(`getEarningsDates (end ${dates.length})`.gray);

	return dates.filter((d) => !!d.date);
};

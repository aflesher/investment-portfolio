interface IDeferredPromise {
	promise: Promise<any>,
	resolve: (value?: any) => void,
	reject: (value?: any) => void
}

export const deferredPromise = (): IDeferredPromise => {
	let resolve;
	let reject;
	const promise = new Promise((res, rej) => {
		resolve = res;
		reject = rej;
	});

	return {promise, resolve, reject};
};

export const replaceSymbol = (symbol: string): string => {
	if (symbol.match(/^fgr/) || symbol.match(/^dsf/) || symbol.match(/^ele/)) {
		return 'fgr.vn';
	}

	if (symbol.match(/^scr/)) {
		return 'scr.to';
	}
	return symbol;
};
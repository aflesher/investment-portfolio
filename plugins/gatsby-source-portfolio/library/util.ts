interface IDeferredPromise<T> {
	promise: Promise<T>;
	resolve: (value?: T) => void;
	reject: () => void;
}

export const deferredPromise = <T>(): IDeferredPromise<T> => {
	let resolve;
	let reject;
	const promise = new Promise<T>((res, rej) => {
		resolve = res;
		reject = rej;
	});

	return { promise, resolve, reject };
};

export const replaceSymbol = (symbol: string): string => {
	if (symbol.match(/^fgr/) || symbol.match(/^dsf/) || symbol.match(/^ele/)) {
		return 'fgr.vn';
	}

	if (symbol.match(/^scr/)) {
		return 'scr.to';
	}

	if (symbol.match(/^bitf/)) {
		return 'bitf.to';
	}
	return symbol;
};

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
import React, { useEffect, useState } from 'react';
import { ref, getDownloadURL } from 'firebase/storage';
import Layout from '../../components/layout';
import { useFirebase } from '../../providers/firebaseProvider';

const Backup = () => {
	const [dividendsUrl, setDividendsUrl] = useState('');
	const [tradesUrl, setTradesUrl] = useState('');
	const [activityUrl, setActivityUrl] = useState('');
	const [krakenTradesUrl, setKrakenTradesUrl] = useState('');

	const { storage } = useFirebase();

	useEffect(() => {
		if (storage) {
			getDownloadURL(ref(storage, 'dividends.json')).then((url) =>
				setDividendsUrl(url)
			);

			getDownloadURL(ref(storage, 'trades.json')).then((url) => setTradesUrl(url));

			getDownloadURL(ref(storage, 'activity.json')).then((url) =>
				setActivityUrl(url)
			);
			getDownloadURL(ref(storage, 'kraken-trades.json')).then((url) =>
				setKrakenTradesUrl(url)
			);
		}
	}, [storage]);
	return (
		<Layout>
			<div className='p-4'>
				<div>{!!dividendsUrl && <a href={dividendsUrl}>DIVIDENDS</a>}</div>
				<div>{!!tradesUrl && <a href={tradesUrl}>TRADES</a>}</div>
				<div>{!!activityUrl && <a href={activityUrl}>ACTIVITY</a>}</div>
				<div>
					{!!krakenTradesUrl && <a href={krakenTradesUrl}>KRAKEN TRADES</a>}
				</div>
			</div>
		</Layout>
	);
};

export default Backup;

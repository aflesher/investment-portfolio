import React, { useEffect, useState } from 'react';
import firebase from 'firebase/compat/app';
import { getStorage, ref, getDownloadURL } from 'firebase/storage';
import { IStoreState } from '../../store/store';
import { connect } from 'react-redux';
import Layout from '../../components/layout';

interface IBackupStateProps extends Pick<IStoreState, 'storage'> {}

const mapStateToProps = ({ storage }: IStoreState): IBackupStateProps => ({
	storage,
});

const Backup: React.FC<IBackupStateProps> = ({ storage }) => {
	const [dividendsUrl, setDividendsUrl] = useState('');
	const [tradesUrl, setTradesUrl] = useState('');
	const [activityUrl, setActivityUrl] = useState('');

	useEffect(() => {
		if (storage) {
			getDownloadURL(ref(storage, 'dividends.json')).then((url) =>
				setDividendsUrl(url)
			);

			getDownloadURL(ref(storage, 'trades.json')).then((url) => setTradesUrl(url));

			getDownloadURL(ref(storage, 'activity.json')).then((url) =>
				setActivityUrl(url)
			);
		}
	}, [storage]);
	return (
		<Layout>
			<div className='p-4'>
				<div>{!!dividendsUrl && <a href={dividendsUrl}>DIVIDENDS</a>}</div>
				<div>{!!tradesUrl && <a href={tradesUrl}>TRADES</a>}</div>
				<div>{!!activityUrl && <a href={activityUrl}>ACTIVITY</a>}</div>
			</div>
		</Layout>
	);
};

export default connect(mapStateToProps)(Backup);

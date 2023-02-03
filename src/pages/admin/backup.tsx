import React, { useEffect } from 'react';
import firebase from 'firebase/compat/app';
import { getStorage, ref } from 'firebase/storage';
import { IStoreState } from '../../store/store';
import { connect } from 'react-redux';

interface IBackupStateProps extends Pick<IStoreState, 'storage'> {}

const mapStateToProps = ({ storage }: IStoreState): IBackupStateProps => ({
	storage,
});

const Backup: React.FC<IBackupStateProps> = ({ storage }) => {
	console.log('backup');
	useEffect(() => {
		console.log('effect', storage);
		if (storage) {
			const pathReference = ref(storage, 'dividends.json');
			console.log(pathReference);
		}
	}, [storage]);
	return <div></div>;
};

export default connect(mapStateToProps)(Backup);

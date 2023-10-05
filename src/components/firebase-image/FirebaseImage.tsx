import React, { useEffect, useState } from 'react';
import { IStoreState } from '../../store/store';
import { getDownloadURL, ref } from 'firebase/storage';

interface IFirebaseImageProps {
	image: string;
}

interface IFirebaseImageStateProps extends Pick<IStoreState, 'storage'> {}

const FirebaseImage: React.FC<
	IFirebaseImageProps & IFirebaseImageStateProps
> = ({ image, storage }) => {
	const [imageUrl, setImageUrl] = useState<string>('');

	useEffect(() => {
		if (storage && image) {
			getDownloadURL(ref(storage, image)).then((url) => setImageUrl(url));
		}
	}, [storage, image]);

	return <>{!!imageUrl && <img style={{ width: '100%' }} src={imageUrl} />}</>;
};

export default FirebaseImage;

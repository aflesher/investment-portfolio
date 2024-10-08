import React, { useEffect, useState } from 'react';
import { getDownloadURL, ref } from 'firebase/storage';
import { useFirebase } from '../../providers/firebaseProvider';

interface IFirebaseImageProps {
	image: string;
}

const FirebaseImage: React.FC<IFirebaseImageProps> = ({ image }) => {
	const [imageUrl, setImageUrl] = useState<string>('');
	const { storage } = useFirebase();

	useEffect(() => {
		if (storage && image) {
			getDownloadURL(ref(storage, image)).then((url) => setImageUrl(url));
		}
	}, [storage, image]);

	return <>{!!imageUrl && <img style={{ width: '100%' }} src={imageUrl} />}</>;
};

export default FirebaseImage;

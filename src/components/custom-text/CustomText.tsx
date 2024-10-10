import React, { useEffect, useState } from 'react';
import { getDownloadURL, ref } from 'firebase/storage';
import { useFirebase } from '../../providers/firebaseProvider';

interface ICustomTextProps {
	text: string;
}

const CustomText: React.FC<ICustomTextProps> = ({ text }) => {
	const [imageUrls, setImageUrls] = useState<string[]>([]);
	const [textPieces, setTextPieces] = useState<string[]>([]);
	const { storage } = useFirebase();

	useEffect(() => {
		if (storage && text) {
			const matches = text.match(/image=\S*/gi);
			setTextPieces(text.replace(/image=\S*/gi, '@').split('@'));

			Promise.all(
				matches?.map((match) =>
					getDownloadURL(ref(storage, match.replace('image=', '')))
				) || []
			).then((urls) => {
				setImageUrls(urls);
			});
		}
	}, [storage, text]);

	return (
		<div>
			{textPieces.map((text, index) => (
				<span key={`${text}${index}`}>
					<p>{text}</p>
					{!!imageUrls?.[index] && (
						<img style={{ width: '100%' }} src={imageUrls?.[index]} />
					)}
				</span>
			))}
		</div>
	);
};

export default CustomText;

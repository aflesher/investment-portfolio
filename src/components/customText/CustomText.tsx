import React, { useEffect, useState } from 'react';
import { IStoreState } from '../../store/store';
import { getDownloadURL, ref } from 'firebase/storage';

interface ICustomTextProps {
	text: string;
}

interface ICustomTextStateProps extends Pick<IStoreState, 'storage'> {}

const CustomText: React.FC<ICustomTextProps & ICustomTextStateProps> = ({
	text,
	storage,
}) => {
	const [imageUrls, setImageUrls] = useState<string[]>([]);
	const [textPieces, setTextPieces] = useState<string[]>([]);

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

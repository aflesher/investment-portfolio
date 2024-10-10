import React from 'react';

import { IAssessment } from '../../../../declarations/assessment';
import CustomText from '../../custom-text/CustomText';

interface IAssessmentStateProps extends Pick<IAssessment, 'notes'> {}

const Assessment: React.FC<IAssessmentStateProps> = ({ notes }) => {
	return (
		<div className='mt-4'>
			{notes
				.slice()
				.reverse()
				.map((note, index) => (
					<div className='my-2 p-3 notes display-linebreak' key={`note${index}`}>
						<CustomText text={note} />
					</div>
				))}
		</div>
	);
};

export default Assessment;

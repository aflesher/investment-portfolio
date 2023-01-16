import React from 'react';
import { graphql } from 'gatsby';
import crypto from 'crypto';
import { Currency } from '../utils/enum';
import Layout from '../components/layout';
import { IReview } from '../utils/review';
import { compareNumber } from '../utils/util';

interface IReviewQuery {
	data: {
		allReview: {
			nodes: IReview[];
		};
	};
}

const Reviews: React.FC<IReviewQuery> = ({ data }) => {
	const reviews = data.allReview.nodes
		.slice()
		.sort((a, b) => compareNumber(b.year, a.year));

	const goalId = (goal: string): string => {
		return crypto.createHash('md5').update(JSON.stringify(goal)).digest('hex');
	};

	const toggleGoal = (goalId: string, goalReached: boolean) => {
		console.log(goalId, goalReached);
	};

	return (
		<Layout>
			<div className='p-4'>
				{reviews.map((review) => (
					<div
						className='mb-4 py-4'
						style={{ borderBottom: '3px solid #fefefe' }}
						key={review.year}
					>
						<div className='d-flex justify-content-between pb-1 border-b mb-3'>
							<div>
								<h2>{review.year}</h2>
							</div>
							<div className='text-right'>
								<h4>{review.grade}</h4>
							</div>
						</div>
						<div className='row mb-4'>
							<div className='col-4'>
								<h4 className='text-positive'>Start</h4>
								{review.start.map((start) => (
									<div className='py-2 border-b' key={start}>
										{start}
									</div>
								))}
							</div>
							<div className='col-4'>
								<h4 className='text-negative'>Stop</h4>
								{review.stop.map((stop) => (
									<div className='py-2 border-b' key={stop}>
										{stop}
									</div>
								))}
							</div>
							<div className='col-4'>
								<h4 className='blue-glow'>Continue</h4>
								{review.continue.map((c) => (
									<div className='py-2 border-b' key={c}>
										{c}
									</div>
								))}
							</div>
						</div>
						<h4>Goals</h4>
						{review.goals.map((goal) => (
							<div className='py-2 border-b' key={goalId(goal)}>
								<div className='form-check'>
									<input
										type='checkbox'
										className='form-check-input'
										id={goalId(goal)}
										onChange={(e) => toggleGoal(goalId(goal), e.target.checked)}
									/>
									<label className='form-check-label' htmlFor={goalId(goal)}>
										{goal}
									</label>
								</div>
							</div>
						))}
						<div className='row mb-4 mt-4'>
							<div className='col-6'>
								<h4 className='text-positive'>Highlights</h4>
								{review.highlights.map((highlight) => (
									<div className='py-2 border-b' key={highlight}>
										{highlight}
									</div>
								))}
							</div>
							<div className='col-6'>
								<h4 className='text-negative'>Lowlights</h4>
								{review.lowlights.map((lowlight) => (
									<div className='py-2 border-b' key={lowlight}>
										{lowlight}
									</div>
								))}
							</div>
						</div>
						<div>{review.comments}</div>
					</div>
				))}
			</div>
		</Layout>
	);
};

export default Reviews;

export const pageQuery = graphql`
	query {
		allReview {
			nodes {
				comments
				continue
				goals
				grade
				highlights
				lowlights
				start
				stop
				year
			}
		}
	}
`;

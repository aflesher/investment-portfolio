import React, { useEffect } from 'react';
import { graphql } from 'gatsby';
import crypto from 'crypto';
import { connect } from 'react-redux';
import Layout from '../components/layout';
import { IReview } from '../utils/review';
import { compareNumber } from '../utils/util';
import {
	IGoalStatus,
	IStoreAction,
	IStoreState,
	SET_GOAL_STATUS,
} from '../store/store';

interface IReviewQuery {
	data: {
		allReview: {
			nodes: IReview[];
		};
	};
}

interface IReviewStateProps
	extends Pick<IStoreState, 'goalStatuses' | 'firestore'> {}

interface IReviewDispatchProps {
	setGoalStatus: (goalStatus: IGoalStatus) => void;
}

const mapStateToProps = ({
	goalStatuses,
	firestore,
}: IStoreState): IReviewStateProps => ({
	goalStatuses,
	firestore,
});

const mapDispatchToProps = (
	dispatch: (action: IStoreAction) => void
): IReviewDispatchProps => {
	return {
		setGoalStatus: (goalStatus: IGoalStatus): void =>
			dispatch({
				type: SET_GOAL_STATUS,
				payload: goalStatus,
			}),
	};
};

const Reviews: React.FC<
	IReviewQuery & IReviewStateProps & IReviewDispatchProps
> = ({ data, goalStatuses, setGoalStatus, firestore }) => {
	const reviews = data.allReview.nodes
		.filter((q) => q.year < new Date().getFullYear())
		.sort((a, b) => compareNumber(b.year, a.year));

	const goalId = (goal: string): string => {
		return crypto.createHash('md5').update(JSON.stringify(goal)).digest('hex');
	};

	const toggleGoal = async (text: string, achieved: boolean) => {
		if (!firestore) {
			return;
		}
		setGoalStatus({ text, achieved });
		const docs = await (await firestore.collection('goalStatus').get()).docs;
		const docRef =
			docs.find((doc) => (doc.data() as IGoalStatus).text === text)?.ref ||
			firestore.collection('goalStatus').doc();
		docRef.set({ text, achieved }, { merge: true });
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
								<h4 className='text-neutral'>Continue</h4>
								{review.continue.map((c) => (
									<div className='py-2 border-b' key={c}>
										{c}
									</div>
								))}
							</div>
						</div>
						<h4 className='text-neutral'>Goals</h4>
						{review.goals.map((goal) => (
							<div className='py-2 border-b' key={goalId(goal)}>
								<div className='form-check'>
									<input
										type='checkbox'
										className='form-check-input'
										id={goalId(goal)}
										checked={
											goalStatuses.find(({ text }) => text === goal)?.achieved || false
										}
										onChange={(e) => toggleGoal(goal, e.target.checked)}
									/>
									<label className='form-check-label' htmlFor={goalId(goal)}>
										<span
											style={{
												textDecoration: goalStatuses.find(({ text }) => text === goal)
													?.achieved
													? 'line-through'
													: 'none',
											}}
										>
											{goal}
										</span>
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
						<div className='display-linebreak'>{review.comments}</div>
					</div>
				))}
			</div>
		</Layout>
	);
};

export default connect(mapStateToProps, mapDispatchToProps)(Reviews);

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

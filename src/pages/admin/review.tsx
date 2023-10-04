import React, { useCallback } from 'react';
import _ from 'lodash';
import TextareaAutosize from 'react-textarea-autosize';
import firebase from 'firebase/compat/app';

import Layout from '../../components/layout';
import { connect } from 'react-redux';
import { IStoreState } from '../../store/store';
import { IReview } from '../../../declarations/review';

interface IReviewStateProps {
	user: firebase.User | null | undefined;
	firebase: firebase.app.App | undefined;
}

interface IFirebaseReviewFields
	extends firebase.firestore.DocumentData,
		IReview {}

interface IFirebaseReview extends IFirebaseReviewFields {
	docRef: firebase.firestore.DocumentReference;
	id?: string;
}

const mapStateToProps = ({
	firebase,
	user,
}: IStoreState): IReviewStateProps => ({
	firebase,
	user,
});

let year = 2018;
const years: number[] = [];
while (year <= new Date().getFullYear()) {
	years.push(year);
	year++;
}

const grades = ['A+', 'A', 'B', 'C+', 'C', 'C-', 'D', 'F'];

const AdminReview: React.FC<IReviewStateProps> = ({ firebase, user }) => {
	const [reviews, setReviews] = React.useState<IFirebaseReview[]>([]);
	const [
		firestore,
		setFirestore,
	] = React.useState<firebase.firestore.Firestore | null>(null);
	const [year, setYear] = React.useState<string>(
		String(new Date().getFullYear())
	);
	const [start, setStart] = React.useState<string[]>([]);
	const [grade, setGrade] = React.useState('');
	const [stop, setStop] = React.useState<string[]>([]);
	const [continues, setContinues] = React.useState<string[]>([]);
	const [goals, setGoals] = React.useState<string[]>([]);
	const [highlights, setHighlights] = React.useState<string[]>([]);
	const [lowlights, setLowlights] = React.useState<string[]>([]);
	const [comments, setComments] = React.useState<string>('');

	const setEmptyYear = useCallback((): void => {
		setStart([]);
		setStop([]);
		setContinues([]);
		setHighlights([]);
		setLowlights([]);
		setGoals([]);
		setComments('');
		setGrade('');
	}, [
		setStart,
		setStop,
		setContinues,
		setHighlights,
		setLowlights,
		setGoals,
		setComments,
		setGrade,
	]);

	const loadReview = useCallback(
		(year: string, loadedReviews?: IFirebaseReview[]): void => {
			if (!year) {
				return setEmptyYear();
			}

			const review = _.find(
				loadedReviews || reviews,
				(q) => q.year === Number(year)
			);
			if (!review) {
				return setEmptyYear();
			}

			setStart(review.start);
			setStop(review.stop);
			setContinues(review.continue);
			setHighlights(review.highlights);
			setLowlights(review.lowlights);
			setGoals(review.goals);
			setComments(review.comments);
			setGrade(review.grade);
		},
		[
			setEmptyYear,
			setStart,
			setStop,
			setContinues,
			setHighlights,
			setLowlights,
			setGoals,
			setComments,
			setGrade,
			reviews,
		]
	);

	const fetchReviews = useCallback(
		async (db: firebase.firestore.Firestore): Promise<void> => {
			const querySnapshot = await db.collection('reviews').get();

			const reviews = querySnapshot.docs.map(
				(queryDocumentSnapshot: firebase.firestore.QueryDocumentSnapshot) => {
					const data = queryDocumentSnapshot.data() as IFirebaseReviewFields;
					return {
						id: queryDocumentSnapshot.id,
						docRef: queryDocumentSnapshot.ref,
						...data,
					};
				}
			);

			setReviews(reviews);
			loadReview(year, reviews);
		},
		[setReviews, loadReview, year]
	);

	const saveReview = useCallback(async () => {
		if (!firestore) {
			return;
		}
		await fetchReviews(firestore);
		const review = _.find(reviews, (q) => q.year === Number(year));
		const docRef = review ? review.docRef : firestore.collection('reviews').doc();

		const fields: IFirebaseReviewFields = {
			start,
			stop,
			continue: continues,
			goals,
			highlights,
			lowlights,
			comments,
			grade,
			year: Number(year),
		};

		await docRef.set(fields, { merge: true });
	}, [
		fetchReviews,
		firestore,
		reviews,
		year,
		start,
		stop,
		continues,
		goals,
		highlights,
		lowlights,
		comments,
		grade,
	]);

	const onSetYear = useCallback(
		(year: string): void => {
			setYear(year);
			loadReview(year);
		},
		[setYear, loadReview]
	);

	const handleAddInputField = (
		state: string[],
		setState: React.Dispatch<React.SetStateAction<string[]>>
	) => {
		const values = state.slice();
		values.push('');
		setState(values);
	};

	React.useEffect(() => {
		if (!firestore && firebase && user) {
			const db = firebase.firestore();
			setFirestore(db);
			fetchReviews(db);
		}
	}, [firebase, user, firestore, fetchReviews]);

	const createInputFields = (
		state: string[],
		name: string,
		setState: React.Dispatch<React.SetStateAction<string[]>>
	) => {
		return state.map((value, index) => (
			<div key={index} className='input-group my-3'>
				<TextareaAutosize
					name={`${name}${index}`}
					value={value}
					className='form-control'
					onChange={(e) => {
						const values = state.slice();
						values[index] = e.target.value;
						setState(values);
					}}
				/>
			</div>
		));
	};

	return (
		<Layout>
			<div className='p-4'>
				<div className='row border-b mb-1'>
					<div className='col-3'>
						<div className='form-group'>
							<label htmlFor='year'>Year</label>
							<select
								name='year'
								value={year}
								onChange={(e) => onSetYear(e.target.value)}
								className='form-control'
							>
								{years.map((year) => (
									<option key={year} value={year}>
										{year}
									</option>
								))}
							</select>
						</div>
					</div>

					<div className='col-3 offset-6'>
						<div className='form-group text-right' style={{ paddingTop: 30 }}>
							<button type='button' className='btn btn-primary' onClick={saveReview}>
								SAVE
							</button>
						</div>
					</div>
				</div>
				<div className='row mt-4'>
					<div className='col-3'>
						<div className='form-group'>
							<label htmlFor='grade'>Grade</label>
							<select
								name='grade'
								value={grade}
								onChange={(e) => setGrade(e.target.value)}
								className='form-control'
							>
								<option key='empty' value=''>
									-
								</option>
								{grades.map((grade) => (
									<option key={grade} value={grade}>
										{grade}
									</option>
								))}
							</select>
						</div>
					</div>
				</div>
				<div className='row mt-4'>
					<div className='col-4'>
						{createInputFields(start, 'start', setStart)}
						<div className='my-3'>
							<button
								type='button'
								className='btn btn-primary'
								onClick={() => handleAddInputField(start, setStart)}
							>
								<i className='fas fa-play mr-2'></i> Start
							</button>
						</div>
					</div>
					<div className='col-4'>
						{createInputFields(stop, 'continue', setStop)}
						<div className='my-3'>
							<button
								type='button'
								className='btn btn-danger'
								onClick={() => handleAddInputField(stop, setStop)}
							>
								<i className='fas fa-stop mr-2'></i> Stop
							</button>
						</div>
					</div>

					<div className='col-4'>
						{createInputFields(continues, 'continue', setContinues)}
						<div className='my-3'>
							<button
								type='button'
								className='btn btn-success'
								onClick={() => handleAddInputField(continues, setContinues)}
							>
								<i className='fas fa-sync-alt mr-2'></i> Continue
							</button>
						</div>
					</div>
				</div>

				<div className='row mt-4'>
					<div className='col-12'>
						{createInputFields(goals, 'goals', setGoals)}
						<div className='my-3'>
							<button
								type='button'
								className='btn btn-info'
								onClick={() => handleAddInputField(goals, setGoals)}
							>
								<i className='fas fa-bullseye mr-2'></i>
								Goal
							</button>
						</div>
					</div>
				</div>

				<div className='row mt-4'>
					<div className='col-6'>
						{createInputFields(highlights, 'highlights', setHighlights)}
						<div className='my-3'>
							<button
								type='button'
								className='btn btn-primary'
								onClick={() => handleAddInputField(highlights, setHighlights)}
							>
								<i className='fas fa-award mr-2'></i> Highlights
							</button>
						</div>
					</div>
					<div className='col-6'>
						{createInputFields(lowlights, 'lowlights', setLowlights)}
						<div className='my-3'>
							<button
								type='button'
								className='btn btn-danger'
								onClick={() => handleAddInputField(lowlights, setLowlights)}
							>
								<i className='fas fa-meh mr-2'></i> Lowlights
							</button>
						</div>
					</div>
				</div>

				<div className='row mt-4'>
					<div className='col-12'>
						<TextareaAutosize
							name='comments'
							value={comments}
							className='form-control'
							onChange={(e) => setComments(e.target.value)}
						/>
					</div>
				</div>
			</div>
		</Layout>
	);
};

export default connect(mapStateToProps)(AdminReview);

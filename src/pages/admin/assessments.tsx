import React from 'react';
// @ts-ignore
import * as firebase from 'firebase';
// @ts-ignore
import { graphql } from 'gatsby';
import _ from'lodash';
import { Typeahead } from 'react-bootstrap-typeahead';

import { IStoreState } from '../../store/store';
import { connect } from 'react-redux';
import { AssetType } from '../../utils/enum';
import Layout from '../../components/layout';

interface IAssessmentsStateProps {
	user: firebase.User | null | undefined,
	firebase: any
}

interface IAsessmentsQuery {
	data: {
		allCompany: {
			nodes: {
				symbol: string
			}[]
		}
	}
}

interface IFirebaseAssessmentFields {
	symbol: string,
	notes: string[],
	targetInvestment: number,
	targetPrice: number,
	minuses: string[],
	pluses: string[],
	type: AssetType,
	questions: string[],
	valuations: string[],
	lastUpdated: Date,
	sector: string,
	checklist: {[key: string]: boolean},
}

interface IFirebaseAssessment extends IFirebaseAssessmentFields {
	docRef: any,
	id?: string,
}

interface IChecklistItem {
	id: string,
	description: string,
	value: boolean
}

const mapStateToProps = ({firebase, user}: IStoreState): IAssessmentsStateProps => ({
	firebase,
	user
});

const defaultChecklist = [
	{id: 'fomo', value: false, description: 'I\'m not buying this stock for FOMO'},
	{id: 'excessCash', value: false, description: 'I\'m not buying this stock because I have an excess of cash'},
	{id: 'othersBuying', value: false,
		description: 'I\'m not buying just because someone else recommended the stock'},
	{id: 'understandBusiness', value: false, description: 'I understand the business'},
	{id: 'valuation', value: false, description: 'I have completed a valuation'}
];

const AssessmentsAdmin: React.FC<IAssessmentsStateProps & IAsessmentsQuery> = ({
	firebase, user, data
}) => {
	const [symbol, setSymbol] = React.useState('');
	const [notes, setNotes] = React.useState<string[]>([]);
	const [targetInvestment, setTargetInvestment] = React.useState<number | undefined>(undefined);
	const [targetPrice, setTargetPrice] = React.useState<number | undefined>(undefined);
	const [pluses, setPluses] = React.useState<string[]>([]);
	const [minuses, setMinuses] = React.useState<string[]>([]);
	const [type, setType] = React.useState(AssetType.stock);
	const [questions, setQuestions] = React.useState<string[]>([]);
	const [valuations, setValuations] = React.useState<string[]>([]);
	const [sector, setSector] = React.useState('');
	const [firestore, setFirestore] = React.useState<object | null>(null);
	const [assessments, setAssessments] = React.useState<IFirebaseAssessment[]>([]);
	const [sectors, setSectors] = React.useState<string[]>([]);
	const [isEdit, setIsEdit] = React.useState(false);
	const [checklist, setChecklist] = React.useState<IChecklistItem[]>(defaultChecklist.slice());

	const fetchAssessments = async (db: any): Promise<void> => {
		const querySnapshot = await db.collection('stocks').get();

		const stocks = querySnapshot.docs.map(
			(queryDocumentSnapshot: any) =>
				_.extend(
					{id: queryDocumentSnapshot.id, docRef: queryDocumentSnapshot.ref},
					queryDocumentSnapshot.data()
				)
		);
		const sectors = _(stocks).map('sector').uniq().filter().value();
		
		setAssessments(stocks);
		setSectors(sectors);
	};

	const loadAssessment = (symbol: string): void => {
		const assessment = _.find(assessments, q => q.symbol === symbol);
		setNotes(assessment?.notes || []);
		setTargetInvestment(assessment?.targetInvestment || undefined);
		setTargetPrice(assessment?.targetPrice || undefined);
		setMinuses(assessment?.minuses || []);
		setPluses(assessment?.pluses || []);
		setType(assessment?.type || AssetType.stock);
		setValuations(assessment?.valuations || []);
		setQuestions(assessment?.questions || []);

		const newChecklist = defaultChecklist.slice();
		if (assessment) {
			_.forEach(assessment.checklist, (value, id) => {
				const item = _.find(newChecklist, q => q.id === id);
				if (item) {
					item.value = value;
				}
			});
		}
		setChecklist(newChecklist);
	};

	const save = async (): Promise<void> => {
		const assessment = _.find(assessments, q => q.symbol === symbol);
		const docRef = assessment ? assessment.docRef : firebase.collection('stocks').doc();

		const newAssessment: IFirebaseAssessmentFields = {
			pluses: _.filter(pluses),
			minuses: _.filter(minuses),
			notes: _.filter(notes),
			valuations: _.filter(valuations),
			targetPrice: targetPrice || 0,
			targetInvestment: targetInvestment || 0,
			questions: _.filter(questions),
			symbol,
			sector,
			type,
			lastUpdated: isEdit && assessment?.lastUpdated || new Date(),
			checklist: _(checklist).keyBy(q => q.id).mapValues(q => q.value).value()
		};

		await docRef.set(newAssessment, {merge: true});

		await fetchAssessments(firestore);
		loadAssessment(symbol);
	};

	React.useEffect(() => {
		if (!firestore && firebase && user) {
			const db = firebase.firestore();
			setFirestore(db);
			fetchAssessments(db);
		}
	}, [firebase, user]);

	const onSymbolChange = (symbol: string) => {
		setSymbol(symbol);
		loadAssessment(symbol);
	};

	const onSetQuestion = (question: string, index: number) => {
		const newQuestions = questions.slice();
		newQuestions[index] = question;
		setQuestions(newQuestions);
	};

	const onSetPlus = (plus: string, index: number) => {
		const newPluses = pluses.slice();
		newPluses[index] = plus;
		setPluses(newPluses);
	};

	const onSetMinus = (minus: string, index: number) => {
		const newMinuses = minuses.slice();
		newMinuses[index] = minus;
		setMinuses(newMinuses);
	};

	const onChangeChecklist = (index: number, value: boolean) => {
		const checklistItems = checklist.slice();
		checklistItems[index].value = value;
		setChecklist(checklistItems);
	};

	const onSetValuation = (valuation: string, index: number) => {
		const newValuations = valuations.slice();
		newValuations[index] = valuation;
		setValuations(newValuations);
	};

	const onSetNote = (valuation: string, index: number) => {
		const newValuations = valuations.slice();
		newValuations[index] = valuation;
		setValuations(newValuations);
	};

	return (
		<Layout>
			<div className='p-4'>
				<div className='row border-b mb-1'>

					<div className='col-3'>
						<div className='form-group'>
							<label htmlFor='symbol'>Symbol</label>
							<Typeahead
								onChange={symbols => onSymbolChange(symbols[0])}
								onInputChange={symbol => onSymbolChange(symbol)}
								options={_.map(data.allCompany.nodes, q => q.symbol)}
								allowNew
								id='symbol'
							/>
						</div>
					</div>

					<div className='col-2 offset-5 pt-4'>
						<div className='form-check pull-right pt-2'>
							<input
								type='checkbox'
								className='form-check-input'
								id='is-edit'
								checked={isEdit}
								onChange={e => setIsEdit(!!e.target.checked)} />
							<label className='form-check-label'>Edit</label>
						</div>
					</div>

					<div className='col-2'>
						<div className='form-group text-right' style={{paddingTop: 30}}>
							<button
								type='button'
								className='btn btn-primary'
								onClick={save}
							>
								SAVE
							</button>
						</div>
					</div>

				</div>
				<div className='row mt-4'>

					<div className='col-6'>
						{pluses.map((plus, index) => (
							<div key={index} className='input-group my-3'>
								<div className='input-group-prepend'>
									<span className='input-group-text' id='plus-addon'>+</span>
								</div>
								<input
									type='text'
									name={`plus${index}`}
									value={plus}
									className='form-control'
									aria-label='Plus'
									aria-describedby='plus-addon'
									onChange={e => onSetPlus(e.target.value, index)}
								/>
							</div>
						))}
						<div className='my-3'>
							<button
								type='button'
								className='btn btn-primary'
								onClick={() => setPluses(pluses.concat(''))}
							>
								Plus
							</button>
						</div>
					</div>
					<div className='col-6'>
						{minuses.map((minus, index) => (
							<div key={index} className='input-group my-3'>
								<div className='input-group-prepend'>
									<span className='input-group-text' id='minus-addon'>-</span>
								</div>
								<input
									type='text'
									name={`minus${index}`}
									value={minus}
									className='form-control'
									aria-label='Minus'
									aria-describedby='minus-addon'
									onChange={e => onSetMinus(e.target.value, index)}
								/>
							</div>
						))}
						<div className='my-3'>
							<button
								type='button'
								className='btn btn-danger'
								onClick={() => setMinuses(pluses.concat(''))}
							>
								Minus
							</button>
						</div>
					</div>

				</div>
				<div className='row mt-4'>

					<div className='col-12'>
						{questions.map((question, index) => (
							<div key={index} className='input-group my-3'>
								<div className='input-group-prepend'>
									<span className='input-group-text' id='question-addon'>?</span>
								</div>
								<input
									type='text'
									name={`question${index}`}
									value={question}
									className='form-control'
									aria-label='Question'
									aria-describedby='question-addon'
									onChange={e => onSetQuestion(e.target.value, index)}
								/>
							</div>
						))}
						<div className='my-3'>
							<button
								type='button'
								className='btn btn-primary'
								onClick={() => setQuestions(questions.concat(''))}
							>
								Question
							</button>
						</div>
					</div>

				</div>
				<div className='row mt-4'>

					<div className='col-12'>
						{_.map(checklist, ({ id, value, description }, index) => (
							<div className='form-check' key={id}>
								<input
									type='checkbox'
									className='form-check-input'
									id={id}
									checked={value}
									onChange={e => onChangeChecklist(index, e.target.checked)} />
								<label className='form-check-label' htmlFor='exampleCheck1'>{description}</label>
							</div>
						))}
					</div>

				</div>

				<div className='row mt-4'>
					
					<div className='col-3'>
						<div className='input-group'>
							<div className='input-group-prepend'>
								<span
									className='input-group-text'
									id='target-price-addon'
								>
									$
								</span>
							</div>
							<input
								type='text'
								className='form-control'
								placeholder='Target Price'
								aria-label='Target Price'
								aria-describedby='target-price-addon'
								value={targetPrice}
								onChange={e => setTargetPrice(e.target.value ? parseInt(e.target.value) : undefined)}
							/>
						</div>
					</div>

					<div className='col-3'>
						<div className='input-group'>
							<div className='input-group-prepend'>
								<span
									className='input-group-text'
									id='target-investment-addon'
								>
									$
								</span>
							</div>
							<input
								type='text'
								className='form-control'
								placeholder='Target Investment'
								aria-label='Target Investment'
								aria-describedby='target-investment-addon'
								value={targetInvestment}
								onChange={e => setTargetInvestment(e.target.value ? parseInt(e.target.value) : undefined)}
							/>
						</div>
					</div>

					<div className='col-3'>
						<div className='form-group'>
							<select
								value={type}
								onChange={e => setType(e.target.value === 'stock' ? AssetType.stock : AssetType.crypto)}
								className='form-control'
							>
								<option value='stock'>stock</option>
								<option value='crypto'>crypto</option>
							</select>
						</div>
					</div>

					<div className='col-3'>
						<div className='form-group'>
							<Typeahead
								onChange={sectors => setSector(sectors[0])}
								onInputChange={sector => setSector(sector)}
								options={sectors}
								allowNew
								id='sector99'
							/>
						</div>
					</div>

				</div>

				<div className='row my-4'>
					<div className='col-12'>
						{valuations.map((valuation, index) => (
							<textarea
								className='form-control'
								placeholder='Valution'
								value={valuation}
								key={`valuation${index}`}
								onChange={e => onSetValuation(e.target.value, index)}
							>
							</textarea>)
						)}
						<div className='my-3'>
							<button
								type='button'
								className='btn btn-primary'
								onClick={() => setValuations(valuations.concat(''))}
							>
								Add
							</button>
						</div>
					</div>
				</div>

				<div className='row my-4'>
					<div className='col-12'>
						{notes.map((note, index) => (
							<textarea
								className='form-control'
								placeholder='Note'
								value={note}
								key={`note${index}`}
								onChange={e => onSetNote(e.target.value, index)}
							>
							</textarea>)
						)}
						<div className='my-3'>
							<button
								type='button'
								className='btn btn-primary'
								onClick={() => setNotes(notes.concat(''))}
							>
								Add
							</button>
						</div>
					</div>
				</div>

			</div>
		</Layout>
	);
};

export default connect(mapStateToProps, null)(AssessmentsAdmin);

export const pageQuery = graphql`
	query {
		allCompany {
			nodes {
				symbol
			}
		}
	}
	`;
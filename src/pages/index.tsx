import { graphql, PageProps } from 'gatsby';
import * as React from 'react';
import _ from 'lodash';

import Layout from '../components/layout';
import { connect } from 'react-redux';
import { IStoreState } from '../store/store';
import { Currency } from '../utils/enum';

interface IIndexQueryProps extends PageProps {
	data: {
		allReview: {
			nodes: {
				comments: string,
				continue: string[],
				goals: string[],
				grade: string,
				hightlights: string[],
				lowlights: string[],
				start: string[],
				stop: string[],
				year: number
			}[]
		},
		allNote: {
			nodes: {
				text: string
			}[]
		}
	}
}

interface IIndexStateProps {
	currency: Currency
}


const mapStateToProps = ({ currency }: IStoreState): IIndexStateProps => ({
	currency
});

const IndexPage: React.FC<IIndexQueryProps & IIndexStateProps> = ({ data, currency }) => {
	const notes = _.sampleSize(data.allNote.nodes, data.allNote.nodes.length);
	const review = _.first(data.allReview.nodes);
	const random = _.random(1,3);
	return (
		<Layout>
			<div className='row p-4'>
				<div className='col-12'>
					{random === 1 && review?.continue.map(c => (
						<div key={c}>
							<i className="fas fa-sync-alt mr-2 blue-color"></i>
							{c}
						</div>
					))}
					{random === 2 && review?.start.map(s => (
						<div key={s}>
							<i className="fas fa-play mr-2 green-color"></i>
							{s}
						</div>
					))}
					{random === 3 && review?.stop.map(s => (
						<div key={s}>
							<i className="fas fa-stop mr-2 red-color"></i>
							{s}
						</div>
					))}
				</div>
			</div>
			{_(notes).sampleSize(3).map(({text}) => (
				<div key={text} className='daily-note text-center b-1 py-2 px-4 mt-4'>
					{text}
				</div>
			)).value()}
		</Layout>
	);
};

export default connect(mapStateToProps)(IndexPage);

export const pageQuery = graphql`
	query {
		allReview(sort: {fields: year, order: ASC}, limit: 1) {
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
		allNote {
			nodes {
				text
			}
		}
	}
	`;

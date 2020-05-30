// eslint-disable-next-line @typescript-eslint/no-unused-vars
import React, { ReactElement } from 'react';
// @ts-ignore
import { graphql, useStaticQuery } from 'gatsby';
import XE from '../components/xe/XE';
import StockHover from '../components/stock-hover/StockHover';
import Assessment from '../components/assessment/Assessment';

const defaultProps = {
	linkText: 'View the source',
};

type SourceProps = { description: string } & typeof defaultProps

type UrlProps = {
	site: {
		siteMetadata: {
			exampleUrl: string
		}
	}
}

const Source = ({ description, linkText }: SourceProps): ReactElement => {
	const data = useStaticQuery<UrlProps>(graphql`
		query {
			site {
				siteMetadata {
					exampleUrl
				}
			}
		}
	`);

	return (
		<React.Fragment>
			<div>
				{description} <br />{' '}
				<a href={data.site.siteMetadata.exampleUrl}>{linkText}</a>
				<div>
					<XE usd={12} cad = {15} currency='usd' />
				</div>
				<div>
					<StockHover
						symbol={'sq'}
						price={80.23}
						previousClosePrice={80.23}
						name={'Square Inc.'}
						assetCurrency={'usd'}
						css={{'text-emphasis': true, 'font-weight-bold': true}}
						marketCap={800000000}
						quantity={243}
						costCad={23000}
						costUsd={18000}
						valueCad={30000}
						valueUsd={26000}
						shareProgress={50}
						priceProgress={40}
						activeCurrency={'usd'}
					/>
				</div>
				<div>
					<Assessment
						name='Square Inc'
						symbol='sq'
						targetInvestment={30000}
						quotePrice={80.23}
						positionTotalCost={18000}
						lastUpdatedTimestamp={new Date().getTime()}
						pluses={['plus']}
						minuses={['minus']}
						questions={['question']}
						valuations={['valuation']}
						notes={['note']}
						targetPrice={200}
					/>
				</div>
			</div>
		</React.Fragment>
	);
};

export default Source;

Source.defaultProps = defaultProps;

import * as React from 'react'; 
import Disclaimer from '../components/disclaimer/Disclaimer';
import Layout from '../components/layout';

const DisclaimerPage: React.FC = () => (
	<Layout>
		<div className='p-4'>
			<Disclaimer />
		</div>
	</Layout>
);

export default DisclaimerPage;
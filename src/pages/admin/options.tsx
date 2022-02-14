import React from 'react';
import { graphql } from 'gatsby';
import _ from 'lodash';
import numeral from 'numeral';

import OptionsCalculator from '../../components/options-calculator/OptionsCalculator';
import Layout from '../../components/layout';

const Options: React.FC = () => {
    return (<Layout>
        <OptionsCalculator></OptionsCalculator>
    </Layout>);
}

export default Options;
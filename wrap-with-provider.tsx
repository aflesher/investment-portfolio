import React from 'react';

import AppProvider from './provider';

// eslint-disable-next-line react/display-name,react/prop-types
export default ({ element }): JSX.Element => {
	// Instantiating store in `wrapRootElement` handler ensures:
	//  - there is fresh store for each SSR page
	//  - it will be called only once in browser, when React mounts
	return <AppProvider>{element}</AppProvider>;
};

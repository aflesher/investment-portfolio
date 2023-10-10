import React, { FC } from 'react';

export interface ITextConfig {
	color?: 'positive' | 'negative';
}

interface ITextStateProps {
	config?: ITextConfig;
}

const Text: FC<ITextStateProps> = ({ children, config }) => {
	const classes: string[] = [];
	if (config?.color === 'positive') {
		classes.push('text-positive');
	}

	if (config?.color === 'negative') {
		classes.push('text-negative');
	}

	return <span className={classes.join(' ')}>{children}</span>;
};

export default Text;

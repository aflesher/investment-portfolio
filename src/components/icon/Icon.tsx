import React, { useEffect, useState } from 'react';

type IconSize = 'fa-xs';

export default function Icon({
	icon,
	title,
	size,
	css = [],
}: {
	icon: string;
	title?: string;
	size?: IconSize;
	css?: string[];
}) {
	const [show, setShow] = useState(false);

	useEffect(() => {
		setShow(true);
	}, [setShow]);

	if (!show) {
		return <></>;
	}

	const classes = ['fas', icon, ...css];
	if (size) {
		classes.push(size);
	}

	return <i className={classes.join(' ')} title={title}></i>;
}

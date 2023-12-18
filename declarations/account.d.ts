export interface IAccount {
	id: string;
	name: string;
	isTaxable: boolean;
	type:
		| 'margin'
		| 'saving'
		| 'tfsa'
		| 'rrsp'
		| 'resp'
		| 'other'
		| 'crypto'
		| 'non-registered';
	displayName: string;
}

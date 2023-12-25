import * as firebase from '../firebase';
import * as questrade from '../questrade';

export const getAssessments = async () => {
	const assessments = await firebase.getAssessments();

	const missingSymbolIds = assessments.filter(
		(assessment) => !assessment.symbolId
	);

	await Promise.all(
		missingSymbolIds.map(async (assessment) => {
			const symbolId = await questrade.findSymbolId(assessment.symbol);
			if (symbolId) {
				assessment.symbolId = symbolId;
				await firebase.setAssessment(assessment);
			}
		})
	);
	console.log('assessments Promise.all() finished'.magenta);

	return assessments;
};

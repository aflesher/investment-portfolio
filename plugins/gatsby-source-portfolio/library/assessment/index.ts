export const assessmentsFillPromise = (async (): Promise<IAssessment[]> => {
	const assessments = await assessmentsPromise;
	await questradeSync;

	const missingSymbolIds: IAssessment[] = [];
	assessments.forEach((assessment) => {
		if (!assessment.symbolId) {
			missingSymbolIds.push(assessment);
		}
	});

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
})();

//@ts-check

delete require.cache[require.resolve('../../../lib/analyze/AnalyzeCore')];
const AnalyzeCore = require('../../../lib/analyze/AnalyzeCore');
const { WithChat } = AnalyzeCore;
const { Assert } = require('@hangxingliu/assert');
const { GroupBy } = AnalyzeCore;
const path = require('path');

const DB_DIR = path.join(__dirname, '../../resources/data-mock');

describe('Terminal (type 3) and Chat (type 4) Activity Analytics', () => {
	it('should aggregate terminal and chat activities and charStats', () => {
		const analyzer = new WithChat(DB_DIR);
		analyzer.setGroupBy(GroupBy.ALL);
		console.log('Analyzer instance created:', analyzer);
		const ok = analyzer.analyze(new Date(1721500000000), new Date(1721500002000), false);
		Assert(ok).isTrue();

		const result = analyzer.getResult();
		console.log('charStats:', result?.total.charStats);
		// Check groupBy.language mapping
		Assert(result?.groupBy.language).hasKey('terminal');
		Assert(result?.groupBy.language).hasKey('chat');
		// Check charStats
		Assert(result?.total.charStats).isObject();
		Assert(result?.total.charStats?.prompt).equals(123);
		Assert(result?.total.charStats?.response).equals(456);
	});
});

//@ts-check

const click = 'click';

let utils = require('../utils/utils'),
	dateTime = require('../utils/datetime'),
	resizer = require('../utils/resizer'),
	csvDialog = require('../ui/exportCSVDialog'),
	reportFilter = require('../reportFilter'),
	API = require('../api'),
	{ URL } = API;

let $page = $('.page-terminal');
let $rangeButtons = $page.find('.range-block [data-range]'),
	$btnExportTerminal = $('#btnExportTerminal');

let chartTerminal = require('../charts/languages_detailed'); // Reusing languages_detailed for now
/** @type {EChartsInstance[]} */
let charts = [];

/** @type {CodingWatchingMap} */
let terminalData = {};
let totalWatchingTime = 0;

module.exports = { name: utils.basename(__filename, '.js'), start, stop };

function stop() {
	charts.map(chart => chart.dispose());
	$rangeButtons.off(click);
	$btnExportTerminal.off(click);
	$page.hide();
}

function start() {
	$page.show();

	charts = [
		chartTerminal.init(utils.getChartDom(chartTerminal.recommendedChartId, $page)[0])
	];

	resizer.removeSubscriber();
	resizer.subscribe(charts);

	reportFilter.removeSubscribers();
	reportFilter.subscribe(request);

	$rangeButtons.on(click, updateRange);
	$btnExportTerminal.on(click, exportCSVTerminal);

	request(reportFilter.getFilter());
}

/** @param {ReportFilter} filter */
function request(filter) {
	void filter; // keep this variable in here
	API.requestSilent(URL.terminal(), data => {
		totalWatchingTime = data.total.watching;
		terminalData = data.groupBy.terminal;

		chartTerminal.update({ data: terminalData })
	});
}

const CLASS_RANGE_DEFAULT = 'btn-default';
const CLASS_RANGE_SELECTED = 'btn-success';
function updateRange() {
	let top = parseInt($(this).attr('data-range'));$rangeButtons.removeClass(CLASS_RANGE_SELECTED).addClass(CLASS_RANGE_DEFAULT);
	$rangeButtons.filter(`[data-range=${top}]`)
		.addClass(CLASS_RANGE_SELECTED).removeClass(CLASS_RANGE_DEFAULT);
	chartTerminal.update({ top });
}

function exportCSVTerminal() {
	const headers = ['Command', 'Percent', 'Cost'];
	let rows = utils.orderByWatchingTime(utils.object2array(terminalData), true);
	let data = rows.map(row => {
		let time = terminalData[row.name].watching;
		let cost = dateTime.getReadableTime(time);
		return [
			decodeURIComponent(row.name),
			(time * 100 / totalWatchingTime).toFixed(2) + '%',
			cost];
	});
	let defaultFile = 'terminal_' + csvDialog.getFileNameFromFilter();
	csvDialog.showExportDialog(defaultFile, headers, data);
}

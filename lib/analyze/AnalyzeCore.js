/**
 * Tracking data analyzer core class
 *
 * ...[unchanged docstring and imports]...
 */
//@ts-check
/// <reference path="../types/AnalyzeCore.d.ts" />

"use strict";
let path = require('path'),
	fs = require('fs');

let DefinedString = require('./DefinedString');
let Exception = require('./ExceptionCollection');

let {
	GROUP_BY,

	COLUMN_INFO_3,
	COLUMN_INFO_4_REQUIRED,
	COLUMN_INFO_4_OPTIONAL,
	// COLUMN_INFO_ALL,

	SUPPORT_VERSION,

	SPLIT_COLUMN,
	SPLIT_LINE,
	ACTIVITY_TYPE
} = require('./Constant');

let {
	getVCSInfo,

	getFileNameFromDateObject,
	dateToYYYYMMDDHHString,
	dateToYYYYMMDDString,

	generateFilterFunction,
	convertGroupRulesNumberToObject,

	getBaseResultObject
} = require('./Utils');

/** How many columns each line in version 3.0 database file */
const COLUMN_COUNT_3 = Object.keys(COLUMN_INFO_3).length;

/** How many columns at least each line in version 4.0 database file */
const COLUMN_COUNT_4_MIN = COLUMN_COUNT_3 + Object.keys(COLUMN_INFO_4_REQUIRED).length;
/** How many columns at most each line in version 4.0 database file */
const COLUMN_COUNT_4_MAX = COLUMN_COUNT_4_MIN + Object.keys(COLUMN_INFO_4_OPTIONAL).length;

const MS_1_HOUR = 3600 * 1000;
const MS_1_DAY = 24 * MS_1_HOUR;

class AnalyzeCore {
	constructor(databaseFolder) {
		this.databaseFolder = databaseFolder;
		this._init();
	}

	_init() {
		this.exception = Exception.create();
		this.filterFunction = generateFilterFunction({});
		this.groupByRules = convertGroupRulesNumberToObject(0);
		this.analyzeTimestampRange = [0, 0];
		this.resultObject = getBaseResultObject();
		this.definedString = DefinedString.create();
	}

	_cleanVariableBeforeAnalyze() {
		this.exception = Exception.create();
		this.analyzeTimestampRange = [0, 0];
		this.filterFunction = this.filterFunction || generateFilterFunction();
		this.groupByRules = this.groupByRules || convertGroupRulesNumberToObject(0);
		this.resultObject = getBaseResultObject();
		this.definedString = DefinedString.create();
	}

	analyze(startDate, endDate, expandToWholeDay = true) {
		this._cleanVariableBeforeAnalyze();

		if (expandToWholeDay) {
			startDate = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate(), 0, 0, 0);
			endDate = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate(), 23, 59, 59);
		}
		this.analyzeTimestampRange = [startDate.getTime(), endDate.getTime()];

		let dateLoopCursor = new Date(startDate.getTime());
		dateLoopCursor.setDate(dateLoopCursor.getDate() - 1);

		let dateLoopEnd = new Date(endDate);
		let dateLoopEndTimestamp = dateLoopEnd.setDate(dateLoopEnd.getDate() + 1);

		let scanFileNameList = [];
		while (dateLoopCursor.getTime() < dateLoopEndTimestamp) {
			scanFileNameList.push(getFileNameFromDateObject(dateLoopCursor));
			dateLoopCursor.setDate(dateLoopCursor.getDate() + 1);
		}

		for (let i = 0, j = scanFileNameList.length; i < j; i++) {
			let needCheckTimeRange = i < 2 || i >= j - 2;
			if (!this._analyzeOneLineFile(scanFileNameList[i], needCheckTimeRange))
				return false;
		}
		return true;
	}

	_analyzeOneLineFile(fileName, needCheckTimeRange) {
		let filePath = path.join(this.databaseFolder, fileName);
		if (!fs.existsSync(filePath))
			return true;
		let content = ''
		try {
			content = fs.readFileSync(filePath, 'utf8');
		} catch (err) {
			return this.exception.addError(`read file error`, fileName), false;
		}
		let lines = content.split(SPLIT_LINE);
		if (lines.length == 0)
			return this.exception.addError(`empty file`, fileName), false;

		let version = lines[0].trim();
		if (SUPPORT_VERSION.indexOf(version) == -1)
			return this.exception.addError(`unsupported version: ${lines[0]}`, fileName), false;

		let versionNum = version == '4.0' ? 4 : 3;
		for (let i = 1; i < lines.length; i++) {
			let line = lines[i].trim();
			if (line.startsWith('#'))
				continue;
			if (line.startsWith('d')) {
				if (!this.definedString.addDefiningLine(line))
					return this.exception.addError(`defining line is invalid`, fileName, i + 1), false;
				continue;
			}
			// Always use the instance method (subclass override)
			if (!this._analyzeOneLine(versionNum, line, fileName, i + 1, needCheckTimeRange))
				return false;
		}
		return true;
	}

	_analyzeOneLine(versionNumber, line, fileName, lineNo, needCheckTimeRange) {
		console.log('BASE _analyzeOneLine (class) called:', { versionNumber, line, fileName, lineNo, needCheckTimeRange });
		var cols = line.split(SPLIT_COLUMN);
		if (!line)
			return true;

		let left = (versionNumber == 4 ? COLUMN_COUNT_4_MIN : COLUMN_COUNT_3),
			right = (versionNumber == 4 ? COLUMN_COUNT_4_MAX : COLUMN_COUNT_3);
		if (cols.length < left) {
			return this.exception.addError(`columns length is not valid. at least ${left}(${cols.length})`, fileName, lineNo), false;
		} else if (cols.length > right) {
			this.exception.addWarning(`too many columns than ${right}(${cols.length})`, fileName, lineNo);
		}

		let vcs = getVCSInfo(cols);
		if (!this.filterFunction(cols, vcs))
			return true;

		var startTime = Number(cols[1]),
			howLong = Number(cols[2]);
		if (isNaN(startTime) || isNaN(howLong))
			return this.exception.addError(`param "start time" or param "how long" is not a number`, fileName, lineNo), false;

		if (needCheckTimeRange) {
			if (startTime > this.analyzeTimestampRange[1]) return true;
			if (startTime + howLong > this.analyzeTimestampRange[1]) {
				howLong = this.analyzeTimestampRange[1] - startTime;
			}
			if (startTime < this.analyzeTimestampRange[0]) {
				if (startTime + howLong < this.analyzeTimestampRange[0]) return true;
				howLong -= this.analyzeTimestampRange[0] - startTime;
				startTime = this.analyzeTimestampRange[0];
			}
		}

		let isCodingRecord = cols[0] == '2' || cols[0] == '3',
			resultGroupBy = this.resultObject.groupBy;
		this.resultObject.total[isCodingRecord ? 'coding' : 'watching'] += howLong;

		if (this.groupByRules.hasComputer)
			this._addOneRecordToAGroupBy(resultGroupBy.computer, cols[6], howLong, isCodingRecord);
		if (this.groupByRules.hasProject)
			this._addOneRecordToAGroupBy(resultGroupBy.project, cols[5], howLong, isCodingRecord);
		if (this.groupByRules.hasFile) {
			if (cols[0] == '3') {
				this._addOneRecordToAGroupBy(resultGroupBy.file, cols[4], howLong, isCodingRecord);
			} else {
				this._addOneRecordToAGroupBy(resultGroupBy.file, cols[4], howLong, isCodingRecord);
			}
		}
		if (this.groupByRules.hasLanguage) {
			if (cols[0] == '3') {
				this._addOneRecordToAGroupBy(resultGroupBy.language, cols[3], howLong, isCodingRecord);
			} else {
				this._addOneRecordToAGroupBy(resultGroupBy.language, cols[3], howLong, isCodingRecord);
			}
		}
		if (this.groupByRules.hasTerminal) {
			if (cols[0] == '3') {
				this._addOneRecordToAGroupBy(resultGroupBy.terminal, cols[4], howLong, isCodingRecord);
			}
		}

		if (this.groupByRules.hasVCS)
			this._addOneRecordToAGroupBy(resultGroupBy.vcs, vcs ? vcs.join(':') : '::', howLong, isCodingRecord);

		if (this.groupByRules.hasHour) {
			let pointerTimestamp = new Date(startTime).setMinutes(0, 0, 0),
				endTimestamp = startTime + howLong,
				lastCountTimestamp = startTime,
				nextCountTimestamp = -1,
				context = resultGroupBy.hour;

			for (; pointerTimestamp < endTimestamp; pointerTimestamp += MS_1_HOUR) {
				nextCountTimestamp = Math.min(endTimestamp, pointerTimestamp + MS_1_HOUR);
				let howLongInThisHour = nextCountTimestamp - lastCountTimestamp;
				this._addOneRecordToAGroupBy(context, dateToYYYYMMDDHHString(new Date(pointerTimestamp)),
					howLongInThisHour, isCodingRecord);

				lastCountTimestamp = nextCountTimestamp;
			}
		}
		if (this.groupByRules.hasDay) {
			let pointerTimestamp = new Date(startTime).setHours(0, 0, 0, 0),
				endTimestamp = startTime + howLong,
				lastCountTimestamp = startTime,
				nextCountTimestamp = -1,
				context = resultGroupBy.day;

			for (; pointerTimestamp < endTimestamp; pointerTimestamp += MS_1_DAY) {
				nextCountTimestamp = Math.min(endTimestamp, pointerTimestamp + MS_1_DAY);
				let howLongInThisDay = nextCountTimestamp - lastCountTimestamp;
				this._addOneRecordToAGroupBy(context, dateToYYYYMMDDString(new Date(pointerTimestamp)),
					howLongInThisDay, isCodingRecord);

				lastCountTimestamp = nextCountTimestamp;
			}
		}
		return true;
	}

	_addOneRecordToAGroupBy(context, name, howLong, isCodingRecord) {
		if (!name)
			name = 'unknown';
		if (context[name])
			context[name][isCodingRecord ? 'coding' : 'watching'] += howLong;
		else
			context[name] = { coding: isCodingRecord ? howLong : 0, watching: isCodingRecord ? 0 : howLong };
	}

	setFilter(filterRules) {
		this.filterFunction = generateFilterFunction(filterRules);
	}

	setGroupBy(groupBy) {
		this.groupByRules = convertGroupRulesNumberToObject(groupBy);
		console.log('setGroupBy called, groupByRules:', this.groupByRules);
	}

	getError() {
		return this.exception.getError();
	}

	getWarning() {
		return this.exception.getWarning();
	}

	getResult() {
		return this.resultObject;
	}
}

AnalyzeCore.GroupBy = GROUP_BY;

const CHAT_LANG = 'chat';

const parseChatR2 = (r2) => {
	if (!r2 || typeof r2 !== 'string') return [0, 0];
	const m = r2.match(/^(\d+),(\d+)$/);
	return m ? [parseInt(m[1], 10), parseInt(m[2], 10)] : [0, 0];
};

class AnalyzeCoreWithChat extends AnalyzeCore {
	_analyzeOneLine(versionNumber, line, fileName, lineNo, needCheckTimeRange) {
		const ok = super._analyzeOneLine(versionNumber, line, fileName, lineNo, needCheckTimeRange);
		if (ok && versionNumber === 4) {
			const cols = line.split(SPLIT_COLUMN);
			const typeCol = parseInt(cols[0], 10);
			const isChat = (typeCol === ACTIVITY_TYPE.CHAT) || (typeCol === ACTIVITY_TYPE.CODING && cols[3] === CHAT_LANG);
			console.log('WithChat _analyzeOneLine:', { typeCol, isChat, line });
			if (isChat && typeof cols[cols.length - 1] !== 'undefined') {
				const [prompt, response] = parseChatR2(cols[cols.length - 1]);
				const result = this.getResult();
				if (!result.total.charStats) result.total.charStats = { prompt: 0, response: 0 };
				result.total.charStats.prompt += prompt;
				result.total.charStats.response += response;
			}
		}
		return ok;
	}

	analyze(...a) {
		const result = this.getResult();
		if (!result.total.charStats) {
			result.total.charStats = { prompt: 0, response: 0 };
		} else {
			result.total.charStats.prompt = 0;
			result.total.charStats.response = 0;
		}
		return super.analyze(...a);
	}
}

module.exports = AnalyzeCore;
module.exports.WithChat = AnalyzeCoreWithChat;

//@ts-check

"use strict";
const REQUIRED_COMMON = [
	'version',
	'token',
	'type',
	'time',
	'long',
	'pcid'
];
const REQUIRED_FILE_ACTIVITY = [
	'lang',
	'file',
	'proj'
];
const REQUIRED_V4_FILE_ACTIVITY = [
	'vcs_type',
	'vcs_repo',
	'vcs_branch',
	'line',
	'char'
];
const REQUIRED_TERMINAL = [
	'lang',
	'command',
	'cwd',
	'line',
	'char'
];
const REQUIRED_CHAT = [
	'lang',
	'r1',
	'r2',
	'line',
	'char'
];
const NUMBER_COMMON = [
	'time',
	'long'
];
const NUMBER_FILE_ACTIVITY = [
	'line',
	'char'
];

module.exports = function (params) {
	// Check common required parameters
	for (let req of REQUIRED_COMMON)
		if (typeof params[req] == 'undefined')
			return { error: `missing param "${req}"!` };

	// Accept both string and integer type representations
	const type = typeof params.type === 'string' && /^\d+$/.test(params.type)
		? parseInt(params.type, 10)
		: params.type;

	// Terminal activity: type 3 or 'terminal'
	if (type === 3 || params.type === 'terminal') {
		for (let req of REQUIRED_TERMINAL)
			if (typeof params[req] == 'undefined')
				return { error: `missing param "${req}" for terminal activity!` };
		if (params.lang !== 'terminal')
			return { error: `invalid lang for terminal activity, expected "terminal"` };
	}
	// Chat activity: type 4 or 'chat'
	else if (type === 4 || params.type === 'chat' || (type === 2 && params.lang === 'chat')) {
		for (let req of REQUIRED_CHAT)
			if (typeof params[req] == 'undefined')
				return { error: `missing param "${req}" for chat activity!` };
		if (params.lang !== 'chat')
			return { error: `invalid lang for chat activity, expected "chat"` };
		if (!/^(\d+),(\d+)$/.test(params.r2))
			return { error: `invalid r2 for chat activity, expected "number,number"` };
	}
	// Watching: type 0
	else if (type === 0) {
		// Only common fields required
	}
	// File activity: type 2 (not chat)
	else {
		for (let req of REQUIRED_FILE_ACTIVITY)
			if (typeof params[req] == 'undefined')
				return { error: `missing param "${req}" for file activity!` };

		if (params.version == '4.0')
			for (let req of REQUIRED_V4_FILE_ACTIVITY)
				if (typeof params[req] == 'undefined')
					return { error: `missing param "${req}" (upload version 4.0)!` };
	}

	// Check number parameters
	let numbersToCheck = [...NUMBER_COMMON];
	if (params.type !== 'terminal' && params.type !== 'chat') {
		numbersToCheck = numbersToCheck.concat(NUMBER_FILE_ACTIVITY);
	} else {
		numbersToCheck = numbersToCheck.concat(['line', 'char']);
	}

	for (let num of numbersToCheck) {
		if (typeof params[num] != 'undefined' &&
			isNaN(parseInt(params[num])) &&
			typeof params[num] !== 'number')
			return { error: `param "${num}" is not an integer` };
	}

	// TODO : It could also verify params length and type 

	return params;
};

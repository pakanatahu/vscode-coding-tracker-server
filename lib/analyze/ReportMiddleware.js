//@ts-check
/// <reference path="../types/AnalyzeCore.d.ts" />

//  ____                                                _                _   _   _   _
// |  _ \    ___   _ __    _ __    ___    ___    __ _  | |_    ___    __| | | | | | | |
// | | | |  / _ \ | '_ \  | '__|  / _ \  / __|  / _` | | __|  / _ \  / _` | | | | | | |
// | |_| | |  __/ | |_) | | |    |  __/ | (__  | (_| | | |_  |  __/ | (_| | |_| |_| |_|
// |____/   \___| | .__/  |_|     \___|  \___|  \__,_|  \__|  \___|  \__,_| (_) (_) (_)
//                |_|
/*
	Deprecated report middleware

	Please use ReportMiddlewareV2.js
	This file will be remove in 1.0.0
*/

"use strict";
const Analyzer = require('./AnalyzeCore'),
	{ GroupBy } = Analyzer;

const GROUP_BY_NORMAL = GroupBy.DAY | GroupBy.LANGUAGE | GroupBy.FILE | GroupBy.PROJECT | GroupBy.COMPUTER;
const GROUP_BY_24HS = GroupBy.HOUR;

const HEADER_JSON = { "Content-Type": "application/json; charset=utf-8" };
const ROUTER_MAP = {
	'GET /recent': [analyzeRecentDays, 'days'],
	'GET /last24hs': [analyze24Hours, 'ts'],
	'GET /project': [analyzeProject, 'days', 'project']
};
let dbPath = 'this value will be set in init(databasePath) method';

//-------------- Core middleware ---------------------
function middleware(req, res, next) { //eslint-disable-line no-unused-vars
	let routerName = getRouterName(req), match = ROUTER_MAP[routerName];
	if (!match) return onError(res, 404, `${routerName} not found!`);

	let params = [];
	for(let i = 1 ; i < match.length ; i++ ) {
		let name = match[i];
		params.push(req.query[name] || (req.body && req.body[name]) || void 0);
	}
	params.push(req);
	params.push(res);

	match[0].apply(this, params);
}
function onError(res, code, message) {
	res.writeHead(code, HEADER_JSON);
	res.write(JSON.stringify({ error: message }));
	res.end();
}
function getRouterName(req) {
	let { method, url } = req, index = url.indexOf('?');
	if (index != -1) url = url.slice(0, index);
	return `${method} ${url}`;
}
/**
 * @param {AnalyzeCoreInstance} analyze
 * @param {number} base
 * @param {number} days
 * @param {any} res
 */
function analyzeThenResponse(analyze, base, days, res) {
	let to = new Date(base), from = new Date(base);
	from.setDate(from.getDate() - days + 1);
	const success = analyze.analyze(from, to);
	if (!success) {
		return onError(res, 500, analyze.getError());
	}
	let result = analyze.getResult();

	// Map language keys: 'terminal' → 'Terminal', 'chat' → 'AI Chat'
	if (result.groupBy && result.groupBy.language) {
		const langMap = { terminal: "Terminal", chat: "AI Chat" };
		const newLang = {};
		for (const k in result.groupBy.language) {
			newLang[langMap[k] || k] = result.groupBy.language[k];
		}
		result.groupBy.language = newLang;
	}
	// Also map in file/project if needed (optional, for consistency)
	if (result.groupBy && result.groupBy.file) {
		const langMap = { terminal: "Terminal", chat: "AI Chat" };
		const newFile = {};
		for (const k in result.groupBy.file) {
			newFile[langMap[k] || k] = result.groupBy.file[k];
		}
		result.groupBy.file = newFile;
	}
	res.json(result);
}

//==========================================
//========  Sub-functions   ================
//==========================================

function analyzeRecentDays(days, req, res) {
	//handler default params
	days = Number(days) || 7;
	let analyze = new Analyzer(dbPath);
	analyze.setGroupBy(GROUP_BY_NORMAL);
	return analyzeThenResponse(analyze, Date.now(), days, res);
}

function analyze24Hours(timestamp, req, res) {
	timestamp = Number(timestamp) || Date.now();
	let analyze = new Analyzer(dbPath);
	analyze.setGroupBy(GROUP_BY_24HS);
	return analyzeThenResponse(analyze, timestamp, 2, res);
}

function analyzeProject(days, projectName, req, res) {
	//handler default params
	days = Number(days) || 7;
	if (!projectName) return onError(res, 400, 'missing parameter "project"!');

	let analyze = new Analyzer(dbPath);
	analyze.setGroupBy(GROUP_BY_NORMAL);
	analyze.setFilter({ project: [encodeURIComponent(projectName)] });
	return analyzeThenResponse(analyze, Date.now(), days, res);
}

//------------------export-----------------------

module.exports = { init: databaseFolder => (dbPath = databaseFolder, middleware) };

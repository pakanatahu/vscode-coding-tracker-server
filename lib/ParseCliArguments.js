//@ts-check

const version = require('./Version');
const generateRandomToken = require('./GenerateRandomToken');

// @ts-ignore
const { Command } = require('commander');
const cliArgs = new Command();

const defaultTokenFile = '$HOME/.coding-tracker-token.json';
const defaultAdminToken = '123456';

cliArgs
	.version(version.server)
	.usage('[option]')
	.description('Launch Visual Studio Code Coding Tracker Data Storage And Analyze Server')
	.option('-d, --debug', 'turn on the debug mode\n')
	.option('-t, --token <adminToken>', `an admin token could be used for upload and everything ("${defaultAdminToken}" by default if no token file could be used)`)
	.option('    --token-file <tokenFilePath>', `set token file path ("${defaultTokenFile}" by default)`)
	.option('    --disable-token-file', `disable "${defaultTokenFile}" and user given token file`)
	.option('    --no-token-file', `\n`)
	.option('-T, --random-token', 'set admin token as a random string (admin token could be used for upload and everything)')
	.option('    --public-report', 'set report API and page public (everyone could visit report page without token)\n')
	.option('-p, --port <serverPort>', 'server listen port', process.env.PORT || '10345')
	.option('-l, --local', 'turn on the local mode (bind on address 127.0.0.1). and could be kill by uri /ajax/kill\n')
	.option('-o, --output <dataOutputFolder>', 'upload data storage folder', './database');
	// @todo set output dir to "$HOME/.coding-tracker" by default.
cliArgs.name('coding-tracker-server');

/** @param {string[]} argv */
function parse(argv) {
	cliArgs.parse(argv);

	//@ts-ignore
	global.DEBUG = cliArgs.opts().debug;

	if (cliArgs.opts().randomToken)
		cliArgs.opts().token = generateRandomToken.gen();

	/*
		Normalize command line arguments
			(commander.js handle --token-file and --token-file incorrect)
	*/
	if (cliArgs.opts().disableTokenFile || cliArgs.opts().tokenFile === false) {
        cliArgs.opts().disableTokenFile = true;
        cliArgs.opts().noTokenFile = true;
        cliArgs.opts().tokenFile = null;
    } else if (cliArgs.opts().tokenFile === true || cliArgs.opts().tokenFile === undefined) {
        // --token-file was provided without a value, or with `true`
        cliArgs.opts().tokenFile = null;
        cliArgs.opts().disableTokenFile = false;
        cliArgs.opts().noTokenFile = false;
    } else if (typeof cliArgs.opts().tokenFile !== 'string') {
        console.error(`fatal: expected type of "--token-file" is boolean or string, but actual is ${typeof cliArgs.opts().tokenFile}\n`);
        process.exit(1);
    } else {
        cliArgs.opts().disableTokenFile = false;
        cliArgs.opts().noTokenFile = false;
    }

	return cliArgs.opts();
}

module.exports = {
	parse,
	getDefaultTokenFile: () => defaultTokenFile.replace('$HOME', process.env.USERPROFILE || process.env.HOME),
	getDefaultAdminToken: () => defaultAdminToken,
	get: () => cliArgs.opts(),
};

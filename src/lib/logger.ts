import * as winston from 'winston';

let AMP_DEBUG = Boolean(process.env.AMP_DEBUG);
if (process.argv.indexOf('-v') !== -1) {
	AMP_DEBUG = true;
}
if (AMP_DEBUG) {console.log('AMP_DEBUG mode on');}

export const cliLogger = new (winston.Logger)({
	transports: AMP_DEBUG ?
		[new (winston.transports.Console)({level: 'debug'}),
			new (winston.transports.File)({filename: 'monopoly.log', level: 'debug'})]
		:
		[new (winston.transports.Console)({level: 'info'})]
});

export const consoleLogger = new (winston.Logger)({
	transports: [new (winston.transports.Console)({level: AMP_DEBUG ? 'debug' : 'info', showLevel: false})
	]
});
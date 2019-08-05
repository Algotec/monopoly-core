import * as winston from 'winston';

export let AMP_DEBUG = Boolean(process.env.AMP_DEBUG);
if (process.argv.indexOf('-v') !== -1) {
	AMP_DEBUG = true;
}
if (AMP_DEBUG) {console.log('AMP_DEBUG mode on');}

export const cliLogger = winston.createLogger({
	transports: AMP_DEBUG ?
		[new (winston.transports.Console)({level: 'debug'}),
			new (winston.transports.File)({filename: 'monopoly.log', level: 'debug'})]
		:
		[new (winston.transports.Console)({level: 'info'})]
});

export const consoleLogger = winston.createLogger({
	transports: [new (winston.transports.Console)({level: AMP_DEBUG ? 'debug' : 'info'})
	]
});

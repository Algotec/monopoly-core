import * as winston from 'winston';

export const cliLogger = new (winston.Logger)({
	transports: [new (winston.transports.Console)({level: 'info'}),
		new (winston.transports.File)({filename: 'monopoly.log', level: 'debug'})
	]
});
cliLogger.cli();

export const consoleLogger = new (winston.Logger)({
	transports: [new (winston.transports.Console)({level: 'info',showLevel:false})
		]
});
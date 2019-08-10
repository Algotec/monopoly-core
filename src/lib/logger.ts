import * as winston from 'winston';

const {createLogger, format, transports} = winston;
const {combine, timestamp, label, printf} = format;
export let AMP_DEBUG = Boolean(process.env.AMP_DEBUG);
if (process.argv.indexOf('-v') !== -1) {
	AMP_DEBUG = true;
}
if (AMP_DEBUG) {console.log('AMP_DEBUG mode on');}

export const cliLogger = winston.createLogger({
	transports: AMP_DEBUG ?
		[new (winston.transports.Console)({level: 'debug', format: winston.format.cli()}),
			new (winston.transports.File)({filename: 'monopoly.log', level: 'debug', format: winston.format.cli()})]
		:
		[new (winston.transports.Console)({level: 'info', format: winston.format.cli()})]
});
const removeLevel = printf(({level, message}) => {
	return `${message}`;
});
export const consoleLogger = winston.createLogger({
	transports: [new (winston.transports.Console)({level: AMP_DEBUG ? 'debug' : 'info', format: combine(winston.format.cli(), removeLevel)})
	]
});

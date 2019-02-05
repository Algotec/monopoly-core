import * as fs from 'fs';
import {promisify} from 'util';

const fsRead = promisify(fs.readFile);
const fsWrite = promisify(fs.writeFile);
const fileOptionsDefaults = {parse: true, delimiter: 2};

export interface FileDocumentOptions {
	parse?: boolean;
	delimiter?: number | string;
	addBlankLine?: boolean
}

export class FileDocument<T = any> {
	public content: T | null = null;
	options: FileDocumentOptions;

	constructor(public filePath: string, options?: FileDocumentOptions) {
		this.options = Object.assign({}, fileOptionsDefaults, options);
	}

	read(): Promise<FileDocument> {
		return fsRead(this.filePath, 'utf8')
			.then((data) => {
					this.content = (this.options.parse) ? JSON.parse(data) : data;
					return this;
				}
			).catch((e: Error) => {
				throw new Error('can not read file ' + this.filePath);
			});
	}

	write(): Promise<FileDocument> {
		let content = this.options.parse ? (JSON.stringify(this.content, null, this.options.delimiter)) : this.content;
		if (this.options.addBlankLine) {
			content += '\n';
		}
		return fsWrite(this.filePath, content)
			.then((data: any) => {return this;}
			)
	}
}
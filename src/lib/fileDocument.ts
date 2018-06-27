import * as fs from 'fs';
import {promisify} from 'util';

const fsRead = promisify(fs.readFile);
const fsWrite = promisify(fs.writeFile);

export interface FileDocumentOptions {
	parse?: boolean;
}

export class FileDocument<T = any> {
	public content: T | null = null;

	constructor(public filePath: string, private options: FileDocumentOptions = {parse: true}) {
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
		return fsWrite(this.filePath, JSON.stringify(this.content))
			.then((data: any) => {return this;}
			)
	}
}
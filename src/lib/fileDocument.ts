import * as fs from 'fs';
import {promisify} from 'util';

const fsRead = promisify(fs.readFile);
const fsWrite = promisify(fs.writeFile);

export class FileDocument<T = any> {
	public content: T;

	constructor(public filePath: string) {

	}

	read(): Promise<FileDocument> {
		return fsRead(this.filePath, 'utf8')
			.then((data) => {
					this.content = JSON.parse(data);
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
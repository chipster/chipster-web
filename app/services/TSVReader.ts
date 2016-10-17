import FileResource from "../resources/fileresource";
import TSVFile from "../model/file/TSVFile";

export class TSVReader {

    static $inject = ['FileResource'];

   constructor(private FileResource: FileResource) {
    }

    getTSV(sessionId: string, datasetId: string) {
        return this.FileResource.getData(sessionId, datasetId).then( (resp: any) => {

            // we have to create the promise, because JQuery-cvs doesn't use them
            return new Promise( (resolve: any, reject: any) => {

                // parse the file data using the JQuery-cvs library
                let parserConfig = {
                    separator: '\t'
                };

                $['csv'].toArrays(resp.data, parserConfig, (err: any, fileArray: string[][]) => {
                    if (fileArray) {
                        resolve(new TSVFile(fileArray));
                    } else {
                        reject(err);
                    }
                });
            });
        });
    }
}
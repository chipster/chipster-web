import FileResource from "../resources/fileresource";
import CSVModel from "../views/sessions/session/visualization/expressionprofile/TSV";

export default class CSVReader {

    static $inject = ['FileResource'];

    constructor(
        private FileResource: FileResource) {
    }

   getColumns(sessionId: string, datasetId: string) {

        return this.FileResource.getData(sessionId, datasetId).then( (resp: any) => {
            
            // we have to create the promise, because JQuery-cvs doesn't use them
            return new Promise( (resolve: any, reject: any) => {

                // parse the file data using the JQuery-cvs library
                let parserConfig = {
                    separator: '\t'
                };

                $['csv'].toArrays(resp.data, parserConfig, (err: any, fileArray: string[][]) => {
                    if (fileArray) {
                        resolve(fileArray[0]);
                    } else {
                        reject(err);
                    }
                });
            });
        });
    }

    getCSV(sessionId: string, datasetId: string) {
        return this.FileResource.getData(sessionId, datasetId).then( (resp: any) => {

            // we have to create the promise, because JQuery-cvs doesn't use them
            return new Promise( (resolve: any, reject: any) => {

                // parse the file data using the JQuery-cvs library
                let parserConfig = {
                    separator: '\t'
                };

                $['csv'].toArrays(resp.data, parserConfig, (err: any, fileArray: string[][]) => {
                    if (fileArray) {
                        resolve(new CSVModel(fileArray));
                    } else {
                        reject(err);
                    }
                });
            });
        });
    }
}
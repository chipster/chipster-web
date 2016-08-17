import FileResource from "../resources/fileresource";

export default class TableService {

    static $inject = ['FileResource'];

    constructor(
        private FileResource: FileResource) {
    }

   getColumns(sessionId: string, datasetId: string) {

        return this.FileResource.getData(sessionId, datasetId).then(function (resp: any) {
            
            // we have to create the promise, because JQuery-cvs doesn't use them
            return new Promise(function(resolve: any, reject: any) {

                // parse the file data using the JQuery-cvs library
                let parserConfig = {
                    separator: '\t'
                };

                $['csv'].toArrays(resp.data, parserConfig, function (err: any, fileArray: string[][]) {
                    if (fileArray) {
                        resolve(fileArray[0]);
                    } else {
                        reject(err);
                    }
                });
            }.bind(this));
        }.bind(this));
    }
}
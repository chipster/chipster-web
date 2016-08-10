import FileResource from "../resources/fileresource";

export default class TableService {

    static $inject = ['FileResource'];

    constructor(
        private FileResource: FileResource) {
    }

   getColumns(sessionId, datasetId) {

        return this.FileResource.getData(sessionId, datasetId).then(function (resp) {
            
            // we have to create the promise, because JQuery-cvs doesn't use them
            return new Promise(function(resolve, reject) {

                // parse the file data using the JQuery-cvs library
                let parserConfig = {
                    separator: '\t'
                };

                $.csv.toArrays(resp.data, parserConfig, function (err, fileArray) {
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
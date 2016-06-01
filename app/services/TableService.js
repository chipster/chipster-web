angular.module('chipster-web').factory('TableService', function (FileRestangular) {

    var service = {};

    service.getColumns = function (sessionId, datasetId) {

        return FileRestangular.getData(sessionId, datasetId).then(function (resp) {

            // we have to create the promise, because JQuery-cvs doesn't use them
            return new Promise(function(resolve, reject) {

                // parse the file data using the JQuery-cvs library
                parserConfig = {
                    separator: '\t'
                };
                $.csv.toArrays(resp.data, parserConfig, function (err, fileArray) {
                    if (fileArray) {
                        resolve(fileArray[0]);
                    } else {
                        reject(err);
                    }
                });
            });
        });
    };

    return service;
});
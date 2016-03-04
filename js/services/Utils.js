chipsterWeb.factory('Utils', function () {

    var service = {};

    service.getFileExtension = function(name) {
        return name.split('.').pop();
    };

    service.startsWith = function(data, start) {
        return data.substring(0, start.length) === start;
    };

    return service;
});
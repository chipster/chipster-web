chipsterWeb.factory('Utils', function () {

    var service = {};

    service.getFileExtension = function(name) {
        return name.split('.').pop();
    };

    return service;
});
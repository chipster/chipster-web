chipsterWeb.factory('Utils', function () {

    var service = {};

    service.getFileExtension = function(name) {
        return name.split('.').pop();
    };

    service.startsWith = function(data, start) {
        return data.substring(0, start.length) === start;
    };

    service.mapValues = function(map) {
        var array = [];
        map.forEach( function(value) {
            array.push(value);
        });
        return array;
    };

    service.arrayToMap = function(array, key) {
        var map = new Map();
        for (var i = 0; i < array.length; i++) {
            map.set(array[i][key], array[i]);
        }
        return map;
    };

    return service;
});
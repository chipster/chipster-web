import * as configurationConstants from '../app.constants';

export default class ConfigurationResource {

    static $inject = ['$resource'];

    constructor(private $resource: angular.resource.IResourceService, private configurationConstants: configurationConstants) {
    }

    getConfigurationResource() {
        return this.$resource(configurationConstants.ServiceLocator + '/services');
    }

}



class ConfigurationResource {

    static $inject = ['$resource', 'ServiceLocator'];

    constructor(private $resource: angular.resource.IResourceService, private ServiceLocator: any) {
    }

    getConfigurationResource() {
        return this.$resource(this.ServiceLocator + '/services');
    }

}

angular.module('chipster-resource').service('ConfigurationResource', ConfigurationResource);


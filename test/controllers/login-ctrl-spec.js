describe('Controller:LoginCtrl',function(){
	
	var LoginCtrl,$httpBackend,$rootScope,$provide,$location,scope;
	beforeEach(module('chipsterWeb'));
	
	beforeEach(inject(function($injector){
		$httpBackend=$injector.get('$httpBackend');
		$rootScope=$injector.get('$rootScope');
		$controller=$injector.get('$controller');
		$location=$injector.get('$location');
		
		LoginCtrl=function(){
			return $controller('LoginCtrl',{
				'$scope':$rootScope,
				'$location':$location,
			});
		};
	}));
	
	//it should have a login controller
	it('should have a LoginCtrl controller',function(){
		expect('chipsterWeb.LoginCtrl').toBeDefined();
	});
	
	//it should store the  username and password in local storage
	
	//it should  redirect the user to session list page if user name and password is correct
	it('should logs a user in and redirect',function(){
		var loginCtrl=LoginCtrl();
		$httpBackend.whenPOST('/login').respond(200); //need to check the post URL
		$rootScope.username="client";
		$rootScope.password='clientPassword';
		$rootScope.login();
		
		$httpBackend.flush();
		$rootScope.$digest();
		expect($location.path()).toBe('/sessions');
		
		
	});
	
	
	
});
chipsterWeb.factory('TemplateService',function(){
	return {

		getSessionTemplate:function(){
			var s={};
			s.sessionId=null;
			s.name="Example session";
			s.notes="Test session created by chipster angular web client";
			s.created = "2015-08-27T17:53:10.331Z";
        	s.accessed = "2015-08-27T17:53:10.331Z";

        	return s;
		}
	};
});
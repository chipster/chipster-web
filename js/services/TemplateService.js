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
		},

		getDatasetTemplate:function(){
			var d={};
			d.datasetId=null;
			d.name="Raw input data";
			d.x=100;
			d.y=100;
			d.sourceJob="163c6fd2-ceb4-42eb-bdf6-c7625fc3992a";
        	return d;
		},

		//creating a random ID
		getRandomFileID:function(){
			var d = new Date().getTime();
		    return uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
		        var r = (d + Math.random()*16)%16 | 0;
		        d = Math.floor(d/16);
		        return (c=='x' ? r : (r&0x3|0x8)).toString(16);
		    });
		}
	};
});
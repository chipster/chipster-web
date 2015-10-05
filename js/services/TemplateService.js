chipsterWeb.factory('TemplateService',function($rootScope){
	return {

		getSessionTemplate:function(){
			var s={};
			s.sessionId=null;
			s.name="Example session";
			s.owner="me";
			s.notes="Example session created by chipster web clinet";
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
			d.sourceJob="j163c6fd2-ceb4-42eb-bdf6-c7625fc3992a";
			d.fileId = "3c2806ed-ed94-42d1-bda9-542947f669ac";
        	d.size = 0;
        	d.checksum = "xyz";
        	return d;
		},

		getJobTemplate:function(){
			var j={};
			j.jobId=null;
			j.toolId="sort.py";
			j.state="COMPLETED";
			j.toolCategory="Utilities";
			j.toolName="Sort file";
			j.toolDescription="Imaginary sort tool for chipster web client";
			j.startTime = "2015-08-27T17:53:10.504Z";
        	j.endTime = "2015-08-27T17:53:10.503Z";

        	j.parameters=[];
        	var p1={};
        	p1.parameterId="sortCol";
        	p1.displayName="Sort column";
        	p1.description="Sort the file according to the column";
        	p1.type="STRING";
        	p1.value="chr";

        	j.parameters.push(p1);

        	var p2={};
        	p2.parameterId="order";
        	p2.displayName="Sort Order";
        	p2.description="Ascending or descending";
        	p2.type="STRING";
        	p2.value="asc";

        	j.parameters.push(p2);


        	
        	j.inputs = [];
	        var i1 = {};
	        i1.inputId = "inFile";
	        i1.displayName = "Input file";
	        i1.description = "File to sort";
	        i1.type = "GENERIC";
	        i1.datasetId = "187b16a1-99f1-42fd-a56e-5cb2f585a1d6";
	        j.inputs.push(i1);

	        var i2 = {};
	        i2.inputId = "extraFile";
	        i2.displayName = "Extra file";
	        i2.description = "Useless extra file";
	        i2.type = "GENERIC";
	        i2.datasetId = "187b16a1-99f1-42fd-a56e-5cb2f585a1d6";
	        j.inputs.push(i2);

	        return j;





		},

		getWorflowNodeTemplate:function(){
			var node={};

            node.name= "";
            node.group=0;
            node.c_id=0;
            node.level=0;

            return node;
                
		},

		getWorkflowLinkTemplate:function(){

		}


		
	};
});
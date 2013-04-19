var fs = require('fs');

var data = fs.readFileSync('./policies/policy.xml.save');
fs.writeFileSync('./policies/policy.xml', data);

data = fs.readFileSync('./policies/man-policy.xml.save');
fs.writeFileSync('./policies/man-policy.xml', data);

var pelib = require('./policyeditor3.js');
var pe = new pelib.policyEditor3();


 var matches = {
 	"subject-match" : 
 		[ 	{"$" : {"attr" : "api-feature", "match" : "http://webinos.org/api/nfc"}} 
 			,
 			{"$" : {"attr" : "api-feature", "match" : "http://webinos.org/api/sensor"}}
 		]
 };

var params = {
	"params" : 
		[
			{"$" : {"attr" : "param:path", "match" : "/home/glatorre/shared"}} 
		]
};

 var updated_matches = {
 	"subject-match" : 
 		[ 	{"$" : {"attr" : "api-feature", "match" : "http://webinos.org/api/pippo"}} 
 			,
 			{"$" : {"attr" : "api-feature", "match" : "http://webinos.org/api/pluto"}}
 		]
 };

//console.log(JSON.stringify(ps.getSubjects("p000002")));

var condition = //[
					{
						"$":{"id":"cond2", "combine":"or"},
						"resource-match":[
							{"$":{"attr":"api-feature", "match":"minnie"}},
							{"$":{"attr":"api-feature", "match":"topolino"}}
						]
					};
				//];

var condition2 = 
				{
					"$":{"id":"cond3", "combine":"and"},
					"resource-match":[
						{"$":{"attr":"api-feature", "match":"nonno"}},
						{"$":{"attr":"api-feature", "match":"nanni"}}
					]
				};				


pe.getPolicySets(succCB);

function succCB(sets){
	var ps = sets[0];
	console.log(ps.toJSONString());
	ps.addPolicy("p1","permit-overrides","descr di p1",0, 
		function(policy){
			policy.addSubject("sub1", matches);
			pe.save(policy);
		}
	);
	
}

//var p1 = ps.createPolicy("p1","permit-overrides","descr di p1");
//ps.addPolicy(p1);
//var p1 = ps.getPolicy("p1");
//console.log(p1.toString());
//p1.addSubject("sub1", matches);
//p1.updateSubject("sub1",updated_matches);
//p1.addRule("rule2", "deny", null);
//p1.addRule("rule 3", "permit", condition2);
//p1.updateRule("rule1", condition2);
//p1.removeRule("rule1");

//pe.save(ps);


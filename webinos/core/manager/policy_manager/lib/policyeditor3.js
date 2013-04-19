(function () {
    'use strict';

    var fs = require('fs');
    var xml2js = require('xml2js');
    var convert2xml = require('data2xml')({attrProp:'$'});
    var path = require('path');
    var dependencies= require('find-dependencies')(__dirname);
    //var webinosPath = dependencies.local.require(dependencies.local.pzp.location).getWebinosPath();
    var webinosPath = '.';

    var userPolicyFile = path.join(webinosPath,'policies', 'policy.xml');
    var manufacturerPolicyFile = path.join(webinosPath,'policies', 'man-policy.xml');
    var decisionPolicyFile = path.join(webinosPath,'policies', 'decisionpermanent.xml');
    var appPolicyFiles = new Array();
    var decisionsessionPolicyFiles = new Array();


    var policy = function(ps, id, combine, description){
        
        var _ps = ps;
        if(ps)
            _ps = ps;
        else{
            _ps = {};
            _ps['$'] = {};
            _ps['$']["id"] = (id) ? id : getNewId();
        }

        if(combine)
            _ps['$']["combine"] = combine;
        if(description)
            _ps['$']["description"] = description;

        function getNewId(type) {
            return new Date().getTime();
        };

        this.getInternalPolicy = function(){
            return _ps;
        };

        this.updateRule = function(ruleId, updatedCondition){
            if(!_ps) {
                return null;
            }

//            if(effect != 'permit' && effect != 'prompt-oneshot' && effect != 'prompt-session' && effect != 'prompt-blanket' && effect != 'deny') {
//                effect = "";
//            }

            //console.log("Effect :: "+effect);
            var policy = _ps;
            var rule;
            var count=0;
            for(var i in policy["rule"]) {
                if(policy["rule"][i]['$']["id"] == ruleId) {
                    rule = policy["rule"][i];
                    break;
                }
                count++;
            }

            if(rule){
                if(!rule.condition){
                    console.log("No condition");
                    rule["condition"][0] = updatedCondition;
                }
                else{

                    //check first child
                    var parent = rule["condition"];
                    var tmp = parent[0];
                    if(tmp['$']["id"] == updatedCondition['$']["id"]){
                        parent[0] = updatedCondition;
                        return;
                    }

                    //check other children
                    while(true){
                        if(tmp.condition){
                            if(tmp.condition[0]['$']["id"] == updatedCondition['$']["id"]){
                                tmp.condition[0] = updatedCondition;
                                return;
                            }
                            else
                                tmp = tmp.condition;
                        }
                        else
                            break;
                    }
                }
            }
        }

        this.addRule = function(newRuleId, effect, newCondition, rulePosition){
            if(!_ps) {
                return null;
            }

            //Check if effect is valid value (deny is included in default rule)
            if(effect != 'permit' && effect != 'prompt-oneshot' && effect != 'prompt-session' && effect != 'prompt-blanket' && effect != 'deny') {
                effect = "permit";
            }

            //console.log("Effect :: "+effect);
            var policy = _ps;

            var rule;
            for(var i in policy['rule']) {
                if(policy['rule'][i]['$']['effect'] == effect) {
                    rule = policy['rule'][i];
                    break;
                }
            }
            //console.log("rule :: "+rule);

            if(!rule){
                var id = (newRuleId) ? newRuleId : new Date().getTime();
                rule = {"$": {"id" : id, "effect" : effect}};
                var position = 0;
                if(rulePosition && (rulePosition<0 || policy["rule"].length == 0))
                    policy["rule"].length;
                if(!rulePosition && policy["rule"])
                    position = policy["rule"].length;
                
                console.log("position : "+position);
                if(!policy["rule"])
                    policy["rule"] = [rule];
                else    
                    policy["rule"].splice(position, 0, rule);
            }

            if(newCondition){
                if(!rule.condition){
                    console.log("No condition");
                    rule["condition"] = [newCondition];
                }
                else{
                    var tmp = rule["condition"][0];
                    while(true){
                        if(tmp.condition){
                            tmp = tmp.condition[0];
                        }
                        else
                            break;
                    }

                    tmp["condition"] = [newCondition];
                }
            }
        };

        this.removeRule = function(ruleId) {
            if(!_ps) {
                return null;
            }
            if(ruleId == null) {
                return null;
            }

            var policy = _ps;

            //console.log("PRE : " + JSON.stringify(policy["rule"]));
            if(policy["rule"]){
                var index = -1;
                for(var i in policy["rule"]){
                    if(policy["rule"][i]["$"]["id"] && policy["rule"][i]["$"]["id"] == ruleId){
                        index = i;
                        break;
                    }
                }
                if(index != -1){
                    console.log("Removing rule " + index);
                    policy["rule"].splice(index,1);
                }
                
            }
            else
                console.log("No rules");
        };

        this.addSubject = function(newSubjectId, matches, policyId){
            if(!_ps) {
                return null;
            }

            //var policy = (policyId) ? getPolicyById(_ps, policyId) : _ps;
            var policy = _ps;

            if(policy == null) {
                return null;
            }
           
            var id = (newSubjectId) ? newSubjectId : new Date().getTime();
            var newsubj = {"$" : {"id" : id} , "subject-match" : [] };
        
            for(var i in matches){
                if(i == "subject-match")
                    newsubj["subject-match"].push(matches[i]);
            }

            if(!policy.target)
                policy.target = [{}];
            if(!policy.target[0]["subject"])
                policy.target[0]["subject"] = [];

            //console.log(JSON.stringify(policy.target[0]));
            policy.target[0]["subject"].push(newsubj);
            //console.log(JSON.stringify(policy.target[0]));

        };

        this.getSubjects = function(policyId){
            if(!_ps) {
                return null;
            }

            var policy = (policyId) ? getPolicyById(_ps, policyId) : _ps;

            if(policy == null) {
                return null;
            }
            var subjects = policy.target[0]["subject"];

            return subjects;
        };

        this.removeSubject = function(subjectId) {
            if(!_ps) {
                return null;
            }
            /*
            if(policyId == null) {
                return;
            }*/

            //var policy = (policyId) ? getPolicyById(_ps, policyId) : _ps;
            var policy = _ps;
            
            //console.log(policy);

            var count = 0;

            if(policy.target && policy.target[0] && policy.target[0]["subject"]){
                var index = -1;
                for(var i in policy.target[0]["subject"]){
                    console.log(policy.target[0]["subject"][i]["$"]["id"]);
                    if(policy.target[0]["subject"][i]["$"]["id"] && policy.target[0]["subject"][i]["$"]["id"] == subjectId){
                        index = i;
                        //break;
                    }
                    count++;
                }
                if(index != -1){
                    console.log("remove "+index);
                    policy.target[0]["subject"].splice(index,1);
                }
                if(count == 1)
                policy.target = [];
            }
            //console.log("AFTER : " + JSON.stringify(policy["rule"]));
        };

        this.updateSubject = function(subjectId, matches){
            if(!_ps) {
                return null;
            }

            //var policy = (policyId) ? getPolicyById(_ps, policyId) : _ps;
            var policy = _ps;

            if(policy == null) {
                return null;
            }
            if(policy.target && policy.target[0] && policy.target[0]["subject"]){
                var subjects = policy.target[0]["subject"];
                for(var i in subjects){
                    if(subjects[i]['$']["id"] == subjectId)
                        subjects[i]["subject-match"] = matches["subject-match"];
                }
            }
        };

        this.updateAttributes = function(policyId, combine, description){
            if(policyId)
                _ps['$']["id"] = policyId;
            if(combine)
                _ps['$']["combine"] = combine;
            if(description)
                _ps['$']["description"] = description;
        };

        this.toJSONString = function(){
            return JSON.stringify(_ps);
        };
    };

    var policyset = function(ps ,type, basefile, fileId, id, combine, description){
    	var _type = type;
    	var _basefile = basefile;
        var _fileId = fileId;

		var _parent;

        //var id = (newSubjectId) ? newSubjectId : new Date().getTime();
        var _ps = ps;
        if(ps)
            _ps = ps;
        else{
            _ps = {};
            _ps['$'] = {};
            _ps['$']["id"] = (id) ? id : getNewId();
        }

        if(combine)
            _ps['$']["combine"] = combine;
        if(description)
            _ps['$']["description"] = description;
        
        this.getBaseFile = function(){
            return _basefile;
        };

        this.getFileId = function(){
            return _fileId;
        };

    	function getNewId(type) {
            return new Date().getTime();
        }

		function getPolicyById(policySet, policyId) {
            //TODO: if the attribute id of the policy/policy-set is not defined, the function will crash
            //console.log('getPolicyById - policySet is '+JSON.stringify(policySet));
            if(policyId == null || policySet['$']['id'] == policyId) {
                return policySet;
            }
            if(policySet['policy']) {
                for(var j in policySet['policy']) {
                    if(policySet['policy'][j]['$']['id'] == policyId) {
                        return policySet['policy'][j];
                    }
                }
            }
            if(policySet['policy-set']) {
                for(var j in policySet['policy-set']) {
                    if(policySet['policy-set'][j]['$']['id'] == policyId) {
                        return policySet['policy-set'][j];
                    }
                    var tmp = getPolicyById(policySet['policy-set'][j], policyId);
                    if(tmp != null) {
                        return tmp;
                    }
                }
            }
            return null;
        };

        function getPolicySetById(policySet, policyId) {
            //TODO: if the attribute id of the policy/policy-set is not defined, the function will crash
            //console.log('getPolicyById - policySet is '+JSON.stringify(policySet));
            
            if(policySet['policy-set']) {
                for(var j in policySet['policy-set']) {
                    if(policySet['policy-set'][j]['$']['id'] == policyId) {
                        return policySet['policy-set'][j];
                    }
                    var tmp = getPolicyById(policySet['policy-set'][j], policyId);
                    if(tmp != null) {
                        return tmp;
                    }
                }
            }
            return null;
        };

        this.removeSubject = function(subjectId, policyId) {
            if(!_ps) {
                return null;
            }
            if(policyId == null) {
                return;
            }

            //var policy = (policyId) ? getPolicyById(_ps, policyId) : _ps;
            var policy = _ps;
            
            //console.log(policy);

            if(policy.target[0]["subject"]){
                var index = -1;
                for(var i in policy.target[0]["subject"]){
                    console.log(policy.target[0]["subject"][i]["$"]["id"]);
                    if(policy.target[0]["subject"][i]["$"]["id"] && policy.target[0]["subject"][i]["$"]["id"] == subjectId){
                        index = i;
                        break;
                    }
                }
                if(index != -1){
                    console.log("remove "+index);
                    policy.target[0]["subject"].splice(index,1);
                }
            }
            //console.log("AFTER : " + JSON.stringify(policy["rule"]));
        };


        function removePolicySetById(policySet, policySetId) {
            if(policySet['policy-set']) {
                for(var j in policySet['policy-set']) {
                    if(policySet['policy-set'][j]['$']['id'] == policySetId) {
                        policySet['policy-set'].splice(j, 1);
                        return true;
                    }
                    if(removePolicyById(policySet['policy-set'][j], policyId)) {
                        return true;
                    }
                }
            }
            return false;
        }

        function removePolicyById(policySet, policyId) {
            //console.log('removePolicyById - id is '+policyId+', set is '+JSON.stringify(policySet));
            if(policySet['policy']) {
                for(var j in policySet['policy']) {
                    if(policySet['policy'][j]['$']['id'] == policyId) {
                        policySet['policy'].splice(j, 1);
                        return true; 
                    }
                }
            }
            if(policySet['policy-set']) {
                for(var j in policySet['policy-set']) {
                    if(policySet['policy-set'][j]['$']['id'] == policyId) {
                        policySet['policy-set'].splice(j, 1);
                        return true;
                    }
                    if(removePolicyById(policySet['policy-set'][j], policyId)) {
                        return true;
                    }
                }
            }
            return false;
        }

    	this.getInternalPolicySet = function(){
    		return _ps;
    	};

        //this.createPolicy = function(policyId, combine, description){
        function createPolicy(policyId, combine, description){
            return new policy(null, policyId, combine, description);
        };

        //this.createPolicySet = function(policySetId, combine, description){
        function createPolicySet(policySetId, combine, description){
            return new policyset(null, policySetId, _basefile, _fileId, policySetId, combine, description);
        };


//    	this.addPolicy = function(newPolicy, newPolicyPosition){
        this.addPolicy = function(policyId, combine, description, newPolicyPosition, succCB){
            var newPolicy = createPolicy(policyId, combine, description);
			if(!_ps) 
                return null;
            
            if(!_ps["policy"])
                _ps["policy"] = new Array();

            var position = (newPolicyPosition == undefined || newPolicyPosition<0 || _ps["policy"].length == 0) ? _ps["policy"].length : newPolicyPosition;
            _ps['policy'].splice(position, 0, newPolicy.getInternalPolicy());
            succCB(newPolicy);
            
    	};

        //this.addPolicySet = function(newPolicySet, newPolicySetPosition){
        this.addPolicySet = function(policySetId, combine, description, newPolicySetPosition){
            var newPolicySet = createPolicySet(policySetId, combine, description);
            if(!_ps) 
                return null;
            
            if(!_ps["policy-set"])
                _ps["policy-set"] = new Array();

            var position = (newPolicySetPosition == undefined || newPolicySetPosition<0 || _ps["policy-set"].length == 0) ? _ps["policy-set"].length : newPolicySetPosition;
//            var position = (!newPolicySetPosition || _ps["policy-set"].length == 0) ? 0 : newPolicySetPosition;

            _ps['policy-set'].splice(position, 0, newPolicySet.getInternalPolicySet());
            
        };

		

        // add subject to policyset
		this.addSubject = function(newSubjectId, matches){
			if(!_ps) {
                return null;
            }

            //var policy = (policyId) ? getPolicyById(_ps, policyId) : _ps;
            var policy = _ps;

            if(policy == null) {
                return null;
            }
           
			var id = (newSubjectId) ? newSubjectId : new Date().getTime();
			var newsubj = {"$" : {"id" : id} , "subject-match" : [] };
		
			for(var i in matches){
				if(i == "subject-match")
					newsubj["subject-match"].push(matches[i]);
			}
            if(!policy.target)
                policy.target = [{}];

			if(!policy.target[0]["subject"])
				policy.target[0]["subject"] = [];

			//console.log(JSON.stringify(policy.target[0]));
            policy.target[0]["subject"].push(newsubj);
            //console.log(JSON.stringify(policy.target[0]));

    	};

    	this.getPolicy = function(policyId, succCB, errCB){
    		if(policyId){
                var tmp = getPolicyById(_ps, policyId);
                if(tmp){
                    //return new policy(tmp);
                    succCB(new Policy(tmp));
                    return;
                }
            }
            errCB();
    	};

        this.getPolicySet = function(policySetId, succCB, errCB){
            if(policySetId){
                var tmp = getPolicySetById(_ps, policySetId);
                if(tmp){
                    //return new policyset(tmp, "policy-set", _basefile, _fileId);
                    succCB(new policyset(tmp, "policy-set", _basefile, _fileId));
                }
            }
            errCB();
        };

        this.getSubjects = function(policyId){
            if(!_ps) {
                return null;
            }

            var policy = (policyId) ? getPolicyById(_ps, policyId) : _ps;

            if(policy == null) {
                return null;
            }
            var subjects = policy.target[0]["subject"];

            return subjects;
        };


        this.updateSubject = function(subjectId, matches, policyId){
            if(!_ps) {
                return null;
            }

            //var policy = (policyId) ? getPolicyById(_ps, policyId) : _ps;
            var policy = _ps;

            if(policy == null) {
                return null;
            }
            
            if(policy.target && policy.target[0] && policy.target[0]["subject"]){
                var subjects = policy.target[0]["subject"];
                for(var i in subjects){
                    console.log(subjects[i]['$']["id"]);
                    if(subjects[i]['$']["id"] == subjectId)
                        subjects[i]["subject-match"] = matches["subject-match"];
                }
            }
        };

    	this.removePolicy = function(policyId){
            if(!_ps) {
                return null;
            }
            if(policyId == null) {
                return;
            }
            removePolicyById(_ps, policyId);
    	};

        this.removePolicySet = function(policySetId){
            if(!_ps) {
                return null;
            }
            if(policySetId == null) {
                return;
            }
            removePolicySetById(_ps, policySetId);
        };

    	

        this.removeSubject = function(subjectId) {
            if(!_ps) {
                return null;
            }
            /*
            if(policyId == null) {
                return;
            }*/

            //var policy = (policyId) ? getPolicyById(_ps, policyId) : _ps;
            var policy = _ps;
            
            //console.log(policy);

            var count = 0;

            if(policy.target && policy.target[0] && policy.target[0]["subject"]){
                var index = -1;
                for(var i in policy.target[0]["subject"]){
                    console.log(policy.target[0]["subject"][i]["$"]["id"]);
                    if(policy.target[0]["subject"][i]["$"]["id"] && policy.target[0]["subject"][i]["$"]["id"] == subjectId){
                        index = i;
                        //break;
                    }
                    count++;
                }
                if(index != -1){
                    console.log("remove "+index);
                    policy.target[0]["subject"].splice(index,1);
                }
                if(count == 1)
                policy.target = [];
            }
            //console.log("AFTER : " + JSON.stringify(policy["rule"]));
        };

        this.updateAttributes = function(policySetId, combine, description){
            if(policySetId)
                _ps['$']["id"] = policySetId;
            if(combine)
                _ps['$']["combine"] = combine;
            if(description)
                _ps['$']["description"] = description;
        };

    	this.toJSONString = function(){
    		return JSON.stringify(_ps);
    		//return "ID : " + _id + ", DESCRIPTION : " + _ps.$.description + ", PATH : " + _basefile;
    	}
    }

    var policyEditor3 = function() {

    	var policyFiles = new Array();
    	var xmlParser = new xml2js.Parser(xml2js.defaults['0.2']);


        function addType(policySet) {
            if(policySet['policy']) {
                for(var i in policySet['policy']) {
                    policySet['policy'][i]['$']['type'] = 'policy';
                }
            }
            if(policySet['policy-set']) {
                for(var i in policySet['policy-set']) {
                    policySet['policy-set'][i]['$']['type'] = 'policy-set';
                    policySet['policy-set'][i] = addType(policySet['policy-set'][i]);
                }
            }
            return policySet;
        };

        function removeType(policySet) {
            var result = policySet;
            delete result['$']['type'];
            if(result['policy']) {
                for(var i in result['policy']) {
                    delete result['policy'][i]['$']['type'];
                }
            }
            if(result['policy-set']) {
                for(var i in result['policy-set']) {
                    removeType(result['policy-set'][i]);
                }
            }
            return result;
        };

        function load(policyRootPath){
	        //init list of available policy files; this list should be updated every time a funcion
	        //is called since some policy files may be added or deleted (app policies or session decision policies)
	        policyFiles.push({'path': manufacturerPolicyFile, 'desc': 'Manufacturer policy', 'content': null});
	        readFileContent(0);
            //readFileContent(manufacturerPolicyFile);
	        policyFiles.push({'path': userPolicyFile, 'desc': 'User policy', 'content': null});
	        readFileContent(1);
            //readFileContent(userPolicyFile);
	        policyFiles.push({'path': decisionPolicyFile, 'desc': 'Permanent decision', 'content': null});
	        readFileContent(2);
            //readFileContent(decisionPolicyFile);
        }

		function readFileContent(fileId) {
            var result = null;
            var xmlPolicy = fs.readFileSync(policyFiles[fileId].path);
            //TODO: it is not clear why parseString ends in a sync way...
            xmlParser.parseString(xmlPolicy, function(err, data) {
                result = data['policy-set'];
            });
            //Adds type (policy or policy-set
            result['$']['type'] = 'policy-set';
            //result = addType(result);
            policyFiles[fileId].content = result;
        }


    	this.getPolicySets = function(success, error){
    		if(!policyFiles || policyFiles.length == 0)
    			load();
    		var sets = new Array();
    		sets.push( new policyset(policyFiles[0].content, "policy-set", policyFiles[0].path, 0));
    		sets.push( new policyset(policyFiles[1].content, "policy-set", policyFiles[1].path, 1));
    		//return sets;
            success(sets);

    	};

    	this.getPolicySet = function(policyset_id, success, error){
    		if(!policyFiles || policyFiles.length == 0)
    			load();
    		//return new policyset(policyFiles[policyset_id].content, "policy-set", policyFiles[policyset_id].path);
            success(new policyset(policyFiles[policyset_id].content, "policy-set", policyFiles[policyset_id].path));
    	};

        this.save = function(policyset){
            var policy2save = policyFiles[policyset.getFileId()].content;//removeType(policyset);
            var data = convert2xml('policy-set', policy2save);
            fs.writeFileSync(policyset.getBaseFile(), data);
        };

    	this.getPolicyIds = function(policyset_id){};

    }

    exports.policyEditor3 = policyEditor3;
}());


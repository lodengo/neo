var async = require('async');
var math = require('mathjs')();

var neo4j = require('neo4j');
var db = new neo4j.GraphDatabase('http://localhost:7474');

function array_unique(arr) {
	var a = [];
    var l = arr.length;
    for(var i=0; i<l; i++) {
      for(var j=i+1; j<l; j++) {
        // If this[i] is found later in the array
        if (arr[i] === arr[j])
          j = ++i;
      }
      a.push(arr[i]);
    }
    return a;
};

math.import({
	sum: function(args){		
		var total = 0;
		var argsArray = arguments;
		Object.keys(argsArray).forEach(function(key){total += argsArray[key];});
		return total;
	}
});

var Cost = require("./cost.js");
var Fee = require("./fee.js");

var refFuncs = ['f', 'c', 'cf', 'ccf'];
var refReg = new RegExp(refFuncs.join('\\([^\\)]*\\)|')+'\\([^\\)]*\\)', 'g');

var Calc = module.exports = function Calc(fee) {	
	this._fee = fee;	
	this._cost = fee._cost;
}

Calc.prototype.visit = function(callback){
	var me = this;	
	var feeExpr = me._fee.feeExpr; 
	var matches = feeExpr.match(refReg) || [];
	
	async.each(matches, function(str, cb){
		var i = str.indexOf("(");
		if(i != -1 && str[str.length-1] == ')'){
			var func = str.substr(0, i);
			var args = str.substr(i+1, str.length-i-2).split(',');
			
			args.push(function(err, result){
				feeExpr = feeExpr.replace(str, result);
				cb(null);
			});
			
			me[func].apply(me, args); 	
		}else{
			feeExpr = feeExpr.replace(str, 0);
			cb(null);
		}		
	}, function(err){ 		
		var feeResult = math.eval(feeExpr); 
		console.log([me._fee.feeName, feeExpr, feeResult]);
		me._fee.feeResult = feeResult.toFixed(2);
		me._fee.save(function(err){callback(err, feeResult);});		
	});
}

Calc.prototype.cf = function(feeName, callback){	
	this._cost.fee(feeName, function(err, fees){
		if(fees && fees.length > 0){
			var fee = fees[0];
			var value = fee.feeResult;
			callback(null, value);
		}else{
			callback(null, 0);
		}
	});		
}

Calc.prototype.f = function(pName, callback){
	var value = this._fee._node.data[pName];
	callback(null, value);
}

Calc.prototype.c = function(pName, callback){	
	var value = this._cost._node.data[pName];
	callback(null, value);
}

Calc.prototype.ccf = function(costType, feeName, callback){
	this._cost.childFees(costType, feeName, function(err, fees){
		async.map(fees, function(fee, cb){
			cb(null, fee.feeResult);
		}, callback);			
	});	
}

Calc.visit = function(node, callback){
	var nodeType = node.data.nodeType;
	if(nodeType == 'fee'){
		var costId = node.data.costId;
		db.getNodeById(costId, function(err, ncost){
			var fee = new Fee(node, new Cost(ncost));
			var calc = new Calc(fee);
			calc.visit(function(err, feeResult){				
				callback(err);
			});
		});
	}else{
		callback(null);
	}
}

Calc.step = function(nodes, callback){	
	var me = this;
	nodes = [].concat(nodes);
	if(nodes.length == 0){
		callback(null);
	}else{
		async.concat(nodes, function(node, cb){		
			me.visit(node, function(err){
				node.getRelationshipNodes({type:'ref', direction: 'in'}, cb);
			});		
		}, function(err, nextNodes){
			me.step(array_unique(nextNodes), callback);
		});
	}
}
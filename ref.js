var neo4j = require('neo4j');
var db = new neo4j.GraphDatabase('http://localhost:7474');
var async = require('async');

var refFuncs = ['f', 'c', 'cf', 'ccf'];
var refReg = new RegExp(refFuncs.join('\\([^\\)]*\\)|')+'\\([^\\)]*\\)', 'g');

var Ref = module.exports = function Ref(cost, fee) {
	this._cost = cost;
	this._fee = fee;
	
	this._refNodeIds = [];
}

Ref.prototype.genRef = function(callback){
	var me = this;
	var feeExpr = me._fee.feeExpr;
	var matches = feeExpr.match(refReg) || [];
	
	async.each(matches, function(str, cb){
		var i = str.indexOf("(");
		if(i != -1 && str[str.length-1] == ')'){
			var func = str.substr(0, i);
			var args = str.substr(i+1, str.length-i-2).split(',');
			args.push(cb);
			me[func].apply(me, args); 	
		}else{
			cb(null);
		}
	}, function(err){		
		callback(err);
	});
}

Ref.prototype.cf = function(fName, callback){	
	var me = this;
	me._cost.fee(feeName, function(err, fees){		
		async.each(fees, function(fee, cb){
			if(me._refNodeIds.indexOf(fee.id) == -1){
				me._refNodeIds.push(fee.id);
				console.log([me._fee.id, '-[:ref]->', fee.id])
				me._fee.ref(fee, cb);				
			}else{
				cb(null);
			}
		}, function(err){
			callback(null);
		});
	});
}

Ref.prototype.f = function(pName, callback){
	callback(null);
}

Ref.prototype.c = function(pName, callback){	
	var me = this;
	if(me._refNodeIds.indexOf(me._cost.id) == -1){
		me._refNodeIds.push(me._cost.id);
		console.log([this._fee.id, '-[:ref]->', me._cost.id])
		me._fee.ref(me._cost, callback);
	}
	else{
		callback(null);
	}
}

Ref.prototype.ccf = function(costType, feeName, callback){
	var me = this;
	me._cost.childFees(costType, feeName, function(err, fees){
		async.each(fees, function(fee, cb){
			if(me._refNodeIds.indexOf(fee.id) == -1){
				me._refNodeIds.push(fee.id);
				console.log([me._fee.id, '-[:ref]->', fee.id])
				me._fee.ref(fee, cb);				
			}else{
				cb(null);
			}
		}, function(err){
			callback(null);
		});
	});	
}
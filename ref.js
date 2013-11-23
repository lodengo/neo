var neo4j = require('neo4j');
var db = new neo4j.GraphDatabase('http://localhost:7474');
var async = require('async');

var refFuncs = ['f', 'c', 'cf', 'ccf'];
var refReg = new RegExp(refFuncs.join('\\([^\\)]*\\)|')+'\\([^\\)]*\\)', 'g');

var Ref = module.exports = function Ref(fee) {	
	this._fee = fee;	
}

Ref.prototype.refNodesByExpr = function(callback){
	var me = this;
	var feeExpr = me._fee.feeExpr;
	var matches = feeExpr.match(refReg) || [];
	
	async.concat(matches, function(str, cb){
		var i = str.indexOf("(");
		if(i != -1 && str[str.length-1] == ')'){
			var func = str.substr(0, i);
			var args = str.substr(i+1, str.length-i-2).split(',');
			args.push(cb);
			me[func].apply(me, args); 	
		}else{
			cb(null, []);
		}
	}, callback);
}

Ref.prototype.cf = function(fName, callback){	
	var me = this;
	db.getNodeById(me._fee.costId, function(err, ncost){
		var cost = new Cost(ncost);
		cost.fee(feeName, function(err, fees){
			async.map(fees, function(fee, cb){cb(null, fee.id);}, callback);
		});
	});	
}

Ref.prototype.f = function(pName, callback){
	callback(null, []);
}

Ref.prototype.c = function(pName, callback){	
	callback(null, [this._fee.costId]);
}

Ref.prototype.ccf = function(costType, feeName, callback){
	var me = this;
	db.getNodeById(me._fee.costId, function(err, ncost){
		var cost = new Cost(ncost);
		cost.childFees(costType, feeName, function(err, fees){
			async.map(fees, function(fee, cb){cb(null, fee.id);}, callback);
		});
	});	
}
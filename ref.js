var async = require('async');
var util = require("./util.js");

var Ref = module.exports = function Ref(fee) {	
	this._fee = fee;	
}

Ref.prototype.refNodesByExpr = function(callback){
	var me = this;
	var feeExpr = me._fee.feeExpr;
	var matches = feeExpr.match(util.refReg) || [];
	
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
	}, function(err, nodes){callback(err, nodes.unique());});
}

Ref.prototype.f = function(pName, callback){
	callback(null, []);
}

Ref.prototype.c = function(pName, callback){	
	var costId = this._fee.costId;
	callback(null, [costId]);
}

Ref.prototype.cf = function(feeName, callback){	
	var costId = this._fee.costId;
	util.query(util.refQuery.cf, {costId: costId, feeName:feeName}, callback);		
}

Ref.prototype.cc = function(costType, pName, callback){
	var costId = this._fee.costId;
	util.query(util.refQuery.cc, {costId: costId, type:costType, prop:pName}, callback);	
}

Ref.prototype.ccf = function(costType, feeName, callback){
	var costId = this._fee.costId;
	util.query(util.refQuery.ccf, {costId: costId, type:costType, feeName:feeName}, callback);	
}

Ref.prototype.cs = function(prop, callback){
	var costId = this._fee.costId;
	util.query(util.refQuery.cs, {costId: costId, prop:prop}, callback);	
}

Ref.prototype.csf = function(feeName, callback){
	var costId = this._fee.costId;
	util.query(util.refQuery.csf, {costId: costId, feeName:feeName}, callback);	
}

Ref.prototype.cas = function(prop, callback){
	var costId = this._fee.costId;
	util.query2(util.refQuery.cas, {costId: costId, prop:prop}, function(err, rows){
		for(var i = 0; i < rows.length; i++){
			var row = rows[i];
			if(row.s){
				return callback(null, [costId]);
			}
			else if(row.aa){
				return callback(null, [row.a]);
			}
		}
	});	
}
var async = require('async');
var math = require('mathjs')();
var util = require("./util.js");
var TopoSort = require("./topsort.js");
var Fee = require("./fee.js");	

math.import(util.math_extend);

var Calc = module.exports = function Calc(fee) {	
	this._fee = fee;		
}

Calc.prototype.calc = function(callback){
	var me = this;	
	var feeExpr = me._fee.feeExpr; 
	var matches = feeExpr.match(util.refReg) || [];
	
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
		feeResult = feeResult.toFixed(2);
		console.log(['calc', me._fee.costId, me._fee.id, me._fee.feeName, feeExpr, feeResult]);
		me._fee.feeResult = feeResult;
		util.query2(util.cypher.update_fee_result, {id: me._fee.id, result:feeResult}, callback);		
	});
}

Calc.start = function(ids, callback){
	util.query2(util.cypher.fees_adj, {id: ids}, function(err, rows){
		var fees = rows.map(function(row){return row.fid});
		
		var uvs = rows.map(function(row){
			return {u: row.fid, v: fees.intersect(row.fids)};
		});
		
		var toposort = new TopoSort(uvs);
		fees = toposort.sort();	
		
		if(fees.cycle){
			callback(null);
		}else{
			async.eachSeries(fees.order, function(feeid, cb){
				Fee.get(parseInt(feeid), function(err, fee){
					var calc = new Calc(fee);
					calc.calc(cb);
				});				
			}, callback);			
		}		
	});
}


Calc.prototype.f = function(pName, callback){
	var value = this._fee._node.data[pName];
	callback(null, value);
}

Calc.prototype.c = function(pName, callback){
	var costId = this._fee.costId;
	util.query(util.calcQuery.c, {costId: costId, prop:pName}, function(err, result){
		callback(null, result[0]);
	});
}

Calc.prototype.cf = function(feeName, callback){	
	var costId = this._fee.costId;
	util.query(util.calcQuery.cf, {costId: costId, feeName:feeName}, function(err, result){
		callback(null, result[0]);
	});	
}

Calc.prototype.cc = function(costType, pName, callback){
	var costId = this._fee.costId;
	util.query(util.calcQuery.cc, {costId: costId, type:costType, prop:pName}, callback);	
}

Calc.prototype.ccf = function(costType, feeName, callback){
	var costId = this._fee.costId;
	util.query(util.calcQuery.ccf, {costId: costId, type:costType, feeName:feeName}, callback);	
}

Calc.prototype.cs = function(prop, callback){
	var costId = this._fee.costId;
	util.query(util.calcQuery.cs, {costId: costId, prop:prop}, callback);	
}

Calc.prototype.csf = function(feeName, callback){
	var costId = this._fee.costId;
	util.query(util.calcQuery.csf, {costId: costId, feeName:feeName}, callback);	
}

Calc.prototype.cas = function(prop, callback){
	var costId = this._fee.costId;
	util.query2(util.calcQuery.cas, {costId: costId, prop:prop}, function(err, results){
		if(results && results.length > 0){
			var s = results[0].s;
			var a = results[0].a[0];
			if(s){
				callback(err, s);
			}else{
				callback(err, a);
			}
		}else{
			callback(err, 0);
		}		
	});	
}


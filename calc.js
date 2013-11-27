var async = require('async');
var math = require('mathjs')();
var util = require("./util.js");
var TopoSort = require("./topsort.js");
	
math.import(util.math_extend);

var Cost = require("./cost.js");
var Fee = require("./fee.js");

var Calc = module.exports = function Calc(fee) {	
	this._fee = fee;	
	this._cost = fee._cost;
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
		console.log([me._cost.type, me._fee.feeName, feeExpr, feeResult]);
		me._fee.feeResult = feeResult.toFixed(2);
		me._fee.save(function(err){callback(err, feeResult);});		
	});
}

Calc.prototype.cf = function(feeName, callback){	
	this._cost.feesByName(feeName, function(err, fees){
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
				Cost.getFee(parseInt(feeid), function(err, fee){
					var calc = new Calc(fee);
					calc.calc(cb);
				});				
			}, callback);			
		}		
	});
}

var async = require('async');
var Cost = require("./cost.js");
var Fee = require("./fee.js");
var Calc = require("./calc.js");
var util = require("./util.js");

var Api = module.exports = function Api() {

}

Api._buildRef = function(costId, callback){	
	util.query(util.cypher.cost_fees, {id: costId}, function(err, myfees){
		util.query(util.cypher.parent_ref_fees, {id: costId}, function(err, parentfees){
			util.query(util.cypher.sibling_ref_fees, {id: costId}, function(err, siblingfees){
				util.query(util.cypher.descendant_ref_fees, {id: costId}, function(err, descendantfees){
					var fees = myfees.concat(parentfees, siblingfees, descendantfees);
					fees = fees.unique();
					async.each(fees, function(nfee, cb){
						var fee = new Fee(nfee);
						fee.buildRef(cb);
					}, callback);
				});
			});
		});
	});
}

Api._startCalc = function(id, callback){
	Calc.start(id, callback);
}
//////////////////////////////////////////////////////////
Api.createCost = function(data, fees, parentId, callback) {
	var me = this;
	Cost.create(data, parentId, function(err, cost) {
		async.each(fees, function(fee, cb) {
			cost.createFee(fee, cb);
		}, function(err) {
			callback(err, cost);			
			me._buildRef(cost.id, function(err){
				me._startCalc(cost.id);
			});
		});
	});
}

Api.updateCost = function(id, key, value, callback){
	
}

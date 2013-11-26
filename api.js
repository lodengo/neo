var async = require('async');
var Cost = require("./cost.js");
var Fee = require("./fee.js");
var Calc = require("./calc.js");

var Api = module.exports = function Api() {

}

Api.createCost = function(data, fees, parentId, callback) {
	var me = this;
	Cost.create(data, parentId, function(err, cost) {
		async.each(fees, function(fee, cb) {
			cost.createFee(fee, cb);
		}, function(err) { callback(err, cost);
//			cost.feesMayRef(function(err, fees){ 
//				async.each(fees, function(fee, cb){
//					fee.buildRef(cb);
//				}, function(err){
//					Calc.step(cost._node, function(err){
//						callback(err, cost);
//					});
//				});
//			});
		});
	});
}

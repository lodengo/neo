var async = require('async');
var Cost = require("./cost.js");
var Fee = require("./fee.js");

var Api = module.exports = function Api() {

}

Api.createCost = function(data, fees, parentId, callback) {
	var me = this;
	Cost.create(data, parentId, function(err, cost) {
		async.each(fees, function(fee, cb) {
			Fee.create(fee, cost.id, null, cb);
		}, function(err) {
			cost.feesMayRef(function(err, fees){
				async.each(fees, function(fee, cb){
					fee.buildRef(cb);
				}, function(err){
					callback(err, cost);
				});
			});
		});
	});
}

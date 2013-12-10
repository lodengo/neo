var async = require('async');
var Cost = require("./cost.js");
var Fee = require("./fee.js");
var Calc = require("./calc.js");
var util = require("./util.js");

var Api = module.exports = function Api() {

}

// ////////////////////////////////////////////////////////
Api._flushFees = function(fees, callback) {
	async.map(fees, function(fee, cb) {
		fee.buildRef(function(err, res) {
			cb(err, fee.id);
		});
	}, function(err, ids) {
		Calc.start(ids, function(err, res) {
			callback(err);
		});
	});
}

Api.createCost = function(data, fees, parentId, callback) {
	var me = this;
	Cost.create(data, parentId, function(err, cost) {
		async.each(fees, function(fee, cb) {
			cost.createFee(fee, null, cb);
		}, function(err) {
			cost.feesToFlushOnCreate(function(err, fees) {
				me._flushFees(fees, function(err, res) {
					callback(err, cost);
				});
			});
		});
	});
}

Api.updateCost = function(id, key, value, callback) {
	var me = this;
	Cost.get(id, function(err, cost) {
		cost.update(key, value, function(err, res) {
			cost.feesToFlushOnUpdate(key, value, function(err, fees) {
				me._flushFees(fees, callback);
			})
		})
	});
}

Api.deleteCost = function(id, callback) {
	var me = this;
	Cost.get(id, function(err, cost) {
		cost.feesToFlushOnDelete(function(err, fees) {
			cost.del(function(err, res) {
				me._flushFees(fees, callback);
			});
		});
	});
}

Api.createFee = function(data, costId, parentId, callback) {
	var me = this;
	Cost.get(id, function(err, cost) {
		cost.createFee(data, parentId, function(err, fee) {
			fee.feesToFlushOnCreate(function(err, fees) {				
				me._flushFees(fees, callback);
			});
		});
	});
}

Api.updateFee = function(id, key, value, callback) {
	Fee.get(id, function(err, fee) {
		fee.update(key, value, function(err, res) {
			fee.feesToFlushOnUpdate(key, value, function(err, fees) {				
				me._flushFees(fees, callback);
			});
		})
	});
}

Api.deleteFee = function(id, callback) {
	Fee.get(id, function(err, fee) {
		fee.feesToFlushOnDelete(function(err, fees) {
			fee.del(function(err, res) {
				me._flushFees(fees, callback);
			});
		});
	});
}

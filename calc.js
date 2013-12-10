var async = require('async');
var math = require('mathjs')();
var util = require("./util.js");
var TopoSort = require("./topsort.js");
var Fee = require("./fee.js");
var db = require("./db.js");

math.import(util.math_extend);

var Calc = module.exports = function Calc(fee) {
	this._fee = fee;
}

Calc.prototype.calc = function(callback) {
	var me = this;
	var feeExpr = me._fee.feeExpr;
	var matches = feeExpr.match(util.refReg) || [];

	async.each(matches, function(str, cb) {
		var i = str.indexOf("(");
		if (i != -1 && str[str.length - 1] == ')') {
			var func = str.substr(0, i);
			var args = str.substr(i + 1, str.length - i - 2).split(',');

			args.push(function(err, result) {
				feeExpr = feeExpr.replace(str, result);
				cb(null);
			});

			me[func].apply(me, args);
		} else {
			feeExpr = feeExpr.replace(str, 0);
			cb(null);
		}
	}, function(err) {
		var feeResult = 0;
		try {
			feeResult = math.eval(feeExpr);
			console.log(me._fee.costType + '.' + me._fee.feeName + '='
					+ feeResult);
		} catch (e) {
			feeResult = 0;			
		}
		feeResult = feeResult.toFixed(2);
		me._fee.feeResult = feeResult;
		db.setFeeResult(me._fee.id, feeResult, callback);
	});
}

Calc.start = function(ids, callback) {
	util.query2(util.cypher.fees_adj1, {
		id : ids
	}, function(err, rows) {
		if (err) {
			return callback(null);
		}
		var fees = rows.map(function(row) {
			return row.fid
		});
		util.query2(util.cypher.fees_adj, {
			id : ids
		}, function(err, rows2) {
			fees = fees.concat(rows2.map(function(row) {
				return row.fid
			}));

			var urows = rows.concat(rows2);
			var uvs = urows.map(function(row) {
				return {
					u : row.fid,
					v : fees.intersect(row.fids)
				};
			});

			var toposort = new TopoSort(uvs);
			fees = toposort.sort();

			if (fees.cycle) {
				callback(null);
			} else {
				async.eachSeries(fees.order, function(feeid, cb) {
					Fee.get(parseInt(feeid), function(err, fee) {
						var calc = new Calc(fee);
						calc.calc(cb);
					});
				}, callback);
			}
		});
	});
}

Calc.prototype.f = function(pName, callback) {
	var value = this._fee._node.data[pName];
	callback(null, value);
}

Calc.prototype.c = function(pName, callback) {
	var costId = this._fee.costId;
	db._C(costId, pName, false, callback);
}

Calc.prototype.cf = function(feeName, callback) {
	var costId = this._fee.costId;
	db._CF(costId, feeName, false, callback);
}

Calc.prototype.cc = function(costType, pName, callback) {
	var costId = this._fee.costId;
	db._CC(costId, costType, pName, false, callback);
}

Calc.prototype.ccf = function(costType, feeName, callback) {
	var costId = this._fee.costId;
	db._CCF(costId, costType, feeName, false, callback);
}

Calc.prototype.cs = function(prop, callback) {
	var costId = this._fee.costId;
	db._CS(costId, prop, false, callback);
}

Calc.prototype.csf = function(feeName, callback) {
	var costId = this._fee.costId;
	db._CSF(costId, feeName, false, callback);
}

Calc.prototype.cas = function(prop, callback) {
	var costId = this._fee.costId;
	db._CAS(costId, prop, false, callback);
}

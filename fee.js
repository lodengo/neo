var async = require('async');
var Ref = require("./ref.js");
var util = require("./util.js");

var Fee = module.exports = function Fee(_node) {
	this._node = _node;
}

Object.defineProperty(Fee.prototype, 'id', {
	get : function() {
		return this._node.id;
	}
});

Object.defineProperty(Fee.prototype, 'feeName', {
	get : function() {
		return this._node.data['feeName'];
	}
});

Object.defineProperty(Fee.prototype, 'feeExpr', {
	get : function() {
		return this._node.data['feeExpr'];
	}
});

Object.defineProperty(Fee.prototype, 'feeResult', {
	get : function() {
		return this._node.data['feeResult'];
	},
	set : function(result) {
		this._node.data['feeResult'] = result;
	}
});

Object.defineProperty(Fee.prototype, 'costId', {
	get : function() {
		return this._node.data['costId'];
	}
});

Object.defineProperty(Fee.prototype, 'costType', {
	get : function() {
		return this._node.data['costType'];
	}
});

Fee.prototype.feesToFlushOnCreate = function(callback) {
	var me = this;
	var costId = me.costId;
	var type = me.costType;
	var feeName = me.feeName;
	db.feesToFlushOnFeeCreate(costId, type, feeName, callback);
}

Fee.prototype.feesToFlushOnUpdate = function(key, value, callback) {
	var me = this;
	if (key != 'feeExpr') {
		var feeExpr = fee.feeExpr;
		var regex = 'f\\(' + key + '\\)';
		if (feeExpr.match(regex)) {
			callback(null, [me]);
		}else{
			callback(null, []);
		}
	} else {
		callback(null, [me]);
	}
}

Fee.prototype.feesToFlushOnDelete = function(callback) {
	var me = this;
	me.feesToFlushOnCreate(callback);
}

Fee.prototype.createRefTo = function(toIds, callback) {
	var id = this.id;
	db.createRefTo(id, toIds, callback);
}

Fee.prototype.removeRefsTo = function(toIds, callback) {
	var id = this.id;
	db.removeRefsTo(id, toIds, callback);
}

Fee.prototype.refedToIds = function(callback) {
	var id = this.id;
	db.feeRefedToIds(id, callback);
}

Fee.prototype.refToIdsByExpr = function(callback) {
	var me = this;
	var ref = new Ref(me);
	ref.refToIdsByExpr(function(err, nodes){
		callback(err, nodes);
	});
}

Fee.prototype.buildRef = function(callback) {
	var me = this;
	me.refedToIds(function(err, refedToIds) {
		me.refToIdsByExpr(function(err, refToIdsByExpr){	
			//console.log(['ref', me.costType, me.feeName, refedToIds, refToIdsByExpr]);			
			me.removeRefsTo(refedToIds.diff(refToIdsByExpr), function(err){
				me.createRefTo(refToIdsByExpr.diff(refedToIds), callback);
			});
		});	
	});
}

Fee.prototype.update = function(prop, value, callback) {
	var me = this;
	var id = me.id;
	var hasProp = this._node.data.hasOwnProperty(property);
	var valueNotNull = (value !== undefined) && (value !== null);

	if (hasProp && value == me._node.data[prop]) {// value not change, do
		// nothing
		return callback(null, 0);
	} else {
		if (hasProp && !valueNotNull) { // set exist prop to null => delete that
			// property
			db.deleteProperty(id, prop, callback);
		} else if (valueNotNull) { // value not null, update(hasprop &&
			// oldvalue != value) or create(!hasprop)
			// the property
			if ((!hasProp) || (value != me._node.data[prop])) {
				db.setProperty(id, prop, value, callback);
			}
		}
	}
};

Fee.prototype.del = function(callback) {
	var me = this;
	var id = me.id;
	db.deleteFee(id, callback);
}

Fee.get = function(id, callback) {
	db.getFee(id, function(err, nfee) {
		callback(err, new Fee(nfee))
	});
}

Fee.create = function(data, costId, costType, parentId, callback) {
	db.createFee(data, costId, costType, parentId, callback);
}

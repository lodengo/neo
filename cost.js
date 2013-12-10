var async = require('async');
var util = require("./util.js");
var Fee = require("./fee.js");
var db = require("./db.js");

var Cost = module.exports = function Cost(_node) {
	this._node = _node;
}

Object.defineProperty(Cost.prototype, 'id', {
	get : function() {
		return this._node.id;
	}
});

Object.defineProperty(Cost.prototype, 'type', {
	get : function() {
		return this._node.data['type'];
	}
});

Cost.prototype.feesToFlushOnCreate = function(callback) {
	var me = this;
	var costId = me.id;
	var type = me.type;
	db.feesToFlushOnCostCreate(costId, type, callback);
}

Cost.prototype.feesToFlushOnUpdate = function(key, value, callback) {
	var me = this;
	var costId = me.id;
	var type = me.type;
	db.feesToFlushOnCostUpdate(costId, type, key, callback);
}

Cost.prototype.feesToFlushOnDelete = function(callback) {
	var me = this;
	var costId = me.id;
	var type = me.type;
	db.feesToFlushOnCostDelete(costId, type, callback);
}

Cost.prototype.update = function(prop, value, callback){
	var me = this;
	var id = me.id;
	var hasProp = this._node.data.hasOwnProperty(prop);
	var valueNotNull = (value !== undefined) && (value !== null);
	
	if(hasProp && value == me._node.data[prop]){// value not change, do nothing
		return callback(null, 0);
	}else{
		if(hasProp && !valueNotNull){ //set exist prop to null => delete that property
			db.deleteProperty(id, prop, callback);
		}
		else if(valueNotNull){ //value not null, update(hasprop && oldvalue != value) or create(!hasprop) the property
			if( (!hasProp) || (value != me._node.data[prop]) ){
				db.setProperty(id, prop, value, callback);
			}
		}
	}	
};

Cost.prototype.del = function(callback){
	var me = this;
	var costId = me.id;
	db.deleteCost(costId, callback);
}

Cost.prototype.createFee = function(data, feeParentId, callback){
	var me = this;
	var costId = me.id
	var costType = me.type;
	Fee.create(data, costId, costType, feeParentId, function(err, nfee){
		callback(err, new Fee(nfee));
	});
}

Cost.get = function(id, callback){
	db.getCost(id, function(err, ncost){
		callback(err, new Cost(ncost));
	});	
};

Cost.create = function(data, parentId, callback){
	db.insertCost(data, parentId, function(err, ncost){
		callback(err, new Cost(ncost));
	});	
};






var async = require('async');
var util = require("./util.js");
var Fee = require("./fee.js");

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

Cost.prototype.save = function (callback) {
    this._node.save(callback);
};

Cost.prototype.createFee = function(data, callback){
	var me = this;
	var costId = me._node.id
	Fee.create(data, costId, null, function(err, nfee){
		callback(err, new Fee(nfee));
	});
}

Cost.get = function(id, callback){
	util.query(util.cypher.node_byid, {id: id}, function(err, ncosts){
		if(ncosts && ncosts.length > 0){
			callback(err, new Cost(ncosts[0]));	
		}else{
			callback(err, null);
		}			
	});	
}

Cost.create = function(data, parentId, callback){
	data.nodeType = 'cost';
	if(parentId){
		util.query(util.cypher.create_cost_child, {parentId:parentId, data: data}, function(err, node){
			callback(err, new Cost(node[0]));
		});
	}else{
		util.query(util.cypher.create_node, {data: data}, function(err, node){
			callback(err, new Cost(node[0]));
		});
	}
}






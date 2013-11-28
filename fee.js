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
	set: function (result) {
		this._node.data['feeResult'] = result;
	}
});

Object.defineProperty(Fee.prototype, 'costId', {
	get : function() {
		return this._node.data['costId'];
	}
});

Fee.prototype.save = function (callback) {
    this._node.save(callback);
};

Fee.prototype.refNodes = function(nodeids, callback){	
	var id = this.id;
	util.query2(util.cypher.fee_ref_nodes, {id: id, nodes: nodeids}, callback);	
}

Fee.prototype.unRefNodes = function(nodeids, callback){
	var id = this.id;
	util.query2(util.cypher.fee_unref_node, {id: id, to: nodeids}, callback);	
}

Fee.prototype.refedNodeids = function(callback){
	var id = this.id;
	util.query(util.cypher.fee_refed_nodeids, {id: id}, callback);	
}

Fee.prototype.refNodeidsByExpr = function(callback){
	var me = this;
	var ref = new Ref(me);
	ref.refNodesByExpr(function(err, nodes){
		callback(err, nodes);
	});
}

Fee.prototype.buildRef = function(callback){
	var me = this;
	me.refedNodeids(function(err, refedNodes){ 
		me.refNodeidsByExpr(function(err, refByExpr){
			console.log(['ref', me.costId, me.id, me.feeName, refedNodes, refByExpr]);
			me.unRefNodes(refedNodes.diff(refByExpr), function(err){
				me.refNodes(refByExpr.diff(refedNodes), callback)
			});
		});
	});
}

Fee.get = function(id, callback){
	util.query(util.cypher.node_byid, {id: id}, function(err, nodes){
		if(nodes && nodes.length > 0){
			callback(err, new Fee(nodes[0]));	
		}else{
			callback(err, null);
		}			
	});	
}

Fee.create = function(data, costId, parentId, callback){
	var me = this;
	var childFees = data.fee || [];
	delete data.fee;
	
	data.nodeType = 'fee';
	data.costId = costId;
	
	if(parentId){
		util.query(util.cypher.create_fee_child, {parentId:parentId, data: data}, function(err, node){
			async.each(childFees, function(cfee, cb){me.create(cfee, costId, node[0].id, cb)}, function(err){
				callback(err, node[0]);
			});	
		});
		
	}else{
		util.query(util.cypher.create_cost_fee, {costId:costId, data: data}, function(err, node){
			async.each(childFees, function(cfee, cb){me.create(cfee, costId, node[0].id, cb)}, function(err){
				callback(err, node[0]);
			});	
		});
	}	
}


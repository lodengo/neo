var neo4j = require('neo4j');
var db = new neo4j.GraphDatabase('http://localhost:7474');
var async = require('async');
var Ref = require("./ref.js");

function array_diff(b, a){	
	return b.filter(function(i) {return !(a.indexOf(i) > -1);});
}

var Fee = module.exports = function Fee(_node, cost) {
	this._node = _node;
	this._cost = cost;
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

Fee.prototype.ref = function(costORfee, callback){
	this._node.createRelationshipTo(costORfee._node, 'ref', {}, callback);	
}

Fee.prototype.refNodes = function(nodes, callback){	
	var query = "start me=node({id}), to=node({nodes}) create me-[r:ref]->to  return r";
	var params = {id: this._node.id, nodes: nodes};
	db.query(query, params, callback);
}

Fee.prototype.unRef = function(costORfee, callback){
	var query = "start me=node({id}), to=node({to}) match me-[r:ref]->to delete r return me";
	var params = {id: this._node.id, to: costORfee.id};
	db.query(query, params, callback);
}

Fee.prototype.unRefNodes = function(nodes, callback){
	var query = "start me=node({id}), to=node({to}) match me-[r:ref]->to delete r return me";
	var params = {id: this._node.id, to: nodes};
	db.query(query, params, callback);
}

Fee.prototype.refedNodes = function(callback){
	this._node.getRelationshipNodes({type:'ref', direction: 'out'}, function(err, nodes){
		async.map(nodes, function(node, cb){cb(null, node.id);}, callback);
	});
}

Fee.prototype.refNodesByExpr = function(callback){
	var me = this;
	var costId = me._node.data['costId'];
	db.getNodeById(costId, function(err, cost){		
		var ref = new Ref(me);
		ref.refNodesByExpr(function(err, nodes){
			callback(err, nodes);
		});
	});	
}

Fee.prototype.buildRef = function(callback){
	var me = this;
	me.refedNodes(function(err, refedNodes){ 
		me.refNodesByExpr(function(err, refByExpr){	//console.log(['buildRef', me.feeName, refedNodes, refByExpr]);
			me.unRefNodes(array_diff(refedNodes, refByExpr), function(err){
				me.refNodes(array_diff(refByExpr, refedNodes), callback)
			});
		});
	});
}

Fee.create = function(data, costId, parentId, callback){
	var me = this;
	var childFees = data.fee || [];
	delete data.fee;
	
	data.nodeType = 'fee';
	data.costId = costId;
	
	var nFee = db.createNode(data);	
	nFee.save(function(err){
		nFee.index('fee', 'costId', costId, function(err){});
		nFee.index('fee', 'feeName', data.feeName, function(err){});		
		
		if(parentId){
			db.getNodeById(parentId, function(err, parentFee){
				parentFee.createRelationshipTo(nFee, 'child', {}, function(err, rel){
					async.each(childFees, function(cfee, cb){me.create(cfee, costId, nFee.id, cb)}, function(err){
						callback(err, nFee);
					});					
				});
			});
		}else{
			db.getNodeById(costId, function(err, nCost){
				nCost.createRelationshipTo(nFee, "fee", function(err, rel){
					async.each(childFees, function(cfee, cb){me.create(cfee, costId, nFee.id, cb)}, function(err){
						callback(err, nFee);
					});	
				});				
			});			
		}		
	});
}


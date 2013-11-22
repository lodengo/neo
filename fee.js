var neo4j = require('neo4j');
var db = new neo4j.GraphDatabase('http://localhost:7474');
var async = require('async');

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
	}
});

Object.defineProperty(Fee.prototype, 'costId', {
	get : function() {
		return this._node.data['costId'];
	}
});

Fee.prototype.ref = function(costORfee, callback){
	this._node.createRelationshipTo(costORfee._node, 'ref', {}, callback);	
}

Fee.create = function(data, costId, parentId, callback){
	var me = this;
	var childFees = data.fee || [];
	delete data.fee;
	
	data.nodeType = 'fee';
	data.costId = costId;
	
	var nFee = db.createNode(data);
	var fee = new Fee(nFee);
	nFee.save(function(err){
		nFee.index('fee', 'costId', costId, function(err){});
		nFee.index('fee', 'feeName', data.feeName, function(err){});		
		
		if(parentId){
			db.getNodeById(parentId, function(err, parentFee){
				parentFee.createRelationshipTo(nFee, 'child', {}, function(err, rel){
					async.each(childFees, function(cfee, cb){me.create(cfee, costId, nFee.id, cb)}, function(err){
						callback(err, fee);
					});					
				});
			});
		}else{
			db.getNodeById(costId, function(err, nCost){
				nCost.createRelationshipTo(nFee, "fee", function(err, rel){
					async.each(childFees, function(cfee, cb){me.create(cfee, costId, nFee.id, cb)}, function(err){
						callback(err, fee);
					});	
				});				
			});			
		}		
	});
}


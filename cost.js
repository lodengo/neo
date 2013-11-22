var neo4j = require('neo4j');
var db = new neo4j.GraphDatabase('http://localhost:7474');
var async = require('async');
var Fee = require("./fee.js");
var Ref = require("./ref.js");

var Cost = module.exports = function Cost(_node) {
	this._node = _node;
}

Object.defineProperty(Cost.prototype, 'id', {
	get : function() {
		return this._node.id;
	}
});

Cost.prototype.fees = function(callback){
	var costId = this._node.id;
	db.getIndexedNodes('fee', 'costId', costId, function(err, nfees){
		async.map(nfees, function(nfee, cb){cb(null, new Fee(nfee));}, callback);		
	});
}

Cost.prototype.fee = function(feeName, callback){
	var query = "costId:" + this._node.id + " AND feeName:"+fName;
	db.queryNodeIndex('fee', query, function(err, nfees){
		async.map(nfees, function(nfee, cb){cb(null, new Fee(nfee));}, callback);	
	});		
}

Cost.prototype.child = function(callback){
	this._node.getRelationshipNodes({type:'child', direction: 'out'}, function(err, ncosts){
		async.map(ncosts, function(ncost, cb){cb(null, new Cost(ncost));}, callback);		
	});
}

Cost.prototype.childByType = function(costType, callback){
	var query = 'start n=node({costId}) match n-[:child]->child where child.type="{type}" return child';
	var params = {costId: this._node.id, type:costType};
	db.query(query, params, function(err, ncosts){
		async.map(ncosts, function(ncost, cb){cb(null, new Cost(ncost));}, callback);		
	});
}

Cost.prototype.childFees = function(childType, feeName, callback){
	var query = 'start n=node({costId}) match n-[:child]->child, child-[:fee|child*]->fee where fee.feeName="{name}" and child.type="{type}" return fee';
	var params = {costId: this._node.id, type:childType, name:feeName};
	db.query(query, params, function(err, nfees){
		async.map(nfees, function(nfee, cb){cb(null, new Fee(nfee));}, callback);	
	});
}

Cost.prototype.sibling = function(callback){
	var query = "start n=node({costId}) match parent-[:child]->n, parent-[:child]->child where child <> n return child";
	var params = {costId: this._node.id};
	db.query(query, params, function(err, ncosts){
		async.map(ncosts, function(ncost, cb){cb(null, new Cost(ncost));}, callback);		
	});
}

Cost.prototype.parent = function(callback){
	this._node.getRelationshipNodes({type:'child', direction: 'in'}, function(err, ncosts){
		async.map(ncosts, function(ncost, cb){cb(null, new Cost(ncost));}, callback);		
	});
}

Cost.prototype.ancestor = function(callback){
	var query = "start n=node({costId}) match n<-[:child*]-ancestor return ancestor";
	var params = {costId: this._node.id};
	db.query(query, params, function(err, ncosts){
		async.map(ncosts, function(ncost, cb){cb(null, new Cost(ncost));}, callback);		
	});
}

Cost.prototype.genRef = function(callback){
	var me = this;
	me.genRefTo(function(err){
		
	})
}

Cost.prototype.genRefTo = function(callback){
	var me = this;
	me.fees(function(err, fees){		
		async.each(fees, function(fee, cb){
			var ref = new Ref(me, fee);
			ref.genRef(cb);		
		}, function(err){			
			callback(err);
		});
	});	
}

Cost.create = function(data, parentId, callback){
	data.nodeType = 'cost';
	var nCost = db.createNode(data);
	var cost = new Cost(nCost);
	nCost.save(function(err){
		if(parentId){
			db.getNodeById(parentId, function(err, parentCost){
				parentCost.createRelationshipTo(nCost, "child", function(err, rel){
					callback(err, cost);
				});
			});
		}else{
			callback(err, cost);
		}		
	});
}






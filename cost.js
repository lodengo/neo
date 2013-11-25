var neo4j = require('neo4j');
var db = new neo4j.GraphDatabase('http://localhost:7474');
var async = require('async');
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

Cost.prototype.fees = function(callback){
	var me = this;
	var costId = me._node.id;
	db.getIndexedNodes('fee', 'costId', costId, function(err, nfees){
		async.map(nfees, function(nfee, cb){cb(null, new Fee(nfee, me));}, callback);		
	});
}

Cost.prototype.fee = function(feeName, callback){
	var me = this;
	var query = "costId:" + this._node.id + " AND feeName:"+feeName;
	db.queryNodeIndex('fee', query, function(err, nfees){
		async.map(nfees, function(nfee, cb){cb(null, new Fee(nfee, me));}, callback);	
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
	var me = this;
	me.child(function(err, children){
		async.concat(children, function(child, cb){
			if(child.type == childType){
				child.fee(feeName, cb);			
			}else{
				cb(null, []);
			}			
		}, callback);
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

Cost.prototype.parentFees = function(callback){
	var me = this;
	me.parent(function(err, parents){
		if(parents && parents.length > 0){
			var parent = parents[0];
			parent.fees(callback);
		}else{
			callback(err,[]);
		}
	});	
}

Cost.prototype.ancestor = function(callback){
	var query = "start n=node({costId}) match n<-[:child*]-ancestor return ancestor";
	var params = {costId: this._node.id};
	db.query(query, params, function(err, ncosts){
		async.map(ncosts, function(ncost, cb){cb(null, new Cost(ncost));}, callback);		
	});
}

Cost.prototype.createFee = function(data, callback){
	var me = this;
	var costId = me._node.id
	Fee.create(data, costId, null, function(err, nfee){
		callback(err, new Fee(nfee, me));
	});
}

Cost.prototype.feesMayRef = function(callback){
	var me = this;
	var fees = [];
	me.fees(function(err, myFees){
		fees = fees.concat(myFees);
		me.parentFees(function(err, parentFees){ 
			fees = fees.concat(parentFees);
			callback(err, fees);
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






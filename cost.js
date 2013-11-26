var neo4j = require('neo4j');
var db = new neo4j.GraphDatabase('http://localhost:7474');
var async = require('async');
var Fee = require("./fee.js");
var util = require("./util.js");

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

Cost.prototype.fees = function(callback){
	var me = this;
	util.query(util.cypher.cost_fees, {id: me.id}, function(err, nfees){
		async.map(nfees, function(nfee, cb){cb(null, new Fee(nfee, me));}, callback);
	});	
}

Cost.prototype.feesByName = function(feeName, callback){
	var me = this;
	util.query(util.cypher.cost_fees_byname, {id: me.id, feeName:feeName}, function(err, nfees){
		async.map(nfees, function(nfee, cb){cb(null, new Fee(nfee, me));}, callback);
	});		
}

Cost.prototype.child = function(callback){
	var me = this;
	util.query(util.cypher.cost_child, {id: me.id}, function(err, ncosts){
		async.map(ncosts, function(ncost, cb){cb(null, new Cost(ncost));}, callback);
	});	
}

Cost.prototype.childByType = function(costType, callback){
	var me = this;
	util.query(util.cypher.cost_child_bytype, {id: me.id, type:costType}, function(err, ncosts){
		async.map(ncosts, function(ncost, cb){cb(null, new Cost(ncost));}, callback);		
	});	
}

Cost.prototype.childFees = function(childType, feeName, callback){
	var me = this;
	util.query2(util.cypher.cost_childbytype_feesbyname, {id: me.id, type:childType, feeName:feeName}, function(err, rows){
		async.map(rows, function(row, cb){cb(null, new Fee(row.childfees, new Cost(row.child)));}, callback);
	});		
}

Cost.prototype.sibling = function(callback){
	var me = this;
	util.query(util.cypher.cost_sibling, {id: me.id}, function(err, ncosts){
		async.map(ncosts, function(ncost, cb){cb(null, new Cost(ncost));}, callback);
	});	
}

Cost.prototype.parent = function(callback){
	var me = this;
	util.query(util.cypher.cost_parent, {id: me.id}, function(err, ncosts){
		async.map(ncosts, function(ncost, cb){cb(null, new Cost(ncost));}, callback);
	});	
}

Cost.prototype.parentFees = function(callback){
	var me = this;
	util.query2(util.cypher.cost_parent_fees, {id: me.id}, function(err, rows){
		async.map(rows, function(row, cb){cb(null, new Fee(row.parentfees, new Cost(row.parent)));}, callback);
	});	
}

Cost.prototype.ancestor = function(callback){
	var me = this;
	util.query(util.cypher.cost_ancestor, {id: me.id}, function(err, ncosts){
		async.map(ncosts, function(ncost, cb){cb(null, new Cost(ncost));}, callback);
	});	
}

Cost.prototype.descendant = function(callback){
	var me = this;
	util.query(util.cypher.cost_descendant, {id: me.id}, function(err, ncosts){
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

Cost.get = function(id, callback){
	util.query(util.cypher.cost_byid, {id: id}, function(err, ncosts){
		if(ncosts && ncosts.length > 0){
			callback(err, new Cost(ncosts[0]));	
		}else{
			callback(err, null);
		}
			
	});	
}

Cost.create = function(data, parentId, callback){
	data.nodeType = 'cost';
	var nCost = db.createNode(data);
	var cost = new Cost(nCost);
	nCost.save(function(err){
		if(parentId){
			db.getNodeById(parentId, function(err, parentCost){
				parentCost.createRelationshipTo(nCost, "costchild", function(err, rel){
					callback(err, cost);
				});
			});
		}else{
			callback(err, cost);
		}		
	});
}






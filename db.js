var neo4j = require('neo4j');
var _db = new neo4j.GraphDatabase('http://localhost:7474');
var async = require('async');

//fetch db query's row data: 
//col: the col key to return or null then first col
//one: true return the first one, false return array
function data_col(err, data, col, one, callback){
	if(err){
		callback(err, one ? null : []);
	}else{
		async.map(data, function(row, cb){
			var key = col || Object.keys(row)[0];
			cb(null, row[key]);
		}, function(err, result){
			callback(err, one ? result[0] : result);
		});
	}
}

var db = module.exports = function db() {

};

db.query = function(query, params, callback) {
	var matches = query.match(/({{[^}]*}})/g);
	matches && matches.forEach(function(str) {
		var key = str.slice(2, -2);
		query = query.replace(str, params[key]);
	});

	_db.query(query, params, callback);
};

db.setFeeResult = function(feeId, result, callback){
	
}
db.getCost = function(id, callback){
	var query = 'start node=node({id}) return node';
	this.query(query, {id: id}, function(err, data){
		data_col(err, data, null, true, callback);
	});
}

db.insertCost = function(data, parentId, callback){
	data.nodeType = 'cost';
	if(parentId){
		var query = "start parent=node({parentId}) create parent-[:costchild]->(node {data}) return node";
		this.query(query, {parentId:parentId, data: data}, function(err, data){
			data_col(err, data, null, true, callback);
		});
	}else{
		var query = 'create (node {data}) return node';
		this.query(query, {data: data}, function(err, data){
			data_col(err, data, null, true, callback);
		});
	}
}

db.feesToFlushOnCostCreate = function(costId, type, callback){
	util.query(util.cypher.cost_fees, {id: costId}, function(err, myfees){
		util.query(util.cypher.parent_ref_fees, {id: costId, type:type}, function(err, parentfees){
			util.query(util.cypher.sibling_ref_fees, {id: costId}, function(err, siblingfees){
				//util.query(util.cypher.descendant_ref_fees, {id: costId}, function(err, descendantfees){
					var fees = myfees.concat(parentfees, siblingfees);//, descendantfees);
					fees = fees.unique();
					async.map(fees, function(nfee, cb){cb(null, new Fee(nfee));}, callback);
				//});
			});
		});
	});
}

db.feesToFlushOnCostDelete = function(costId, type, callback){
	util.query(util.cypher.parent_ref_fees, {id: costId, type:type}, function(err, parentfees){
		util.query(util.cypher.sibling_ref_fees, {id: costId}, function(err, siblingfees){
			var fees = parentfees.concat(siblingfees);
			async.map(fees, function(nfee, cb){cb(null, new Fee(nfee));}, callback);
		});
	});
}

db.feesToFlushOnCostUpdate = function(costId, type, prop, callback){
	util.query(util.cypher.fees_mayref_prop, {id: costId, prop:prop}, function(err, myfees){
		util.query(util.cypher.parent_fees_mayref_prop, {id: costId, type:type, prop:prop}, function(err, parentfees){
			util.query(util.cypher.sibling_fees_mayref_prop, {id: costId, prop:prop}, function(err, siblingfees){
				util.query(util.cypher.descendant_fees_mayref_prop, {id: costId, prop:prop}, function(err, descendantfees){
					var fees = myfees.concat(parentfees, siblingfees, descendantfees);
					fees = fees.unique();
					async.map(fees, function(nfee, cb){cb(null, new Fee(nfee));}, callback);
				});
			});
		});
		
	});
}

db.deleteProperty = function(id, prop, callback){
	util.query2(util.cypher.delete_node_property, {id: id, property:prop}, callback);
}

db.setProperty = function(id, prop, value, callback){
	util.query2(util.cypher.set_node_property, {id: id, property:prop, value:value}, callback);
}

db.deleteCost = function(costId, callback){
	util.query2(util.cypher.delete_cost, {id: costId}, callback);
}

db.createFee = function(data, costId, costType, parentId, callback){
	var childFees = data.fee || [];
	delete data.fee;
	
	data.nodeType = 'fee';
	data.costId = costId;	
	data.costType = costType;
	
	if(parentId){
		util.query(util.cypher.create_fee_child, {parentId:parentId, data: data}, function(err, node){
			async.each(childFees, function(cfee, cb){me.create(cfee, costId, costType, node[0].id, cb)}, function(err){
				callback(err, node[0]);
			});	
		});
		
	}else{
		util.query(util.cypher.create_cost_fee, {costId:costId, data: data}, function(err, node){
			async.each(childFees, function(cfee, cb){me.create(cfee, costId, costType, node[0].id, cb)}, function(err){
				callback(err, node[0]);
			});	
		});
	}	
}

db.getFee = function(id, callback){
	util.query(util.cypher.node_byid, {id: id}, function(err, nodes){
		if(nodes && nodes.length > 0){
			callback(err, new Fee(nodes[0]));	
		}else{
			callback(err, null);
		}			
	});	
}

db.deleteFee = function(id, callback){
	util.query2(util.cypher.delete_fee, {id: id}, callback);
}

db.feesToFlushOnFeeCreate = function(costId, type, feeName, callback){
	util.query(util.cypher.cost_fees_mayref_fee, {costId: costId, feeName:feeName}, function(err, myfees){
		util.query(util.cypher.parent_fees_mayref_fee, {costId: costId, type:type, feeName:feeName}, function(err, parentfees){
			util.query(util.cypher.sibling_fees_mayref_fee, {id: costId, feeName:feeName}, function(err, siblingfees){
				var fees = myfees.concat(parentfees, siblingfees);
				fees = fees.unique();
				async.map(fees, function(nfee, cb){cb(null, new Fee(nfee));}, callback);
			});			
		});
	});
}

db.getFees = function(ids, callback){
	
}

db.createRefsTo = function(fromFeeId, toIds, callback){
	util.query2(util.cypher.fee_ref_nodes, {
		id : id,
		nodes : nodeids
	}, callback);
}

db.removeRefsTo = function(fromFeeId, toIds, callback){
	util.query2(util.cypher.fee_unref_node, {
		id : id,
		to : nodeids
	}, callback);
}

db.feeRefedToIds = function(feeId, callback){
	util.query(util.cypher.fee_refed_nodeids, {
		id : id
	}, callback);
}
/////////////////////////////////////////////////////
function _cb(err, data, getId, callback){
	var result = data.result ? [].concat(data.result) : [];
	var values = result.map(function(e) {
		return getId? e.id : e.value;
	});		
	callback(err, values);
};

db._C = function(costId, prop, getId, callback){
	
}

db._CF = function(costId, feeName, getId, callback) {	 
	var query = 'start cost=node({costId}) match cost-[:fee|feechild*]->fees where fees.feeName! ={feeName} return id(fees) as id, fees.feeResult as value';
	this.query(query, {costId: costId, feeName:feeName}, function(err, data){
		_cb(err, data, getId, callback);
	});
}


db._CC = function(costId, type, prop, getId, callback) {
	var query = 'start cost=node({costId}) match cost-[:costchild]->child where child.type! = {type} and has(child.{{prop}}) return id(child) as id, child.{{prop}} as value';
	this.query(query, {costId: costId, type:costType, prop:pName}, function(err, data){
		_cb(err, data, getId, callback);
	});
}

db._CCF = function(costId, type, feeName, getId, callback) {
	var query = 'start cost=node({costId}) match cost-[:costchild]->child, child-[:fee|feechild*]->childfees where child.type! = {type} and childfees.feeName! = {feeName} return id(childfees) as id, childfees.feeResult as value';
	this.query(query, {costId: costId, type:costType, feeName:feeName}, function(err, data){
		_cb(err, data, getId, callback);
	});
}

db._CS = function(costId, prop, getId, callback) {
	var query = 'start cost=node({costId}) match cost<-[:costchild]-parent, parent-[:costchild]->sibling where sibling <> cost and has(sibling.{{prop}}) return id(sibling) as id, sibling.{{prop}} as value';
	this.query(query, {costId: costId, prop:prop}, function(err, data){
		_cb(err, data, getId, callback);
	});
}

db._CSF = function(costId, feeName, getId, callback) {
	var query = 'start cost=node({costId}) match cost<-[:costchild]-parent, parent-[:costchild]->sibling, sibling-[:fee|feechild*]->siblingfees where sibling <> cost and siblingfees.feeName! ={feeName}  return id(siblingfees) as id, siblingfees.feeResult as value';
	this.query(query, {costId: costId, feeName:feeName}, function(err, data){
		_cb(err, data, getId, callback);
	});
}

db._CAS = function(costId, prop, getId, callback) {
	var query = 'start cost=node({costId}) match cost<-[:costchild*]-ancestor return cost.{{prop}}? as s, id(ancestor) as a, ancestor.{{prop}}? as aa';
	this.query(query, {costId: costId, prop:prop}, function(err, data){
		_cb(err, data, getId, callback);
	});
}
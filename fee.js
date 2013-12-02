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

Object.defineProperty(Fee.prototype, 'costType', {
	get : function() {
		return this._node.data['costType'];
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

Fee.prototype.feesMayRefMe = function(callback){
	var me = this;
	var costId = me.costId;
	var type = me.costType;
	var feeName = me.feeName;
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

Fee.prototype.update = function(prop, value, callback){
	var me = this;
	var id = me.id;
	var hasProp = this._node.data.hasOwnProperty(property);
	var valueNotNull = (value !== undefined) && (value !== null);
	
	if(hasProp && value == me._node.data[prop]){// value not change, do nothing
		return callback(null, 0);
	}else{
		if(hasProp && !valueNotNull){ //set exist prop to null => delete that property
			util.query2(util.cypher.delete_node_property, {id: id, property:prop}, callback);
		}
		else if(valueNotNull){ //value not null, update(hasprop && oldvalue != value) or create(!hasprop) the property
			if( (!hasProp) || (value != me._node.data[prop]) ){
				util.query2(util.cypher.set_node_property, {id: id, property:prop, value:value}, callback);
			}
		}
	}	
};

Fee.prototype.del = function(callback){
	var me = this;
	var id = me.id;
	util.query2(util.cypher.delete_fee, {id: id}, callback);
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

Fee.create = function(data, costId, costType, parentId, callback){
	var me = this;
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


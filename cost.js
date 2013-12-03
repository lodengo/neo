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

Cost.prototype.update = function(prop, value, callback){
	var me = this;
	var id = me.id;
	var hasProp = this._node.data.hasOwnProperty(prop);
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

Cost.prototype.del = function(callback){
	var me = this;
	var costId = me.id;
	util.query2(util.cypher.delete_cost, {id: costId}, callback);
}

Cost.prototype.feesMayRefFromParentAndSibling = function(callback){
	var me = this;
	var costId = me.id;
	var type = me.type;
	util.query(util.cypher.parent_ref_fees, {id: costId, type:type}, function(err, parentfees){
		util.query(util.cypher.sibling_ref_fees, {id: costId}, function(err, siblingfees){
			var fees = parentfees.concat(siblingfees);
			async.map(fees, function(nfee, cb){cb(null, new Fee(nfee));}, callback);
		});
	});
	
}
//fees may ref me and my fees 
Cost.prototype.feesMayRefMeAndMyfees = function(callback){
	var me = this;
	var costId = me.id;
	var type = me.type;
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
};

Cost.prototype.feesMayRefProp = function(prop, callback){
	var me = this;
	var costId = me.id;
	var type = me.type;
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


Cost.prototype.save = function (callback) {
    this._node.save(callback);
};

Cost.prototype.createFee = function(data, feeParentId, callback){
	var me = this;
	var costId = me.id
	var costType = me.type;
	Fee.create(data, costId, costType, feeParentId, function(err, nfee){
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
};

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
};






var neo4j = require('neo4j');
var db = new neo4j.GraphDatabase('http://localhost:7474');
var async = require('async');

//Compute the intersection of n arrays
Array.prototype.intersect =
  function() {
    if (!arguments.length)
      return [];
    var a1 = this;
    var a = a2 = null;
    var n = 0;
    while(n < arguments.length) {
      a = [];
      a2 = arguments[n];
      var l = a1.length;
      var l2 = a2.length;
      for(var i=0; i<l; i++) {
        for(var j=0; j<l2; j++) {
          if (a1[i] === a2[j])
            a.push(a1[i]);
        }
      }
      a1 = a;
      n++;
    }
    return a.unique();
  };

// Return new array with duplicate values removed
Array.prototype.unique =
  function() {
    var a = [];
    var l = this.length;
    for(var i=0; i<l; i++) {
      for(var j=i+1; j<l; j++) {
        // If this[i] is found later in the array
        if (this[i] === this[j])
          j = ++i;
      }
      a.push(this[i]);
    }
    return a;
};

//Return elements which are in A but not in arg0 through argn
Array.prototype.diff =
  function() {
    var a1 = this;
    var a = a2 = null;
    var n = 0;
    while(n < arguments.length) {
      a = [];
      a2 = arguments[n];
      var l = a1.length;
      var l2 = a2.length;
      var diff = true;
      for(var i=0; i<l; i++) {
        for(var j=0; j<l2; j++) {
          if (a1[i] === a2[j]) {
            diff = false;
            break;
          }
        }
        diff ? a.push(a1[i]) : diff = true;
      }
      a1 = a;
      n++;
    }
    return a.unique();
 };
 ////////////////////////////////////////////////////
//费用表达式引用关系
exports.refReg = new RegExp(['f', 'c', 'cf', 'ccf'].join('\\([^\\)]*\\)|')+'\\([^\\)]*\\)', 'g');

//费用表达式--计算扩展 see: https://github.com/josdejong/mathjs/blob/master/docs/extend.md
exports.math_extend = {
		sum: function(args){			
			var total = 0;
			var argsArray = arguments;
			Object.keys(argsArray).forEach(function(key){total += argsArray[key];});
			return total;
		}
};
//cypher query
exports.cypher = {
		cost_byid: 'start cost=node({id}) return cost',
		cost_parent: 'start n=node({id}) match n<-[:costchild]-parent return parent',
		cost_ancestor: 'start n=node({id}) match n<-[:costchild*]-ancestor return ancestor',
		cost_child: 'start n=node({id}) match n-[:costchild]->child return child',
		cost_child_bytype: 'start n=node({id}) match n-[:costchild]->child where child.type! = {type} return child',
		cost_descendant : 'start n=node({id}) match n-[:costchild*]->descendant return descendant',
		cost_sibling : 'start n=node({id}) match n<-[:costchild]-parent, parent-[:costchild]->sibling where sibling <> n return sibling',
		cost_fees: 'start n=node({id}) match n-[:fee|feechild*]->fees return fees',
		cost_fees_byname: 'start n=node({id}) match n-[:fee|feechild*]->fees where fees.feeName ! ={feeName} return fees',
		cost_parent_fees: 'start n=node({id}) match n<-[:costchild]-parent, parent-[:fee|feechild*]->parentfees return parent, parentfees',
		cost_ancestor_fees : 'start n=node({id}) match n<-[:costchild*]-ancestor, ancestor-[:fee|feechild*]->ancestorfees return ancestorfees',
		cost_child_fees: 'start n=node({id}) match n-[:costchild]->child, child-[:fee|feechild*]->childfees return childfees',
		cost_childbytype_feesbyname: 'start n=node({id}) match n-[:costchild]->child, child-[:fee|feechild*]->childfees where child.type! = {type} and childfees.feeName! = {feeName} return child, childfees',
		cost_descendant_fees: 'start n=node({id}) match n-[:costchild*]->descendant, descendant-[:fee|feechild*]->descendantfees return descendantfees',
		cost_sibling_fees: 'start n=node({id}) match n<-[:costchild]-parent, parent-[:costchild]->sibling, sibling-[:fee|feechild*]->siblingfees where sibling <> n return siblingfees',
		fee_byid: 'start fee=node({id}) match cost-[:fee|feechild*]->fee return fee, cost',
		fees_adj: 'start n=node({id}) match n<-[:ref*]-fees, fees-[:ref]->f return id(fees) as fid, collect(id(f)) as fids',
		fee_ref_nodes: 'start me=node({id}), to=node({nodes}) create me-[r:ref]->to',
		fee_unref_node: 'start me=node({id}), to=node({to}) match me-[r:ref]->to delete r',
		fee_refed_nodeids: 'start fee=node({id}) match fee-[:ref]->node return id(node) as ids',
		create_node: 'create (node {data}) return node',
		create_cost_child: 'start parent=node({parentId}) create parent-[:costchild]->(node {data}) return node',
		create_fee_child: 'start parent=node({parentId}) create parent-[:feechild]->(node {data}) return node',
		create_cost_fee: 'start cost=node({costId}) create cost-[:fee]->(node {data}) return node',
};

exports.query2 = function(query, params, callback){
	db.query(query, params, callback);
};

exports.query = function(query, params, callback){
	db.query(query, params, function(err, rows){
		if(err){
			callback(err, []);
		}else{
			async.map(rows, function(row, cb){
				var key = Object.keys(row)[0];
				cb(null, row[key]);
			}, callback);
		}
	});
};

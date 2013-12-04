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
 
 Array.prototype.random = function() {
	 var len = this.length;
	 var idx = Math.floor(Math.random() * len);
	 return this[idx];
 };
 
 Array.prototype.shuffle = function() {
	 var o = this;
	 for(var j, x, i = o.length; i; j = Math.floor(Math.random() * i), x = o[--i], o[i] = o[j], o[j] = x);
	    return o;
 };
 ////////////////////////////////////////////////////
//费用表达式引用关系
exports.refReg = new RegExp(['f', 'c', 'cf', 'cc', 'ccf', 'cs', 'csf', 'cas'].join('\\([^\\)]*\\)|')+'\\([^\\)]*\\)', 'g');

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
		node_byid: 'start node=node({id}) return node',
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
		fees_adj1: 'start n=node({id}) match n-[:ref]->f return id(n) as fid, collect(id(f)) as fids',
		fees_adj: 'start n=node({id}) match n<-[:ref*]-fees, fees-[:ref]->f return id(fees) as fid, collect(id(f)) as fids',
		fee_ref_nodes: 'start me=node({id}), to=node({nodes}) create me-[r:ref]->to',
		fee_unref_node: 'start me=node({id}), to=node({to}) match me-[r:ref]->to delete r',
		fee_refed_nodeids: 'start fee=node({id}) match fee-[:ref]->node return id(node) as ids',
		create_node: 'create (node {data}) return node',
		create_cost_child: 'start parent=node({parentId}) create parent-[:costchild]->(node {data}) return node',
		create_fee_child: 'start parent=node({parentId}) create parent-[:feechild]->(node {data}) return node',
		create_cost_fee: 'start cost=node({costId}) create cost-[:fee]->(node {data}) return node',
		update_fee_result: 'start fee=node({id}) set fee.feeResult={result}',
		parent_ref_fees: 'start cost=node({id}) match cost<-[:costchild]-parent, parent-[:fee|feechild*]->parentfees where parentfees.feeExpr =~ ".*cc.?\\\\({{type}}.*" return parentfees',
		sibling_ref_fees: 'start cost=node({id}) match cost<-[:costchild]-parent, parent-[:costchild]->sibling, sibling-[:fee|feechild*]->siblingfees where sibling <> cost and siblingfees.feeExpr =~ ".*cs.*" return siblingfees',
		descendant_ref_fees: 'start cost=node({id}) match cost-[:costchild*]->descendant, descendant-[:fee|feechild*]->descendantfees where descendantfees.feeExpr =~ ".*cas.*" return descendantfees',
		set_node_property: 'start node=node({id}) set node.{{property}}={value}',
		delete_node_property: 'start node=node({id}) delete node.{{property}}',
		fees_mayref_prop: 'start n=node({id}) match n-[:fee|feechild*]->fees where fees.feeExpr=~".*cas\\\\({{prop}}\\\\)|c\\\\({{prop}}\\\\).*" return fees',
		parent_fees_mayref_prop: 'start cost=node({id}) match cost<-[:costchild]-parent, parent-[:fee|feechild*]->parentfees where parentfees.feeExpr=~".*cc\\\\({{type}},{{prop}}\\\\).*" return parentfees',
		sibling_fees_mayref_prop: 'start cost=node({id}) match cost<-[:costchild]-parent, parent-[:costchild]->sibling, sibling-[:fee|feechild*]->siblingfees where sibling <> cost and siblingfees.feeExpr =~ ".*cs\\\\({{prop}}\\\\).*" return siblingfees',
		descendant_fees_mayref_prop: 'start cost=node({id}) match cost-[:costchild*]->descendant, descendant-[:fee|feechild*]->descendantfees where descendantfees.feeExpr =~ ".*cas\\\\({{prop}}\\\\).*" return descendantfees',
		delete_cost: 'start cost=node({id})	match cost-[:fee|feechild|costchild*]->m with cost, m MATCH m-[r?]-(), cost-[r1?]-() delete cost, m, r, r1',	
		cost_fees_mayref_fee: 'start cost=node({costId}) match cost-[:fee|feechild*]->fees where fees.feeExpr=~ ".*cf\\\\({{feeName}}\\\\).*" return fees',
		parent_fees_mayref_fee: 'start cost=node({costId}) match cost<-[:costchild]-parent, parent-[:fee|feechild*]->parentfees where parentfees.feeExpr =~ ".*ccf\\\\({{type}},{{feeName}}\\\\).*" return parentfees',
		sibling_fees_mayref_fee: 'start cost=node({costId}) match cost<-[:costchild]-parent, parent-[:costchild]->sibling, sibling-[:fee|feechild*]->siblingfees where sibling <> cost and siblingfees.feeExpr =~ ".*csf\\\\({{feeName}}\\\\).*" return siblingfees',
		delete_fee: 'start fee=node({id}) match fee-[:feechild*]->m with fee, m match m-[r?]-(), fee-[:r1?]-() delete fee, m, r, r1',
		
};

exports.refQuery = {
		cf: 'start cost=node({costId}) match cost-[:fee|feechild*]->fees where fees.feeName! ={feeName} return id(fees)',
		//cf: 'start fees=node:node_auto_index(costId={costId}) where fees.feeName ={feeName} return id(fees)',		
		cc: 'start cost=node({costId}) match cost-[:costchild]->child where child.type! = {type} and has(child.{{prop}}) return id(child)',
		ccf: 'start cost=node({costId}) match cost-[:costchild]->child, child-[:fee|feechild*]->childfees where child.type! = {type} and childfees.feeName! = {feeName} return id(childfees)',
		cs: 'start cost=node({costId}) match cost<-[:costchild]-parent, parent-[:costchild]->sibling where sibling <> cost and has(sibling.{{prop}}) return id(sibling)',
		csf: 'start cost=node({costId}) match cost<-[:costchild]-parent, parent-[:costchild]->sibling, sibling-[:fee|feechild*]->siblingfees where sibling <> cost and siblingfees.feeName! ={feeName}  return id(siblingfees)',
		cas: 'start cost=node({costId}) match cost<-[:costchild*]-ancestor return cost.{{prop}}? as s, id(ancestor) as a, ancestor.{{prop}}? as aa'
};

exports.calcQuery = {
		c: 'start cost=node({costId}) return cost.{{prop}}',
		cf: 'start cost=node({costId}) match cost-[:fee|feechild*]->fees where fees.feeName! ={feeName} return fees.feeResult',
		cc: 'start cost=node({costId}) match cost-[:costchild]->child where child.type! = {type} and has(child.{{prop}}) return child.{{prop}}',
		ccf: 'start cost=node({costId}) match cost-[:costchild]->child, child-[:fee|feechild*]->childfees where child.type! = {type} and childfees.feeName! = {feeName} return childfees.feeResult',
		cs: 'start cost=node({costId}) match cost<-[:costchild]-parent, parent-[:costchild]->sibling where sibling <> cost and has(sibling.{{prop}}) return sibling.{{prop}}',
		csf: 'start cost=node({costId}) match cost<-[:costchild]-parent, parent-[:costchild]->sibling, sibling-[:fee|feechild*]->siblingfees where sibling <> cost and siblingfees.feeName! ={feeName}  return siblingfees.feeResult',
		cas: 'start cost=node({costId}) match cost<-[:costchild*]-ancestor return cost.{{prop}}? as s, collect(ancestor.{{prop}}?) as a'
};

function md5(str){
    var hash = require('crypto').createHash('md5');
    return hash.update(str+"").digest('hex');
}
var stats = {
		count:0,
		total:0,
		max:0,
		qst:{},
		add: function(s, q){
			var t = new Date() - s;			
			this.count++;
			this.total += t;
			if(t > this.max){
				this.max = t;
			}
			var md5q = md5(q);
			if(! this.qst.hasOwnProperty(md5q)){
				this.qst[md5q] = {q:q, count:1, total:t, max:t};
			}else{				
				this.qst[md5q].count+=1;
				this.qst[md5q].total+=t;
				if(t > this.qst[md5q].max){
					this.qst[md5q].max = t;
				}
			}			
		},		
		info: function(){
			var me = this;
			var ss = [];
			Object.keys(me.qst).forEach(function(k){
				var e = me.qst[k]; e.avg = e.total/e.count;
				ss.push(e);
			});
			ss.sort(function(a, b){return b.avg - a.avg});
			return {
				count:this.count,
				total:this.total,
				max:this.max,
				avg: this.total/this.count,
				ss:ss
			};
		}
}; exports.stats = stats;

exports.query2 = function(query, params, callback){var s=new Date();
	var matches = query.match(/({{[^}]*}})/g);
	matches && matches.forEach(function(str){
		var key = str.slice(2, -2);
		query = query.replace(str, params[key]);
	});
	
	db.query(query, params, function(err, res){ stats.add(s, query);
		callback(err, res);
	});
};

exports.query = function(query, params, callback){var s=new Date();
	var matches = query.match(/({{[^}]*}})/g);
	matches && matches.forEach(function(str){
		var key = str.slice(2, -2);
		query = query.replace(str, params[key]);
	});
	
	db.query(query, params, function(err, rows){ stats.add(s, query);
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

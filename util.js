var neo4j = require('neo4j');
var db = new neo4j.GraphDatabase('http://localhost:7474');
var async = require('async');

exports.array_unique = function array_unique(arr) {
	var a = [];
    var l = arr.length;
    for(var i=0; i<l; i++) {
      for(var j=i+1; j<l; j++) {
        // If this[i] is found later in the array
        if (arr[i] === arr[j])
          j = ++i;
      }
      a.push(arr[i]);
    }
    return a;
};

exports.array_diff = function array_diff(b, a){	
	return b.filter(function(i) {return !(a.indexOf(i) > -1);});
};

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

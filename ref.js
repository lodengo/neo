var async = require('async');

var refFuncs = ['f', 'c', 'cf', 'ccf'];
var refReg = new RegExp(refFuncs.join('\\([^\\)]*\\)|')+'\\([^\\)]*\\)', 'g');

function array_unique(arr) {
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

var Ref = module.exports = function Ref(fee) {	
	this._fee = fee;	
	this._cost = fee._cost;
}

Ref.prototype.refNodesByExpr = function(callback){
	var me = this;
	var feeExpr = me._fee.feeExpr;
	var matches = feeExpr.match(refReg) || [];
	
	async.concat(matches, function(str, cb){
		var i = str.indexOf("(");
		if(i != -1 && str[str.length-1] == ')'){
			var func = str.substr(0, i);
			var args = str.substr(i+1, str.length-i-2).split(',');
			
			args.push(cb);
			me[func].apply(me, args); 	
		}else{
			cb(null, []);
		}
	}, function(err, nodes){callback(err, array_unique(nodes));});
}

Ref.prototype.cf = function(feeName, callback){	
	this._cost.fee(feeName, function(err, fees){
		async.map(fees, function(fee, cb){cb(null, fee.id);}, callback);
	});		
}

Ref.prototype.f = function(pName, callback){
	callback(null, []);
}

Ref.prototype.c = function(pName, callback){	
	var costId = this._cost.id;
	callback(null, [costId]);
}

Ref.prototype.ccf = function(costType, feeName, callback){
	this._cost.childFees(costType, feeName, function(err, fees){
		async.map(fees, function(fee, cb){cb(null, fee.id);}, callback);			
	});	
}
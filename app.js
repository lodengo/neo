var Api = require("./api.js");
var async = require('async');
var Cost = require('./cost.js');
var util = require("./util.js");

function Tester() {
	this.ztgc = 0; //整体工程id
	this.dxgc = []; //单项工程ids
	this.dwgc = []; //单位工程ids
	this.fbfx = []; //分部分项ids	
	this.qd = []; //清单ids
	this.de = []; //定额ids
	this.glj = []; //工料机ids
}

Tester.prototype.createZtgc = function(callback) {
	var me = this;
	var ztgc = {
		type : '整体工程'
	};
	//var fs = fees['ztgc'];
	Api.createCost(ztgc, null, function(err, cost){
		me.ztgc = cost.id;
		callback(null, cost);
	});
}

Tester.prototype.createDXgc = function(callback) {
	var me = this;
	var parentId = me.ztgc;
	var dxgc = {
		type : '单项工程'
	};
	//var fs = fees['dxgc'];	
	Api.createCost(dxgc, parentId, function(err, cost){
		me.dxgc.push(cost.id);
		callback(null, cost);
	});
}

Tester.prototype.createDwgc = function(callback) {
	var me = this;
	var dwgc = {
		type : '单位工程'
	};
	//var fs = fees['dwgc'];
	var parentId =  me.dxgc.random();
	if(!parentId){return callback(null);}
	Api.createCost(dwgc, parentId, function(err, cost){
		me.dwgc.push(cost.id);
		callback(null, cost);
	});
}

Tester.prototype.createFbfx = function(callback) {
	var me = this;
	var fbfx = {
		type : '分部分项'
	};
	//var fs = fees['fbfx'];
	var parentId =  me.dwgc.random();
	if(!parentId){return callback(null);}
	Api.createCost(fbfx, parentId, function(err, cost){
		me.fbfx.push(cost.id);
		callback(null, cost);
	});
}

Tester.prototype.createQd = function(callback){
	var me = this;
	var qd = {
			type: '清单',
			quantity: Math.random() * 1000
	};
	
	//var fs = fees['qd'];
	var parentId = me.fbfx.random();
	if(!parentId){return callback(null);}
	Api.createCost(qd, parentId, function(err, cost){
		me.qd.push(cost.id);
		callback(null, cost);
	});
}

Tester.prototype.createDe = function(callback) {
	var me = this;
	var de = {
		type : '定额',
		quantity: Math.random() * 1000
	};
	//var fs = fees['de'];
	var parentId =  me.qd.random();
	if(!parentId){return callback(null);}
	Api.createCost(de, parentId, function(err, cost){
		me.de.push(cost.id);
		callback(null, cost);
	});
}

Tester.prototype.createGlj = function(callback) {
	var me = this;
	var types = [ "人工", "材料", "机械" ];
	var glj = {
		'type' : types[Math.floor(Math.random() * 10) % 3],
		'price' : Math.random() * 100,
		'content' : Math.random()
	};
	//var fs = fees['glj'];
	var parentId =  me.de.random();
	if(!parentId){return callback(null);}
	Api.createCost(glj, parentId, function(err, cost){
		me.glj.push(cost.id);
		callback(null, cost);
	});
}

//修改工程量
Tester.prototype.modGcl = function(callback){
	var me = this;
	var modQd = Math.random() < 0.5;
	var nid = modQd ? me.qd.random() : me.de.random();
	if(!nid){return callback(null);}
	var gcl = Math.random() * 1000;
	Api.updateCost(nid, 'quantity', gcl, function(err, res){
		callback(err);
	});
}

//删除清单或定额
Tester.prototype.delNode = function(callback){
	var me = this;
	var delQd = Math.random() < 0.5;
	var nid = delQd ? me.qd.random() : me.de.random();
	if(!nid){return callback(null);}
	Api.deleteCost(nid, function(err, res){
		callback(err);
	});
}
// //////////////////////////////////////////////////////
function arrPush(arr, e, n){
	if(n){
		for(var i = 0; i < n; i++){
			arr.push(e);
		}
	}else{
		arr.push(e);
	}
}

var stats = {
		totalms:0,
		steps:0,
		avgms:0,
		maxms:0,
		finish: function(start, action){
			var me = this;
			var ms = new Date() - start;
			me.totalms += ms;
			me.steps += 1;
			me.avgms = me.totalms/me.steps;
			me.maxms = ms > me.maxms ? ms : me.maxms;
		}
};

function step(actor, actions, i, callback){
	var start = new Date();
	if(i == actions.length){
		callback();
	}else{
		var act = actions[i];
		console.log("step " + i + ": " + act);
		actor[act](function(err, res){	
			stats.finish(start, act);
			step(actor, actions, i+1, callback);
		});	
	}	
}

function run(callback){	
	var actions = ['createZtgc'];
	arrPush(actions, "createDXgc", 1);
	arrPush(actions, "createDwgc", 4);
	arrPush(actions, "createFbfx", 8);	
	arrPush(actions, "createQd", 16);	
	arrPush(actions, "createDe", 32);	
	arrPush(actions, "createGlj", 100);	
	//arrPush(actions, "modGcl", 5);
	//arrPush(actions, "delNode", 2);	
	
	var actor = new Tester();
	step(actor, actions, 0, callback);
}

run(function(){
	console.log('done, info:');
	console.log(stats);
});



















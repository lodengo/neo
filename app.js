var Api = require("./api.js");
var async = require('async');
var neo4j = require('neo4j');
var db = new neo4j.GraphDatabase('http://localhost:7474');
var Cost = require("./cost.js");

var fees = {
	'ztgc' : [ { // 鏁翠綋宸ョ▼
		feeName : '鍗曢」宸ョ▼宸ョ▼璐瑰悎璁�,
		feeExpr : '',
		feeResult : '0'
	}, {
		feeName : '鏁翠綋宸ョ▼璐圭敤鍚堣',
		feeExpr : '',
		feeResult : '0'
	}, {
		feeName : '宸ョ▼鎬婚�浠�,
		feeExpr : '',
		feeResult : '0'
	} ],
	'dxgc' : [ // 鍗曢」宸ョ▼
			{
				feeName : '鍗曚綅宸ョ▼宸ョ▼璐瑰悎璁�,
				feeExpr : '300+400*2-50',
				feeResult : '0'
			},
			{
				feeName : '鍗曢」宸ョ▼璐圭敤鍚堣',
				feeExpr : 'cf(鎺柦椤圭洰娓呭崟璐圭敤)+cf(鍏朵粬椤圭洰娓呭崟璐圭敤)+cf(瑙勮垂)+cf(绋庨噾)',
				feeResult : '0',
				fee : [
						{
							feeName : '鎺柦椤圭洰娓呭崟璐圭敤',
							feeExpr : '100+10*20',
							feeResult : '0'
						},
						{
							feeName : '鍏朵粬椤圭洰娓呭崟璐圭敤',
							feeExpr : '500+100',
							feeResult : '0'
						},
						{
							feeName : '瑙勮垂',
							feeExpr : 'cf(宸ョ▼鎺掓薄璐�+cf(绀句細淇濋殰璐�+cf(浣忔埧鍏Н閲�+cf(娌抽亾绠＄悊璐�',
							feeResult : '0',
							fee : [
									{
										feeName : '宸ョ▼鎺掓薄璐�,
										feeExpr : 'cf(鎺柦椤圭洰娓呭崟璐圭敤)*f(feeRate)',
										feeRate : '0.0348', // 璐圭巼
										feeResult : '0'
									},
									{
										feeName : '绀句細淇濋殰璐�,
										feeExpr : '200*f(feeRate)',
										feeRate : '0.0348', // 璐圭巼
										feeResult : '0'
									},
									{
										feeName : '浣忔埧鍏Н閲�,
										feeExpr : 'cf(鎺柦椤圭洰娓呭崟璐圭敤)*f(feeRate)',
										feeRate : '0.0348', // 璐圭巼
										feeResult : '0'
									},
									{
										feeName : '娌抽亾绠＄悊璐�,
										feeExpr : '(cf(鎺柦椤圭洰娓呭崟璐圭敤)+cf(鍏朵粬椤圭洰娓呭崟璐圭敤)+cf(宸ョ▼鎺掓薄璐�+cf(绀句細淇濋殰璐�+cf(浣忔埧鍏Н閲�)*f(feeRate)',
										feeRate : '0.0348', // 璐圭巼
										feeResult : '0'
									} ]
						},
						{
							feeName : '绋庨噾',
							feeExpr : '(cf(鎺柦椤圭洰娓呭崟璐圭敤)+cf(鍏朵粬椤圭洰娓呭崟璐圭敤)+cf(瑙勮垂)-cf(娌抽亾绠＄悊璐�)*f(feeRate)',
							feeRate : '0.0348', // 璐圭巼
							feeResult : '0'
						} ]
			}, {
				feeName : '宸ョ▼鎬婚�浠�,
				feeExpr : 'cf(鍗曚綅宸ョ▼宸ョ▼璐瑰悎璁�+cf(鍗曢」宸ョ▼璐圭敤鍚堣)',
				feeResult : '0'
			} ],
	'dwgc' : [ // 鍗曚綅宸ョ▼
			{
				feeName : '鍒嗛儴鍒嗛」宸ョ▼閲忔竻鍗曡垂鐢�,
				feeExpr : '0',
				feeResult : '0'
			},
			{
				feeName : '鎺柦椤圭洰娓呭崟璐圭敤',
				feeExpr : '0',
				feeResult : '0'
			},
			{
				feeName : '鍏朵粬椤圭洰娓呭崟璐圭敤',
				feeExpr : '0',
				feeResult : '0'
			},
			{
				feeName : '瑙勮垂',
				feeExpr : 'cf(宸ョ▼鎺掓薄璐�+cf(绀句細淇濋殰璐�+cf(浣忔埧鍏Н閲�+cf(娌抽亾绠＄悊璐�',
				feeResult : '0',
				fee : [
						{
							feeName : '宸ョ▼鎺掓薄璐�,
							feeExpr : '(cf(鍒嗛儴鍒嗛」宸ョ▼閲忔竻鍗曡垂鐢�+cf(鎺柦椤圭洰娓呭崟璐圭敤))*f(feeRate)',
							feeRate : '0.0348', // 璐圭巼
							feeResult : '0'
						},
						{
							feeName : '绀句細淇濋殰璐�,
							feeExpr : '200*f(feeRate)',
							feeRate : '0.0348', // 璐圭巼
							feeResult : '0'
						},
						{
							feeName : '浣忔埧鍏Н閲�,
							feeExpr : '(cf(鍒嗛儴鍒嗛」宸ョ▼閲忔竻鍗曡垂鐢�+cf(鎺柦椤圭洰娓呭崟璐圭敤))*f(feeRate)',
							feeRate : '0.0348', // 璐圭巼
							feeResult : '0'
						},
						{
							feeName : '娌抽亾绠＄悊璐�,
							feeExpr : '(cf(鍒嗛儴鍒嗛」宸ョ▼閲忔竻鍗曡垂鐢�+cf(鎺柦椤圭洰娓呭崟璐圭敤)+cf(鍏朵粬椤圭洰娓呭崟璐圭敤)+cf(宸ョ▼鎺掓薄璐�+cf(绀句細淇濋殰璐�+cf(浣忔埧鍏Н閲�)*f(feeRate)',
							feeRate : '0.0348', // 璐圭巼
							feeResult : '0'
						} ]
			},
			{
				feeName : '绋庨噾',
				feeExpr : '(cf(鍒嗛儴鍒嗛」宸ョ▼閲忔竻鍗曡垂鐢�+cf(鎺柦椤圭洰娓呭崟璐圭敤)+cf(鍏朵粬椤圭洰娓呭崟璐圭敤)+cf(瑙勮垂)-cf(娌抽亾绠＄悊璐�)*f(feeRate)',
				feeResult : '0',
				feeRate : '0.0348', // 璐圭巼
			},
			{
				feeName : '宸ョ▼鎬婚�浠�,
				feeExpr : 'cf(鍒嗛儴鍒嗛」宸ョ▼閲忔竻鍗曡垂鐢�+cf(鎺柦椤圭洰娓呭崟璐圭敤)+cf(鍏朵粬椤圭洰娓呭崟璐圭敤)+cf(瑙勮垂)+cf(绋庨噾)',
				feeResult : '0'
			} ],
	'fbfx' : [ { // 鍒嗛儴鍒嗛」
		feeName : '浜哄伐璐瑰悎浠�,
		feeExpr : '',
		feeResult : '0'
	}, {
		feeName : '鏉愭枡璐瑰悎浠�,
		feeExpr : '',
		feeResult : '0'
	}, {
		feeName : '鏈烘璐瑰悎浠�,
		feeExpr : '',
		feeResult : '0'
	}, {
		feeName : '鐩存帴璐瑰悎浠�,
		feeExpr : '',
		feeResult : '0'
	}, {
		feeName : '缁煎悎鍚堜环',
		feeExpr : '',
		feeResult : '0'
	} ],
	'qd' : [ { // 娓呭崟
		feeName : '浜哄伐璐�,
		feeExpr : '',
		feeResult : '0'
	}, {
		feeName : '浜哄伐璐瑰悎浠�,
		feeExpr : '',
		feeResult : '0'
	}, {
		feeName : '鏉愭枡璐�,
		feeExpr : '',
		feeResult : '0'
	}, {
		feeName : '鏉愭枡璐瑰悎浠�,
		feeExpr : '',
		feeResult : '0'
	}, {
		feeName : '鏈烘璐�,
		feeExpr : '',
		feeResult : '0'
	}, {
		feeName : '鏈烘璐瑰悎浠�,
		feeExpr : '',
		feeResult : '0'
	}, {
		feeName : '鐩存帴璐�,
		feeExpr : '',
		feeResult : '0'
	}, {
		feeName : '鐩存帴璐瑰悎浠�,
		feeExpr : '',
		feeResult : '0'
	}, {
		feeName : '缁煎悎鍗曚环',
		feeExpr : '',
		feeResult : '0'
	}, {
		feeName : '缁煎悎鍚堜环',
		feeExpr : '',
		feeResult : '0'
	} ],
	'de' : [ 
	        { // 瀹氶
		feeName : '浜哄伐璐�,
		feeExpr : 'sum(ccf(浜哄伐,鐩存帴璐�)',
		feeResult : '0'
	}
//	,{
//		feeName : '浜哄伐璐瑰悎浠�,
//		feeExpr : 'cf(浜哄伐璐�*c(宸ョ▼閲�',
//		feeResult : '0'
//	}, {
//		feeName : '鏉愭枡璐�,
//		feeExpr : 'sum(ccf(鏉愭枡,鐩存帴璐�)',
//		feeResult : '0'
//	}, {
//		feeName : '鏉愭枡璐瑰悎浠�,
//		feeExpr : 'cf(鏉愭枡璐�*c(宸ョ▼閲�',
//		feeResult : '0'
//	}, {
//		feeName : '鏈烘璐�,
//		feeExpr : 'sum(ccf(鏈烘,鐩存帴璐�)',
//		feeResult : '0'
//	}, {
//		feeName : '鏈烘璐瑰悎浠�,
//		feeExpr : 'cf(鏈烘璐�*c(宸ョ▼閲�',
//		feeResult : '0'
//	}, {
//		feeName : '鐩存帴璐�,
//		feeExpr : 'cf(浜哄伐璐�+cf(鏉愭枡璐�+cf(鏈烘璐�',
//		feeResult : '0'
//	}, {
//		feeName : '鐩存帴璐瑰悎浠�,
//		feeExpr : 'cf(鐩存帴璐�*c(宸ョ▼閲�',
//		feeResult : '0'
//	}, {
//		feeName : '绠＄悊璐�,
//		feeExpr : '1+2',
//		feeResult : '0'
//	}, {
//		feeName : '绠＄悊璐瑰悎浠�,
//		feeExpr : 'cf(绠＄悊璐�*c(宸ョ▼閲�',
//		feeResult : '0'
//	}, {
//		feeName : '鍒╂鼎',
//		feeExpr : '1+2*3',
//		feeResult : '0'
//	}, {
//		feeName : '鍒╂鼎鍚堜环',
//		feeExpr : 'cf(鍒╂鼎)*c(宸ョ▼閲�',
//		feeResult : '0'
//	}, {
//		feeName : '缁煎悎鍗曚环',
//		feeExpr : 'cf(鐩存帴璐�+cf(绠＄悊璐�+cf(鍒╂鼎)',
//		feeResult : '0'
//	}, {
//		feeName : '缁煎悎鍚堜环',
//		feeExpr : 'cf(缁煎悎鍗曚环)*c(宸ョ▼閲�',
//		feeResult : '0'
//	} 
	],
	'glj' : [ { // 宸ユ枡鏈�		feeName : '鐩存帴璐�,
		feeExpr : 'c(鍗曚环)*c(鍚噺)',
		feeResult : '0'
	} ]
};
// ////////////////////////////////////////////
function App() {

}

App.prototype.createDwgc = function(parentId, callback) {
	var dwgc = {
		type : '鍗曚綅宸ョ▼'
	};
	var fs = fees['dwgc'];
	Api.createCost(dwgc, fs, parentId, callback);
}
App.prototype.createDe = function(parentId, callback) {
	var de = {
		type : '瀹氶',
		宸ョ▼閲�: Math.random() * 1000
	};
	var fs = fees['de'];
	Api.createCost(de, fs, parentId, callback);
}

App.prototype.createGlj = function(parentId, callback) {
	var types = [ "浜哄伐", "鏉愭枡", "鏈烘" ];
	var glj = {
		'type' : types[Math.floor(Math.random() * 10) % 3],
		'鍗曚环' : Math.random() * 100,
		'鍚噺' : Math.random()
	};
	var fs = fees['glj'];
	Api.createCost(glj, fs, parentId, callback);
}
// //////////////////////////////////////////////////////
var app = new App();
app.createDe(null, function(err, de){
//	async.times(6, function(n, next){
//		app.createGlj(de.id, function(err, glj){
//			next(err, glj.id);
//		});
//	}, function(err, gljs){
//		console.log(de.id, gljs);
//	});	
});

//db.getNodeById(298, function(err, node){
//	var cost = new Cost(node);
//	cost.sibling(function(err, sibling){
//		console.log(sibling);
//	})
//});



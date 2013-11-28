var Api = require("./api.js");
var async = require('async');
var neo4j = require('neo4j');
var db = new neo4j.GraphDatabase('http://localhost:7474');
var Cost = require("./cost.js");
var Fee = require("./fee.js");
var Ref = require("./ref.js");
var Calc = require("./calc.js");
var util = require("./util.js");

var fees = {
	'ztgc' : [ { //整体工程
		feeName : '单项工程费用合计',
		feeExpr : '',
		feeResult : '0'
	}, {
		feeName : '整体工程费用合计',
		feeExpr : '',
		feeResult : '0'
	}, {
		feeName : '工程总造价',
		feeExpr : '',
		feeResult : '0'
	} ],
	'dxgc' : [ // 单项工程
			{
				feeName : '单位工程工程费合计',
				feeExpr : '300+400*2-50',
				feeResult : '0'
			},
			{
				feeName : '单项工程费用合计',
				feeExpr : 'cf(措施项目清单费用)+cf(其他项目清单费用)+cf(规费)+cf(税金)',
				feeResult : '0',
				fee : [
						{
							feeName : '措施项目清单费用',
							feeExpr : '100+10*20',
							feeResult : '0'
						},
						{
							feeName : '其他项目清单费用',
							feeExpr : '500+100',
							feeResult : '0'
						},
						{
							feeName : '规费',
							feeExpr : 'cf(工程排污费))+cf(社会保障费)+cf(住房公积金)+cf(河道管理费)',
							feeResult : '0',
							fee : [
									{
										feeName : '工程排污费',
										feeExpr : 'cf(措施项目清单费用)*f(feeRate)',
										feeRate : '0.0348', // 费率
										feeResult : '0'
									},
									{
										feeName : '社会保障费',
										feeExpr : '200*f(feeRate)',
										feeRate : '0.0348', // 费率
										feeResult : '0'
									},
									{
										feeName : '住房公积金',
										feeExpr : 'cf(措施项目清单费用)*f(feeRate)',
										feeRate : '0.0348', // 费率
										feeResult : '0'
									},
									{
										feeName : '河道管理费',
										feeExpr : '(cf(措施项目清单费用)+cf(其他项目清单费用)+cf(工程排污费)+cf(社会保障费)+cf(住房公积金))*f(feeRate)',
										feeRate : '0.0348', // 费率
										feeResult : '0'
									} ]
						},
						{
							feeName : '税金',
							feeExpr : '(cf(措施项目清单费用)+cf(其他项目清单费用)+cf(规费)-cf(河道管理费))*f(feeRate)',
							feeRate : '0.0348', // 费率
							feeResult : '0'
						} ]
			}, {
				feeName : '工程总造价',
				feeExpr : 'cf(单位工程工程费合计)+cf(单项工程费用合计)',
				feeResult : '0'
			} ],
	'dwgc' : [ // 单位工程
			{
				feeName : '分部分项工程量清单费用',
				feeExpr : '0',
				feeResult : '0'
			},
			{
				feeName : '措施项目清单费用',
				feeExpr : '0',
				feeResult : '0'
			},
			{
				feeName : '其他项目清单费用',
				feeExpr : '0',
				feeResult : '0'
			},
			{
				feeName : '规费',
				feeExpr : 'cf(工程排污费)+cf(社会保障费)+cf(住房公积金)+cf(河道管理费)',
				feeResult : '0',
				fee : [
						{
							feeName : '工程排污费',
							feeExpr : '(cf(分部分项工程量清单费用)+cf(措施项目清单费用))*f(feeRate)',
							feeRate : '0.0348', // 费率
							feeResult : '0'
						},
						{
							feeName : '社会保障费',
							feeExpr : '200*f(feeRate)',
							feeRate : '0.0348', // 费率
							feeResult : '0'
						},
						{
							feeName : '住房公积金',
							feeExpr : '(cf(分部分项工程量清单费用)+cf(措施项目清单费用))*f(feeRate)',
							feeRate : '0.0348', // 费率
							feeResult : '0'
						},
						{
							feeName : '河道管理费',
							feeExpr : '(cf(分部分项工程量清单费用)+cf(措施项目清单费用)+cf(其他项目清单费用)+cf(工程排污费)+cf(社会保障费)+cf(住房公积金))*f(feeRate)',
							feeRate : '0.0348', // 费率
							feeResult : '0'
						} ]
			},
			{
				feeName : '税金',
				feeExpr : '(cf(分部分项工程量清单费用)+cf(措施项目清单费用)+cf(其他项目清单费用)+cf(规费)-cf(河道管理费))*f(feeRate)',
				feeResult : '0',
				feeRate : '0.0348', // 费率
			},
			{
				feeName : '工程总造价',
				feeExpr : 'cf(分部分项工程量清单费用)+cf(措施项目清单费用)+cf(其他项目清单费用)+cf(规费)+cf(税金)',
				feeResult : '0'
			} ],
	'fbfx' : [ { // 分部分项
		feeName : '人工费合价',
		feeExpr : '',
		feeResult : '0'
	}, {
		feeName : '材料费合价',
		feeExpr : '',
		feeResult : '0'
	}, {
		feeName : '机械费合价',
		feeExpr : '',
		feeResult : '0'
	}, {
		feeName : '直接费合价',
		feeExpr : '',
		feeResult : '0'
	}, {
		feeName : '综合合价',
		feeExpr : '',
		feeResult : '0'
	} ],
	'qd' : [ { // 清单
		feeName : '人工费',
		feeExpr : '',
		feeResult : '0'
	}, {
		feeName : '人工费合价',
		feeExpr : '',
		feeResult : '0'
	}, {
		feeName : '材料费',
		feeExpr : '',
		feeResult : '0'
	}, {
		feeName : '材料费合价',
		feeExpr : '',
		feeResult : '0'
	}, {
		feeName : '机械费',
		feeExpr : '',
		feeResult : '0'
	}, {
		feeName : '机械费合价',
		feeExpr : '',
		feeResult : '0'
	}, {
		feeName : '直接费',
		feeExpr : '',
		feeResult : '0'
	}, {
		feeName : '直接费合价',
		feeExpr : '',
		feeResult : '0'
	}, {
		feeName : '综合单价',
		feeExpr : '',
		feeResult : '0'
	}, {
		feeName : '综合合价',
		feeExpr : '',
		feeResult : '0'
	} ],
	'de' : [ // 定额
	         { 
		feeName : '人工费',
		feeExpr : 'sum(ccf(人工,直接费))',
		feeResult : '0'
	}
	,{
		feeName : '人工费合价',
		feeExpr : 'cf(人工费)*c(quantity)',
		feeResult : '0'
	}
	, {
		feeName : '材料费',
		feeExpr : 'sum(ccf(材料,直接费))',
		feeResult : '0'
	}
	, {
		feeName : '材料费合价',
		feeExpr : 'cf(材料费)*c(quantity)',
		feeResult : '0'
	}
	, {
		feeName : '机械费',
		feeExpr : 'sum(ccf(机械,直接费))',
		feeResult : '0'
	}
	, {
		feeName : '机械费合价',
		feeExpr : 'cf(机械费)*c(quantity)',
		feeResult : '0'
	}
	, {
		feeName : '直接费',
		feeExpr : 'cf(人工费)+cf(材料费)+cf(机械费)',
		feeResult : '0'
	}, {
		feeName : '直接费合价',
		feeExpr : 'cf(直接费)*c(quantity)',
		feeResult : '0'
	}
	, {
		feeName : '管理费',
		feeExpr : '1+2',
		feeResult : '0'
	}, {
		feeName : '管理费合价',
		feeExpr : 'cf(管理费)*c(quantity)',
		feeResult : '0'
	}, {
		feeName : '利润',
		feeExpr : '1+2*3',
		feeResult : '0'
	}, {
		feeName : '利润合价',
		feeExpr : 'cf(利润)*c(quantity)',
		feeResult : '0'
	}, {
		feeName : '综合单价',
		feeExpr : 'cf(直接费)+cf(管理费)+cf(利润)',
		feeResult : '0'
	}, {
		feeName : '综合合价',
		feeExpr : 'cf(综合单价)*c(quantity)',
		feeResult : '0'
	} 
	],
	'glj' : [ { // 工料机
		feeName : '直接费',
		feeExpr : 'c(price)*c(content)',
		feeResult : '0'
	} ]
};
// ////////////////////////////////////////////
function App() {

}

App.prototype.createDwgc = function(parentId, callback) {
	var dwgc = {
		type : '单位工程'
	};
	var fs = fees['dwgc'];
	Api.createCost(dwgc, fs, parentId, callback);
}
App.prototype.createDe = function(parentId, callback) {
	var de = {
		type : '定额',
		quantity: Math.random() * 1000
	};
	var fs = fees['de'];
	Api.createCost(de, fs, parentId, callback);
}

App.prototype.createGlj = function(parentId, callback) {
	var types = [ "人工", "材料", "机械" ];
	var glj = {
		'type' : types[Math.floor(Math.random() * 10) % 3],
		'price' : Math.random() * 100,
		'content' : Math.random()
	};
	var fs = fees['glj'];
	Api.createCost(glj, fs, parentId, callback);
}
// //////////////////////////////////////////////////////
var app = new App();

app.createGlj(626, function(err, de){ console.log(de.id);
//	async.times(1, function(n, next){
//		app.createGlj(de.id, function(err, glj){
//			next(err, glj.id);
//		});
//	}, function(err, gljs){
//		console.log(de.id, gljs);
//	});	
});















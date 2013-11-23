//clear db
START n=node(*) 
MATCH n-[r?]-m 
WITH n, r 
DELETE n, r

//query
//all nodes
start n=node(*) return n

//create
start me=node(0), to=node(1,2) create me-[r:ref]->to  return me
start n=node(0), m=node(1,2) match n-[r:ref]->m return r
start n=node(0), m=node(1,2) match n-[r:ref]->m delete r

//glj
create (glj{type:"浜哄伐",price:100,content:0.4}),
	(zjf{feeName:"鐩存帴璐�}),
	glj-[:fee]->zjf

//de
create (de{type:"瀹氶", quantity:100}),
	(rgf{feeName:"浜哄伐璐�}), 
	(rgfhj{feeName:"浜哄伐璐瑰悎浠�}),
	(clf{feeName:"鏉愭枡璐�}), 
	(clfhj{feeName:"鏉愭枡璐瑰悎浠�}),
	(jxf{feeName:"鏈烘璐�}), 
	(jxfhj{feeName:"鏈烘璐瑰悎浠�}),
	(zjf{feeName:"鐩存帴璐�}), 
	(zjfhj{feeName:"鐩存帴璐瑰悎浠�}),
	de-[:fee]->rgf,
	de-[:fee]->rgfhj,
	de-[:fee]->clf,
	de-[:fee]->clfhj,
	de-[:fee]->jxf,
	de-[:fee]->jxfhj,
	de-[:fee]->zjf,
	de-[:fee]->zjfhj
return de

//qd
create (qd{type:"娓呭崟", quantity:200}),
	(rgf{feeName:"浜哄伐璐�}), 
	(rgfhj{feeName:"浜哄伐璐瑰悎浠�}),
	(clf{feeName:"鏉愭枡璐�}), 
	(clfhj{feeName:"鏉愭枡璐瑰悎浠�}),
	(jxf{feeName:"鏈烘璐�}), 
	(jxfhj{feeName:"鏈烘璐瑰悎浠�}),
	(zjf{feeName:"鐩存帴璐�}), 
	(zjfhj{feeName:"鐩存帴璐瑰悎浠�}),
	qd-[:fee]->rgf,
	qd-[:fee]->rgfhj,
	qd-[:fee]->clf,
	qd-[:fee]->clfhj,
	qd-[:fee]->jxf,
	qd-[:fee]->jxfhj,
	qd-[:fee]->zjf,
	qd-[:fee]->zjfhj
return qd

//




//clear db
START n=node(*) 
MATCH n-[r?]-m 
WITH n, r 
DELETE n, r

//query
//all nodes
start n=node(*) return n

//create

//glj
create (glj{type:"人工",price:100,content:0.4}),
	(zjf{feeName:"直接费"}),
	glj-[:fee]->zjf

//de
create (de{type:"定额", quantity:100}),
	(rgf{feeName:"人工费"}), 
	(rgfhj{feeName:"人工费合价"}),
	(clf{feeName:"材料费"}), 
	(clfhj{feeName:"材料费合价"}),
	(jxf{feeName:"机械费"}), 
	(jxfhj{feeName:"机械费合价"}),
	(zjf{feeName:"直接费"}), 
	(zjfhj{feeName:"直接费合价"}),
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
create (qd{type:"清单", quantity:200}),
	(rgf{feeName:"人工费"}), 
	(rgfhj{feeName:"人工费合价"}),
	(clf{feeName:"材料费"}), 
	(clfhj{feeName:"材料费合价"}),
	(jxf{feeName:"机械费"}), 
	(jxfhj{feeName:"机械费合价"}),
	(zjf{feeName:"直接费"}), 
	(zjfhj{feeName:"直接费合价"}),
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




//clear db
START n=node(*) 
MATCH n-[r?]-m 
WITH n, r 
DELETE n, r

//cost query
// (333)-[:costchild]->(334, 335),(334)-[:costchild]->(336, 337),(335)-[:costchild]->(338,339,340)

//create
create 

//parent
start n=node(334) match n<-[:costchild]-parent return parent 

//ancestor
start n=node(336) match n<-[:costchild*]-ancestor return ancestor

//child
start n=node(333) match n-[:costchild]->child return child

//child by type
start n=node(333) match n-[:costchild]->child where child.type! = '人工' return child

//descendant
start n=node(333) match n-[:costchild*]->descendant return descendant

//sibling
start n=node(336) match n<-[:costchild]-parent, parent-[:costchild]->sibling where sibling <> n return sibling

//fees
start n=node(338) match n-[:fee|feechild*]->fees return fees

//fees by name
start n=node(338) match n-[:fee|feechild*]->fees where fees.feeName ! ="直接费" return fees

//fees with name of child with type
start n=node(335) match n-[:costchild]->child, child-[:fee|feechild*]->childfees where child.type! = '人工' and childfees.feeName! = '直接费' return child, childfees

//parent-fees
start n=node(348) match n<-[:costchild]-parent, parent-[:fee|feechild*]->parentfees return parentfees

//ancestor-fees
start n=node(348) match n<-[:costchild*]-ancestor, ancestor-[:fee|feechild*]->ancestorfees return ancestorfees

//child fees
start n=node(335) match n-[:costchild]->child, child-[:fee|feechild*]->childfees return childfees

//descendant fees
start n=node(333) match n-[:costchild*]->descendant, descendant-[:fee|feechild*]->descendantfees return descendantfees

//sibling fees
start n=node(340) match n<-[:costchild]-parent, parent-[:costchild]->sibling, sibling-[:fee|feechild*]->siblingfees where sibling <> n return siblingfees

//all fees ref me (direct or indirect)
start n=node(1078) match n<-[:ref*]-fees return distinct fees

//邻接表
start n=node(1080, 1082, 1081)
match n-[:ref]->f
where id(f) in [1080, 1082, 1081]
return id(n), collect(id(f))


start n=node(1078) 
match n<-[:ref*]-fees, fees-[:ref]->f 
return fees, f

//cost-fees
start n=node({id}) 
match n-[:fee|feechild*]->fees 
where fees.feeExpr=~".*cas\\(key1\\)|c\\(key1\\).*"
return fees

//parent-fees
start cost=node({id}) 
match 
cost<-[:costchild]-parent, 
parent-[:fee|feechild*]->parentfees 
where parentfees.feeExpr=~".*cc\\(type,prop\\).*" 

//sibling-fees
start cost=node({id}) 
match cost<-[:costchild]-parent, parent-[:costchild]->sibling, 
sibling-[:fee|feechild*]->siblingfees where sibling <> cost and siblingfees.feeExpr =~ ".*cs\\({{prop}}\\).*" 
return siblingfees

//descendant_fees
start cost=node({id}) 
match cost-[:costchild*]->descendant, 
descendant-[:fee|feechild*]->descendantfees 
where descendantfees.feeExpr =~ ".*cas\\({{prop}}\\).*" 
return descendantfees

//delete cost
start cost=node(40078)
match cost-[:fee|feechild|costchild*]->m
with cost, m MATCH m-[r?]-()
delete cost, m, r

//get all nodes adn rels
start n=node(*), r=rel(*)
return n, r












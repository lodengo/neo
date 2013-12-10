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




//descendant
start n=node(333) match n-[:costchild*]->descendant return descendant

//sibling
start n=node(336) match n<-[:costchild]-parent, parent-[:costchild]->sibling where sibling <> n return sibling

//fees
start n=node(338) match n-[:fee|feechild*]->fees return fees

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












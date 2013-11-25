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
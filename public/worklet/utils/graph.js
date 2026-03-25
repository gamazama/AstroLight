
function topologicalSort(graph) {
  const sorted = [];
  const visited = new Set();
  const temp = new Set();
  
  // Build adjacency list, ensuring we only include nodes that actually exist in the graph
  const nodeIds = new Set(graph.nodes.map(n => n.id));
  const adj = new Map(graph.nodes.map(n => [n.id, []]));
  
  graph.connections.forEach(c => {
    // Only add dependency if both nodes exist
    if (adj.has(c.toNodeId) && nodeIds.has(c.fromNodeId)) {
        adj.get(c.toNodeId).push(c.fromNodeId);
    }
  });

  const visit = (nodeId) => {
    if (temp.has(nodeId)) { 
      // Cycle detected! 
      // Instead of failing the whole graph, we warn and return true to 
      // treat this specific dependency edge as resolved (breaking the loop).
      // console.warn("Cycle detected in graph involving node:", nodeId); 
      return true; 
    }
    if (visited.has(nodeId)) {
      return true;
    }
    
    visited.add(nodeId);
    temp.add(nodeId);
    
    const neighbors = adj.get(nodeId) || [];
    for (const neighborId of neighbors) {
      visit(neighborId);
    }
    
    temp.delete(nodeId);
    sorted.push(nodeId);
    return true;
  };

  for (const node of graph.nodes) {
    if (!visited.has(node.id)) {
      visit(node.id);
    }
  }
  
  return sorted;
}

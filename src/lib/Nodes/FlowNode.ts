import { Graph } from '../Graphs/Graph.js';
import { Socket } from '../Sockets/Socket.js';
import { Node } from './Node.js';
import { NodeDescription } from './NodeDescription.js';
import { NodeEvalContext } from './NodeEvalContext.js';

export class FlowNode extends Node {
  constructor(
    description: NodeDescription,
    graph: Graph,
    inputSocketList: Socket[],
    outputSocketList: Socket[],
    public readonly flowEvalFunc: (context: NodeEvalContext) => void
  ) {
    // determine if this is an eval node
    super(description, graph, inputSocketList, outputSocketList);
  }
}
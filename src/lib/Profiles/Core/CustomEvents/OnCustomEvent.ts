import { CustomEvent } from '../../../Events/CustomEvent.js';
import { Graph } from '../../../Graphs/Graph.js';
import { Node } from '../../../Nodes/Node.js';
import { NodeDescription } from '../../../Nodes/NodeDescription.js';
import { NodeEvalContext } from '../../../Nodes/NodeEvalContext.js';
import { Socket } from '../../../Sockets/Socket.js';

export class OnCustomEvent extends Node {
  public static GetDescription(graph: Graph, customEventId: string) {
    const customEvent = graph.customEvents[customEventId];
    return new NodeDescription(
      `customEvent/ontriggered/${customEvent.id}`,
      'Event',
      `On ${customEvent.name}`,
      (nodeDescription, graph) =>
        new OnCustomEvent(nodeDescription, graph, customEvent)
    );
  }

  constructor(
    nodeDescription: NodeDescription,
    graph: Graph,
    public readonly customEvent: CustomEvent
  ) {
    super(
      nodeDescription,
      graph,
      [],
      [
        new Socket('flow', 'flow'),
        ...customEvent.parameters.map(
          (parameter) =>
            new Socket(parameter.valueTypeName, parameter.name, parameter.value)
        )
      ],
      (context: NodeEvalContext) => {
        customEvent.eventEmitter.addListener((parameters) => {
          Object.keys(parameters).forEach((parameterName) =>
            context.writeOutput(parameterName, parameters[parameterName])
          );
          context.commit('flow');
        });
      }
    );

    // TODO replace with analysis of category, if Event, then evaluate on startup, it is async and interruptable.
    this.evaluateOnStartup = true;
    this.async = true;
    this.interruptibleAsync = true;
  }
}
import { Assert } from '../../../Diagnostics/Assert.js';
import { CustomEvent } from '../../../Events/CustomEvent.js';
import { Engine } from '../../../Execution/Engine.js';
import { Graph } from '../../../Graphs/Graph.js';
import { EventNode } from '../../../Nodes/EventNode.js';
import { NodeDescription } from '../../../Nodes/Registry/NodeDescription.js';
import { Socket } from '../../../Sockets/Socket.js';

export class OnCustomEvent extends EventNode {
  public static GetDescription(graph: Graph, customEventId: string) {
    const customEvent = graph.customEvents[customEventId];
    return new NodeDescription(
      `customEvent/onTriggered/${customEvent.id}`,
      'Event',
      `On ${customEvent.name}`,
      (description, graph) => new OnCustomEvent(description, graph, customEvent)
    );
  }

  constructor(
    description: NodeDescription,
    graph: Graph,
    public readonly customEvent: CustomEvent
  ) {
    super(
      description,
      graph,
      [],
      [
        new Socket('flow', 'flow'),
        ...customEvent.parameters.map(
          (parameter) =>
            new Socket(
              parameter.valueTypeName,
              parameter.name,
              parameter.value,
              parameter.label
            )
        )
      ]
    );
  }
  private onCustomEvent:
    | ((parameters: { [parameter: string]: any }) => void)
    | undefined = undefined;

  init(engine: Engine) {
    Assert.mustBeTrue(this.onCustomEvent === undefined);

    this.onCustomEvent = (parameters) => {
      this.customEvent.parameters.forEach((parameterSocket) => {
        if (!(parameterSocket.name in parameters)) {
          throw new Error(
            `parameters of custom event do not align with parameters of custom event node, missing ${parameterSocket.name}`
          );
        }
        this.writeOutput(
          parameterSocket.name,
          parameters[parameterSocket.name]
        );
      });
      engine.commitToNewFiber(this, 'flow');
    };
    this.customEvent.eventEmitter.addListener(this.onCustomEvent);
  }

  dispose(engine: Engine) {
    Assert.mustBeTrue(this.onCustomEvent !== undefined);
    if (this.onCustomEvent !== undefined) {
      this.customEvent.eventEmitter.removeListener(this.onCustomEvent);
    }
  }
}

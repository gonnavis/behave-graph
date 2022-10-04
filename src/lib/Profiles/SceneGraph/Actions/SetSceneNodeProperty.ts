import { Object3D } from 'three';

import { Node } from '../../../Nodes/Node';
import { IThree } from '../../../Providers/IThree';
import { Socket } from '../../../Sockets/Socket';

export class SetSceneNodeProperty<T> extends Node {
  constructor(
    nodeName: string,
    public readonly valueTypeName: string,
    setter: (node: Object3D, value: T) => void
  ) {
    super(
      'Action',
      nodeName,
      [
        new Socket('flow', 'flow'),
        new Socket('id', 'nodeId'),
        new Socket(valueTypeName, 'value')
      ],
      [new Socket('flow', 'flow')],
      (context) => {
        const three =
          context.graph.registry.implementations.get<IThree>('IThree');
        const object3D = three.getObject3D(context.readInput('modeId'));
        setter(object3D, context.readInput('value'));
      }
    );
  }
}

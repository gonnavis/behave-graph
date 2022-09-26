import exampleDelay from '../../../../examples/core/async/Delay.json';
import exampleBranch from '../../../../examples/core/flow/Branch.json';
import exampleFlipFlop from '../../../../examples/core/flow/FlipFlop.json';
import exampleForLoop from '../../../../examples/core/flow/ForLoop.json';
import exampleSequence from '../../../../examples/core/flow/Sequence.json';
import exampleHelloWorld from '../../../../examples/core/HelloWorld.json';
import exampleMath from '../../../../examples/core/logic/Math.json';
import exampleState from '../../../../examples/core/variables/SetGet.json';
import Logger from '../../Diagnostics/Logger';
import registerCoreProfile from '../../Profiles/Core/registerCoreProfile';
import Registry from '../../Registry';
import { GraphJSON } from './GraphJSON';
import readGraphFromJSON from './readGraphFromJSON';

const registry = new Registry();
registerCoreProfile(registry);

Logger.onWarn.clear();

describe('readGraphFromJSON', () => {
  it('throws if node ids are not unique', () => {
    const json = {
      variables: [],
      customEvents: [],
      nodes: [
        {
          type: 'lifecycle/start',
          id: '0',
        },
        {
          type: 'action/log',
          id: '0',
        },
      ],
    };
    expect(() => readGraphFromJSON(json, registry)).toThrow();
  });

  it('throws if input keys don\'t match known sockets', () => {
    const json = {
      variables: [],
      customEvents: [],
      nodes: [
        {
          type: 'action/log',
          id: '1',
          inputs: {
            wrong: { value: 'Hello World!' },
          },
        },
      ],
    };
    expect(() => readGraphFromJSON(json, registry)).toThrow();
  });

  it('throws if input points to non-existent node', () => {
    const json = {
      variables: [],
      customEvents: [],
      nodes: [
        {
          type: 'lifecycle/start',
          id: '0',
        },
        {
          type: 'action/log',
          id: '1',
          inputs: {
            flow: { links: [{ nodeId: '2', socket: 'flow' }] },
            text: { value: 'Hello World!' },
          },
        },
      ],
    };
    expect(() => readGraphFromJSON(json, registry)).toThrow();
  });

  it('throws if input points to non-existent socket', () => {
    const json = {
      variables: [],
      customEvents: [],
      nodes: [
        {
          type: 'lifecycle/start',
          id: '0',
        },
        {
          type: 'action/log',
          id: '1',
          inputs: {
            flow: { links: [{ nodeId: '0', socket: 'text' }] },
            text: { value: 'Hello World!' },
          },
        },
      ],
    };
    expect(() => readGraphFromJSON(json, registry)).toThrow();
  });

  it('parses all the examples without error', () => {
    const examples = [exampleBranch, exampleDelay, exampleHelloWorld, exampleMath,
      exampleState, exampleForLoop, exampleSequence, exampleFlipFlop] as GraphJSON[];

    examples.forEach((json) => {
      expect(() => readGraphFromJSON(json, registry)).not.toThrow();
    });
  });
});

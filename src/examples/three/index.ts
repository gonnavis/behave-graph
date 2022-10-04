/* eslint-disable no-param-reassign */
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader.js';

import {
  DefaultLogger,
  GraphEvaluator,
  Logger,
  ManualLifecycleEventEmitter,
  readGraphFromJSON,
  registerCoreProfile,
  registerSceneGraphProfile,
  Registry,
  validateDirectedAcyclicGraph,
  validateGraphRegistry,
  validateLinks
} from '../../lib';

let camera: THREE.PerspectiveCamera | null = null;
let scene: THREE.Scene | null = null;
let renderer: THREE.WebGLRenderer | null = null;

function render() {
  if (camera !== null && renderer !== null && scene !== null) {
    renderer.render(scene, camera);
  }
}

function onWindowResize() {
  if (camera !== null && renderer !== null) {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize(window.innerWidth, window.innerHeight);

    render();
  }
}

//

async function main() {
  Logger.onVerbose.clear();

  const registry = new Registry();
  registerCoreProfile(registry);
  registerSceneGraphProfile(registry);

  const urlSearchParams = new URLSearchParams(window.location.search);
  const graphName = urlSearchParams.get('graph');
  const graphJsonPath = `/examples/core/basics/${graphName}.json`;
  if (graphJsonPath === undefined) {
    throw new Error('no path specified');
  }

  Logger.verbose(`reading behavior graph: ${graphJsonPath}`);
  const json = await (await fetch(graphJsonPath)).json();
  const graph = readGraphFromJSON(json, registry);
  graph.name = graphJsonPath;

  // await fs.writeFile('./examples/test.json', JSON.stringify(writeGraphToJSON(graph), null, ' '), { encoding: 'utf-8' });
  Logger.verbose('validating:');
  const errorList: string[] = [];
  Logger.verbose('validating registry');
  errorList.push(...validateGraphRegistry(registry));
  Logger.verbose('validating socket links have matching types on either end');
  errorList.push(...validateLinks(graph));
  Logger.verbose('validating that graph is directed acyclic');
  errorList.push(...validateDirectedAcyclicGraph(graph));

  if (errorList.length > 0) {
    Logger.error(`${errorList.length} errors found:`);
    errorList.forEach((errorText, errorIndex) => {
      Logger.error(`${errorIndex}: ${errorText}`);
    });
    return;
  }

  const container = document.createElement('div');
  document.body.appendChild(container);

  camera = new THREE.PerspectiveCamera(
    45,
    window.innerWidth / window.innerHeight,
    0.25,
    20
  );
  camera.position.set(-1.8, 0.6, 2.7);

  const localScene = new THREE.Scene();
  scene = localScene;

  new RGBELoader()
    .setPath('textures/equirectangular/')
    .load('royal_esplanade_1k.hdr', (texture) => {
      texture.mapping = THREE.EquirectangularReflectionMapping;

      localScene.background = texture;
      localScene.environment = texture;

      render();

      // model

      const loader = new GLTFLoader().setPath(
        'models/gltf/DamagedHelmet/glTF/'
      );
      loader.load('DamagedHelmet.gltf', (gltf) => {
        localScene.add(gltf.scene);

        render();
      });
    });

  const localRenderer = new THREE.WebGLRenderer({ antialias: true });
  localRenderer.setPixelRatio(window.devicePixelRatio);
  localRenderer.setSize(window.innerWidth, window.innerHeight);
  localRenderer.toneMapping = THREE.ACESFilmicToneMapping;
  localRenderer.toneMappingExposure = 1;
  localRenderer.outputEncoding = THREE.sRGBEncoding;
  container.appendChild(localRenderer.domElement);

  renderer = localRenderer;

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.addEventListener('change', render); // use if there is no animation loop
  controls.minDistance = 2;
  controls.maxDistance = 10;
  controls.target.set(0, 0, -0.2);
  controls.update();

  window.addEventListener('resize', onWindowResize);

  Logger.verbose('creating behavior graph');
  const graphEvaluator = new GraphEvaluator(graph);

  registry.implementations.register('ILogger', new DefaultLogger());
  const manualLifecycleEventEmitter = new ManualLifecycleEventEmitter();
  registry.implementations.register(
    'ILifecycleEventEmitter',
    manualLifecycleEventEmitter
  );

  // const startTime = Date.now();

  Logger.verbose('initialize graph');
  let numSteps = await graphEvaluator.executeAll();

  Logger.verbose('triggering start event');
  manualLifecycleEventEmitter.startEvent.emit();

  Logger.verbose('executing all (async)');
  numSteps += await graphEvaluator.executeAllAsync(5.0);

  for (let tick = 0; tick < 5; tick++) {
    Logger.verbose('triggering tick');
    manualLifecycleEventEmitter.tickEvent.emit();

    Logger.verbose('executing all (async)');
    // eslint-disable-next-line no-await-in-loop
    numSteps += await graphEvaluator.executeAllAsync(5.0);
  }

  Logger.verbose('triggering end event');
  manualLifecycleEventEmitter.endEvent.emit();

  Logger.verbose('executing all (async)');
  numSteps += await graphEvaluator.executeAllAsync(5.0);

  // const deltaTime = Date.now() - startTime;

  // Logger.info(`  ${numSteps} nodes executed in ${deltaTime / 1000} seconds, at a rate of ${Math.round((numSteps * 1000) / deltaTime)} steps/second`);
}

main();
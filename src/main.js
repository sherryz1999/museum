// src/main.js
// Minimal museum scene (fresh start) with the provided Google Slides iframe embedded
// on the right wall at pixel size 94x100 using CSS3DRenderer.

import * as THREE from 'https://unpkg.com/three@0.159.0/build/three.module.js';
import { OrbitControls } from 'https://unpkg.com/three@0.159.0/examples/jsm/controls/OrbitControls.js';
import { CSS3DRenderer, CSS3DObject } from 'https://unpkg.com/three@0.159.0/examples/jsm/renderers/CSS3DRenderer.js';

// --- Basic scene config ---
const ROOM = { width: 20, height: 4, depth: 12 };

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.body.appendChild(renderer.domElement);

// CSS3D renderer sits above WebGL canvas. We keep pointerEvents none on the container
// and enable pointer events only on the iframe element so mouse controls still work.
const cssRenderer = new CSS3DRenderer();
cssRenderer.domElement.style.position = 'absolute';
cssRenderer.domElement.style.top = '0';
cssRenderer.domElement.style.left = '0';
cssRenderer.domElement.style.zIndex = '5';
cssRenderer.domElement.style.pointerEvents = 'none';
document.body.appendChild(cssRenderer.domElement);

// --- Fix: create cssScene for CSS3D objects ---
const cssScene = new THREE.Scene();

const scene = new THREE.Scene();
scene.background = new THREE.Color(0xf8f8f8);

const camera = new THREE.PerspectiveCamera(60, 2, 0.1, 200);
camera.position.set(0, 1.6, ROOM.depth / 2 + 3.0);

const controls = new OrbitControls(camera, renderer.domElement);
controls.target.set(0, 1.6, 0);
controls.enableDamping = true;

// --- Lights ---
scene.add(new THREE.AmbientLight(0xffffff, 0.6));
const dir = new THREE.DirectionalLight(0xffffff, 0.5);
dir.position.set(-5, ROOM.height * 0.9, 5);
scene.add(dir);

// --- Room (floor + walls) ---
function makePlane(w, h, color) {
  const mat = new THREE.MeshStandardMaterial({ color, side: THREE.DoubleSide });
  const geo = new THREE.PlaneGeometry(w, h);
  return new THREE.Mesh(geo, mat);
}

const floor = makePlane(ROOM.width, ROOM.depth, 0xede6dd);
floor.rotation.x = -Math.PI / 2;
floor.position.y = 0;
floor.receiveShadow = true;
scene.add(floor);

const ceiling = makePlane(ROOM.width, ROOM.depth, 0xf0f0f0);
ceiling.rotation.x = Math.PI / 2;
ceiling.position.y = ROOM.height;
scene.add(ceiling);

const backWall = makePlane(ROOM.width, ROOM.height, 0x0f6b58); // emerald-ish
backWall.position.z = -ROOM.depth / 2;
backWall.position.y = ROOM.height / 2;
scene.add(backWall);

// left wall (interior)
const leftWall = makePlane(ROOM.depth, ROOM.height, 0xffffff);
leftWall.rotation.y = Math.PI / 2;
leftWall.position.x = -ROOM.width / 2;
leftWall.position.y = ROOM.height / 2;
scene.add(leftWall);

// right wall (interior) - we'll put the CSS3D iframe in front of this wall
const rightWall = makePlane(ROOM.depth, ROOM.height, 0xffffff);
rightWall.rotation.y = -Math.PI / 2;
rightWall.position.x = ROOM.width / 2;
rightWall.position.y = ROOM.height / 2;
scene.add(rightWall);

// front wall with simple door opening (kept minimal)
const frontWall = makePlane(ROOM.width, ROOM.height, 0x0f6b58);
frontWall.position.z = ROOM.depth / 2;
frontWall.position.y = ROOM.height / 2;
frontWall.rotation.y = Math.PI;
scene.add(frontWall);

// --- Add the Google Slides iframe as a CSS3DObject on the RIGHT wall ---
// Use the exact iframe URL and size requested (94 x 100)
const SLIDE_IFRAME_SRC = 'https://docs.google.com/presentation/d/e/2PACX-1vT0SUWPd9MwElcdH1FiH5AcQ8_oiqvHqg4xa_tnSB9lVh34-TzYnae4Ji5jPj_XLQ/pubembed?start=true&loop=false&delayms=3000';
const IFRAME_PX_W = 94;
const IFRAME_PX_H = 100;

// create container element
const slideContainer = document.createElement('div');
slideContainer.style.width = IFRAME_PX_W + 'px';
slideContainer.style.height = IFRAME_PX_H + 'px';
slideContainer.style.overflow = 'hidden';
slideContainer.style.border = '0';
slideContainer.style.boxSizing = 'border-box';
slideContainer.style.pointerEvents = 'auto'; // enable interactions inside iframe

// create iframe
const slideIframe = document.createElement('iframe');
slideIframe.src = SLIDE_IFRAME_SRC;
slideIframe.frameBorder = '0';
slideIframe.width = String(IFRAME_PX_W);
slideIframe.height = String(IFRAME_PX_H);
slideIframe.allowFullscreen = true;
slideIframe.setAttribute('mozallowfullscreen', 'true');
slideIframe.setAttribute('webkitallowfullscreen', 'true');
slideIframe.style.display = 'block';
slideIframe.style.width = '100%';
slideIframe.style.height = '100%';
slideIframe.style.border = '0';
slideContainer.appendChild(slideIframe);

// create CSS3DObject and position it on the right wall (centered vertically)
const cssObject = new CSS3DObject(slideContainer);

// Position: match the rightWall mesh location and orientation
// rightWall is at x = ROOM.width/2, y = ROOM.height/2, z = 0 and rotated -PI/2
cssObject.position.set(ROOM.width / 2 - 0.01, ROOM.height / 2, 0); // slight inward nudge
cssObject.rotation.y = -Math.PI / 2;
cssScene.add(cssObject);

// --- Resize handling ---
function onResize() {
  const w = window.innerWidth;
  const h = window.innerHeight;
  renderer.setSize(w, h);
  cssRenderer.setSize(w, h);
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
}
window.addEventListener('resize', onResize);
onResize();

// --- Animation loop ---
function animate() {
  requestAnimationFrame(animate);
  controls.update();
  renderer.render(scene, camera);
  cssRenderer.render(cssScene, camera);
}
animate();

// --- Helpful console info ---
console.log('Google Slides iframe embedded on right wall at pixel size', IFRAME_PX_W + 'x' + IFRAME_PX_H);

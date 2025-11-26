// src/main.js
// Museum scene — Emerald exterior theme, portraits, door.
// Update: ensure back-wall landscape frames are visible.
// - Force the back-wall frames to face the room (rotationY = Math.PI).
// - Nudge frames slightly in front of the back wall to avoid z-fighting.
// - Improve texture-load logging and show a high-contrast fallback material when load fails.

import * as THREE from 'https://unpkg.com/three@0.159.0/build/three.module.js';
import { OrbitControls } from 'https://unpkg.com/three@0.159.0/examples/jsm/controls/OrbitControls.js';

const canvasContainer = document.body;

// --- Configuration ---
const YOUTUBE_VIDEO_ID = 'FXTDo0TEp6Q';
const PORTRAIT_FILES = ['IMG_3400.JPG', 'IMG_3402.JPG', 'IMG_3403.JPG'];
const PORTRAIT_DESCRIPTIONS = {
  'IMG_3400.JPG': 'Portrait 1 — description editable here or by double-clicking.',
  'IMG_3402.JPG': 'Portrait 2 — replace this text with your description.',
  'IMG_3403.JPG': 'Portrait 3 — replace this text with your description.'
};

// PDF to display (preview + click to open full)
const PDF_URL = 'https://sherryz1999.github.io/museum/CatFoodDrive.pdf';

// Room size
const ROOM = { width: 20, height: 4, depth: 12 };
// Gap from wall
const GAP_WORLD_UNITS = 1;

// --- Renderer (WebGL) ---
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.body.appendChild(renderer.domElement);

// --- Scene & Camera ---
const scene = new THREE.Scene();
scene.background = new THREE.Color(0xf8f8f8);
const camera = new THREE.PerspectiveCamera(60, 2, 0.1, 200);
camera.position.set(0, 1.6, ROOM.depth / 2 + 2.5);

// --- Controls ---
const controls = new OrbitControls(camera, renderer.domElement);
controls.target.set(0, 1.6, 0);
controls.enableDamping = true;
controls.minDistance = 1.5;
controls.maxDistance = 50;

// --- Lighting ---
const ambient = new THREE.AmbientLight(0xffffff, 0.6);
scene.add(ambient);

const dir = new THREE.DirectionalLight(0xffffff, 0.6);
dir.position.set(-5, ROOM.height * 0.9, 5);
dir.castShadow = true;
dir.shadow.camera.left = -20; dir.shadow.camera.right = 20;
dir.shadow.camera.top = 20; dir.shadow.camera.bottom = -20;
dir.shadow.mapSize.set(2048, 2048);
dir.shadow.bias = -0.00005;
scene.add(dir);

const hemi = new THREE.HemisphereLight(0xffffff, 0x444444, 0.35);
hemi.position.set(0, ROOM.height, 0);
scene.add(hemi);

const fill = new THREE.DirectionalLight(0xffffff, 0.25);
fill.position.set(0, ROOM.height * 0.8, -1);
fill.castShadow = false;
scene.add(fill);

// --- Palette ---
const EMERALD_PRIMARY = 0x0f6b58;
const EMERALD_ACCENT = 0x7fcfb1;
const OUTSIDE_TRIM = 0x734b2b;

// --- Room planes helper ---
function makePlane(w, h, color) {
  const mat = new THREE.MeshStandardMaterial({ color, side: THREE.DoubleSide });
  const geo = new THREE.PlaneGeometry(w, h);
  return new THREE.Mesh(geo, mat);
}

// floor / ceiling / walls
const floor = makePlane(ROOM.width, ROOM.depth, 0xede6dd);
floor.rotation.x = -Math.PI / 2; floor.position.y = 0; floor.receiveShadow = true; scene.add(floor);
const ceiling = makePlane(ROOM.width, ROOM.depth, 0xf0f0f0); ceiling.rotation.x = Math.PI / 2; ceiling.position.y = ROOM.height; scene.add(ceiling);
const backWall = makePlane(ROOM.width, ROOM.height, EMERALD_PRIMARY);
backWall.position.z = -ROOM.depth / 2; backWall.position.y = ROOM.height / 2; scene.add(backWall);

const leftWall = makePlane(ROOM.depth, ROOM.height, 0xffffff);
leftWall.rotation.y = Math.PI / 2; leftWall.position.x = -ROOM.width / 2; leftWall.position.y = ROOM.height / 2; scene.add(leftWall);

const rightWall = makePlane(ROOM.depth, ROOM.height, 0xffffff);
rightWall.rotation.y = -Math.PI / 2; rightWall.position.x = ROOM.width / 2; rightWall.position.y = ROOM.height / 2; scene.add(rightWall);

// --- Loader ---
const loader = new THREE.TextureLoader();
if (typeof loader.setCrossOrigin === 'function') {
  try { loader.setCrossOrigin('anonymous'); } catch (e) {}
}
loader.crossOrigin = 'anonymous';

// --- Frame creation (same as before) with improved texture error handling ---
function createFrame({
  x = 0, y = 1.6, z = -ROOM.depth / 2 + 0.01,
  openingWidth = 3.2, openingHeight = 1.8,
  frameDepth = 0.08, frameBorderThickness = 0.12, matInset = 0.12,
  videoId = '', title = '', rotationY = 0, imageUrl = '', isPortrait = false, userdata = {}
} = {}) {
  const outerW = openingWidth + frameBorderThickness * 2;
  const outerH = openingHeight + frameBorderThickness * 2;

  const shape = new THREE.Shape();
  shape.moveTo(-outerW / 2, -outerH / 2);
  shape.lineTo(-outerW / 2, outerH / 2);
  shape.lineTo(outerW / 2, outerH / 2);
  shape.lineTo(outerW / 2, -outerH / 2);
  shape.lineTo(-outerW / 2, -outerH / 2);

  const hole = new THREE.Path();
  hole.moveTo(-openingWidth / 2, -openingHeight / 2);
  hole.lineTo(-openingWidth / 2, openingHeight / 2);
  hole.lineTo(openingWidth / 2, openingHeight / 2);
  hole.lineTo(openingWidth / 2, -openingHeight / 2);
  hole.lineTo(-openingWidth / 2, -openingHeight / 2);
  shape.holes.push(hole);

  const extrudeSettings = { depth: frameDepth, bevelEnabled: true, bevelThickness: 0.01, bevelSize: 0.01, bevelSegments: 1, steps: 1 };
  const frameGeo = new THREE.ExtrudeGeometry(shape, extrudeSettings);

  const group = new THREE.Group();

  const frameMat = new THREE.MeshStandardMaterial({ color: 0x5a3b2a, roughness: 0.6, metalness: 0.02 });
  const frameMesh = new THREE.Mesh(frameGeo, frameMat);
  frameMesh.castShadow = !isPortrait;
  frameMesh.receiveShadow = true;
  frameMesh.position.set(0, 0, -frameDepth / 2);
  group.add(frameMesh);

  const matW = openingWidth - matInset * 2;
  const matH = openingHeight - matInset * 2;
  const matGeo = new THREE.PlaneGeometry(matW, matH);
  const matMesh = new THREE.Mesh(matGeo, new THREE.MeshStandardMaterial({ color: 0xffffff }));
  matMesh.position.set(0, 0, frameDepth / 2 + 0.005);
  matMesh.castShadow = false;
  group.add(matMesh);

  const thumbGeo = new THREE.PlaneGeometry(matW - 0.02, matH - 0.02);
  const placeholder = new THREE.MeshBasicMaterial({ color: 0x111111 });
  const thumbMesh = new THREE.Mesh(thumbGeo, placeholder);
  thumbMesh.castShadow = !isPortrait;
  thumbMesh.receiveShadow = true;
  thumbMesh.userData = Object.assign({ type: isPortrait ? 'portrait' : 'video-frame', videoId, title }, userdata);
  thumbMesh.position.set(0, 0, frameDepth / 2 + 0.01);
  group.add(thumbMesh);

  if (imageUrl) {
    const absUrl = (new URL(imageUrl, window.location.href)).href;
    loader.load(
      absUrl,
      (tex) => {
        tex.encoding = THREE.sRGBEncoding;
        thumbMesh.material = new THREE.MeshBasicMaterial({ map: tex });
        thumbMesh.material.needsUpdate = true;
        thumbMesh.userData.imageUrl = absUrl;
        console.log('Loaded frame image:', absUrl);
      },
      undefined,
      (err) => {
        console.warn('Failed to load image for frame (will show fallback):', absUrl, err);
        // set a visible fallback material so the frame is always visible
        thumbMesh.material = new THREE.MeshBasicMaterial({ color: 0xffcc00 });
        thumbMesh.material.needsUpdate = true;
        thumbMesh.userData.imageUrl = '';
      }
    );
  } else if (videoId) {
    const thumbUrl = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
    loader.load(thumbUrl, (tex) => {
      tex.encoding = THREE.sRGBEncoding;
      thumbMesh.material = new THREE.MeshBasicMaterial({ map: tex });
      thumbMesh.material.needsUpdate = true;
    }, undefined, () => {});
  }

  const glassMat = new THREE.MeshPhongMaterial({ color: 0xffffff, transparent: true, opacity: 0.04 });
  const glassMesh = new THREE.Mesh(thumbGeo.clone(), glassMat);
  glassMesh.position.set(0, 0, frameDepth / 2 + 0.017);
  glassMesh.castShadow = false;
  group.add(glassMesh);

  const rimGeo = new THREE.BoxGeometry(outerW + 0.002, outerH + 0.002, 0.004);
  const rimMat = new THREE.MeshStandardMaterial({ color: 0x2c1f17, roughness: 0.7 });
  const rimMesh = new THREE.Mesh(rimGeo, rimMat);
  rimMesh.position.set(0, 0, -frameDepth / 2 - 0.002);
  rimMesh.castShadow = !isPortrait;
  group.add(rimMesh);

  group.position.set(x, y, z);
  group.rotation.y = rotationY;
  scene.add(group);

  thumbMesh.userData._group = group;
  if (!thumbMesh.userData.imageUrl) thumbMesh.userData.imageUrl = imageUrl ? (new URL(imageUrl, window.location.href)).href : '';
  return thumbMesh;
}

// --- Add main interior frames (center + decorations) ---
createFrame({ x: 0, y: 1.6, z: -ROOM.depth / 2 + 0.06, openingWidth: 3.2, openingHeight: 1.8, videoId: YOUTUBE_VIDEO_ID, title: 'Violin Performance', rotationY: 0 });
createFrame({ x: 4.2, y: 1.6, z: -ROOM.depth / 2 + 0.06, openingWidth: 3.2, openingHeight: 1.8, title: 'Art 2', rotationY: 0 });
createFrame({ x: -4.2, y: 1.6, z: -ROOM.depth / 2 + 0.06, openingWidth: 3.2, openingHeight: 1.8, title: 'Art 1', rotationY: 0 });

// --- NEW: two landscape pictures on the back wall (left and right of center) ---
// Important: frames must face into the room. set rotationY = Math.PI so the frame front faces +Z (camera side).
// Also nudge them a bit in front of the back wall to avoid z-fighting.

const BACK_OFFSET = 0.08; // small nudge in front of back wall

// Left landscape image (to the left side of the back wall)
createFrame({
  x: -3.8,
  y: 1.6,
  z: -ROOM.depth / 2 + BACK_OFFSET,
  openingWidth: 2.4,
  openingHeight: 1.4,
  frameDepth: 0.06,
  frameBorderThickness: 0.06,
  matInset: 0.06,
  rotationY: Math.PI, // face into the room
  imageUrl: 'https://sherryz1999.github.io/museum/IMG_3401.JPG',
  title: 'Back Left - Landscape'
});

// Right landscape image (to the right side of the back wall)
createFrame({
  x: 3.8,
  y: 1.6,
  z: -ROOM.depth / 2 + BACK_OFFSET,
  openingWidth: 2.4,
  openingHeight: 1.4,
  frameDepth: 0.06,
  frameBorderThickness: 0.06,
  matInset: 0.06,
  rotationY: Math.PI, // face into the room
  imageUrl: 'https://sherryz1999.github.io/museum/IMG_34012.JPG',
  title: 'Back Right - Landscape'
});

// --- Portraits on left wall ---
const portraitCount = PORTRAIT_FILES.length;
if (portraitCount > 0) {
  const padding = 0.6;
  const usableDepth = ROOM.depth - padding * 2 - GAP_WORLD_UNITS * 2;
  const segment = portraitCount === 1 ? 0 : usableDepth / (portraitCount - 1);
  const portraitFrameDepth = 0.06;
  const leftX = -ROOM.width / 2 + GAP_WORLD_UNITS + portraitFrameDepth / 2;
  const portraitY = ROOM.height / 2;

  for (let i = 0; i < portraitCount; i++) {
    const file = PORTRAIT_FILES[i];
    const z = -ROOM.depth / 2 + padding + GAP_WORLD_UNITS + segment * i;
    const imageUrl = new URL(file, window.location.href).href;
    const mesh = createFrame({
      x: leftX, y: portraitY, z: z,
      openingWidth: 1.2, openingHeight: 1.8, frameDepth: portraitFrameDepth,
      frameBorderThickness: 0.08, matInset: 0.08,
      rotationY: Math.PI / 2, imageUrl: imageUrl, isPortrait: true, userdata: { filename: file }
    });
    mesh.userData.filename = file;
    mesh.userData.description = PORTRAIT_DESCRIPTIONS[file] || '';
  }
}

// --- Front wall with door (unchanged) ---
const DOOR_WIDTH = 2.2, DOOR_HEIGHT = 2.2, DOOR_DEPTH = 0.08;
const leftSegW = (ROOM.width - DOOR_WIDTH) / 2;
const rightSegW = leftSegW;
const wallH = ROOM.height;

const frontLeft = new THREE.Mesh(new THREE.PlaneGeometry(leftSegW, wallH), new THREE.MeshStandardMaterial({ color: EMERALD_PRIMARY, side: THREE.DoubleSide }));
frontLeft.position.set(-ROOM.width / 2 + leftSegW / 2, wallH / 2, ROOM.depth / 2);
frontLeft.rotation.y = Math.PI; scene.add(frontLeft);

const frontRight = new THREE.Mesh(new THREE.PlaneGeometry(rightSegW, wallH), new THREE.MeshStandardMaterial({ color: EMERALD_PRIMARY, side: THREE.DoubleSide }));
frontRight.position.set(ROOM.width / 2 - rightSegW / 2, wallH / 2, ROOM.depth / 2);
frontRight.rotation.y = Math.PI; scene.add(frontRight);

const doorFrameThickness = 0.06;
const doorFrameMat = new THREE.MeshStandardMaterial({ color: OUTSIDE_TRIM, roughness: 0.6 });
const frameGroup = new THREE.Group();
const frameLeft = new THREE.Mesh(new THREE.BoxGeometry(doorFrameThickness, DOOR_HEIGHT + 0.02, DOOR_DEPTH + 0.01), doorFrameMat);
frameLeft.position.set(-DOOR_WIDTH / 2 - doorFrameThickness / 2, 0, 0);
const frameRight = frameLeft.clone(); frameRight.position.x = DOOR_WIDTH / 2 + doorFrameThickness / 2;
const frameTop = new THREE.Mesh(new THREE.BoxGeometry(DOOR_WIDTH + doorFrameThickness * 2, doorFrameThickness, DOOR_DEPTH + 0.01), doorFrameMat);
frameTop.position.set(0, DOOR_HEIGHT / 2 + doorFrameThickness / 2, 0);
frameGroup.add(frameLeft, frameRight, frameTop);
frameGroup.position.set(0, DOOR_HEIGHT / 2, ROOM.depth / 2 - 0.001); frameGroup.rotation.y = Math.PI; scene.add(frameGroup);

const doorGroup = new THREE.Group();
doorGroup.position.set(-DOOR_WIDTH / 2, DOOR_HEIGHT / 2, ROOM.depth / 2 + 0.005); doorGroup.rotation.y = 0; scene.add(doorGroup);

const doorGeo = new THREE.BoxGeometry(DOOR_WIDTH, DOOR_HEIGHT, DOOR_DEPTH);
const doorMat = new THREE.MeshStandardMaterial({ color: OUTSIDE_TRIM, roughness: 0.5 });
const doorMesh = new THREE.Mesh(doorGeo, doorMat);
doorMesh.position.set(DOOR_WIDTH / 2, 0, -DOOR_DEPTH / 2); doorMesh.castShadow = true; doorMesh.receiveShadow = true; doorMesh.userData = { type: 'door' }; doorGroup.add(doorMesh);

const knob = new THREE.Mesh(new THREE.SphereGeometry(0.04, 12, 12), new THREE.MeshStandardMaterial({ color: 0xcccc99 }));
knob.position.set(DOOR_WIDTH - 0.22, 0, 0.03); doorMesh.add(knob);

let doorOpen = false; let doorTargetRotation = 0; const DOOR_OPEN_ANGLE = -Math.PI / 2 + 0.05;
function toggleDoor() { doorOpen = !doorOpen; doorTargetRotation = doorOpen ? DOOR_OPEN_ANGLE : 0; }

// --- Image modal & interactions (unchanged) ---
// ... (modal, raycast handlers) ...

// simple resize/render
function onResize() { const w = window.innerWidth; const h = window.innerHeight; renderer.setSize(w, h); camera.aspect = w / h; camera.updateProjectionMatrix(); }
window.addEventListener('resize', onResize);
onResize();

function animate() {
  requestAnimationFrame(animate);
  controls.update();
  renderer.render(scene, camera);
}
animate();

// Helpful debugging note
console.log('Back-wall frames created at z =', -ROOM.depth / 2 + BACK_OFFSET, 'with rotationY = Math.PI.');
console.log('If the back-wall pictures are still invisible:');
console.log('- Open DevTools Console and look for "Failed to load image for frame" warnings.');
console.log('- Verify the two image URLs are correct and publicly reachable:');
console.log('  https://sherryz1999.github.io/museum/IMG_3401.JPG');
console.log('  https://sherryz1999.github.io/museum/IMG_34012.JPG');

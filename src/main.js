// src/main.js
// Museum scene — portrait alignment, image loading, click-to-enlarge modal.
// Added console logging of each portrait's x, y, z (group/world) to help diagnose placement.

import * as THREE from 'https://unpkg.com/three@0.159.0/build/three.module.js';
import { OrbitControls } from 'https://unpkg.com/three@0.159.0/examples/jsm/controls/OrbitControls.js';

const canvasContainer = document.body;

// --- Configuration ---
const YOUTUBE_VIDEO_ID = 'FXTDo0TEp6Q';

// Portrait filenames relative to site root (update if images live in a subfolder)
const PORTRAIT_FILES = ['IMG_3400.JPG', 'IMG_3402.JPG', 'IMG_3403.JPG'];

// Descriptions (editable)
const PORTRAIT_DESCRIPTIONS = {
  'IMG_3400.JPG': 'Portrait 1 — description editable here or by double-clicking.',
  'IMG_3402.JPG': 'Portrait 2 — replace this text with your description.',
  'IMG_3403.JPG': 'Portrait 3 — replace this text with your description.'
};

// Room size
const ROOM = { width: 20, height: 4, depth: 12 };

// Gap from left/right wall in world units
const GAP_WORLD_UNITS = 1;

// --- Renderer ---
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
dir.shadow.camera.left = -20;
dir.shadow.camera.right = 20;
dir.shadow.camera.top = 20;
dir.shadow.camera.bottom = -20;
dir.shadow.mapSize.set(2048, 2048);
scene.add(dir);

// --- Room planes ---
function makePlane(w, h, color) {
  const mat = new THREE.MeshStandardMaterial({ color, side: THREE.DoubleSide });
  const geo = new THREE.PlaneGeometry(w, h);
  return new THREE.Mesh(geo, mat);
}
const floor = makePlane(ROOM.width, ROOM.depth, 0xede6dd);
floor.rotation.x = -Math.PI / 2; floor.position.y = 0; floor.receiveShadow = true; scene.add(floor);
const ceiling = makePlane(ROOM.width, ROOM.depth, 0xf0f0f0); ceiling.rotation.x = Math.PI / 2; ceiling.position.y = ROOM.height; scene.add(ceiling);
const backWall = makePlane(ROOM.width, ROOM.height, 0xffffff); backWall.position.z = -ROOM.depth / 2; backWall.position.y = ROOM.height / 2; scene.add(backWall);
const frontWall = makePlane(ROOM.width, ROOM.height, 0xffffff); frontWall.position.z = ROOM.depth / 2; frontWall.rotation.y = Math.PI; frontWall.position.y = ROOM.height / 2; scene.add(frontWall);
const leftWall = makePlane(ROOM.depth, ROOM.height, 0xffffff); leftWall.rotation.y = Math.PI / 2; leftWall.position.x = -ROOM.width / 2; leftWall.position.y = ROOM.height / 2; scene.add(leftWall);
const rightWall = makePlane(ROOM.depth, ROOM.height, 0xffffff); rightWall.rotation.y = -Math.PI / 2; rightWall.position.x = ROOM.width / 2; rightWall.position.y = ROOM.height / 2; scene.add(rightWall);

// --- Loader (with CORS hint) ---
const loader = new THREE.TextureLoader();
if (typeof loader.setCrossOrigin === 'function') {
  try { loader.setCrossOrigin('anonymous'); } catch (e) {}
}
loader.crossOrigin = 'anonymous';

// createFrame groups pieces so rotation/position keep the frame flush with walls
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

  const extrudeSettings = {
    depth: frameDepth,
    bevelEnabled: true,
    bevelThickness: 0.01,
    bevelSize: 0.01,
    bevelSegments: 1,
    steps: 1
  };
  const frameGeo = new THREE.ExtrudeGeometry(shape, extrudeSettings);

  const group = new THREE.Group();

  const frameMat = new THREE.MeshStandardMaterial({ color: 0x5a3b2a, roughness: 0.6, metalness: 0.02 });
  const frameMesh = new THREE.Mesh(frameGeo, frameMat);
  frameMesh.castShadow = true; frameMesh.receiveShadow = true;
  frameMesh.position.set(0, 0, -frameDepth / 2);
  group.add(frameMesh);

  const matW = openingWidth - matInset * 2;
  const matH = openingHeight - matInset * 2;
  const matGeo = new THREE.PlaneGeometry(matW, matH);
  const matMesh = new THREE.Mesh(matGeo, new THREE.MeshStandardMaterial({ color: 0xffffff }));
  matMesh.position.set(0, 0, frameDepth / 2 + 0.005);
  group.add(matMesh);

  const thumbGeo = new THREE.PlaneGeometry(matW - 0.02, matH - 0.02);
  const placeholder = new THREE.MeshBasicMaterial({ color: 0x111111 });
  const thumbMesh = new THREE.Mesh(thumbGeo, placeholder);
  thumbMesh.castShadow = true; thumbMesh.receiveShadow = true;
  thumbMesh.userData = Object.assign({ type: isPortrait ? 'portrait' : 'video-frame', videoId, title }, userdata);
  thumbMesh.position.set(0, 0, frameDepth / 2 + 0.01);
  group.add(thumbMesh);

  // Load image if provided (absolute URL)
  if (imageUrl) {
    const absUrl = (new URL(imageUrl, window.location.href)).href;
    loader.load(
      absUrl,
      (tex) => {
        tex.encoding = THREE.sRGBEncoding;
        thumbMesh.material = new THREE.MeshBasicMaterial({ map: tex });
        thumbMesh.material.needsUpdate = true;
        // store abs url for modal usage
        thumbMesh.userData.imageUrl = absUrl;
      },
      undefined,
      (err) => {
        console.warn('Failed to load image for frame:', absUrl, err);
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
  group.add(glassMesh);

  const rimGeo = new THREE.BoxGeometry(outerW + 0.002, outerH + 0.002, 0.004);
  const rimMat = new THREE.MeshStandardMaterial({ color: 0x2c1f17, roughness: 0.7 });
  const rimMesh = new THREE.Mesh(rimGeo, rimMat);
  rimMesh.position.set(0, 0, -frameDepth / 2 - 0.002);
  group.add(rimMesh);

  // place and rotate the whole group
  group.position.set(x, y, z);
  group.rotation.y = rotationY;
  scene.add(group);

  // keep reference to group in userData
  thumbMesh.userData._group = group;
  // ensure imageUrl stored even if loader hasn't finished yet
  if (!thumbMesh.userData.imageUrl) thumbMesh.userData.imageUrl = imageUrl ? (new URL(imageUrl, window.location.href)).href : '';
  return thumbMesh;
}

// --- Main frames (center + decorations) ---
createFrame({
  x: 0, y: 1.6, z: -ROOM.depth / 2 + 0.06,
  openingWidth: 3.2, openingHeight: 1.8,
  videoId: YOUTUBE_VIDEO_ID, title: 'Violin Performance', rotationY: 0
});
createFrame({ x: 4.2, y: 1.6, z: -ROOM.depth / 2 + 0.06, openingWidth: 3.2, openingHeight: 1.8, title: 'Art 2', rotationY: 0 });
createFrame({ x: -4.2, y: 1.6, z: -ROOM.depth / 2 + 0.06, openingWidth: 3.2, openingHeight: 1.8, title: 'Art 1', rotationY: 0 });

// --- Portrait frames along the LEFT wall (centered vertically, evenly spaced horizontally) ---
const portraitCount = PORTRAIT_FILES.length;
const portraitMeshes = []; // collect references for logging/inspection
if (portraitCount > 0) {
  const padding = 0.6; // avoid corners
  const usableDepth = ROOM.depth - padding * 2;
  const segment = portraitCount === 1 ? 0 : usableDepth / (portraitCount - 1); // if only one, place at center
  const portraitFrameDepth = 0.06;

  // X coordinate just in front of left wall with GAP_WORLD_UNITS offset
  const leftX = -ROOM.width / 2 + GAP_WORLD_UNITS + portraitFrameDepth / 2;

  // Y set to wall middle
  const portraitY = ROOM.height / 2;

  for (let i = 0; i < portraitCount; i++) {
    const file = PORTRAIT_FILES[i];
    const z = -ROOM.depth / 2 + padding + segment * i;
    const imageUrl = new URL(file, window.location.href).href;

    const mesh = createFrame({
      x: leftX,
      y: portraitY,
      z: z,
      openingWidth: 1.2,
      openingHeight: 1.8,
      frameDepth: portraitFrameDepth,
      frameBorderThickness: 0.08,
      matInset: 0.08,
      rotationY: Math.PI / 2, // face inward
      imageUrl: imageUrl,
      isPortrait: true,
      userdata: { filename: file }
    });

    mesh.userData.filename = file;
    mesh.userData.description = PORTRAIT_DESCRIPTIONS[file] || '';
    portraitMeshes.push(mesh);
  }
}

// --- Log positions of each portrait (group/world/local) to help debugging ---
setTimeout(() => {
  console.log('--- Portrait positions debug ---');
  portraitMeshes.forEach((mesh, idx) => {
    const filename = mesh.userData.filename || (`portrait_${idx}`);
    const group = mesh.userData._group;
    // group local position
    const gx = group.position.x, gy = group.position.y, gz = group.position.z;
    // mesh local position (inside group)
    const lx = mesh.position.x, ly = mesh.position.y, lz = mesh.position.z;
    // world position of the mesh (resolve the group's transform)
    const worldPos = new THREE.Vector3();
    mesh.getWorldPosition(worldPos);
    console.log(`Portrait[${idx}] ${filename} — group (x,y,z)=(${gx.toFixed(3)}, ${gy.toFixed(3)}, ${gz.toFixed(3)}), local (x,y,z)=(${lx.toFixed(3)}, ${ly.toFixed(3)}, ${lz.toFixed(3)}), world (x,y,z)=(${worldPos.x.toFixed(3)}, ${worldPos.y.toFixed(3)}, ${worldPos.z.toFixed(3)})`);
  });
  console.log('--- End portrait positions debug ---');
}, 1000); // run after a short delay so scene setup/loader starts

// --- Image modal (click-to-enlarge) ---
// (image modal code unchanged — omitted here for brevity in this summary; full modal exists in your file)


// --- Raycasting & popup UI (hover + click) ---
// (rest of your interaction, rendering and animation loop remain unchanged)
// For brevity the rest of the file is unchanged from previous version — make sure to keep your modal, raycasting,
// pointer handlers, resize and animate functions exactly as in your current working src/main.js.

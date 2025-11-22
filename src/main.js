// src/main.js
// Reverted to museum-style frame base and extended:
// - Made the room wider & deeper (ROOM.width / ROOM.depth changed) while keeping existing frames same size.
// - Added 3 portrait frames on the left wall showing IMG_3400.JPG, IMG_3402.JPG, IMG_3403.JPG.
// - When the mouse moves over a portrait frame a small popup follows the cursor showing the description.
// - You can edit descriptions later in the PORTRAIT_DESCRIPTIONS map or by double‑clicking a portrait to change it via a prompt.
//
// Notes:
// - Portrait images should be uploaded to the repository (museum root or adjust paths).
// - Serve the site over HTTP (python -m http.server 8080) or use GitHub Pages. file:// won't let the images/three.js modules load properly.

import * as THREE from 'https://unpkg.com/three@0.159.0/build/three.module.js';
import { OrbitControls } from 'https://unpkg.com/three@0.159.0/examples/jsm/controls/OrbitControls.js';

const canvasContainer = document.body;

// --- Configuration ---
// Your YouTube video ID (center frame)
const YOUTUBE_VIDEO_ID = 'FXTDo0TEp6Q';

// Portrait files (repo root). Change filenames if you upload them to a different location.
const PORTRAIT_FILES = ['IMG_3400.JPG', 'IMG_3402.JPG', 'IMG_3403.JPG'];

// Descriptions for each portrait (easy to edit). Keys are filenames.
const PORTRAIT_DESCRIPTIONS = {
  'IMG_3400.JPG': 'Portrait 1 — description editable here or by double-clicking the portrait.',
  'IMG_3402.JPG': 'Portrait 2 — replace this text with your description.',
  'IMG_3403.JPG': 'Portrait 3 — replace this text with your description.'
};

// --- Room size (wider and deeper than before) ---
// Increased width and depth; existing frame sizes remain unchanged because frames use fixed dimensions.
const ROOM = {
  width: 20, // was 12
  height: 4,
  depth: 12 // was 8
};

// --- Renderer ---
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.body.appendChild(renderer.domElement);

// --- Scene & Camera ---
const scene = new THREE.Scene();
scene.background = new THREE.Color(0xf8f8f8);

const camera = new THREE.PerspectiveCamera(60, 2, 0.1, 100);
camera.position.set(0, 1.6, ROOM.depth / 2 + 1.5);

// --- Controls ---
const controls = new OrbitControls(camera, renderer.domElement);
controls.target.set(0, 1.6, 0);
controls.enableDamping = true;
controls.minDistance = 1.5;
controls.maxDistance = 25;

// --- Lighting ---
const ambient = new THREE.AmbientLight(0xffffff, 0.6);
scene.add(ambient);

const dir = new THREE.DirectionalLight(0xffffff, 0.6);
dir.position.set(-5, ROOM.height * 0.9, 5);
dir.castShadow = true;
dir.shadow.camera.left = -10;
dir.shadow.camera.right = 10;
dir.shadow.camera.top = 10;
dir.shadow.camera.bottom = -10;
dir.shadow.mapSize.set(1024, 1024);
scene.add(dir);

// --- Create room planes ---
function makePlane(w, h, color) {
  const mat = new THREE.MeshStandardMaterial({ color, side: THREE.DoubleSide });
  const geo = new THREE.PlaneGeometry(w, h);
  return new THREE.Mesh(geo, mat);
}

const floor = makePlane(ROOM.width, ROOM.depth, 0xede6dd);
floor.rotation.x = -Math.PI / 2;
floor.position.y = 0;
scene.add(floor);
floor.receiveShadow = true;

const ceiling = makePlane(ROOM.width, ROOM.depth, 0xf0f0f0);
ceiling.rotation.x = Math.PI / 2;
ceiling.position.y = ROOM.height;
scene.add(ceiling);

const backWall = makePlane(ROOM.width, ROOM.height, 0xffffff);
backWall.position.z = -ROOM.depth / 2;
backWall.position.y = ROOM.height / 2;
scene.add(backWall);

const frontWall = makePlane(ROOM.width, ROOM.height, 0xffffff);
frontWall.position.z = ROOM.depth / 2;
frontWall.rotation.y = Math.PI;
frontWall.position.y = ROOM.height / 2;
scene.add(frontWall);

const leftWall = makePlane(ROOM.depth, ROOM.height, 0xffffff);
leftWall.rotation.y = Math.PI / 2;
leftWall.position.x = -ROOM.width / 2;
leftWall.position.y = ROOM.height / 2;
scene.add(leftWall);

const rightWall = makePlane(ROOM.depth, ROOM.height, 0xffffff);
rightWall.rotation.y = -Math.PI / 2;
rightWall.position.x = ROOM.width / 2;
rightWall.position.y = ROOM.height / 2;
scene.add(rightWall);

// --- Texture loader ---
const loader = new THREE.TextureLoader();
loader.crossOrigin = 'anonymous';

// Flexible createFrame - supports custom opening size and rotation (so we can hang on left wall)
function createFrame({
  x = 0,
  y = 1.6,
  z = -ROOM.depth / 2 + 0.01,
  openingWidth = 3.2,
  openingHeight = 1.8,
  frameDepth = 0.08,
  frameBorderThickness = 0.12,
  matInset = 0.12,
  videoId = '',
  title = '',
  rotationY = 0,
  imageUrl = '',
  isPortrait = false, // if true treat image as portrait
  userdata = {}
} = {}) {
  const outerW = openingWidth + frameBorderThickness * 2;
  const outerH = openingHeight + frameBorderThickness * 2;

  // Frame shape (outer rect with inner hole)
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
  frameGeo.translate(0, 0, -frameDepth / 2);

  const frameMat = new THREE.MeshStandardMaterial({ color: 0x5a3b2a, roughness: 0.6, metalness: 0.02 });
  const frameMesh = new THREE.Mesh(frameGeo, frameMat);
  frameMesh.castShadow = true;
  frameMesh.receiveShadow = true;
  frameMesh.position.set(x, y, z - frameDepth / 2);
  frameMesh.rotation.y = rotationY;
  scene.add(frameMesh);

  // Mat (white inset)
  const matW = openingWidth - matInset * 2;
  const matH = openingHeight - matInset * 2;
  const matGeo = new THREE.PlaneGeometry(matW, matH);
  const matMesh = new THREE.Mesh(matGeo, new THREE.MeshStandardMaterial({ color: 0xffffff }));
  matMesh.position.set(x, y, z + 0.005);
  matMesh.rotation.y = rotationY;
  scene.add(matMesh);

  // Thumbnail / image plane
  const thumbGeo = new THREE.PlaneGeometry(matW - 0.02, matH - 0.02);
  const placeholder = new THREE.MeshBasicMaterial({ color: 0x111111 });
  const thumbMesh = new THREE.Mesh(thumbGeo, placeholder);
  thumbMesh.position.set(x, y, z + 0.01);
  thumbMesh.rotation.y = rotationY;
  thumbMesh.userData = Object.assign({ type: isPortrait ? 'portrait' : 'video-frame', videoId, title }, userdata);
  thumbMesh.castShadow = true;
  thumbMesh.receiveShadow = true;
  scene.add(thumbMesh);

  // Load image if provided
  if (imageUrl) {
    loader.load(
      imageUrl,
      (tex) => {
        tex.encoding = THREE.sRGBEncoding;
        thumbMesh.material = new THREE.MeshBasicMaterial({ map: tex });
        thumbMesh.material.needsUpdate = true;
      },
      undefined,
      () => {
        // keep placeholder if load fails
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

  // Glass sheen
  const glassMat = new THREE.MeshPhongMaterial({ color: 0xffffff, transparent: true, opacity: 0.04 });
  const glassMesh = new THREE.Mesh(thumbGeo.clone(), glassMat);
  glassMesh.position.set(x, y, z + 0.017);
  glassMesh.rotation.y = rotationY;
  scene.add(glassMesh);

  // Rim decoration
  const rimGeo = new THREE.BoxGeometry(outerW + 0.002, outerH + 0.002, 0.004);
  const rimMat = new THREE.MeshStandardMaterial({ color: 0x2c1f17, roughness: 0.7 });
  const rimMesh = new THREE.Mesh(rimGeo, rimMat);
  rimMesh.position.set(x, y, z - frameDepth / 2 - 0.002);
  rimMesh.rotation.y = rotationY;
  scene.add(rimMesh);

  return thumbMesh;
}

// --- Add main frames (keep same sizes as before) ---
createFrame({
  x: 0,
  y: 1.6,
  z: -ROOM.depth / 2 + 0.06,
  openingWidth: 3.2,
  openingHeight: 1.8,
  videoId: YOUTUBE_VIDEO_ID,
  title: 'Violin Performance',
  rotationY: 0
});

// decorative frames
createFrame({ x: 4.2, y: 1.6, z: -ROOM.depth / 2 + 0.06, openingWidth: 3.2, openingHeight: 1.8, title: 'Art 2', rotationY: 0 });
createFrame({ x: -4.2, y: 1.6, z: -ROOM.depth / 2 + 0.06, openingWidth: 3.2, openingHeight: 1.8, title: 'Art 1', rotationY: 0 });

// --- Add 3 portrait frames on the LEFT WALL (vertical stack) ---
// Portrait frame dimensions (portrait orientation)
const PORTRAIT_W = 1.2;
const PORTRAIT_H = 1.8;
const LEFT_FRAME_X = -ROOM.width / 2 + 0.06; // just in front of the left wall
const LEFT_FRAME_ZS = [ -1.6, 0, 1.6 ]; // z positions along the left wall
const LEFT_FRAME_YS = [ 2.2, 1.4, 0.6 ]; // vertical stack (top, middle, bottom) - tweak as needed

for (let i = 0; i < PORTRAIT_FILES.length; i++) {
  const file = PORTRAIT_FILES[i];
  // imageUrl is relative to the page; adjust if you put images in a subfolder (e.g., 'images/IMG_3400.JPG')
  const imageUrl = './' + encodeURIComponent(file);
  const mesh = createFrame({
    x: LEFT_FRAME_X,
    y: LEFT_FRAME_YS[i],
    z: LEFT_FRAME_ZS[i],
    openingWidth: PORTRAIT_W,
    openingHeight: PORTRAIT_H,
    frameDepth: 0.06,
    frameBorderThickness: 0.08,
    matInset: 0.08,
    rotationY: Math.PI / 2, // face inward from left wall
    imageUrl: imageUrl,
    isPortrait: true,
    userdata: { filename: file }
  });

  // attach caption/title for click/hover handling
  mesh.userData.filename = file;
  mesh.userData.description = PORTRAIT_DESCRIPTIONS[file] || '';
}

// --- Raycasting for pointer interactions (hover + popup + double-click edit) ---
const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();

// Popup DOM element
const popup = document.createElement('div');
popup.id = 'desc-popup';
popup.style.position = 'fixed';
popup.style.pointerEvents = 'none';
popup.style.background = 'rgba(0,0,0,0.75)';
popup.style.color = '#fff';
popup.style.padding = '8px 10px';
popup.style.borderRadius = '6px';
popup.style.fontFamily = 'system-ui, Arial, sans-serif';
popup.style.fontSize = '13px';
popup.style.maxWidth = '300px';
popup.style.display = 'none';
popup.style.zIndex = '1000';
popup.style.boxShadow = '0 6px 18px rgba(0,0,0,0.35)';
document.body.appendChild(popup);

function showPopup(text, clientX, clientY) {
  popup.innerText = text || '';
  popup.style.left = (clientX + 14) + 'px';
  popup.style.top = (clientY + 14) + 'px';
  popup.style.display = 'block';
}

function hidePopup() {
  popup.style.display = 'none';
}

// on pointer move, raycast and show popup if hovering portrait
function onPointerMove(event) {
  const rect = renderer.domElement.getBoundingClientRect();
  pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

  raycaster.setFromCamera(pointer, camera);
  const intersects = raycaster.intersectObjects(scene.children, false);

  let found = false;
  for (const it of intersects) {
    const obj = it.object;
    if (obj.userData && obj.userData.type === 'portrait') {
      const filename = obj.userData.filename;
      const desc = PORTRAIT_DESCRIPTIONS[filename] || obj.userData.description || 'No description';
      showPopup(desc, event.clientX, event.clientY);
      found = true;
      break;
    }
  }
  if (!found) hidePopup();
}
window.addEventListener('pointermove', onPointerMove);

// double-click to edit description for any portrait (uses a prompt for quick edits)
function onDoubleClick(event) {
  const rect = renderer.domElement.getBoundingClientRect();
  pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

  raycaster.setFromCamera(pointer, camera);
  const intersects = raycaster.intersectObjects(scene.children, false);
  for (const it of intersects) {
    const obj = it.object;
    if (obj.userData && obj.userData.type === 'portrait') {
      const filename = obj.userData.filename;
      const current = PORTRAIT_DESCRIPTIONS[filename] || '';
      const updated = window.prompt('Edit description for ' + filename + ':', current);
      if (updated !== null) {
        PORTRAIT_DESCRIPTIONS[filename] = updated;
        obj.userData.description = updated;
        // If popup is open, update it
        showPopup(updated, event.clientX, event.clientY);
        console.log('Updated description for', filename);
      }
      break;
    }
  }
}
window.addEventListener('dblclick', onDoubleClick);

// --- Modal logic to show YouTube embed (center frame) ---
const modal = document.getElementById('video-modal');
const ytIframe = document.getElementById('yt-iframe');
const closeBtn = document.getElementById('close-btn');

function openVideoModal(videoId) {
  if (ytIframe && modal) {
    ytIframe.src = `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0`;
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  } else {
    window.open(`https://www.youtube.com/watch?v=${videoId}`, '_blank', 'noopener');
  }
}

function closeVideoModal() {
  if (ytIframe && modal) {
    ytIframe.src = '';
    modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }
}
if (closeBtn) closeBtn.addEventListener('click', closeVideoModal);
if (modal) modal.addEventListener('click', (e) => { if (e.target === modal) closeVideoModal(); });

// clicking the center frame still opens the video modal
function onPointerDown(event) {
  const rect = renderer.domElement.getBoundingClientRect();
  pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

  raycaster.setFromCamera(pointer, camera);
  const intersects = raycaster.intersectObjects(scene.children, false);
  for (const i of intersects) {
    const obj = i.object;
    if (obj.userData && obj.userData.type === 'video-frame' && obj.userData.videoId) {
      openVideoModal(obj.userData.videoId);
      break;
    }
  }
}
window.addEventListener('pointerdown', onPointerDown);

// --- Resize ---
function onResize() {
  const w = window.innerWidth;
  const h = window.innerHeight;
  renderer.setSize(w, h);
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
}
window.addEventListener('resize', onResize);
onResize();

// --- Animation loop ---
const clock = new THREE.Clock();
function animate() {
  requestAnimationFrame(animate);
  controls.update();

  // subtle float for frames
  const t = performance.now() * 0.0002;
  scene.traverse((o) => {
    if (o.userData && (o.userData.type === 'video-frame' || o.userData.type === 'portrait')) {
      o.rotation.z = Math.sin(t + (o.position.x || 0)) * 0.002;
    }
  });

  renderer.render(scene, camera);
}
animate();

// --- Helpful console message ---
console.log('PORTRAIT_DESCRIPTIONS (editable):', PORTRAIT_DESCRIPTIONS);
console.log('If you want to change descriptions later, update the PORTRAIT_DESCRIPTIONS object at the top of src/main.js or double-click a portrait in the scene to edit it.');

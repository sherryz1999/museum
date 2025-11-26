// src/main.js
// Museum scene — Emerald exterior theme, portraits, door.
// Change: embed the provided Google Slides iframe into the WebGL frame on the right wall
// using CSS3DRenderer so the iframe appears exactly in front of the right-wall frame.

import * as THREE from 'https://unpkg.com/three@0.159.0/build/three.module.js';
import { OrbitControls } from 'https://unpkg.com/three@0.159.0/examples/jsm/controls/OrbitControls.js';
import { CSS3DRenderer, CSS3DObject } from 'https://unpkg.com/three@0.159.0/examples/jsm/renderers/CSS3DRenderer.js';

const canvasContainer = document.body;

// --- Configuration ---
const YOUTUBE_VIDEO_ID = 'FXTDo0TEp6Q';
const PORTRAIT_FILES = ['IMG_3400.JPG', 'IMG_3402.JPG', 'IMG_3403.JPG'];
const PORTRAIT_DESCRIPTIONS = {
  'IMG_3400.JPG': 'Portrait 1 — description editable here or by double-clicking.',
  'IMG_3402.JPG': 'Portrait 2 — replace this text with your description.',
  'IMG_3403.JPG': 'Portrait 3 — replace this text with your description.'
};

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

// --- CSS3D renderer (for the iframe) ---
const cssRenderer = new CSS3DRenderer();
cssRenderer.domElement.style.position = 'absolute';
cssRenderer.domElement.style.top = '0';
cssRenderer.domElement.style.left = '0';
cssRenderer.domElement.style.zIndex = '6';
// let CSS3D renderer ignore pointer events on its root; individual element will accept events
cssRenderer.domElement.style.pointerEvents = 'none';
document.body.appendChild(cssRenderer.domElement);
// separate scene for CSS3D objects
const cssScene = new THREE.Scene();

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
// Soft ambient + directional + hemisphere + fill (portraits set to not cast shadows)
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
const EMERALD_PRIMARY = 0x0f6b58; // deep emerald
const EMERALD_ACCENT = 0x7fcfb1;
const OUTSIDE_TRIM = 0x734b2b;

// --- Room planes ---
function makePlane(w, h, color) {
  const mat = new THREE.MeshStandardMaterial({ color, side: THREE.DoubleSide });
  const geo = new THREE.PlaneGeometry(w, h);
  return new THREE.Mesh(geo, mat);
}

const floor = makePlane(ROOM.width, ROOM.depth, 0xede6dd);
floor.rotation.x = -Math.PI / 2; floor.position.y = 0; floor.receiveShadow = true; scene.add(floor);
const ceiling = makePlane(ROOM.width, ROOM.depth, 0xf0f0f0); ceiling.rotation.x = Math.PI / 2; ceiling.position.y = ROOM.height; scene.add(ceiling);
const backWall = makePlane(ROOM.width, ROOM.height, EMERALD_PRIMARY);
backWall.position.z = -ROOM.depth / 2; backWall.position.y = ROOM.height / 2; scene.add(backWall);

// Left and right interior walls — keep interior neutral (light)
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

// --- Frame creation (same as before) ---
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
    loader.load(absUrl, (tex) => {
      tex.encoding = THREE.sRGBEncoding;
      thumbMesh.material = new THREE.MeshBasicMaterial({ map: tex });
      thumbMesh.material.needsUpdate = true;
      thumbMesh.userData.imageUrl = absUrl;
    }, undefined, (err) => {
      console.warn('Failed to load image for frame:', absUrl, err);
    });
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

// --- Portraits on left wall (unchanged logic, centered vertically and evenly spaced) ---
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

// --- Front wall with door ---
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

// --- Image modal (unchanged) ---
const imgModal = document.createElement('div');
imgModal.id = 'image-modal';
Object.assign(imgModal.style, { position: 'fixed', inset: 0, display: 'none', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.75)', zIndex: 2000 });
const imgContainer = document.createElement('div');
Object.assign(imgContainer.style, { maxWidth: '90%', maxHeight: '90%', boxShadow: '0 10px 40px rgba(0,0,0,0.6)', borderRadius: '6px', overflow: 'hidden', background: '#111' });
const imgEl = document.createElement('img');
imgEl.id = 'modal-image';
Object.assign(imgEl.style, { display: 'block', width: '100%', height: 'auto', maxHeight: '90vh', objectFit: 'contain', background: '#000' });
const imgModalCloseBtn = document.createElement('button');
imgModalCloseBtn.innerText = '×';
Object.assign(imgModalCloseBtn.style, { position: 'absolute', top: '18px', right: '22px', zIndex: 2100, fontSize: '28px', color: '#fff', background: 'transparent', border: 'none', cursor: 'pointer' });
imgContainer.appendChild(imgEl); imgModal.appendChild(imgContainer); imgModal.appendChild(imgModalCloseBtn); document.body.appendChild(imgModal);
function openImageModal(src, alt = '') { if (!src) return; imgEl.src = src; imgEl.alt = alt; imgModal.style.display = 'flex'; }
function closeImageModal() { imgModal.style.display = 'none'; imgEl.src = ''; }
imgModalCloseBtn.addEventListener('click', closeImageModal);
imgModal.addEventListener('click', (e) => { if (e.target === imgModal) closeImageModal(); });
window.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeImageModal(); });

// --- Raycasting, popup and interactions (unchanged) ---
const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();
const popup = document.createElement('div');
popup.id = 'desc-popup';
Object.assign(popup.style, { position: 'fixed', pointerEvents: 'none', background: 'rgba(0,0,0,0.78)', color: '#fff', padding: '8px 10px', borderRadius: '6px', fontFamily: 'system-ui, Arial, sans-serif', fontSize: '13px', maxWidth: '320px', display: 'none', zIndex: '1000', boxShadow: '0 6px 18px rgba(0,0,0,0.35)' });
document.body.appendChild(popup);
function showPopup(text, clientX, clientY) { popup.innerText = text || ''; const left = Math.min(window.innerWidth - 340, clientX + 14); const top = Math.min(window.innerHeight - 80, clientY + 14); popup.style.left = left + 'px'; popup.style.top = top + 'px'; popup.style.display = 'block'; }
function hidePopup() { popup.style.display = 'none'; }

function onPointerMove(event) {
  const rect = renderer.domElement.getBoundingClientRect();
  pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
  raycaster.setFromCamera(pointer, camera);
  const intersects = raycaster.intersectObjects(scene.children, true);
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

function onPointerDown(event) {
  const rect = renderer.domElement.getBoundingClientRect();
  pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
  raycaster.setFromCamera(pointer, camera);
  const intersects = raycaster.intersectObjects(scene.children, true);
  for (const it of intersects) {
    const obj = it.object;
    if (obj.userData && obj.userData.type === 'portrait') {
      const src = obj.userData.imageUrl || (obj.userData._group && obj.userData._group.userData && obj.userData._group.userData.imageUrl) || '';
      openImageModal(src, obj.userData.filename || '');
      return;
    }
    if (obj.userData && obj.userData.type === 'video-frame' && obj.userData.videoId) {
      openVideoModal(obj.userData.videoId);
      return;
    }
    if (obj.userData && obj.userData.type === 'door') {
      toggleDoor();
      return;
    }
  }
}
window.addEventListener('pointerdown', onPointerDown);

// --- RIGHT wall: keep a decorative WebGL frame (no slide) ---
const RIGHT_FRAME_W = 3.2;
const RIGHT_FRAME_H = 2.0;
const frameDepth = 0.06;

// backing panel
const rightBackingMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.6 });
const rightBackingGeo = new THREE.PlaneGeometry(RIGHT_FRAME_W, RIGHT_FRAME_H);
const rightBacking = new THREE.Mesh(rightBackingGeo, rightBackingMat);
rightBacking.position.set(ROOM.width / 2 - (frameDepth / 2 + 0.02), ROOM.height / 2, 0);
rightBacking.rotation.y = -Math.PI / 2;
rightBacking.receiveShadow = true;
scene.add(rightBacking);

// rim around the backing
const rimGeo = new THREE.BoxGeometry(RIGHT_FRAME_W + 0.04, RIGHT_FRAME_H + 0.04, 0.02);
const rimMat = new THREE.MeshStandardMaterial({ color: 0x2c1f17, roughness: 0.7 });
const rimMesh = new THREE.Mesh(rimGeo, rimMat);
rimMesh.position.set(ROOM.width / 2 - (frameDepth / 2 + 0.02), ROOM.height / 2, -0.01);
rimMesh.rotation.y = -Math.PI / 2;
rimMesh.castShadow = true;
scene.add(rimMesh);

// --- Embed Google Slides iframe in front of the RIGHT wall frame using CSS3D ---
// Use the exact iframe markup/URL and requested pixel size 94x100
const SLIDE_IFRAME_SRC = 'https://docs.google.com/presentation/d/e/2PACX-1vT0SUWPd9MwElcdH1FiH5AcQ8_oiqvHqg4xa_tnSB9lVh34-TzYnae4Ji5jPj_XLQ/pubembed?start=true&loop=false&delayms=3000';
const IFRAME_PX_W = 94;
const IFRAME_PX_H = 100;

const slideContainer = document.createElement('div');
slideContainer.style.width = IFRAME_PX_W + 'px';
slideContainer.style.height = IFRAME_PX_H + 'px';
slideContainer.style.overflow = 'hidden';
slideContainer.style.border = '0';
slideContainer.style.boxSizing = 'border-box';
slideContainer.style.pointerEvents = 'auto'; // enable mouse interaction within iframe
slideContainer.style.background = '#fff';
slideContainer.style.borderRadius = '3px';
slideContainer.style.boxShadow = '0 4px 10px rgba(0,0,0,0.18)';

// iframe itself
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

// create CSS3D object and align with the WebGL frame (rightBacking)
const slideCssObj = new CSS3DObject(slideContainer);
// copy position and rotation from rightBacking so it sits flush
slideCssObj.position.copy(rightBacking.position);
slideCssObj.rotation.copy(rightBacking.rotation);
// nudge slightly forward so it is visible above the backing
slideCssObj.position.x += 0.01;
cssScene.add(slideCssObj);

// Allow pointer events for the iframe area: enable on its DOM container
slideContainer.addEventListener('pointerenter', () => {
  // enable pointer-events on the cssRenderer root so iframe receives events
  cssRenderer.domElement.style.pointerEvents = 'auto';
});
slideContainer.addEventListener('pointerleave', () => {
  // restore so the WebGL canvas receives events normally when not over iframe
  cssRenderer.domElement.style.pointerEvents = 'none';
});

// --- Modal & center frame video functions (unchanged) ---
const modal = document.getElementById('video-modal');
const ytIframe = document.getElementById('yt-iframe');
const closeBtn = document.getElementById('close-btn');
function openVideoModal(videoId) { if (ytIframe && modal) { ytIframe.src = `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0`; modal.setAttribute('aria-hidden', 'false'); document.body.style.overflow = 'hidden'; } else { window.open(`https://www.youtube.com/watch?v=${videoId}`, '_blank', 'noopener'); } }
function closeVideoModal() { if (ytIframe && modal) { ytIframe.src = ''; modal.setAttribute('aria-hidden', 'true'); document.body.style.overflow = ''; } }
if (closeBtn) closeBtn.addEventListener('click', closeVideoModal);
if (modal) modal.addEventListener('click', (e) => { if (e.target === modal) closeVideoModal(); });

// --- Resize / render ---
function onResize() {
  const w = window.innerWidth; const h = window.innerHeight;
  renderer.setSize(w, h);
  cssRenderer.setSize(w, h);
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
}
window.addEventListener('resize', onResize);
onResize();

function animate() {
  requestAnimationFrame(animate);
  controls.update();

  // smooth door animation
  const current = doorGroup.rotation.y;
  const diff = doorTargetRotation - current;
  if (Math.abs(diff) > 0.0005) {
    doorGroup.rotation.y += diff * 0.18; // easing
  } else {
    doorGroup.rotation.y = doorTargetRotation;
  }

  // gentle float
  const t = performance.now() * 0.0002;
  scene.traverse((o) => {
    if (o.userData && (o.userData.type === 'video-frame' || o.userData.type === 'portrait')) {
      o.rotation.z = Math.sin(t + (o.position.x || 0)) * 0.002;
    }
  });

  renderer.render(scene, camera);
  cssRenderer.render(cssScene, camera);
}
animate();

// --- Helpful logs ---
console.log(slideCssObj.position.x);
console.log(slideCssObj.position.y);
console.log(slideCssObj.position.z);
console.log('Embedded Google Slides iframe into the WebGL right-wall frame (94x100 px).');

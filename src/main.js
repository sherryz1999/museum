// src/main.js
// Museum scene — Emerald exterior theme, portraits, door.
// Base: commit 2d1c151. PDF.js preview aligned to the WebGL frame on the right wall.
// PDF preview size is computed from the frame world size so it visually fits the WebGL frame.

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

// --- CSS3D renderer (for embedding DOM elements like the PDF preview) ---
const cssRenderer = new CSS3DRenderer();
cssRenderer.domElement.style.position = 'absolute';
cssRenderer.domElement.style.top = '0';
cssRenderer.domElement.style.left = '0';
cssRenderer.domElement.style.zIndex = '6';
cssRenderer.domElement.style.pointerEvents = 'none'; // enable when hovering the preview
document.body.appendChild(cssRenderer.domElement);
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

// interior walls
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

// --- Frame creation (same as commit) ---
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

// --- RIGHT wall: create a decorative WebGL frame using createFrame() and embed a PDF.js preview ---
// Capture the returned thumb mesh so we can align the CSS3D object to its group
const RIGHT_FRAME_W = 3.2;
const RIGHT_FRAME_H = 2.0;
const RIGHT_FRAME_DEPTH = 0.06;

const rightFrameThumb = createFrame({
  x: ROOM.width / 2 - (RIGHT_FRAME_DEPTH / 2 + 0.02),
  y: ROOM.height / 2,
  z: 0,
  openingWidth: RIGHT_FRAME_W,
  openingHeight: RIGHT_FRAME_H,
  frameDepth: RIGHT_FRAME_DEPTH,
  frameBorderThickness: 0.04,
  matInset: 0.04,
  rotationY: -Math.PI / 2,
  title: 'Right Wall Frame'
});

const rightFrameGroup = rightFrameThumb && rightFrameThumb.userData && rightFrameThumb.userData._group ? rightFrameThumb.userData._group : null;

// Determine preview pixel size from frame world size so preview visually fits the frame.
// You can tweak PIXELS_PER_UNIT to make the preview larger or smaller.
const PIXELS_PER_UNIT = 1000; // 100 pixels per world unit
const IFRAME_PX_W = Math.max(48, Math.round(RIGHT_FRAME_W * PIXELS_PER_UNIT)); // minimum to avoid too-small
const IFRAME_PX_H = Math.max(48, Math.round(RIGHT_FRAME_H * PIXELS_PER_UNIT));

// Helper: dynamically load PDF.js from CDN (pdfjs-dist)
function loadPdfJs(version = '3.9.179') {
  return new Promise((resolve, reject) => {
    if (window.pdfjsLib) return resolve(window.pdfjsLib);
    const script = document.createElement('script');
    script.src = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${version}/build/pdf.min.js`;
    script.onload = () => {
      if (window.pdfjsLib) {
        window.pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${version}/build/pdf.worker.min.js`;
        resolve(window.pdfjsLib);
      } else {
        reject(new Error('pdfjsLib not available after load'));
      }
    };
    script.onerror = (e) => reject(new Error('Failed to load pdf.js: ' + e.message));
    document.head.appendChild(script);
  });
}

// Create preview and render first page using PDF.js
async function createPdfPreview(pdfUrl, widthPx, heightPx) {
  // container element for CSS3D
  const container = document.createElement('div');
  container.style.width = widthPx + 'px';
  container.style.height = heightPx + 'px';
  container.style.boxSizing = 'border-box';
  container.style.pointerEvents = 'auto';
  container.style.background = '#fff';
  container.style.borderRadius = '3px';
  container.style.overflow = 'hidden';
  container.style.display = 'flex';
  container.style.alignItems = 'center';
  container.style.justifyContent = 'center';
  container.style.padding = '2px';
  container.style.position = 'relative';

  // canvas for PDF rendering
  const canvas = document.createElement('canvas');
  canvas.style.width = '100%';
  canvas.style.height = '100%';
  canvas.style.display = 'block';
  canvas.style.background = '#fff';
  container.appendChild(canvas);

  // simple loading indicator
  const loading = document.createElement('div');
  loading.innerText = 'Loading...';
  loading.style.position = 'absolute';
  loading.style.fontSize = '12px';
  loading.style.color = '#444';
  loading.style.pointerEvents = 'none';
  container.appendChild(loading);

  // click to open full PDF
  container.addEventListener('click', (e) => {
    window.open(pdfUrl, '_blank', 'noopener');
  });

  try {
    const pdfjs = await loadPdfJs();
    const loadingTask = pdfjs.getDocument({ url: pdfUrl, withCredentials: false });
    const pdf = await loadingTask.promise;
    const page = await pdf.getPage(1);
    const viewport = page.getViewport({ scale: 1 });

    // compute scale to fit canvas element size (taking devicePixelRatio into account)
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const targetW = widthPx * dpr;
    const targetH = heightPx * dpr;
    const scale = Math.min(targetW / viewport.width, targetH / viewport.height);
    const scaledViewport = page.getViewport({ scale });

    // set canvas size in device pixels, style in CSS pixels
    const ctx = canvas.getContext('2d', { alpha: false });
    canvas.width = Math.round(scaledViewport.width);
    canvas.height = Math.round(scaledViewport.height);
    // keep canvas style sized by CSS pixels (account for dpr)
    canvas.style.width = Math.round(scaledViewport.width / dpr) + 'px';
    canvas.style.height = Math.round(scaledViewport.height / dpr) + 'px';

    const renderContext = {
      canvasContext: ctx,
      viewport: scaledViewport
    };
    await page.render(renderContext).promise;

    // remove loading
    if (loading.parentNode) loading.parentNode.removeChild(loading);
  } catch (err) {
    // show fallback link text
    container.innerHTML = '';
    const a = document.createElement('a');
    a.href = pdfUrl;
    a.target = '_blank';
    a.rel = 'noopener';
    a.innerText = 'Open PDF';
    a.style.display = 'inline-block';
    a.style.padding = '8px 10px';
    a.style.background = '#eee';
    a.style.borderRadius = '4px';
    a.style.color = '#111';
    container.appendChild(a);
    console.error('PDF preview failed:', err);
  }

  return container;
}

// Create and attach CSS3D preview aligned to frame
(async () => {
  if (!rightFrameGroup) return;

  const previewEl = await createPdfPreview(PDF_URL, IFRAME_PX_W, IFRAME_PX_H);
  const cssObj = new CSS3DObject(previewEl);

  // align with WebGL frame group
  cssObj.position.copy(rightFrameGroup.position);
  cssObj.rotation.copy(rightFrameGroup.rotation);

  // nudge outward along frame normal so it sits in front of the frame
  const normal = new THREE.Vector3(1, 0, 0).applyQuaternion(rightFrameGroup.quaternion);
  cssObj.position.add(normal.multiplyScalar(0.02));

  cssScene.add(cssObj);

  // pointer control while hovering preview
  previewEl.addEventListener('pointerenter', () => { cssRenderer.domElement.style.pointerEvents = 'auto'; });
  previewEl.addEventListener('pointerleave', () => { cssRenderer.domElement.style.pointerEvents = 'none'; });
})();

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

// --- Animation loop ---
function animate() {
  requestAnimationFrame(animate);
  controls.update();

  // smooth door animation
  const current = doorGroup.rotation.y;
  const diff = doorTargetRotation - current;
  if (Math.abs(diff) > 0.0005) {
    doorGroup.rotation.y += diff * 0.18;
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
console.log('PDF.js preview set up for', PDF_URL, ' — click the preview to open the full PDF.');

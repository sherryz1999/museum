// src/main.js
// Museum scene — portrait alignment, image loading, and click-to-enlarge modal.
// Change: added a configurable gap from the wall for left/right portraits (GAP_WORLD_UNITS).
// Set GAP_WORLD_UNITS = 1 to leave ~1 unit gap from the wall as requested.

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

// Gap from left/right wall in world units (change to adjust)
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
if (portraitCount > 0) {
  const padding = 0.6; // avoid corners
  const usableDepth = ROOM.depth - padding * 2;
  const segment = portraitCount === 1 ? 0 : usableDepth / (portraitCount - 1); // if only one, place at center
  const portraitFrameDepth = 0.06;

  // X coordinate just in front of left wall with GAP_WORLD_UNITS offset
  const leftX = -ROOM.depth / 2 + GAP_WORLD_UNITS + portraitFrameDepth / 2;

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
  }
}

// --- Image modal (click-to-enlarge) ---
// Create modal DOM elements dynamically so no index.html change required
const imgModal = document.createElement('div');
imgModal.id = 'image-modal';
Object.assign(imgModal.style, {
  position: 'fixed',
  inset: 0,
  display: 'none',
  alignItems: 'center',
  justifyContent: 'center',
  background: 'rgba(0,0,0,0.75)',
  zIndex: 2000
});
const imgContainer = document.createElement('div');
Object.assign(imgContainer.style, {
  maxWidth: '90%',
  maxHeight: '90%',
  boxShadow: '0 10px 40px rgba(0,0,0,0.6)',
  borderRadius: '6px',
  overflow: 'hidden',
  background: '#111'
});
const imgEl = document.createElement('img');
imgEl.id = 'modal-image';
Object.assign(imgEl.style, {
  display: 'block',
  width: '100%',
  height: 'auto',
  maxHeight: '90vh',
  objectFit: 'contain',
  background: '#000'
});
// renamed the image-modal close button variable to avoid collision with other `closeBtn`
const imgModalCloseBtn = document.createElement('button');
imgModalCloseBtn.innerText = '×';
Object.assign(imgModalCloseBtn.style, {
  position: 'absolute',
  top: '18px',
  right: '22px',
  zIndex: 2100,
  fontSize: '28px',
  color: '#fff',
  background: 'transparent',
  border: 'none',
  cursor: 'pointer'
});

// Append elements
imgContainer.appendChild(imgEl);
imgModal.appendChild(imgContainer);
imgModal.appendChild(imgModalCloseBtn);
document.body.appendChild(imgModal);

function openImageModal(src, alt = '') {
  if (!src) return;
  imgEl.src = src;
  imgEl.alt = alt;
  imgModal.style.display = 'flex';
}
function closeImageModal() {
  imgModal.style.display = 'none';
  imgEl.src = '';
}
imgModalCloseBtn.addEventListener('click', closeImageModal);
imgModal.addEventListener('click', (e) => {
  if (e.target === imgModal) closeImageModal();
});
window.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') closeImageModal();
});

// --- Raycasting & popup UI (hover + click) ---
const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();

const popup = document.createElement('div');
popup.id = 'desc-popup';
Object.assign(popup.style, {
  position: 'fixed',
  pointerEvents: 'none',
  background: 'rgba(0,0,0,0.78)',
  color: '#fff',
  padding: '8px 10px',
  borderRadius: '6px',
  fontFamily: 'system-ui, Arial, sans-serif',
  fontSize: '13px',
  maxWidth: '320px',
  display: 'none',
  zIndex: '1000',
  boxShadow: '0 6px 18px rgba(0,0,0,0.35)'
});
document.body.appendChild(popup);

function showPopup(text, clientX, clientY) {
  popup.innerText = text || '';
  const left = Math.min(window.innerWidth - 340, clientX + 14);
  const top = Math.min(window.innerHeight - 80, clientY + 14);
  popup.style.left = left + 'px';
  popup.style.top = top + 'px';
  popup.style.display = 'block';
}
function hidePopup() { popup.style.display = 'none'; }

function onPointerMove(event) {
  const rect = renderer.domElement.getBoundingClientRect();
  pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
  raycaster.setFromCamera(pointer, camera);
  // intersect children so we detect thumbMesh inside groups
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

// pointerdown: click-to-enlarge for portraits, click center frame to open video modal
function onPointerDown(event) {
  const rect = renderer.domElement.getBoundingClientRect();
  pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
  raycaster.setFromCamera(pointer, camera);
  const intersects = raycaster.intersectObjects(scene.children, true);

  for (const it of intersects) {
    const obj = it.object;
    if (obj.userData && obj.userData.type === 'portrait') {
      // open image modal
      const src = obj.userData.imageUrl || (obj.userData._group && obj.userData._group.userData && obj.userData._group.userData.imageUrl) || '';
      openImageModal(src, obj.userData.filename || '');
      return;
    }
    if (obj.userData && obj.userData.type === 'video-frame' && obj.userData.videoId) {
      openVideoModal(obj.userData.videoId);
      return;
    }
  }
}
window.addEventListener('pointerdown', onPointerDown);

// double-click editing of descriptions
function onDoubleClick(event) {
  const rect = renderer.domElement.getBoundingClientRect();
  pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
  raycaster.setFromCamera(pointer, camera);
  const intersects = raycaster.intersectObjects(scene.children, true);
  for (const it of intersects) {
    const obj = it.object;
    if (obj.userData && obj.userData.type === 'portrait') {
      const filename = obj.userData.filename;
      const current = PORTRAIT_DESCRIPTIONS[filename] || '';
      const updated = window.prompt('Edit description for ' + filename + ':', current);
      if (updated !== null) {
        PORTRAIT_DESCRIPTIONS[filename] = updated;
        obj.userData.description = updated;
        showPopup(updated, event.clientX, event.clientY);
        console.log('Updated description for', filename);
      }
      break;
    }
  }
}
window.addEventListener('dblclick', onDoubleClick);

// --- Modal & click for center frame (YouTube) ---
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

// --- Resize / render ---
function onResize() {
  const w = window.innerWidth; const h = window.innerHeight;
  renderer.setSize(w, h);
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
}
window.addEventListener('resize', onResize);
onResize();

function animate() {
  requestAnimationFrame(animate);
  controls.update();
  // subtle float
  const t = performance.now() * 0.0002;
  scene.traverse((o) => {
    if (o.userData && (o.userData.type === 'video-frame' || o.userData.type === 'portrait')) {
      o.rotation.z = Math.sin(t + (o.position.x || 0)) * 0.002;
    }
  });
  renderer.render(scene, camera);
}
animate();

// --- Helpful logs ---
console.log('Portrait files:', PORTRAIT_FILES);
console.log('PORTRAIT_DESCRIPTIONS (editable):', PORTRAIT_DESCRIPTIONS);
console.log('If images do not appear, open DevTools → Network to check for 404s or CORS errors.');

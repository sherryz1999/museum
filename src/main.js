// src/main.js
// Museum scene — fixes for portrait alignment and image loading.
// - Portrait frames on the left wall are now grouped and rotated as a single Group so they stay flush
//   against the wall and remain horizontally aligned.
// - Image URLs are built using new URL(file, window.location.href).href and loader logs failures.
// - Double-click to edit portrait descriptions; hover shows popup. Keep serving via HTTP or GitHub Pages.

import * as THREE from 'https://unpkg.com/three@0.159.0/build/three.module.js';
import { OrbitControls } from 'https://unpkg.com/three@0.159.0/examples/jsm/controls/OrbitControls.js';

const canvasContainer = document.body;

// --- Configuration ---
const YOUTUBE_VIDEO_ID = 'FXTDo0TEp6Q';

// Portrait filenames relative to site root (update if images live in a subfolder)
const PORTRAIT_FILES = ['IMG_3400.JPG', 'IMG_3402.JPG', 'IMG_3403.JPG'];

// Descriptions (easy to edit)
const PORTRAIT_DESCRIPTIONS = {
  'IMG_3400.JPG': 'Portrait 1 — description editable here or by double-clicking.',
  'IMG_3402.JPG': 'Portrait 2 — replace this text with your description.',
  'IMG_3403.JPG': 'Portrait 3 — replace this text with your description.'
};

// Room size (wider & deeper)
const ROOM = { width: 20, height: 4, depth: 12 };

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

// createFrame now groups all frame parts into a THREE.Group so rotation works around the group's origin
function createFrame({
  x = 0, y = 1.6, z = -ROOM.depth / 2 + 0.01,
  openingWidth = 3.2, openingHeight = 1.8,
  frameDepth = 0.08, frameBorderThickness = 0.12, matInset = 0.12,
  videoId = '', title = '', rotationY = 0, imageUrl = '', isPortrait = false, userdata = {}
} = {}) {
  const outerW = openingWidth + frameBorderThickness * 2;
  const outerH = openingHeight + frameBorderThickness * 2;

  // Build geometry (don't translate geometry — we'll position via group)
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
  // Note: do NOT translate geometry here. We'll place pieces relative to group.

  // Build group
  const group = new THREE.Group();

  // frame mesh (centered)
  const frameMat = new THREE.MeshStandardMaterial({ color: 0x5a3b2a, roughness: 0.6, metalness: 0.02 });
  const frameMesh = new THREE.Mesh(frameGeo, frameMat);
  frameMesh.castShadow = true;
  frameMesh.receiveShadow = true;
  // push frame slightly back inside the group so front face is at +frameDepth/2 local z
  frameMesh.position.set(0, 0, -frameDepth / 2);
  group.add(frameMesh);

  // mat (white) sits slightly in front of the frame front face
  const matW = openingWidth - matInset * 2;
  const matH = openingHeight - matInset * 2;
  const matGeo = new THREE.PlaneGeometry(matW, matH);
  const matMesh = new THREE.Mesh(matGeo, new THREE.MeshStandardMaterial({ color: 0xffffff }));
  matMesh.position.set(0, 0, frameDepth / 2 + 0.005);
  group.add(matMesh);

  // thumbnail plane (in front of mat)
  const thumbGeo = new THREE.PlaneGeometry(matW - 0.02, matH - 0.02);
  const placeholder = new THREE.MeshBasicMaterial({ color: 0x111111 });
  const thumbMesh = new THREE.Mesh(thumbGeo, placeholder);
  thumbMesh.castShadow = true; thumbMesh.receiveShadow = true;
  thumbMesh.userData = Object.assign({ type: isPortrait ? 'portrait' : 'video-frame', videoId, title }, userdata);
  thumbMesh.position.set(0, 0, frameDepth / 2 + 0.01);
  group.add(thumbMesh);

  // Load image if provided
  if (imageUrl) {
    // Ensure absolute url
    const absUrl = (new URL(imageUrl, window.location.href)).href;
    loader.load(
      absUrl,
      (tex) => {
        tex.encoding = THREE.sRGBEncoding;
        thumbMesh.material = new THREE.MeshBasicMaterial({ map: tex });
        thumbMesh.material.needsUpdate = true;
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

  // glass sheen (in front)
  const glassMat = new THREE.MeshPhongMaterial({ color: 0xffffff, transparent: true, opacity: 0.04 });
  const glassMesh = new THREE.Mesh(thumbGeo.clone(), glassMat);
  glassMesh.position.set(0, 0, frameDepth / 2 + 0.017);
  group.add(glassMesh);

  // rim decoration behind frame
  const rimGeo = new THREE.BoxGeometry(outerW + 0.002, outerH + 0.002, 0.004);
  const rimMat = new THREE.MeshStandardMaterial({ color: 0x2c1f17, roughness: 0.7 });
  const rimMesh = new THREE.Mesh(rimGeo, rimMat);
  rimMesh.position.set(0, 0, -frameDepth / 2 - 0.002);
  group.add(rimMesh);

  // Place group at desired world position and apply rotation
  group.position.set(x, y, z);
  group.rotation.y = rotationY;
  scene.add(group);

  // return the thumbnail mesh so callers can attach userdata / interactions
  // but keep a reference to its parent group (useful for debugging)
  thumbMesh.userData._group = group;
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

// --- Portrait frames along the LEFT wall (evenly spaced horizontally) ---
const portraitCount = PORTRAIT_FILES.length;
if (portraitCount > 0) {
  // evenly spaced z positions along left wall (avoid being flush with corners)
  const padding = 0.6;
  const usableDepth = ROOM.depth - padding * 2;
  const segment = usableDepth / (portraitCount - 1 || 1); // if only one, avoid /0

  const portraitFrameDepth = 0.06;
  // X coordinate just in front of left wall
  const leftX = -ROOM.width / 2 + portraitFrameDepth / 2 + 0.06;

  // vertical stack center Y
  const centerY = 1.6;
  const verticalSpacing = 0.95; // distance between portraits vertically (tweak as needed)
  const startY = centerY + (verticalSpacing * (portraitCount - 1)) / 2;

  for (let i = 0; i < portraitCount; i++) {
    const file = PORTRAIT_FILES[i];
    const z = -ROOM.depth / 2 + padding + segment * i; // evenly spaced
    const y = startY - i * verticalSpacing;

    // Build absolute URL for the image (works on GitHub Pages or local http server)
    const imageUrl = new URL(file, window.location.href).href;

    const mesh = createFrame({
      x: leftX,
      y: y,
      z: z,
      openingWidth: 1.2,
      openingHeight: 1.8,
      frameDepth: portraitFrameDepth,
      frameBorderThickness: 0.08,
      matInset: 0.08,
      rotationY: Math.PI / 2, // face inward from left wall
      imageUrl: imageUrl,
      isPortrait: true,
      userdata: { filename: file }
    });

    mesh.userData.filename = file;
    mesh.userData.description = PORTRAIT_DESCRIPTIONS[file] || '';
  }
}

// --- Raycasting & popup UI ---
const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();

const popup = document.createElement('div');
popup.id = 'desc-popup';
popup.style.position = 'fixed';
popup.style.pointerEvents = 'none';
popup.style.background = 'rgba(0,0,0,0.78)';
popup.style.color = '#fff';
popup.style.padding = '8px 10px';
popup.style.borderRadius = '6px';
popup.style.fontFamily = 'system-ui, Arial, sans-serif';
popup.style.fontSize = '13px';
popup.style.maxWidth = '320px';
popup.style.display = 'none';
popup.style.zIndex = '1000';
popup.style.boxShadow = '0 6px 18px rgba(0,0,0,0.35)';
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

// double-click to edit portrait descriptions
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

function onPointerDown(event) {
  const rect = renderer.domElement.getBoundingClientRect();
  pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
  raycaster.setFromCamera(pointer, camera);
  const intersects = raycaster.intersectObjects(scene.children, true);
  for (const i of intersects) {
    const obj = i.object;
    if (obj.userData && obj.userData.type === 'video-frame' && obj.userData.videoId) {
      openVideoModal(obj.userData.videoId);
      break;
    }
  }
}
window.addEventListener('pointerdown', onPointerDown);

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

// --- Debug logs ---
console.log('Portrait files:', PORTRAIT_FILES);
console.log('PORTRAIT_DESCRIPTIONS (editable):', PORTRAIT_DESCRIPTIONS);
console.log('If images do not appear, open DevTools → Network to check for 404s or CORS errors.');

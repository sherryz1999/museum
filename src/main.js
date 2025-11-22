// src/main.js
// Embed local PPTX via Office viewer using raw.githack (so GitHub Pages is NOT required).
// Set SLIDES_FILE to the filename in the repo root and this script will build a raw.githack URL
// and then construct the Microsoft Office embed URL that the iframe will load.
//
// Notes:
// - raw.githack serves files from raw.githubusercontent with headers suitable for third-party viewers.
// - The file must exist in the repository (repo root or a subpath you specify in SLIDES_FILE).
// - If you preview locally via file:// the Office viewer cannot fetch the file — use a public URL or raw.githack as used here.

import * as THREE from 'https://unpkg.com/three@0.159.0/build/three.module.js';
import { OrbitControls } from 'https://unpkg.com/three@0.159.0/examples/jsm/controls/OrbitControls.js';
import { CSS3DRenderer, CSS3DObject } from 'https://unpkg.com/three@0.159.0/examples/jsm/renderers/CSS3DRenderer.js';

const canvasContainer = document.body;

// --- Configuration ---
// center YouTube video
const YOUTUBE_VIDEO_ID = 'FXTDo0TEp6Q';

// file in repo root (change to swap)
const SLIDES_FILE = 'CATTNR.pptx';

// Build an Office embed URL where the PPTX is served via raw.githack.
// raw.githack URL: https://raw.githack.com/{owner}/{repo}/{branch}/{path}
// Office embed URL: https://view.officeapps.live.com/op/embed.aspx?src={encoded_raw_githack_url}
function buildOfficeEmbedUrlViaRawGithack(fileName) {
  const owner = 'sherryz1999';
  const repo = 'museum';
  const branch = 'main';

  // Normalize the path and encode segments (handles spaces and parentheses)
  const cleaned = fileName.replace(/^\.\//, '').replace(/^\/+/, '');
  const segments = cleaned.split('/').map(seg => encodeURIComponent(seg));
  const encodedPath = segments.join('/');
  const rawGithackUrl = `https://raw.githack.com/${owner}/${repo}/${branch}/${encodedPath}`;
  const officeEmbed = 'https://view.officeapps.live.com/op/embed.aspx?src=' + encodeURIComponent(rawGithackUrl);

  console.log('Using raw.githack URL for Office embed:', rawGithackUrl);
  return officeEmbed;
}

const SLIDES_EMBED_URL = buildOfficeEmbedUrlViaRawGithack(SLIDES_FILE);

// --- Scene configuration ---
const ROOM = { width: 12, height: 4, depth: 8 };

// --- WebGL renderer ---
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.body.appendChild(renderer.domElement);

// --- CSS3D renderer (for interactive iframes) ---
// Container ignores pointer events; iframe containers will receive events.
const cssRenderer = new CSS3DRenderer();
cssRenderer.domElement.style.position = 'absolute';
cssRenderer.domElement.style.top = '0';
cssRenderer.domElement.style.left = '0';
cssRenderer.domElement.style.pointerEvents = 'none';
cssRenderer.domElement.style.zIndex = '5';
document.body.appendChild(cssRenderer.domElement);

// --- Scenes & camera ---
const scene = new THREE.Scene();
const cssScene = new THREE.Scene();
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
dir.shadow.mapSize.set(1024, 1024);
scene.add(dir);

// --- Room helper ---
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

// createFrame supports either a YouTube thumbnail or an embedUrl for CSS3D iframe
function createFrame({ x = 0, y = 1.6, z = -ROOM.depth / 2 + 0.01, videoId = '', title = '', embedUrl = '' }) {
  const frameWidth = 3.2;
  const frameHeight = 1.8;

  // border behind the frame
  const borderGeo = new THREE.BoxGeometry(frameWidth + 0.12, frameHeight + 0.12, 0.08);
  const borderMat = new THREE.MeshStandardMaterial({ color: 0x2f2f2f });
  const border = new THREE.Mesh(borderGeo, borderMat);
  border.position.set(x, y, z - 0.04);
  border.castShadow = true;
  scene.add(border);

  // main plane (thumbnail or placeholder)
  const planeGeo = new THREE.PlaneGeometry(frameWidth, frameHeight);
  const placeholder = new THREE.MeshBasicMaterial({ color: 0x111111 });
  const plane = new THREE.Mesh(planeGeo, placeholder);
  plane.position.set(x, y, z);
  plane.userData = { type: 'video-frame', videoId, title, embedUrl };
  plane.receiveShadow = true;
  plane.castShadow = true;
  scene.add(plane);

  // If YouTube id provided, load thumbnail
  if (videoId) {
    const thumbUrl = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
    loader.load(
      thumbUrl,
      (tex) => {
        plane.material = new THREE.MeshBasicMaterial({ map: tex });
        plane.material.needsUpdate = true;
      },
      undefined,
      () => {}
    );
  }

  // If embedUrl provided (Office viewer via raw.githack), create a constrained container and add iframe
  if (embedUrl) {
    // pixelsPerUnit controls pixel footprint; clamped to avoid huge iframes on high DPI
    const pixelsPerUnit = Math.max(100, Math.min(160, Math.floor(window.devicePixelRatio * 140)));
    const pxW = Math.round(frameWidth * pixelsPerUnit);
    const pxH = Math.round(frameHeight * pixelsPerUnit);

    const container = document.createElement('div');
    container.style.width = pxW + 'px';
    container.style.height = pxH + 'px';
    container.style.overflow = 'hidden';
    container.style.pointerEvents = 'auto';
    container.style.boxSizing = 'border-box';
    container.style.position = 'relative';
    container.style.background = '#000';
    container.style.borderRadius = '2px';
    container.style.boxShadow = '0 6px 18px rgba(0,0,0,0.25)';

    const iframe = document.createElement('iframe');
    iframe.src = embedUrl;
    iframe.style.width = '100%';
    iframe.style.height = '100%';
    iframe.style.border = '0';
    iframe.style.display = 'block';
    iframe.allow = 'autoplay; encrypted-media; fullscreen';
    iframe.setAttribute('allowfullscreen', '');
    iframe.style.pointerEvents = 'auto';

    container.appendChild(iframe);

    const cssObject = new CSS3DObject(container);
    cssObject.position.set(x, y, z + 0.02);
    cssObject.rotation.copy(plane.rotation);
    cssScene.add(cssObject);

    plane.userData.cssObject = cssObject;
    plane.userData.cssContainer = container;
    plane.userData.iframe = iframe;

    iframe.addEventListener('load', () => {
      console.log('Embedded file iframe loaded:', embedUrl);
    });
    iframe.addEventListener('error', (e) => {
      console.warn('Embedded iframe error', e);
    });
  }

  // sheen overlay
  const sheen = new THREE.Mesh(planeGeo, new THREE.MeshPhongMaterial({
    color: 0xffffff,
    transparent: true,
    opacity: 0.03
  }));
  sheen.position.set(x, y, z + 0.001);
  scene.add(sheen);

  return plane;
}

// --- Add frames ---
// Center: YouTube thumbnail
createFrame({
  x: 0,
  y: 1.6,
  z: -ROOM.depth / 2 + 0.06,
  videoId: YOUTUBE_VIDEO_ID,
  title: 'Violin Performance'
});

// Left: embed local PPTX via Office viewer using raw.githack
createFrame({
  x: -4.2,
  y: 1.6,
  z: -ROOM.depth / 2 + 0.06,
  title: 'CATTNR Presentation',
  embedUrl: SLIDES_EMBED_URL
});

// Right: decorative
createFrame({
  x: 4.2,
  y: 1.6,
  z: -ROOM.depth / 2 + 0.06,
  title: 'Art 2'
});

// --- Raycasting / clicks (only open modal for YouTube frames) ---
const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();

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

// --- Modal logic for YouTube ---
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
if (modal) modal.addEventListener('click', (e) => {
  if (e.target === modal) closeVideoModal();
});

// --- Resize handling ---
function onResize() {
  const w = window.innerWidth;
  const h = window.innerHeight;
  renderer.setSize(w, h);
  cssRenderer.setSize(w, h);
  camera.aspect = w / h;
  camera.updateProjectionMatrix();

  const pixelsPerUnit = Math.max(100, Math.min(160, Math.floor(window.devicePixelRatio * 140)));
  cssScene.traverse((child) => {
    if (child instanceof CSS3DObject) {
      const el = child.element;
      el.style.width = Math.round(3.2 * pixelsPerUnit) + 'px';
      el.style.height = Math.round(1.8 * pixelsPerUnit) + 'px';
      if (el.firstChild && el.firstChild.tagName === 'IFRAME') {
        el.firstChild.style.width = '100%';
        el.firstChild.style.height = '100%';
      }
      el.style.maxWidth = Math.round(4.2 * pixelsPerUnit) + 'px';
      el.style.maxHeight = Math.round(2.2 * pixelsPerUnit) + 'px';
    }
  });

  cssRenderer.domElement.style.zIndex = 5;
  renderer.domElement.style.zIndex = 1;
}
window.addEventListener('resize', onResize);
onResize();

// --- Animation loop ---
function animate() {
  requestAnimationFrame(animate);
  controls.update();

  const t = performance.now() * 0.0002;
  scene.traverse((o) => {
    if (o.userData && o.userData.type === 'video-frame') {
      o.rotation.z = Math.sin(t + (o.position.x || 0)) * 0.002;
    }
  });

  renderer.render(scene, camera);
  cssRenderer.render(cssScene, camera);
}
animate();

// --- Debug logs ---
console.log('Office embed URL:', SLIDES_EMBED_URL);
console.log('cssScene children:', cssScene.children);
setTimeout(() => console.log('cssScene children after 2s:', cssScene.children), 2000);

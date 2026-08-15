/* ==================== 登录背景：波涛海浪（Three.js 水面着色器） ==================== */
/* 参考：Open Three「波涛海浪」 https://codepen.io/aderaaij/pen/XWpMONO */
/* 适配：移除 dat.GUI / OrbitControls，按需加载，登录成功 destroy() 释放。 */
import * as THREE from "three";

let renderer = null;
let scene = null;
let camera = null;
let waterMaterial = null;
let waterMesh = null;
let rafId = 0;
let running = false;
let container = null;
let clock = null;
const DPR_CAP = 1.5; // 像素比上限：兼顾清晰度与渲染开销

// ---------- 颜色（适配浅色 / 深色主题） ----------
function buildColors() {
  const dark = document.body.classList.contains("dark");
  if (dark) {
    return {
      depth: 0x0a2f3c,
      surface: 0x3f90ad,
      fog: 0x060f17,
      fogNear: 2,
      fogFar: 10
    };
  }
  return {
    depth: 0xaee4e4,
    surface: 0x4d9aaa,
    fog: 0x8e99a2,
    fogNear: 1,
    fogFar: 8
  };
}

// ---------- 着色器（Perlin 3D Noise 海浪） ----------
const vertexShader = ` #include <fog_pars_vertex>

uniform float uTime;

uniform float uBigWavesElevation;
uniform vec2 uBigWavesFrequency;
uniform float uBigWaveSpeed;

uniform float uSmallWavesElevation;
uniform float uSmallWavesFrequency;
uniform float uSmallWavesSpeed;
uniform float uSmallWavesIterations;

varying float vElevation;

//	Classic Perlin 3D Noise
//	by Stefan Gustavson
vec4 permute(vec4 x){return mod(((x*34.0)+1.0)*x, 289.0);}
vec4 taylorInvSqrt(vec4 r){return 1.79284291400159 - 0.85373472095314 * r;}
vec3 fade(vec3 t) {return t*t*t*(t*(t*6.0-15.0)+10.0);}

float cnoise(vec3 P){
  vec3 Pi0 = floor(P);
  vec3 Pi1 = Pi0 + vec3(1.0);
  Pi0 = mod(Pi0, 289.0);
  Pi1 = mod(Pi1, 289.0);
  vec3 Pf0 = fract(P);
  vec3 Pf1 = Pf0 - vec3(1.0);
  vec4 ix = vec4(Pi0.x, Pi1.x, Pi0.x, Pi1.x);
  vec4 iy = vec4(Pi0.yy, Pi1.yy);
  vec4 iz0 = Pi0.zzzz;
  vec4 iz1 = Pi1.zzzz;

  vec4 ixy = permute(permute(ix) + iy);
  vec4 ixy0 = permute(ixy + iz0);
  vec4 ixy1 = permute(ixy + iz1);

  vec4 gx0 = ixy0 / 7.0;
  vec4 gy0 = fract(floor(gx0) / 7.0) - 0.5;
  gx0 = fract(gx0);
  vec4 gz0 = vec4(0.5) - abs(gx0) - abs(gy0);
  vec4 sz0 = step(gz0, vec4(0.0));
  gx0 -= sz0 * (step(0.0, gx0) - 0.5);
  gy0 -= sz0 * (step(0.0, gy0) - 0.5);

  vec4 gx1 = ixy1 / 7.0;
  vec4 gy1 = fract(floor(gx1) / 7.0) - 0.5;
  gx1 = fract(gx1);
  vec4 gz1 = vec4(0.5) - abs(gx1) - abs(gy1);
  vec4 sz1 = step(gz1, vec4(0.0));
  gx1 -= sz1 * (step(0.0, gx1) - 0.5);
  gy1 -= sz1 * (step(0.0, gy1) - 0.5);

  vec3 g000 = vec3(gx0.x,gy0.x,gz0.x);
  vec3 g100 = vec3(gx0.y,gy0.y,gz0.y);
  vec3 g010 = vec3(gx0.z,gy0.z,gz0.z);
  vec3 g110 = vec3(gx0.w,gy0.w,gz0.w);
  vec3 g001 = vec3(gx1.x,gy1.x,gz1.x);
  vec3 g101 = vec3(gx1.y,gy1.y,gz1.y);
  vec3 g011 = vec3(gx1.z,gy1.z,gz1.z);
  vec3 g111 = vec3(gx1.w,gy1.w,gz1.w);

  vec4 norm0 = taylorInvSqrt(vec4(dot(g000, g000), dot(g010, g010), dot(g100, g100), dot(g110, g110)));
  g000 *= norm0.x;
  g010 *= norm0.y;
  g100 *= norm0.z;
  g110 *= norm0.w;
  vec4 norm1 = taylorInvSqrt(vec4(dot(g001, g001), dot(g011, g011), dot(g101, g101), dot(g111, g111)));
  g001 *= norm1.x;
  g011 *= norm1.y;
  g101 *= norm1.z;
  g111 *= norm1.w;

  float n000 = dot(g000, Pf0);
  float n100 = dot(g100, vec3(Pf1.x, Pf0.yz));
  float n010 = dot(g010, vec3(Pf0.x, Pf1.y, Pf0.z));
  float n110 = dot(g110, vec3(Pf1.xy, Pf0.z));
  float n001 = dot(g001, vec3(Pf0.xy, Pf1.z));
  float n101 = dot(g101, vec3(Pf1.x, Pf0.y, Pf1.z));
  float n011 = dot(g011, vec3(Pf0.x, Pf1.yz));
  float n111 = dot(g111, Pf1);

  vec3 fade_xyz = fade(Pf0);
  vec4 n_z = mix(vec4(n000, n100, n010, n110), vec4(n001, n101, n011, n111), fade_xyz.z);
  vec2 n_yz = mix(n_z.xy, n_z.zw, fade_xyz.y);
  float n_xyz = mix(n_yz.x, n_yz.y, fade_xyz.x);
  return 2.2 * n_xyz;
}

void main() {
  #include <begin_vertex>
  #include <project_vertex>
  #include <fog_vertex>
  vec4 modelPosition = modelMatrix * vec4(position, 1.0);
  float elevation =
    sin(modelPosition.x * uBigWavesFrequency.x + uTime * uBigWaveSpeed)
    * sin(modelPosition.z * uBigWavesFrequency.y + uTime * uBigWaveSpeed)
    * uBigWavesElevation;

  for(float i = 1.0; i <= 10.0; i++) {
    elevation -= abs(
      cnoise(
        vec3(modelPosition.xz * uSmallWavesFrequency * i, uTime * uSmallWavesSpeed)
      )
      * uSmallWavesElevation / i
    );
    if(i >= uSmallWavesIterations) {
      break;
    }
  }

  modelPosition.y += elevation;
  vec4 viewPosition = viewMatrix * modelPosition;
  vec4 projectedPosition = projectionMatrix * viewPosition;
  gl_Position = projectedPosition;

  vElevation = elevation;
}`;

const fragmentShader = `
  #include <fog_pars_fragment>
  precision mediump float;
  uniform vec3 uDepthColor;
  uniform vec3 uSurfaceColor;

  uniform float uColorOffset;
  uniform float uColorMultiplier;

  varying float vElevation;

  void main() {
    float mixStrength = (vElevation + uColorOffset) * uColorMultiplier;
    vec3 color = mix(uDepthColor, uSurfaceColor, mixStrength);
    gl_FragColor = vec4(color, 1.0);
    #include <fog_fragment>
  }`;

function init() {
  if (!container || renderer) return;

  const colors = buildColors();
  const isMobile = window.innerHeight <= 640;
  const segments = isMobile ? 128 : 256; // 网格细分：移动端降级保性能

  scene = new THREE.Scene();
  scene.background = new THREE.Color(colors.fog);
  scene.fog = new THREE.Fog(colors.fog, colors.fogNear, colors.fogFar);

  camera = new THREE.PerspectiveCamera(
    70,
    window.innerWidth / window.innerHeight,
    0.1,
    100
  );
  const camX = 0, camY = 1.3, camZ = 3.4;
  camera.position.set(camX, camY, camZ);
  camera.lookAt(0, 0, 0);

  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, DPR_CAP));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.domElement.style.cssText = "position:absolute;inset:0;display:block;";
  container.appendChild(renderer.domElement);

  const waterGeometry = new THREE.PlaneGeometry(12, 12, segments, segments);
  waterMaterial = new THREE.ShaderMaterial({
    vertexShader,
    fragmentShader,
    transparent: true,
    fog: true,
    uniforms: {
      uTime: { value: 0 },
      uBigWavesElevation: { value: 0.2 },
      uBigWavesFrequency: { value: new THREE.Vector2(4, 2) },
      uBigWaveSpeed: { value: 0.75 },
      uSmallWavesElevation: { value: 0.15 },
      uSmallWavesFrequency: { value: 3 },
      uSmallWavesSpeed: { value: 0.2 },
      uSmallWavesIterations: { value: 4 },
      uDepthColor: { value: new THREE.Color(colors.depth) },
      uSurfaceColor: { value: new THREE.Color(colors.surface) },
      uColorOffset: { value: 0.08 },
      uColorMultiplier: { value: 5 },
      ...THREE.UniformsLib["fog"]
    }
  });

  waterMesh = new THREE.Mesh(waterGeometry, waterMaterial);
  waterMesh.rotation.x = -Math.PI * 0.5;
  scene.add(waterMesh);


  clock = new THREE.Clock();
  window.addEventListener("resize", onResize, false);
  document.addEventListener("visibilitychange", onVisibility, false);
  running = true;
  animate();
}

function animate() {
  if (!running) return;
  rafId = requestAnimationFrame(animate);
  const delta = clock.getDelta();
  const elapsed = clock.getElapsedTime();

  waterMaterial.uniforms.uTime.value = elapsed;

  // 平缓左右摆动，制造轻微纵深感（无鼠标干扰）
  camera.position.x = Math.sin(elapsed * 0.08) * 0.4;
  camera.lookAt(0, 0, 0);

  renderer.render(scene, camera);
}

function onResize() {
  if (!camera || !renderer) return;
  const w = window.innerWidth, h = window.innerHeight;
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
  renderer.setSize(w, h);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, DPR_CAP));
}

// 标签页隐藏时暂停渲染，降低后台性能占用
function onVisibility() {
  if (!camera) return;
  if (document.hidden) {
    running = false;
    if (rafId) { cancelAnimationFrame(rafId); rafId = 0; }
  } else if (!running) {
    clock.getDelta(); // 清空暂停期间积累的时间，避免跳动
    running = true;
    animate();
  }
}

function refreshForTheme() {
  destroy();
  if (container && !container.hidden) init();
}

export function mount(target) {
  container = target;
  if (!container) return;
  init();
}

export function destroy() {
  running = false;
  if (rafId) { cancelAnimationFrame(rafId); rafId = 0; }
  window.removeEventListener("resize", onResize);
  document.removeEventListener("visibilitychange", onVisibility);
  if (renderer) {
    renderer.dispose();
    if (renderer.domElement && renderer.domElement.parentNode) {
      renderer.domElement.parentNode.removeChild(renderer.domElement);
    }
    renderer = null;
  }
  if (waterMaterial) waterMaterial.dispose();
  if (waterMesh && waterMesh.geometry) waterMesh.geometry.dispose();
  waterMaterial = null; waterMesh = null; scene = null; camera = null;
}

export function setThemeMode() {
  refreshForTheme();
}
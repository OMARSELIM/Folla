import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import {
  CameraPresetId,
  Folla3DAction,
  FollaAppearance,
  TimeOfDay,
} from '../types/game';
import { createFolla3DCharacter, Folla3DRig } from './follaCharacter';
import {
  createSanctuaryEnvironment,
  InteractiveTargetType,
  SanctuaryEnvironment,
} from './sanctuaryEnvironment';
import { createProceduralTextures } from './textures';

interface Folla3DViewportProps {
  appearance: FollaAppearance;
  timeOfDay: TimeOfDay;
  isSleeping: boolean;
  unlockedKeepsakes: string[];
  actionSignal: Folla3DAction;
  cameraPreset: CameraPresetId;
  cameraPresetTrigger: number;
  onInteractTarget: (target: InteractiveTargetType) => void;
}

interface CameraPresetCoords {
  pos: [number, number, number];
  target: [number, number, number];
}

const CAMERA_PRESETS: Record<CameraPresetId, CameraPresetCoords> = {
  overview: { pos: [0, 3.6, 6.2], target: [0, 0.95, -0.2] },
  dining: { pos: [-1.1, 2.35, 3.35], target: [-2.15, 0.85, 0.75] },
  sleep: { pos: [0.55, 2.45, 2.65], target: [2.45, 0.75, -0.45] },
  closeup: { pos: [0.15, 1.85, 2.75], target: [0, 1.15, 0.45] },
};

const SKY_COLORS: Record<TimeOfDay | 'night_sleep', number> = {
  morning: 0xdfeef5,
  noon: 0xe6f2f8,
  afternoon: 0xf4e3c8,
  evening: 0x3b486b,
  night_sleep: 0x1c2541,
};

// Module-scope reusable math objects (zero GC in render loop)
const _camTargetPos = new THREE.Vector3();
const _camTargetLook = new THREE.Vector3();
const _follaTargetPos = new THREE.Vector3();
const _skyTargetColor = new THREE.Color();
const _raycaster = new THREE.Raycaster();
const _pointerNdc = new THREE.Vector2();

function detectSoftwareWebGL(): boolean {
  try {
    const testCanvas = document.createElement('canvas');
    const gl = testCanvas.getContext('webgl2') || testCanvas.getContext('webgl');
    if (!gl) return true;
    const ext = gl.getExtension('WEBGL_debug_renderer_info');
    const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
    const gpu = String(gl.getParameter(param) || '');
    gl.getExtension('WEBGL_lose_context')?.loseContext();
    return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
  } catch {
    return true;
  }
}

export const Folla3DViewport: React.FC<Folla3DViewportProps> = ({
  appearance,
  timeOfDay,
  isSleeping,
  unlockedKeepsakes,
  actionSignal,
  cameraPreset,
  cameraPresetTrigger,
  onInteractTarget,
}) => {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const [webglFailed, setWebglFailed] = useState(false);

  // Refs synced with latest props without tearing down WebGL scene
  const appearanceRef = useRef(appearance);
  const timeOfDayRef = useRef(timeOfDay);
  const isSleepingRef = useRef(isSleeping);
  const keepsakesRef = useRef(unlockedKeepsakes);
  const actionRef = useRef(actionSignal);
  const interactCallbackRef = useRef(onInteractTarget);

  const rigRef = useRef<Folla3DRig | null>(null);
  const envRef = useRef<SanctuaryEnvironment | null>(null);
  const camTransitionRef = useRef<{
    active: boolean;
    preset: CameraPresetId;
  }>({ active: false, preset: 'overview' });

  const actionTimerRef = useRef(0);
  const lastActionIdRef = useRef(actionSignal.id);

  useEffect(() => {
    appearanceRef.current = appearance;
    rigRef.current?.updateAppearance(appearance);
  }, [appearance]);

  useEffect(() => {
    timeOfDayRef.current = timeOfDay;
  }, [timeOfDay]);

  useEffect(() => {
    isSleepingRef.current = isSleeping;
  }, [isSleeping]);

  useEffect(() => {
    keepsakesRef.current = unlockedKeepsakes;
    envRef.current?.updateKeepsakes(unlockedKeepsakes);
  }, [unlockedKeepsakes]);

  useEffect(() => {
    actionRef.current = actionSignal;
    if (actionSignal.id !== lastActionIdRef.current) {
      lastActionIdRef.current = actionSignal.id;
      actionTimerRef.current = actionSignal.type === 'greeting' ? 1.8 : 3.2;
      if (actionSignal.foodId) {
        envRef.current?.updateFoodVisual(actionSignal.foodId);
      }
    }
  }, [actionSignal]);

  useEffect(() => {
    interactCallbackRef.current = onInteractTarget;
  }, [onInteractTarget]);

  useEffect(() => {
    if (cameraPresetTrigger > 0) {
      camTransitionRef.current = { active: true, preset: cameraPreset };
    }
  }, [cameraPreset, cameraPresetTrigger]);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const isSoftwareGl = detectSoftwareWebGL();

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: !isSoftwareGl,
        powerPreference: 'high-performance',
      });
    } catch {
      setWebglFailed(true);
      return;
    }

    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.08;
    renderer.setPixelRatio(
      isSoftwareGl ? 1 : Math.min(window.devicePixelRatio || 1, 2)
    );
    renderer.shadowMap.enabled = !isSoftwareGl;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.domElement.style.display = 'block';
    renderer.domElement.style.width = '100%';
    renderer.domElement.style.height = '100%';
    container.appendChild(renderer.domElement);

    const handleContextLost = (e: Event) => {
      e.preventDefault();
      setWebglFailed(true);
    };
    const handleContextRestored = () => {
      setWebglFailed(false);
    };
    renderer.domElement.addEventListener('webglcontextlost', handleContextLost);
    renderer.domElement.addEventListener('webglcontextrestored', handleContextRestored);

    // Scene + Fog + RoomEnvironment
    const scene = new THREE.Scene();
    const initialBg = new THREE.Color(SKY_COLORS.morning);
    scene.background = initialBg;
    scene.fog = new THREE.FogExp2(initialBg.getHex(), 0.032);

    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    const roomEnv = new RoomEnvironment();
    const envTarget = pmremGenerator.fromScene(roomEnv, 0.04);
    scene.environment = envTarget.texture;
    roomEnv.dispose();
    pmremGenerator.dispose();

    // Camera + OrbitControls
    const camera = new THREE.PerspectiveCamera(
      46,
      container.clientWidth / Math.max(1, container.clientHeight),
      0.1,
      80
    );
    camera.position.set(...CAMERA_PRESETS.overview.pos);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.target.set(...CAMERA_PRESETS.overview.target);
    controls.enableDamping = !isSoftwareGl;
    controls.dampingFactor = 0.06;
    controls.minDistance = 3.2;
    controls.maxDistance = 11.5;
    controls.minPolarAngle = 0.25;
    controls.maxPolarAngle = Math.PI * 0.46;
    controls.minAzimuthAngle = -Math.PI * 0.65;
    controls.maxAzimuthAngle = Math.PI * 0.65;
    controls.enablePan = false;
    controls.update();

    const cancelPresetTransition = () => {
      camTransitionRef.current.active = false;
    };
    controls.addEventListener('start', cancelPresetTransition);

    // 3-Point Studio & Courtyard Lighting
    const hemiLight = new THREE.HemisphereLight(0xcbe8f6, 0x9c8262, 0.72);
    scene.add(hemiLight);

    const keyLight = new THREE.DirectionalLight(0xfff3dc, 1.55);
    keyLight.position.set(4.8, 7.5, 5.2);
    keyLight.castShadow = !isSoftwareGl;
    keyLight.shadow.mapSize.width = 1024;
    keyLight.shadow.mapSize.height = 1024;
    keyLight.shadow.camera.near = 1;
    keyLight.shadow.camera.far = 22;
    const d = 6.5;
    keyLight.shadow.camera.left = -d;
    keyLight.shadow.camera.right = d;
    keyLight.shadow.camera.top = d;
    keyLight.shadow.camera.bottom = -d;
    keyLight.shadow.bias = -0.0005;
    keyLight.shadow.normalBias = 0.02;
    scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(0x9bd4f5, 0.52);
    rimLight.position.set(-5.0, 4.2, -5.5);
    scene.add(rimLight);

    // Procedural Textures + Environment + Folla Character
    const textures = createProceduralTextures(
      renderer.capabilities.getMaxAnisotropy()
    );
    const environment = createSanctuaryEnvironment(textures, isSoftwareGl);
    environment.updateKeepsakes(keepsakesRef.current);
    scene.add(environment.group);
    envRef.current = environment;

    const follaRig = createFolla3DCharacter(
      appearanceRef.current,
      textures.contactShadow
    );
    follaRig.root.position.set(0, 0, 0.45);
    scene.add(follaRig.root);
    rigRef.current = follaRig;

    // Sleep Floating Star Particles (InstancedMesh or small Group visible while sleeping)
    const sleepStarsGroup = new THREE.Group();
    sleepStarsGroup.position.set(2.55, 1.25, -0.45);
    sleepStarsGroup.visible = false;
    const starGeo = new THREE.OctahedronGeometry(0.06, 0);
    const starMat = new THREE.MeshBasicMaterial({ color: 0xfde68a });
    const sleepStarMeshes: THREE.Mesh[] = [];
    for (let i = 0; i < 4; i++) {
      const s = new THREE.Mesh(starGeo, starMat);
      sleepStarMeshes.push(s);
      sleepStarsGroup.add(s);
    }
    scene.add(sleepStarsGroup);

    // Register Folla mesh hierarchy as clickable
    const allInteractables = [...environment.interactables, follaRig.root];
    follaRig.root.traverse((child) => {
      child.userData.interactiveType = 'folla';
    });

    // Pointer Click & Throttled Hover Raycasting
    let pointerDownX = 0;
    let pointerDownY = 0;
    let lastHoverTime = 0;

    const updatePointerNdc = (clientX: number, clientY: number) => {
      const rect = renderer.domElement.getBoundingClientRect();
      _pointerNdc.x = ((clientX - rect.left) / rect.width) * 2 - 1;
      _pointerNdc.y = -((clientY - rect.top) / rect.height) * 2 + 1;
    };

    const onPointerDown = (e: PointerEvent) => {
      pointerDownX = e.clientX;
      pointerDownY = e.clientY;
    };

    const onPointerUp = (e: PointerEvent) => {
      const dist = Math.hypot(e.clientX - pointerDownX, e.clientY - pointerDownY);
      if (dist > 8) return; // Ignore orbit drags
      updatePointerNdc(e.clientX, e.clientY);
      _raycaster.setFromCamera(_pointerNdc, camera);
      const hits = _raycaster.intersectObjects(allInteractables, true);
      if (hits.length > 0) {
        const hitType = hits[0].object.userData.interactiveType as
          | InteractiveTargetType
          | undefined;
        if (hitType) {
          interactCallbackRef.current(hitType);
        }
      }
    };

    const onPointerMove = (e: PointerEvent) => {
      const now = performance.now();
      if (now - lastHoverTime < 65) return;
      lastHoverTime = now;
      updatePointerNdc(e.clientX, e.clientY);
      _raycaster.setFromCamera(_pointerNdc, camera);
      const hits = _raycaster.intersectObjects(allInteractables, true);
      renderer.domElement.style.cursor = hits.length > 0 ? 'pointer' : 'grab';
    };

    renderer.domElement.addEventListener('pointerdown', onPointerDown);
    renderer.domElement.addEventListener('pointerup', onPointerUp);
    renderer.domElement.addEventListener('pointermove', onPointerMove);

    // Pre-compile shaders on GPU devices
    if (!isSoftwareGl) {
      renderer.compile(scene, camera);
    }

    // Resize Observer
    const handleResize = () => {
      if (!container) return;
      const w = Math.max(1, container.clientWidth);
      const h = Math.max(1, container.clientHeight);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);
    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(container);

    // Software WebGL loop pacing helper
    let frameId = 0;
    let disposed = false;

    const afterDraw = (cb: () => void) => {
      const gl = renderer.getContext() as WebGL2RenderingContext | null;
      if (!gl || typeof gl.fenceSync !== 'function') {
        frameId = window.setTimeout(cb, 80);
        return;
      }
      const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
      gl.flush();
      const poll = () => {
        if (disposed) {
          if (sync) gl.deleteSync(sync);
          return;
        }
        const state = sync ? gl.getSyncParameter(sync, gl.SYNC_STATUS) : gl.SIGNALED;
        if (state === gl.UNSIGNALED) {
          frameId = window.setTimeout(poll, 5);
        } else {
          if (sync) gl.deleteSync(sync);
          frameId = window.setTimeout(cb, 80);
        }
      };
      frameId = window.setTimeout(poll, 5);
    };

    // Animation State
    const clock = new THREE.Clock();
    let elapsedTotal = 0;
    let sleepBlend = isSleepingRef.current ? 1 : 0;
    let currentFacingYaw = 0;

    const tick = () => {
      if (disposed) return;

      const delta = Math.min(0.08, clock.getDelta());
      elapsedTotal += delta;

      if (actionTimerRef.current > 0) {
        actionTimerRef.current = Math.max(0, actionTimerRef.current - delta);
      }

      const sleeping = isSleepingRef.current;
      const curAction =
        actionTimerRef.current > 0 ? actionRef.current.type : 'idle';

      // 1. Dynamic Lighting & Sky Fog Transition
      const skyKey = sleeping ? 'night_sleep' : timeOfDayRef.current;
      _skyTargetColor.setHex(SKY_COLORS[skyKey]);
      (scene.background as THREE.Color).lerp(_skyTargetColor, 1 - Math.exp(-3 * delta));
      if (scene.fog instanceof THREE.FogExp2) {
        scene.fog.color.copy(scene.background as THREE.Color);
      }

      const targetKeyInt = sleeping
        ? 0.28
        : timeOfDayRef.current === 'evening'
        ? 0.65
        : 1.55;
      const targetHemiInt = sleeping
        ? 0.34
        : timeOfDayRef.current === 'evening'
        ? 0.45
        : 0.72;
      const targetLampInt = sleeping || timeOfDayRef.current === 'evening' ? 1.85 : 0.45;

      keyLight.intensity = THREE.MathUtils.damp(keyLight.intensity, targetKeyInt, 3.5, delta);
      hemiLight.intensity = THREE.MathUtils.damp(hemiLight.intensity, targetHemiInt, 3.5, delta);
      environment.bedsideLampLight.intensity = THREE.MathUtils.damp(
        environment.bedsideLampLight.intensity,
        targetLampInt,
        4,
        delta
      );
      environment.bedsideLampShadeMat.emissiveIntensity = sleeping ? 1.15 : 0.35;

      // 2. Smooth Camera Preset Interpolation
      if (camTransitionRef.current.active) {
        const preset = CAMERA_PRESETS[camTransitionRef.current.preset];
        _camTargetPos.set(...preset.pos);
        _camTargetLook.set(...preset.target);
        camera.position.lerp(_camTargetPos, 1 - Math.exp(-4.8 * delta));
        controls.target.lerp(_camTargetLook, 1 - Math.exp(-5.4 * delta));
        if (
          camera.position.distanceTo(_camTargetPos) < 0.04 &&
          controls.target.distanceTo(_camTargetLook) < 0.04
        ) {
          camTransitionRef.current.active = false;
        }
      }
      controls.update();

      // 3. Folla Locomotion & Posture Targets
      let targetYaw = 0;
      if (sleeping) {
        // Bed center coordinates
        _follaTargetPos.set(2.55, 0.56, -0.45);
        targetYaw = -Math.PI / 6;
      } else if (curAction === 'eating' || curAction === 'drinking') {
        // Stand beside the dining table facing the platter/pitcher
        _follaTargetPos.set(-1.32, 0, 0.75);
        targetYaw = -Math.PI / 2;
      } else {
        // Center living rug
        _follaTargetPos.set(0, 0, 0.45);
        targetYaw = 0;
      }

      const distToGoal = Math.hypot(
        _follaTargetPos.x - follaRig.root.position.x,
        _follaTargetPos.z - follaRig.root.position.z
      );
      const isWalking = distToGoal > 0.14;

      follaRig.root.position.x = THREE.MathUtils.damp(
        follaRig.root.position.x,
        _follaTargetPos.x,
        4.2,
        delta
      );
      follaRig.root.position.z = THREE.MathUtils.damp(
        follaRig.root.position.z,
        _follaTargetPos.z,
        4.2,
        delta
      );

      // Only lift onto mattress when close to bed
      const targetRootY = sleeping && distToGoal < 0.55 ? 0.58 : 0;
      follaRig.root.position.y = THREE.MathUtils.damp(
        follaRig.root.position.y,
        targetRootY,
        5.5,
        delta
      );

      // Facing direction
      if (isWalking) {
        targetYaw = Math.atan2(
          _follaTargetPos.x - follaRig.root.position.x,
          _follaTargetPos.z - follaRig.root.position.z
        );
      }
      currentFacingYaw = THREE.MathUtils.damp(currentFacingYaw, targetYaw, 6, delta);
      follaRig.root.rotation.y = currentFacingYaw;

      // Sleep Lie-Down Posture & Bed Quilt Animation
      sleepBlend = THREE.MathUtils.damp(
        sleepBlend,
        sleeping && distToGoal < 0.55 ? 1 : 0,
        5,
        delta
      );
      follaRig.bodyPivot.rotation.x = -sleepBlend * (Math.PI / 2 - 0.08);
      follaRig.bodyPivot.position.z = sleepBlend * 0.65;
      follaRig.bodyPivot.position.y = sleepBlend * 0.12;

      // Pull quilt gently over Folla when sleeping
      environment.bedQuilt.position.z = THREE.MathUtils.lerp(0.34, 0.12, sleepBlend);
      environment.bedQuilt.position.y = THREE.MathUtils.lerp(0.55, 0.66, sleepBlend);

      // 4. Limb & Facial Animations
      const blinkCycle = elapsedTotal % 4.2;
      const isBlinking = blinkCycle > 4.02;
      follaRig.setSleepingLook(sleeping && sleepBlend > 0.45, isBlinking ? 1 : 0);

      // Held props visibility
      follaRig.handSnack.visible = curAction === 'eating' && !isWalking;
      follaRig.handCup.visible = curAction === 'drinking' && !isWalking;

      if (isWalking) {
        const stride = Math.sin(elapsedTotal * 10);
        follaRig.leftLeg.rotation.x = stride * 0.45;
        follaRig.rightLeg.rotation.x = -stride * 0.45;
        follaRig.leftArm.rotation.x = -stride * 0.35;
        follaRig.rightArm.rotation.x = stride * 0.35;
        follaRig.rightArm.rotation.z = 0;
        follaRig.headGroup.rotation.z = Math.sin(elapsedTotal * 5) * 0.03;
        follaRig.setMouthOpen(false);
      } else if (sleeping) {
        follaRig.leftLeg.rotation.x = 0;
        follaRig.rightLeg.rotation.x = 0;
        follaRig.leftArm.rotation.x = 0;
        follaRig.rightArm.rotation.x = 0;
        follaRig.rightArm.rotation.z = 0;
        follaRig.headGroup.rotation.z = Math.sin(elapsedTotal * 1.4) * 0.04;
        follaRig.bodyPivot.position.y += Math.sin(elapsedTotal * 2) * 0.012;
        follaRig.setMouthOpen(false);
      } else if (curAction === 'eating' || curAction === 'drinking') {
        const chewWave = (Math.sin(elapsedTotal * 7.5) + 1) * 0.5;
        follaRig.leftLeg.rotation.x = 0;
        follaRig.rightLeg.rotation.x = 0;
        follaRig.leftArm.rotation.x = 0;
        follaRig.rightArm.rotation.x = -1.25 - chewWave * 0.55;
        follaRig.rightArm.rotation.z = -0.35;
        follaRig.headGroup.rotation.x = chewWave * 0.12;
        follaRig.setMouthOpen(chewWave > 0.55);
      } else if (curAction === 'greeting') {
        follaRig.leftLeg.rotation.x = 0;
        follaRig.rightLeg.rotation.x = 0;
        follaRig.leftArm.rotation.x = 0;
        follaRig.rightArm.rotation.x = -0.25;
        follaRig.rightArm.rotation.z = 2.25 + Math.sin(elapsedTotal * 11) * 0.35;
        follaRig.headGroup.rotation.z = Math.sin(elapsedTotal * 6) * 0.08;
        follaRig.setMouthOpen(true);
      } else {
        // Gentle idle breathing
        follaRig.leftLeg.rotation.x = THREE.MathUtils.damp(
          follaRig.leftLeg.rotation.x,
          0,
          8,
          delta
        );
        follaRig.rightLeg.rotation.x = THREE.MathUtils.damp(
          follaRig.rightLeg.rotation.x,
          0,
          8,
          delta
        );
        follaRig.leftArm.rotation.x = Math.sin(elapsedTotal * 1.8) * 0.04;
        follaRig.rightArm.rotation.x = THREE.MathUtils.damp(
          follaRig.rightArm.rotation.x,
          -Math.sin(elapsedTotal * 1.8) * 0.04,
          8,
          delta
        );
        follaRig.rightArm.rotation.z = THREE.MathUtils.damp(
          follaRig.rightArm.rotation.z,
          0,
          8,
          delta
        );
        follaRig.headGroup.rotation.x = Math.sin(elapsedTotal * 1.5) * 0.03;
        follaRig.headGroup.rotation.z = Math.sin(elapsedTotal * 1.1) * 0.04;
        follaRig.setMouthOpen(false);
      }

      // 5. Sleep Floating Stars Animation
      sleepStarsGroup.visible = sleeping && sleepBlend > 0.55;
      if (sleepStarsGroup.visible) {
        sleepStarMeshes.forEach((star, i) => {
          const t = (elapsedTotal * 0.65 + i * 0.25) % 1;
          star.position.set(
            Math.sin(elapsedTotal * 1.5 + i) * 0.28,
            t * 1.1,
            Math.cos(elapsedTotal * 1.2 + i) * 0.22
          );
          const s = Math.sin(t * Math.PI) * 1.1;
          star.scale.setScalar(Math.max(0.01, s));
          star.rotation.y = elapsedTotal * 1.5 + i;
        });
      }

      renderer.render(scene, camera);

      if (isSoftwareGl) {
        afterDraw(tick);
      } else {
        frameId = requestAnimationFrame(tick);
      }
    };

    tick();

    return () => {
      disposed = true;
      cancelAnimationFrame(frameId);
      clearTimeout(frameId);
      resizeObserver.disconnect();
      window.removeEventListener('resize', handleResize);
      controls.removeEventListener('start', cancelPresetTransition);
      controls.dispose();
      renderer.domElement.removeEventListener('pointerdown', onPointerDown);
      renderer.domElement.removeEventListener('pointerup', onPointerUp);
      renderer.domElement.removeEventListener('pointermove', onPointerMove);
      renderer.domElement.removeEventListener('webglcontextlost', handleContextLost);
      renderer.domElement.removeEventListener('webglcontextrestored', handleContextRestored);

      follaRig.dispose();
      environment.dispose();
      textures.dispose();
      starGeo.dispose();
      starMat.dispose();
      envTarget.dispose();
      renderer.dispose();

      if (renderer.domElement.parentNode === container) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  if (webglFailed) {
    return (
      <div className="absolute inset-0 flex items-center justify-center bg-[#EFE5D3] p-6 text-center">
        <div className="max-w-sm rounded-2xl border border-[#1C2A24]/15 bg-[#FAF6EE] p-6 shadow-md">
          <p className="text-base font-bold text-[#1C2A24]">
            تعذّر تشغيل العرض ثلاثي الأبعاد على هذا الجهاز
          </p>
          <p className="mt-2 text-xs text-[#52665C]">
            يمكنك متابعة التحديات والعناية بفُلَّة من أزرار التحكم بالأسفل.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={mountRef}
      className="absolute inset-0 h-full w-full touch-none"
      aria-label="مشهد حديقة فُلَّة ثلاثي الأبعاد - اسحب لتدوير الكاميرا وانقر على العناصر للتفاعل"
    />
  );
};

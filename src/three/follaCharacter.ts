import * as THREE from 'three';
import { HAIR_STYLE_OPTIONS, OUTFIT_OPTIONS, SKIN_TONES } from '../data/challenges';
import { FollaAppearance } from '../types/game';

export interface Folla3DRig {
  root: THREE.Group;
  bodyPivot: THREE.Group;
  headGroup: THREE.Group;
  leftArm: THREE.Group;
  rightArm: THREE.Group;
  leftLeg: THREE.Group;
  rightLeg: THREE.Group;
  handSnack: THREE.Group;
  handCup: THREE.Group;
  leftEyeOpen: THREE.Mesh;
  rightEyeOpen: THREE.Mesh;
  leftEyeClosed: THREE.Mesh;
  rightEyeClosed: THREE.Mesh;
  mouthSmile: THREE.Mesh;
  mouthOpen: THREE.Mesh;
  updateAppearance: (appearance: FollaAppearance) => void;
  setSleepingLook: (sleeping: boolean, blinkAmount?: number) => void;
  setMouthOpen: (open: boolean) => void;
  dispose: () => void;
}

export function createFolla3DCharacter(
  initialAppearance: FollaAppearance,
  contactShadowTexture: THREE.Texture
): Folla3DRig {
  const disposables: Array<{ dispose: () => void }> = [];
  const track = <T extends { dispose: () => void }>(res: T): T => {
    disposables.push(res);
    return res;
  };

  const root = new THREE.Group();
  root.name = 'folla_character';

  // Soft contact shadow directly on ground
  const shadowGeo = track(new THREE.PlaneGeometry(1.15, 1.15));
  const shadowMat = track(
    new THREE.MeshBasicMaterial({
      map: contactShadowTexture,
      transparent: true,
      depthWrite: false,
      opacity: 0.48,
    })
  );
  const contactShadow = new THREE.Mesh(shadowGeo, shadowMat);
  contactShadow.rotation.x = -Math.PI / 2;
  contactShadow.position.y = 0.025;
  root.add(contactShadow);

  // Body pivot (rotated when lying down on the bed)
  const bodyPivot = new THREE.Group();
  root.add(bodyPivot);

  // Shared Dynamic Materials
  const skinMat = track(
    new THREE.MeshStandardMaterial({
      color: 0xf4cbae,
      roughness: 0.58,
      metalness: 0.02,
    })
  );
  const dressMat = track(
    new THREE.MeshStandardMaterial({
      color: 0x5ba98b,
      roughness: 0.72,
      metalness: 0.04,
    })
  );
  const trimMat = track(
    new THREE.MeshStandardMaterial({
      color: 0xf5e7c6,
      roughness: 0.45,
      metalness: 0.15,
    })
  );
  const patternMat = track(
    new THREE.MeshStandardMaterial({
      color: 0xc78318,
      roughness: 0.35,
      metalness: 0.35,
    })
  );
  const headWrapPrimaryMat = track(
    new THREE.MeshStandardMaterial({
      color: 0xfaf2df,
      roughness: 0.65,
      metalness: 0.05,
    })
  );
  const headWrapAccentMat = track(
    new THREE.MeshStandardMaterial({
      color: 0xc78318,
      roughness: 0.4,
      metalness: 0.25,
    })
  );
  const shoeMat = track(
    new THREE.MeshStandardMaterial({
      color: 0x5e3c28,
      roughness: 0.6,
      metalness: 0.08,
    })
  );
  const eyeWhiteMat = track(
    new THREE.MeshStandardMaterial({ color: 0x1c2a24, roughness: 0.2, metalness: 0.1 })
  );
  const blushMat = track(
    new THREE.MeshStandardMaterial({
      color: 0xe58a7e,
      roughness: 0.75,
      transparent: true,
      opacity: 0.65,
    })
  );

  // Legs + Shoes (bottom-center grounded at y = 0)
  const legGeo = track(new THREE.CylinderGeometry(0.065, 0.058, 0.42, 14));
  const shoeGeo = track(new THREE.SphereGeometry(0.085, 16, 12));

  const createLeg = (xOffset: number) => {
    const legGroup = new THREE.Group();
    legGroup.position.set(xOffset, 0.44, 0);

    const legMesh = new THREE.Mesh(legGeo, skinMat);
    legMesh.position.y = -0.18;
    legMesh.castShadow = true;
    legGroup.add(legMesh);

    const shoe = new THREE.Mesh(shoeGeo, shoeMat);
    shoe.scale.set(0.95, 0.65, 1.35);
    shoe.position.set(0, -0.39, 0.035);
    shoe.castShadow = true;
    legGroup.add(shoe);

    return legGroup;
  };

  const leftLeg = createLeg(-0.12);
  const rightLeg = createLeg(0.12);
  bodyPivot.add(leftLeg, rightLeg);

  // Sculpted Flared Dress Skirt (LatheGeometry for smooth silhouette)
  const skirtPoints = [
    new THREE.Vector2(0.01, 0),
    new THREE.Vector2(0.36, 0),
    new THREE.Vector2(0.32, 0.2),
    new THREE.Vector2(0.24, 0.46),
    new THREE.Vector2(0.19, 0.62),
  ];
  const skirtGeo = track(new THREE.LatheGeometry(skirtPoints, 28));
  const skirtMesh = new THREE.Mesh(skirtGeo, dressMat);
  skirtMesh.position.y = 0.24;
  skirtMesh.castShadow = true;
  skirtMesh.receiveShadow = true;
  bodyPivot.add(skirtMesh);

  // Skirt decorative bottom hem ring
  const hemGeo = track(new THREE.TorusGeometry(0.35, 0.022, 10, 32));
  const hemMesh = new THREE.Mesh(hemGeo, trimMat);
  hemMesh.rotation.x = Math.PI / 2;
  hemMesh.position.y = 0.255;
  bodyPivot.add(hemMesh);

  // Upper Torso Bodice
  const torsoGeo = track(new THREE.CylinderGeometry(0.17, 0.21, 0.38, 22));
  const torsoMesh = new THREE.Mesh(torsoGeo, dressMat);
  torsoMesh.position.y = 0.96;
  torsoMesh.castShadow = true;
  bodyPivot.add(torsoMesh);

  // Embroidered Sash / Belt around waist
  const sashGeo = track(new THREE.CylinderGeometry(0.205, 0.215, 0.08, 22));
  const sashMesh = new THREE.Mesh(sashGeo, patternMat);
  sashMesh.position.y = 0.81;
  bodyPivot.add(sashMesh);

  // Front decorative collar / embroidery trim
  const collarGeo = track(new THREE.TorusGeometry(0.145, 0.024, 10, 24));
  const collarMesh = new THREE.Mesh(collarGeo, trimMat);
  collarMesh.rotation.x = Math.PI / 2;
  collarMesh.position.y = 1.13;
  bodyPivot.add(collarMesh);

  // Articulated Arms
  const sleeveGeo = track(new THREE.CylinderGeometry(0.062, 0.072, 0.26, 14));
  const handGeo = track(new THREE.SphereGeometry(0.058, 14, 12));

  const createArm = (side: -1 | 1) => {
    const armGroup = new THREE.Group();
    armGroup.position.set(side * 0.22, 1.09, 0);

    const sleeve = new THREE.Mesh(sleeveGeo, dressMat);
    sleeve.position.set(side * 0.03, -0.11, 0);
    sleeve.rotation.z = side * 0.22;
    sleeve.castShadow = true;
    armGroup.add(sleeve);

    const cuff = new THREE.Mesh(
      track(new THREE.TorusGeometry(0.068, 0.015, 8, 16)),
      trimMat
    );
    cuff.rotation.x = Math.PI / 2;
    cuff.rotation.y = side * 0.22;
    cuff.position.set(side * 0.055, -0.22, 0);
    armGroup.add(cuff);

    const hand = new THREE.Mesh(handGeo, skinMat);
    hand.position.set(side * 0.068, -0.28, 0.01);
    hand.castShadow = true;
    armGroup.add(hand);

    return armGroup;
  };

  const leftArm = createArm(-1);
  const rightArm = createArm(1);
  bodyPivot.add(leftArm, rightArm);

  // Held snack item (appears on right hand while eating)
  const handSnack = new THREE.Group();
  handSnack.position.set(0.07, -0.31, 0.09);
  handSnack.visible = false;
  const snackBall = new THREE.Mesh(
    track(new THREE.SphereGeometry(0.055, 12, 10)),
    track(new THREE.MeshStandardMaterial({ color: 0xc2412d, roughness: 0.45 }))
  );
  snackBall.scale.set(1, 0.85, 1);
  handSnack.add(snackBall);
  rightArm.add(handSnack);

  // Held water cup (appears on right hand while drinking)
  const handCup = new THREE.Group();
  handCup.position.set(0.07, -0.31, 0.09);
  handCup.visible = false;
  const cupBody = new THREE.Mesh(
    track(new THREE.CylinderGeometry(0.048, 0.036, 0.11, 14)),
    track(
      new THREE.MeshPhysicalMaterial({
        color: 0x7dd3fc,
        roughness: 0.1,
        metalness: 0.05,
        transparent: true,
        opacity: 0.82,
      })
    )
  );
  handCup.add(cupBody);
  rightArm.add(handCup);

  // Head Group
  const headGroup = new THREE.Group();
  headGroup.position.set(0, 1.38, 0);
  bodyPivot.add(headGroup);

  // Neck
  const neck = new THREE.Mesh(
    track(new THREE.CylinderGeometry(0.07, 0.08, 0.12, 14)),
    skinMat
  );
  neck.position.y = -0.18;
  headGroup.add(neck);

  // Sculpted Face / Head Sphere
  const headSphere = new THREE.Mesh(
    track(new THREE.SphereGeometry(0.265, 28, 24)),
    skinMat
  );
  headSphere.scale.set(1, 1.04, 0.96);
  headSphere.castShadow = true;
  headGroup.add(headSphere);

  // Eyes (Open & Sleeping Closed Eyelids)
  const eyeGeo = track(new THREE.SphereGeometry(0.034, 14, 12));
  const highlightGeo = track(new THREE.SphereGeometry(0.011, 8, 8));
  const highlightMat = track(new THREE.MeshBasicMaterial({ color: 0xffffff }));

  const createEye = (x: number) => {
    const eye = new THREE.Mesh(eyeGeo, eyeWhiteMat);
    eye.position.set(x, 0.015, 0.232);
    eye.scale.set(0.95, 1.15, 0.6);

    const sparkle = new THREE.Mesh(highlightGeo, highlightMat);
    sparkle.position.set(0.01, 0.012, 0.025);
    eye.add(sparkle);
    return eye;
  };

  const leftEyeOpen = createEye(-0.088);
  const rightEyeOpen = createEye(0.088);
  headGroup.add(leftEyeOpen, rightEyeOpen);

  // Closed eye arcs for blinking & sleeping
  const closedEyeGeo = track(
    new THREE.TorusGeometry(0.032, 0.008, 8, 16, Math.PI)
  );
  const leftEyeClosed = new THREE.Mesh(closedEyeGeo, eyeWhiteMat);
  leftEyeClosed.position.set(-0.088, 0.01, 0.242);
  leftEyeClosed.rotation.z = Math.PI;
  leftEyeClosed.visible = false;

  const rightEyeClosed = new THREE.Mesh(closedEyeGeo, eyeWhiteMat);
  rightEyeClosed.position.set(0.088, 0.01, 0.242);
  rightEyeClosed.rotation.z = Math.PI;
  rightEyeClosed.visible = false;
  headGroup.add(leftEyeClosed, rightEyeClosed);

  // Rosy cheeks
  const cheekGeo = track(new THREE.SphereGeometry(0.042, 12, 10));
  const leftCheek = new THREE.Mesh(cheekGeo, blushMat);
  leftCheek.scale.set(1.2, 0.75, 0.4);
  leftCheek.position.set(-0.145, -0.05, 0.21);

  const rightCheek = new THREE.Mesh(cheekGeo, blushMat);
  rightCheek.scale.set(1.2, 0.75, 0.4);
  rightCheek.position.set(0.145, -0.05, 0.21);
  headGroup.add(leftCheek, rightCheek);

  // Smile & Open Eating/Talking Mouth
  const mouthSmile = new THREE.Mesh(
    track(new THREE.TorusGeometry(0.044, 0.009, 8, 16, Math.PI)),
    track(new THREE.MeshStandardMaterial({ color: 0xb84a54, roughness: 0.4 }))
  );
  mouthSmile.position.set(0, -0.088, 0.238);
  mouthSmile.rotation.z = Math.PI;
  headGroup.add(mouthSmile);

  const mouthOpen = new THREE.Mesh(
    track(new THREE.SphereGeometry(0.028, 12, 10)),
    track(new THREE.MeshStandardMaterial({ color: 0x9b3341, roughness: 0.4 }))
  );
  mouthOpen.position.set(0, -0.095, 0.238);
  mouthOpen.scale.set(1.1, 0.9, 0.5);
  mouthOpen.visible = false;
  headGroup.add(mouthOpen);

  // Hijab & Hair Accessories Group (toggled dynamically per FollaAppearance)
  const hijabGroup = new THREE.Group();
  headGroup.add(hijabGroup);

  const hijabHood = new THREE.Mesh(
    track(new THREE.SphereGeometry(0.285, 28, 24, 0, Math.PI * 2, 0, Math.PI * 0.78)),
    headWrapPrimaryMat
  );
  hijabHood.rotation.x = -0.35;
  hijabHood.position.set(0, 0.01, -0.02);
  hijabHood.castShadow = true;
  hijabGroup.add(hijabHood);

  const hijabBrim = new THREE.Mesh(
    track(new THREE.TorusGeometry(0.252, 0.036, 12, 32)),
    headWrapPrimaryMat
  );
  hijabBrim.position.set(0, 0.015, 0.075);
  hijabBrim.rotation.x = 0.2;
  hijabGroup.add(hijabBrim);

  const hijabShawl = new THREE.Mesh(
    track(new THREE.CylinderGeometry(0.22, 0.27, 0.22, 24, 1, false)),
    headWrapPrimaryMat
  );
  hijabShawl.position.set(0, -0.21, -0.01);
  hijabGroup.add(hijabShawl);

  const hijabAccentBrooch = new THREE.Mesh(
    track(new THREE.OctahedronGeometry(0.042, 1)),
    headWrapAccentMat
  );
  hijabAccentBrooch.position.set(0.18, 0.14, 0.16);
  hijabGroup.add(hijabAccentBrooch);

  // Home Hairstyles Group (for braids / bun / wavy_headband)
  const hairGroup = new THREE.Group();
  headGroup.add(hairGroup);

  const hairCap = new THREE.Mesh(
    track(new THREE.SphereGeometry(0.278, 26, 22, 0, Math.PI * 2, 0, Math.PI * 0.65)),
    headWrapPrimaryMat
  );
  hairCap.rotation.x = -0.32;
  hairCap.position.set(0, 0.025, -0.02);
  hairCap.castShadow = true;
  hairGroup.add(hairCap);

  // Twin braids
  const braidsSubGroup = new THREE.Group();
  [-1, 1].forEach((side) => {
    for (let i = 0; i < 4; i++) {
      const bead = new THREE.Mesh(
        track(new THREE.SphereGeometry(0.056 - i * 0.008, 12, 10)),
        headWrapPrimaryMat
      );
      bead.position.set(side * (0.24 + i * 0.015), -0.04 - i * 0.075, -0.04);
      braidsSubGroup.add(bead);
    }
    const tie = new THREE.Mesh(
      track(new THREE.TorusGeometry(0.036, 0.012, 8, 14)),
      headWrapAccentMat
    );
    tie.position.set(side * 0.28, -0.26, -0.04);
    tie.rotation.x = Math.PI / 2;
    braidsSubGroup.add(tie);
  });
  hairGroup.add(braidsSubGroup);

  // Top bun + ribbon
  const bunSubGroup = new THREE.Group();
  const bunSphere = new THREE.Mesh(
    track(new THREE.SphereGeometry(0.11, 16, 14)),
    headWrapPrimaryMat
  );
  bunSphere.position.set(0, 0.29, -0.06);
  const bunRibbon = new THREE.Mesh(
    track(new THREE.TorusGeometry(0.095, 0.02, 10, 20)),
    headWrapAccentMat
  );
  bunRibbon.rotation.x = Math.PI / 2;
  bunRibbon.position.set(0, 0.24, -0.05);
  bunSubGroup.add(bunSphere, bunRibbon);
  hairGroup.add(bunSubGroup);

  // Headband flowers
  const headbandSubGroup = new THREE.Group();
  const band = new THREE.Mesh(
    track(new THREE.TorusGeometry(0.27, 0.02, 10, 28, Math.PI)),
    headWrapAccentMat
  );
  band.position.set(0, 0.06, 0.03);
  band.rotation.z = 0;
  headbandSubGroup.add(band);
  [-0.14, 0, 0.14].forEach((fx, idx) => {
    const flower = new THREE.Mesh(
      track(new THREE.DodecahedronGeometry(0.034, 0)),
      trimMat
    );
    flower.position.set(fx, 0.26 - idx * 0.01 + (idx === 1 ? 0.04 : 0), 0.11);
    headbandSubGroup.add(flower);
  });
  hairGroup.add(headbandSubGroup);

  const updateAppearance = (appearance: FollaAppearance) => {
    const skin = SKIN_TONES.find((s) => s.id === appearance.skinTone) || SKIN_TONES[1];
    const outfit =
      OUTFIT_OPTIONS.find((o) => o.id === appearance.outfit) || OUTFIT_OPTIONS[0];
    const hair =
      HAIR_STYLE_OPTIONS.find((h) => h.id === appearance.hairStyle) ||
      HAIR_STYLE_OPTIONS[0];

    skinMat.color.set(skin.base);
    blushMat.color.set(skin.blush);

    dressMat.color.set(outfit.primaryColor);
    trimMat.color.set(outfit.trimColor);
    patternMat.color.set(outfit.patternColor);

    headWrapPrimaryMat.color.set(hair.primaryColor);
    headWrapAccentMat.color.set(hair.accentColor);

    const isHijab = hair.id.startsWith('hijab_');
    hijabGroup.visible = isHijab;
    hairGroup.visible = !isHijab;
    if (!isHijab) {
      braidsSubGroup.visible = hair.id === 'braids';
      bunSubGroup.visible = hair.id === 'bun_ribbon';
      headbandSubGroup.visible = hair.id === 'wavy_headband';
    }
  };

  updateAppearance(initialAppearance);

  const setSleepingLook = (sleeping: boolean, blinkAmount = 0) => {
    const eyesClosed = sleeping || blinkAmount > 0.5;
    leftEyeOpen.visible = !eyesClosed;
    rightEyeOpen.visible = !eyesClosed;
    leftEyeClosed.visible = eyesClosed;
    rightEyeClosed.visible = eyesClosed;
  };

  const setMouthOpen = (open: boolean) => {
    mouthSmile.visible = !open;
    mouthOpen.visible = open;
  };

  return {
    root,
    bodyPivot,
    headGroup,
    leftArm,
    rightArm,
    leftLeg,
    rightLeg,
    handSnack,
    handCup,
    leftEyeOpen,
    rightEyeOpen,
    leftEyeClosed,
    rightEyeClosed,
    mouthSmile,
    mouthOpen,
    updateAppearance,
    setSleepingLook,
    setMouthOpen,
    dispose: () => {
      disposables.forEach((d) => d.dispose());
    },
  };
}

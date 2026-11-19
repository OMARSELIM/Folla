import * as THREE from 'three';
import { FoodOptionId } from '../types/game';
import { ProceduralTextureSet } from './textures';

export type InteractiveTargetType = 'folla' | 'food_table' | 'water_pitcher' | 'bed' | 'bookshelf';

export interface SanctuaryEnvironment {
  group: THREE.Group;
  interactables: THREE.Object3D[];
  bedQuilt: THREE.Mesh;
  bedsideLampLight: THREE.PointLight;
  bedsideLampShadeMat: THREE.MeshStandardMaterial;
  keepsakeNodes: {
    lantern: THREE.Group;
    olive: THREE.Group;
    charity_box: THREE.Group;
    prayer_mat: THREE.Group;
  };
  snackDishGroup: THREE.Group;
  updateFoodVisual: (foodId?: FoodOptionId) => void;
  updateKeepsakes: (unlockedIds: string[]) => void;
  dispose: () => void;
}

export function createSanctuaryEnvironment(
  textures: ProceduralTextureSet,
  isSoftwareGl: boolean
): SanctuaryEnvironment {
  const disposables: Array<{ dispose: () => void }> = [];
  const track = <T extends { dispose: () => void }>(res: T): T => {
    disposables.push(res);
    return res;
  };

  const group = new THREE.Group();
  const interactables: THREE.Object3D[] = [];

  const registerClickable = (obj: THREE.Object3D, targetType: InteractiveTargetType) => {
    obj.userData.interactiveType = targetType;
    obj.traverse((child) => {
      child.userData.interactiveType = targetType;
    });
    interactables.push(obj);
  };

  // Materials
  const floorMat = track(
    new THREE.MeshStandardMaterial({
      map: textures.floorTile,
      roughness: 0.78,
      metalness: 0.04,
    })
  );
  const outdoorGrassMat = track(
    new THREE.MeshStandardMaterial({
      color: 0x6ea66b,
      roughness: 0.9,
      metalness: 0.0,
    })
  );
  const plasterWallMat = track(
    new THREE.MeshStandardMaterial({
      color: 0xf7efe1,
      roughness: 0.85,
      metalness: 0.02,
    })
  );
  const woodMat = track(
    new THREE.MeshStandardMaterial({
      map: textures.wood,
      roughness: 0.58,
      metalness: 0.06,
    })
  );
  const brassMat = track(
    new THREE.MeshStandardMaterial({
      color: 0xd49a2a,
      roughness: 0.24,
      metalness: 0.86,
    })
  );
  const emeraldAccentMat = track(
    new THREE.MeshStandardMaterial({
      color: 0x0f6b4e,
      roughness: 0.55,
      metalness: 0.08,
    })
  );
  const ceramicMat = track(
    new THREE.MeshStandardMaterial({
      color: 0xfaf6ee,
      roughness: 0.25,
      metalness: 0.05,
    })
  );
  const glassWaterMat = track(
    new THREE.MeshPhysicalMaterial({
      color: 0x86d7f7,
      roughness: 0.08,
      metalness: 0.04,
      transmission: isSoftwareGl ? 0 : 0.72,
      transparent: true,
      opacity: isSoftwareGl ? 0.55 : 0.92,
      ior: 1.45,
    })
  );

  // 1. Extended Outdoor Courtyard & Garden Terrain (no floating box void)
  const gardenGround = new THREE.Mesh(
    track(new THREE.CircleGeometry(32, 48)),
    outdoorGrassMat
  );
  gardenGround.rotation.x = -Math.PI / 2;
  gardenGround.position.y = -0.02;
  gardenGround.receiveShadow = true;
  group.add(gardenGround);

  // Sanctuary Stone & Zellige Courtyard Platform (y = 0)
  const platform = new THREE.Mesh(
    track(new THREE.CylinderGeometry(5.6, 5.8, 0.14, 40)),
    floorMat
  );
  platform.position.y = -0.07;
  platform.receiveShadow = true;
  group.add(platform);

  // Central Woven Living Rug (offset by +0.02 on Y to prevent Z-fighting)
  const rugMesh = new THREE.Mesh(
    track(new THREE.BoxGeometry(3.2, 0.024, 2.6)),
    track(
      new THREE.MeshStandardMaterial({
        map: textures.rug,
        roughness: 0.92,
        metalness: 0.0,
      })
    )
  );
  rugMesh.position.set(0, 0.012, 0.3);
  rugMesh.receiveShadow = true;
  group.add(rugMesh);

  // 2. Back Arched Courtyard Wall (open to garden horizon on sides and through arches)
  const backWallGroup = new THREE.Group();
  backWallGroup.position.set(0, 0, -4.1);
  group.add(backWallGroup);

  const wallLeft = new THREE.Mesh(
    track(new THREE.BoxGeometry(2.8, 3.2, 0.32)),
    plasterWallMat
  );
  wallLeft.position.set(-3.1, 1.6, 0);
  wallLeft.castShadow = true;
  wallLeft.receiveShadow = true;

  const wallRight = new THREE.Mesh(
    track(new THREE.BoxGeometry(2.8, 3.2, 0.32)),
    plasterWallMat
  );
  wallRight.position.set(3.1, 1.6, 0);
  wallRight.castShadow = true;
  wallRight.receiveShadow = true;

  const wallHeader = new THREE.Mesh(
    track(new THREE.BoxGeometry(3.6, 0.75, 0.32)),
    plasterWallMat
  );
  wallHeader.position.set(0, 2.82, 0);
  wallHeader.castShadow = true;

  // Decorative wooden mashrabiya pillars framing the central garden archway
  [-1.7, 1.7].forEach((px) => {
    const pillar = new THREE.Mesh(
      track(new THREE.CylinderGeometry(0.11, 0.13, 2.6, 16)),
      woodMat
    );
    pillar.position.set(px, 1.3, 0.08);
    pillar.castShadow = true;
    backWallGroup.add(pillar);
  });

  // Top frieze trim
  const frieze = new THREE.Mesh(
    track(new THREE.BoxGeometry(9.2, 0.16, 0.38)),
    emeraldAccentMat
  );
  frieze.position.set(0, 3.22, 0);
  backWallGroup.add(wallLeft, wallRight, wallHeader, frieze);

  // Outdoor Garden Trees (Multi-part date palms & olive trees visible through arch and around courtyard)
  const createGardenTree = (x: number, z: number, scale: number) => {
    const tree = new THREE.Group();
    tree.position.set(x, 0, z);
    tree.scale.setScalar(scale);

    const trunk = new THREE.Mesh(
      track(new THREE.CylinderGeometry(0.14, 0.22, 2.2, 10)),
      woodMat
    );
    trunk.position.y = 1.1;
    trunk.castShadow = true;
    tree.add(trunk);

    const leafMat = track(
      new THREE.MeshStandardMaterial({
        color: 0x3b7a4c,
        roughness: 0.78,
        metalness: 0.02,
      })
    );
    [
      [0, 2.35, 0, 0.85],
      [-0.45, 2.1, 0.25, 0.62],
      [0.48, 2.15, -0.22, 0.65],
      [0.15, 2.05, 0.45, 0.58],
    ].forEach(([lx, ly, lz, r]) => {
      const crown = new THREE.Mesh(track(new THREE.DodecahedronGeometry(r, 1)), leafMat);
      crown.position.set(lx, ly, lz);
      crown.castShadow = true;
      tree.add(crown);
    });
    group.add(tree);
  };
  createGardenTree(-6.5, -5.8, 1.1);
  createGardenTree(6.8, -5.4, 1.0);
  createGardenTree(0.4, -8.2, 1.25);
  createGardenTree(-7.2, 1.5, 0.95);
  createGardenTree(7.4, 2.0, 1.05);

  // Low limestone garden border stones
  for (let i = 0; i < 14; i++) {
    const angle = (i / 14) * Math.PI * 2;
    if (angle > 0.6 && angle < 2.5) continue; // Keep front camera side open
    const stone = new THREE.Mesh(
      track(new THREE.BoxGeometry(0.85, 0.34, 0.24)),
      plasterWallMat
    );
    stone.position.set(Math.cos(angle) * 5.65, 0.17, Math.sin(angle) * 5.65);
    stone.rotation.y = -angle + Math.PI / 2;
    stone.castShadow = true;
    stone.receiveShadow = true;
    group.add(stone);
  }

  // ---------------------------------------------------------------------------
  // 3. DINING TABLE STATION (مائدة الطعام والشراب) at (-2.45, 0, 0.75)
  // ---------------------------------------------------------------------------
  const diningGroup = new THREE.Group();
  diningGroup.position.set(-2.45, 0, 0.75);
  group.add(diningGroup);

  // Table top + bevel rim
  const tableTop = new THREE.Mesh(
    track(new THREE.CylinderGeometry(0.88, 0.86, 0.08, 32)),
    woodMat
  );
  tableTop.position.y = 0.66;
  tableTop.castShadow = true;
  tableTop.receiveShadow = true;
  diningGroup.add(tableTop);

  // Center table runner cloth
  const runner = new THREE.Mesh(
    track(new THREE.CylinderGeometry(0.62, 0.62, 0.015, 24)),
    emeraldAccentMat
  );
  runner.position.y = 0.706;
  diningGroup.add(runner);

  // 4 carved table legs
  [
    [-0.48, -0.48],
    [0.48, -0.48],
    [-0.48, 0.48],
    [0.48, 0.48],
  ].forEach(([lx, lz]) => {
    const leg = new THREE.Mesh(
      track(new THREE.CylinderGeometry(0.048, 0.036, 0.65, 12)),
      woodMat
    );
    leg.position.set(lx, 0.325, lz);
    leg.castShadow = true;
    diningGroup.add(leg);
  });

  // 2 Cozy Low Dining Poufs / Cushions
  const createPouf = (x: number, z: number, color: number) => {
    const pouf = new THREE.Mesh(
      track(new THREE.CylinderGeometry(0.28, 0.3, 0.24, 20)),
      track(new THREE.MeshStandardMaterial({ color, roughness: 0.82 }))
    );
    pouf.position.set(x, 0.12, z);
    pouf.castShadow = true;
    pouf.receiveShadow = true;
    diningGroup.add(pouf);
  };
  createPouf(1.05, 0.05, 0xb85d6f);
  createPouf(-0.98, 0.3, 0xc78318);

  // Clickable Food Platter on the Table
  const snackDishGroup = new THREE.Group();
  snackDishGroup.position.set(0.18, 0.715, 0.12);
  diningGroup.add(snackDishGroup);

  const plate = new THREE.Mesh(
    track(new THREE.CylinderGeometry(0.24, 0.18, 0.035, 24)),
    ceramicMat
  );
  plate.castShadow = true;
  snackDishGroup.add(plate);

  // Food items (swapped colors/shapes per selected FoodOptionId)
  const foodItemsGroup = new THREE.Group();
  foodItemsGroup.position.y = 0.045;
  snackDishGroup.add(foodItemsGroup);

  const foodMatA = track(new THREE.MeshStandardMaterial({ color: 0x7c3f14, roughness: 0.4 }));
  const foodMatB = track(new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.35 }));
  const foodItems: THREE.Mesh[] = [];
  for (let i = 0; i < 5; i++) {
    const angle = (i / 5) * Math.PI * 2;
    const item = new THREE.Mesh(
      track(new THREE.SphereGeometry(0.052, 14, 12)),
      i % 2 === 0 ? foodMatA : foodMatB
    );
    item.scale.set(1.2, 0.85, 0.9);
    item.position.set(Math.cos(angle) * 0.09, 0.02, Math.sin(angle) * 0.09);
    foodItems.push(item);
    foodItemsGroup.add(item);
  }
  registerClickable(snackDishGroup, 'food_table');

  // Clickable Glass Water Pitcher & Cup on the Table
  const waterPitcherGroup = new THREE.Group();
  waterPitcherGroup.position.set(-0.24, 0.715, -0.14);
  diningGroup.add(waterPitcherGroup);

  const pitcherPoints = [
    new THREE.Vector2(0, 0),
    new THREE.Vector2(0.11, 0),
    new THREE.Vector2(0.13, 0.12),
    new THREE.Vector2(0.075, 0.25),
    new THREE.Vector2(0.095, 0.32),
  ];
  const pitcherMesh = new THREE.Mesh(
    track(new THREE.LatheGeometry(pitcherPoints, 20)),
    glassWaterMat
  );
  pitcherMesh.castShadow = true;
  waterPitcherGroup.add(pitcherMesh);

  const waterCore = new THREE.Mesh(
    track(new THREE.CylinderGeometry(0.08, 0.1, 0.16, 16)),
    track(
      new THREE.MeshStandardMaterial({
        color: 0x38bdf8,
        roughness: 0.12,
        transparent: true,
        opacity: 0.7,
      })
    )
  );
  waterCore.position.y = 0.09;
  waterPitcherGroup.add(waterCore);

  const waterCup = new THREE.Mesh(
    track(new THREE.CylinderGeometry(0.055, 0.042, 0.13, 16)),
    glassWaterMat
  );
  waterCup.position.set(0.2, 0.065, 0.15);
  waterPitcherGroup.add(waterCup);
  registerClickable(waterPitcherGroup, 'water_pitcher');

  // ---------------------------------------------------------------------------
  // 4. COZY BED STATION (سرير الراحة والنوم) at (2.55, 0, -0.45)
  // ---------------------------------------------------------------------------
  const bedGroup = new THREE.Group();
  bedGroup.position.set(2.55, 0, -0.45);
  bedGroup.rotation.y = -Math.PI / 6;
  group.add(bedGroup);

  // Wooden Bed Frame + Legs
  const bedFrame = new THREE.Mesh(
    track(new THREE.BoxGeometry(1.45, 0.24, 2.15)),
    woodMat
  );
  bedFrame.position.y = 0.24;
  bedFrame.castShadow = true;
  bedFrame.receiveShadow = true;
  bedGroup.add(bedFrame);

  [
    [-0.64, -0.96],
    [0.64, -0.96],
    [-0.64, 0.96],
    [0.64, 0.96],
  ].forEach(([bx, bz]) => {
    const leg = new THREE.Mesh(
      track(new THREE.CylinderGeometry(0.05, 0.045, 0.16, 12)),
      woodMat
    );
    leg.position.set(bx, 0.08, bz);
    bedGroup.add(leg);
  });

  // Carved Headboard with Brass Crescent Finial
  const headboard = new THREE.Mesh(
    track(new THREE.BoxGeometry(1.48, 0.95, 0.1)),
    woodMat
  );
  headboard.position.set(0, 0.68, -1.03);
  headboard.castShadow = true;
  bedGroup.add(headboard);

  const headboardArch = new THREE.Mesh(
    track(new THREE.CylinderGeometry(0.55, 0.55, 0.08, 24, 1, false, 0, Math.PI)),
    emeraldAccentMat
  );
  headboardArch.rotation.z = Math.PI / 2;
  headboardArch.rotation.y = Math.PI / 2;
  headboardArch.position.set(0, 1.12, -1.03);
  bedGroup.add(headboardArch);

  const brassFinial = new THREE.Mesh(
    track(new THREE.SphereGeometry(0.065, 14, 12)),
    brassMat
  );
  brassFinial.position.set(0, 1.32, -1.03);
  bedGroup.add(brassFinial);

  // Plush Cream Mattress
  const mattress = new THREE.Mesh(
    track(new THREE.BoxGeometry(1.32, 0.2, 1.98)),
    ceramicMat
  );
  mattress.position.set(0, 0.44, 0.02);
  mattress.receiveShadow = true;
  bedGroup.add(mattress);

  // Soft Pillow
  const pillow = new THREE.Mesh(
    track(new THREE.BoxGeometry(0.76, 0.14, 0.42)),
    track(new THREE.MeshStandardMaterial({ color: 0xfef9ef, roughness: 0.85 }))
  );
  pillow.position.set(0, 0.59, -0.68);
  pillow.rotation.x = 0.14;
  pillow.castShadow = true;
  bedGroup.add(pillow);

  // Animated Cozy Quilt Blanket (pulls up smoothly when Folla sleeps)
  const bedQuilt = new THREE.Mesh(
    track(new THREE.BoxGeometry(1.35, 0.14, 1.24)),
    track(
      new THREE.MeshStandardMaterial({
        map: textures.quilt,
        roughness: 0.82,
      })
    )
  );
  bedQuilt.position.set(0, 0.55, 0.34);
  bedQuilt.castShadow = true;
  bedQuilt.receiveShadow = true;
  bedGroup.add(bedQuilt);
  registerClickable(bedGroup, 'bed');

  // Bedside Nightstand + Glowing Brass Lantern
  const nightstand = new THREE.Group();
  nightstand.position.set(1.02, 0, -0.78);
  bedGroup.add(nightstand);

  const standBody = new THREE.Mesh(
    track(new THREE.BoxGeometry(0.46, 0.52, 0.46)),
    woodMat
  );
  standBody.position.y = 0.26;
  standBody.castShadow = true;
  nightstand.add(standBody);

  const lampBase = new THREE.Mesh(
    track(new THREE.CylinderGeometry(0.08, 0.11, 0.06, 16)),
    brassMat
  );
  lampBase.position.y = 0.55;
  nightstand.add(lampBase);

  const bedsideLampShadeMat = track(
    new THREE.MeshStandardMaterial({
      color: 0xfdf2d0,
      emissive: 0xffb347,
      emissiveIntensity: 0.35,
      roughness: 0.35,
    })
  );
  const lampShade = new THREE.Mesh(
    track(new THREE.CylinderGeometry(0.09, 0.14, 0.2, 8)),
    bedsideLampShadeMat
  );
  lampShade.position.y = 0.68;
  nightstand.add(lampShade);

  const lampCap = new THREE.Mesh(
    track(new THREE.ConeGeometry(0.11, 0.12, 8)),
    brassMat
  );
  lampCap.position.y = 0.83;
  nightstand.add(lampCap);

  const bedsideLampLight = new THREE.PointLight(0xffb85c, 0.6, 5.5, 1.8);
  bedsideLampLight.position.set(0, 0.72, 0);
  nightstand.add(bedsideLampLight);

  // ---------------------------------------------------------------------------
  // 5. PROPHETS' STORIES BOOKCASE (مكتبة قصص الأنبياء) at (0, 0, -3.55)
  // ---------------------------------------------------------------------------
  const bookshelfGroup = new THREE.Group();
  bookshelfGroup.position.set(0, 0, -3.55);
  group.add(bookshelfGroup);

  const shelfFrame = new THREE.Mesh(
    track(new THREE.BoxGeometry(1.45, 1.55, 0.36)),
    woodMat
  );
  shelfFrame.position.y = 0.78;
  shelfFrame.castShadow = true;
  shelfFrame.receiveShadow = true;
  bookshelfGroup.add(shelfFrame);

  // Books in vibrant spine colors
  const spineColors = [0x0f6b4e, 0xc78318, 0x1e6b8a, 0xb85d6f, 0x6d4c9e];
  [0.45, 0.92, 1.32].forEach((sy, rowIdx) => {
    const shelfBoard = new THREE.Mesh(
      track(new THREE.BoxGeometry(1.36, 0.04, 0.38)),
      ceramicMat
    );
    shelfBoard.position.set(0, sy, 0.02);
    bookshelfGroup.add(shelfBoard);

    for (let b = 0; b < 5; b++) {
      const book = new THREE.Mesh(
        track(new THREE.BoxGeometry(0.12, 0.24 + (b % 2) * 0.05, 0.22)),
        track(
          new THREE.MeshStandardMaterial({
            color: spineColors[(b + rowIdx) % spineColors.length],
            roughness: 0.65,
          })
        )
      );
      book.position.set(-0.42 + b * 0.21, sy + 0.15, 0.05);
      book.castShadow = true;
      bookshelfGroup.add(book);
    }
  });
  registerClickable(bookshelfGroup, 'bookshelf');

  // ---------------------------------------------------------------------------
  // 6. DYNAMIC UNLOCKABLE 3D KEEPSAKES (تذكارات الغرفة)
  // ---------------------------------------------------------------------------
  // A. Brass Standing Lantern
  const lanternKeep = new THREE.Group();
  lanternKeep.position.set(-1.55, 0, -2.55);
  const lStand = new THREE.Mesh(
    track(new THREE.CylinderGeometry(0.05, 0.16, 1.2, 12)),
    brassMat
  );
  lStand.position.y = 0.6;
  const lGlow = new THREE.Mesh(
    track(new THREE.OctahedronGeometry(0.16, 0)),
    track(
      new THREE.MeshStandardMaterial({
        color: 0xfef3c7,
        emissive: 0xf59e0b,
        emissiveIntensity: 0.9,
      })
    )
  );
  lGlow.position.y = 1.32;
  lanternKeep.add(lStand, lGlow);
  group.add(lanternKeep);

  // B. Potted Olive Tree
  const oliveKeep = new THREE.Group();
  oliveKeep.position.set(1.65, 0, -2.65);
  const pot = new THREE.Mesh(
    track(new THREE.CylinderGeometry(0.24, 0.16, 0.36, 18)),
    track(new THREE.MeshStandardMaterial({ color: 0xb45309, roughness: 0.72 }))
  );
  pot.position.y = 0.18;
  const oliveTrunk = new THREE.Mesh(
    track(new THREE.CylinderGeometry(0.04, 0.055, 0.55, 10)),
    woodMat
  );
  oliveTrunk.position.y = 0.55;
  const oliveCrown = new THREE.Mesh(
    track(new THREE.DodecahedronGeometry(0.32, 1)),
    track(new THREE.MeshStandardMaterial({ color: 0x2e7d5b, roughness: 0.75 }))
  );
  oliveCrown.position.y = 0.95;
  oliveKeep.add(pot, oliveTrunk, oliveCrown);
  group.add(oliveKeep);

  // C. Carved Charity Box (حصالة الصدقة)
  const charityKeep = new THREE.Group();
  charityKeep.position.set(-1.45, 0, 2.25);
  const cBox = new THREE.Mesh(
    track(new THREE.BoxGeometry(0.34, 0.28, 0.26)),
    woodMat
  );
  cBox.position.y = 0.14;
  const cLid = new THREE.Mesh(
    track(new THREE.BoxGeometry(0.36, 0.06, 0.28)),
    brassMat
  );
  cLid.position.y = 0.3;
  charityKeep.add(cBox, cLid);
  group.add(charityKeep);

  // D. Embroidered Prayer Mat (سجادة الصلاة)
  const prayerMatKeep = new THREE.Group();
  prayerMatKeep.position.set(1.55, 0.02, 2.1);
  prayerMatKeep.rotation.y = -0.35;
  const pMatBase = new THREE.Mesh(
    track(new THREE.BoxGeometry(0.75, 0.02, 1.15)),
    track(new THREE.MeshStandardMaterial({ color: 0x1e6b8a, roughness: 0.85 }))
  );
  const pMatArch = new THREE.Mesh(
    track(new THREE.BoxGeometry(0.54, 0.025, 0.88)),
    track(new THREE.MeshStandardMaterial({ color: 0xe6b956, roughness: 0.65 }))
  );
  prayerMatKeep.add(pMatBase, pMatArch);
  group.add(prayerMatKeep);

  const keepsakeNodes = {
    lantern: lanternKeep,
    olive: oliveKeep,
    charity_box: charityKeep,
    prayer_mat: prayerMatKeep,
  };

  const updateKeepsakes = (unlockedIds: string[]) => {
    lanternKeep.visible = unlockedIds.includes('lantern');
    oliveKeep.visible = unlockedIds.includes('olive');
    charityKeep.visible = unlockedIds.includes('charity_box');
    prayerMatKeep.visible = unlockedIds.includes('prayer_mat');
  };

  const updateFoodVisual = (foodId?: FoodOptionId) => {
    if (foodId === 'fruit') {
      foodMatA.color.set(0xc2412d); // Red apple
      foodMatB.color.set(0xea580c); // Fresh orange
    } else if (foodId === 'meal') {
      foodMatA.color.set(0xd97706); // Golden bread
      foodMatB.color.set(0x0f6b4e); // Herb soup garnish
    } else {
      foodMatA.color.set(0x7c3f14); // Sweet dates
      foodMatB.color.set(0xd97706); // Golden honey
    }
  };

  return {
    group,
    interactables,
    bedQuilt,
    bedsideLampLight,
    bedsideLampShadeMat,
    keepsakeNodes,
    snackDishGroup,
    updateFoodVisual,
    updateKeepsakes,
    dispose: () => {
      disposables.forEach((d) => d.dispose());
    },
  };
}

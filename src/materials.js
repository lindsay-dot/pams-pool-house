// One named material per surface. Stage 2 (finishes and colors) swaps these;
// nothing here changes any dimension.
import * as THREE from 'three';
import { T } from './textures.js';

const std = (opts) => new THREE.MeshStandardMaterial({ roughness: 0.9, metalness: 0, ...opts });

export function createMaterials() {
  const M = {
    // grounds
    grass: std({ map: T.grass(), roughness: 1 }),
    gravel: std({ map: T.gravel(), roughness: 1 }),

    // pool + deck
    deck: std({ map: T.concrete('#cfccc2') }),
    coping: std({ map: T.plain('#e4e0d4', 0.05, 3) }),
    poolFinish: std({ map: T.plain('#dfeef2', 0.04, 4), side: THREE.DoubleSide }),
    waterlineTile: std({ map: T.tile('#3d7fa6'), roughness: 0.35 }),
    water: new THREE.MeshPhysicalMaterial({
      color: '#49b6d6', transparent: true, opacity: 0.68, roughness: 0.08, metalness: 0,
      bumpMap: T.ripples(), bumpScale: 0.6, envMapIntensity: 1.1,
    }),

    // pool house (colors from the Rev. I drawing, tuned to the house photos)
    slab: std({ map: T.concrete('#c9c6bc', 12) }),
    siding: std({ map: T.boardBatten('#eeeadf') }),
    trim: std({ color: '#f1efe8', roughness: 0.7 }),
    brick: std({ map: T.brick(['#8f5747', '#9c5b4a', '#7d4a3d', '#a9685a'], '#d8d2c6') }),
    brickDark: std({ map: T.brick(['#7a4639', '#804a3c', '#6c3e33'], '#cfc8bb', 8) }),
    stone: std({ color: '#cfc5b4' }),
    hearth: std({ color: '#8e8479' }),
    firebox: std({ color: '#1c1816', roughness: 1 }),
    roof: std({ map: T.shingle('#5f534c'), side: THREE.FrontSide }),
    ceilingWood: std({ map: T.wood('#b07d4a'), side: THREE.BackSide, roughness: 0.75 }),
    timber: std({ map: T.wood('#3b3936', 1), roughness: 0.8 }),
    stain: std({ map: T.wood('#a5703c', 1), roughness: 0.7 }),
    doorWood: std({ map: T.wood('#9a6636', 0.75), roughness: 0.6 }),
    garageDoor: std({ map: T.ribs('#3f4144'), roughness: 0.55, metalness: 0.3 }),
    serviceDoor: std({ color: '#3f4144', roughness: 0.6 }),
    metalRoof: std({ map: T.seam('#4a4842'), roughness: 0.45, metalness: 0.5, side: THREE.DoubleSide }),
    glass: std({ color: '#8fa9b3', roughness: 0.08, metalness: 0.2, envMapIntensity: 1.4 }),
    black: std({ color: '#1d1f21', roughness: 0.5, metalness: 0.4 }),
    steel: std({ color: '#b9bec2', roughness: 0.3, metalness: 0.9 }),

    // kitchen as drawn (Stage 3 replaces this)
    counterBase: std({ color: '#d9d6c9' }),
    counterTop: std({ color: '#7c8079', roughness: 0.4 }),

    // fence
    fence: std({ color: '#1b1c1e', roughness: 0.5, metalness: 0.5 }),

    // existing house (from the photos)
    houseSiding: std({ map: T.boardBatten('#eeebe1') }),
    houseBrick: std({ map: T.brick(['#8a5443', '#9b5f4b', '#75463a', '#a56b55', '#6b4037'], '#ddd8cc', 13) }),
    houseRoof: std({ map: T.shingle('#4b4541', 6) }),
    housePost: std({ color: '#2a2622', roughness: 0.7 }),
    houseTrim: std({ color: '#f1efe8', roughness: 0.7 }),

    // trees
    trunk: std({ color: '#5a4636', roughness: 1 }),
    leaves: std({ color: '#3c5a2c', roughness: 1 }),
    pine: std({ color: '#2f4f2c', roughness: 1 }),
  };
  for (const [name, m] of Object.entries(M)) m.name = name;
  return M;
}

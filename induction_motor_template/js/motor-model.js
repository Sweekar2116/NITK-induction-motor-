import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { TransformControls } from 'three/addons/controls/TransformControls.js';
// 1. IMPORT THE MODULE
import { createMotorCover } from './motor_cover_module.js';
import { createWireHarness } from './wire_harness_module.js';

// --- Configuration ---
const CONFIG = {
    // Rotor (Existing)
    rotorOuterRadius: 5.0,
    slotRadius: 0.35,
    slotNeckWidth: 0.15,
    slotCount: 28,
    slotDepthOffset: 0.8,
    stackHeight: 12,
    laminationCount: 140,
    barRadius: 0.32,
    shaftRadius: 1.5,
    shaftLength: 28,
    skewTotalAngle: (Math.PI * 2) / 28,
    endRingThickness: 0.2,

    // Stator Core
    statorOuterRadius: 9.5,
    statorInnerRadius: 5.2,
    statorLength: 14,
    statorSlots: 24,

    // Winding Settings (UPDATED)
    windingPitch: 4,
    windingRadius: 5.9,
    endTurnExtension: 0.7,

    // New settings for stranded wires
    strandsPerCoil: 24,       // Number of individual wires per coil bundle
    strandRadius: 0.02,       // Radius of a single wire strand
    bundleSpread: 0.3,        // How far the strands spread out from the center line

    // Back Cover Position
    backCoverZOffset: -0.1    // CHANGE THIS to move back cover forward/backward
};

// State
let isRotating = false;
let wireframeMode = false;
let gizmoEnabled = false;
let isExploded = false;
let explodeFactor = 0;
let statorVisible = true;
let powerSupplyRef = null;
let powerSupplyRotation = null;
let powerSupplyPosition = null;

// Component References
let mainGroup;
let rotorGroup;
let statorGroup;
let transformControl;
let backCoverBaseZ = 0; // Base Z position for back cover

const parts = {
    shaft: null,
    core: null,
    cage: null,
    stator: null,
    windings: null,
    backCover: null, // Added reference for the cover
    shaftBlocker: null // Reference for blocked rotor mechanism
};

// Expose parts globally for button control
window.motorParts = parts;

// Scene variables
let scene, camera, renderer, controls;

// ==========================================
// 1. ROTOR GENERATION
// ==========================================
function createLaminationShape(R, r, neckHalfWidth, count, depthOffset) {
    const shape = new THREE.Shape();
    const step = (Math.PI * 2) / count;
    const D = R - depthOffset;
    const outerNeckAngle = Math.asin(neckHalfWidth / R);
    const innerNeckAngle = Math.asin(neckHalfWidth / r);

    for (let i = 0; i < count; i++) {
        const angle = i * step;
        const nextAngle = angle + step;
        const startOuter = angle + outerNeckAngle;
        const endOuter = nextAngle - outerNeckAngle;

        if (i === 0) shape.moveTo(R * Math.cos(startOuter), R * Math.sin(startOuter));
        shape.absarc(0, 0, R, startOuter, endOuter, false);

        const cx = D * Math.cos(nextAngle);
        const cy = D * Math.sin(nextAngle);
        const slotRight = nextAngle - innerNeckAngle;
        const slotLeft = nextAngle + innerNeckAngle;

        shape.lineTo(cx + r * Math.cos(slotRight), cy + r * Math.sin(slotRight));
        shape.absarc(cx, cy, r, slotRight, slotLeft, true);
        shape.lineTo(R * Math.cos(nextAngle + outerNeckAngle), R * Math.sin(nextAngle + outerNeckAngle));
    }
    const holePath = new THREE.Path();
    holePath.absarc(0, 0, CONFIG.shaftRadius, 0, Math.PI * 2, false);
    shape.holes.push(holePath);
    return shape;
}

function buildRotor() {
    const group = new THREE.Group();

    // A. Shaft
    parts.shaft = new THREE.Group();
    const shaftGeo = new THREE.CylinderGeometry(CONFIG.shaftRadius, CONFIG.shaftRadius * 0.9, CONFIG.shaftLength, 32);
    shaftGeo.rotateX(Math.PI / 2);
    const shaftMat = new THREE.MeshStandardMaterial({ color: 0xdddddd, metalness: 0.9, roughness: 0.2 });
    const shaftMesh = new THREE.Mesh(shaftGeo, shaftMat);
    parts.shaft.add(shaftMesh);
    
    // Shaft lock mechanism - realistic industrial design
    const blockerGroup = new THREE.Group();
    
    // Materials
    const metalMat = new THREE.MeshStandardMaterial({ 
        color: 0x3a3a3a, 
        metalness: 0.8, 
        roughness: 0.3
    });
    const boltMat = new THREE.MeshStandardMaterial({ 
        color: 0x555555, 
        metalness: 0.9, 
        roughness: 0.2
    });
    
    // Main mounting block (vertical rectangular block)
    const mountBlockGeo = new THREE.BoxGeometry(CONFIG.shaftRadius * 3.5, CONFIG.shaftRadius * 5, CONFIG.shaftRadius * 2.5);
    const mountBlock = new THREE.Mesh(mountBlockGeo, metalMat);
    mountBlock.position.y = CONFIG.shaftRadius * 2.5;
    blockerGroup.add(mountBlock);
    
    // Shaft passage hole base (horizontal block through which shaft passes)
    const passageBlockGeo = new THREE.BoxGeometry(CONFIG.shaftRadius * 3.5, CONFIG.shaftRadius * 2.8, CONFIG.shaftRadius * 3);
    const passageBlock = new THREE.Mesh(passageBlockGeo, metalMat);
    passageBlock.position.y = -CONFIG.shaftRadius * 0.2;
    blockerGroup.add(passageBlock);
    
    // Clamping arm (angled piece that holds shaft)
    const clampArmGeo = new THREE.BoxGeometry(CONFIG.shaftRadius * 2, CONFIG.shaftRadius * 1.8, CONFIG.shaftRadius * 3);
    const clampArm = new THREE.Mesh(clampArmGeo, metalMat);
    clampArm.position.set(0, -CONFIG.shaftRadius * 1.5, CONFIG.shaftRadius * 0.5);
    clampArm.rotation.x = -0.15;
    blockerGroup.add(clampArm);
    
    // Locking screw/bolt on top
    const boltGeo = new THREE.CylinderGeometry(CONFIG.shaftRadius * 0.4, CONFIG.shaftRadius * 0.4, CONFIG.shaftRadius * 2.5, 8);
    const lockBolt = new THREE.Mesh(boltGeo, boltMat);
    lockBolt.position.set(0, CONFIG.shaftRadius * 4.2, 0);
    blockerGroup.add(lockBolt);
    
    // Bolt head
    const boltHeadGeo = new THREE.CylinderGeometry(CONFIG.shaftRadius * 0.7, CONFIG.shaftRadius * 0.7, CONFIG.shaftRadius * 0.6, 6);
    const boltHead = new THREE.Mesh(boltHeadGeo, boltMat);
    boltHead.position.set(0, CONFIG.shaftRadius * 5.5, 0);
    blockerGroup.add(boltHead);
    
    // Side mounting bolts
    const sideBoltGeo = new THREE.CylinderGeometry(CONFIG.shaftRadius * 0.25, CONFIG.shaftRadius * 0.25, CONFIG.shaftRadius * 4, 8);
    sideBoltGeo.rotateZ(Math.PI / 2);
    const sideBolt1 = new THREE.Mesh(sideBoltGeo, boltMat);
    sideBolt1.position.set(0, CONFIG.shaftRadius * 3.5, CONFIG.shaftRadius * 1.2);
    blockerGroup.add(sideBolt1);
    
    const sideBolt2 = new THREE.Mesh(sideBoltGeo.clone(), boltMat);
    sideBolt2.position.set(0, CONFIG.shaftRadius * 1.5, CONFIG.shaftRadius * 1.2);
    blockerGroup.add(sideBolt2);
    
    // Position and orient the shaft lock
    blockerGroup.position.z = CONFIG.shaftLength * 0.35;
    blockerGroup.rotation.x = Math.PI / 2;
    blockerGroup.visible = false; // Hidden by default
    parts.shaft.add(blockerGroup);
    parts.shaftBlocker = blockerGroup; // Store reference
    
    group.add(parts.shaft);

    // B. Core
    parts.core = new THREE.Group();
    const statorShape = createLaminationShape(CONFIG.rotorOuterRadius, CONFIG.slotRadius, CONFIG.slotNeckWidth, CONFIG.slotCount, CONFIG.slotDepthOffset);
    const platePitch = CONFIG.stackHeight / CONFIG.laminationCount;
    const plateThick = platePitch * 0.85;

    const laminationGeo = new THREE.ExtrudeGeometry(statorShape, { depth: plateThick, bevelEnabled: false, curveSegments: 6 });
    laminationGeo.center();

    const laminationMat = new THREE.MeshStandardMaterial({ color: 0x8899aa, metalness: 0.5, roughness: 0.6 });
    const laminations = new THREE.InstancedMesh(laminationGeo, laminationMat, CONFIG.laminationCount);
    laminations.castShadow = true;
    laminations.receiveShadow = true;

    const dummy = new THREE.Object3D();
    const startZ = -CONFIG.stackHeight / 2;

    for (let i = 0; i < CONFIG.laminationCount; i++) {
        const zPos = startZ + i * platePitch;
        const twistRatio = i / (CONFIG.laminationCount - 1);
        const twistAngle = twistRatio * CONFIG.skewTotalAngle;
        dummy.position.set(0, 0, zPos);
        dummy.rotation.set(0, 0, twistAngle);
        dummy.updateMatrix();
        laminations.setMatrixAt(i, dummy.matrix);
    }
    parts.core.add(laminations);
    group.add(parts.core);

    // C. Cage
    parts.cage = new THREE.Group();
    const cageMaterial = new THREE.MeshStandardMaterial({ color: 0xddeeff, metalness: 0.85, roughness: 0.3 });

    const cageDist = CONFIG.rotorOuterRadius - CONFIG.slotDepthOffset;
    const barExtension = CONFIG.endRingThickness + 0.2;
    const zStart = -CONFIG.stackHeight / 2 - barExtension;
    const zEnd = CONFIG.stackHeight / 2 + barExtension;
    const p1 = new THREE.Vector3(cageDist, 0, zStart);
    const p2 = new THREE.Vector3(cageDist * Math.cos(CONFIG.skewTotalAngle), cageDist * Math.sin(CONFIG.skewTotalAngle), zEnd);
    const barVector = new THREE.Vector3().subVectors(p2, p1);
    const barLen = barVector.length();

    const barGeo = new THREE.CylinderGeometry(CONFIG.barRadius, CONFIG.barRadius, barLen, 8);
    barGeo.rotateX(Math.PI / 2);
    const bars = new THREE.InstancedMesh(barGeo, cageMaterial, CONFIG.slotCount);

    const barMidpoint = new THREE.Vector3().addVectors(p1, p2).multiplyScalar(0.5);
    const defaultDir = new THREE.Vector3(0, 0, 1);
    const targetDir = barVector.clone().normalize();
    const quaternion = new THREE.Quaternion().setFromUnitVectors(defaultDir, targetDir);

    for (let i = 0; i < CONFIG.slotCount; i++) {
        const angle = (i / CONFIG.slotCount) * Math.PI * 2;
        dummy.position.copy(barMidpoint);
        dummy.quaternion.copy(quaternion);
        dummy.scale.set(1, 1, 1);
        dummy.updateMatrix();
        const rotMatrix = new THREE.Matrix4().makeRotationZ(angle);
        dummy.matrix.premultiply(rotMatrix);
        bars.setMatrixAt(i, dummy.matrix);
    }
    parts.cage.add(bars);

    const plateShape = new THREE.Shape();
    plateShape.absarc(0, 0, CONFIG.rotorOuterRadius, 0, Math.PI * 2, false);
    const plateHole = new THREE.Path();
    plateHole.absarc(0, 0, CONFIG.shaftRadius + 0.1, 0, Math.PI * 2, true);
    plateShape.holes.push(plateHole);
    const plateGeo = new THREE.ExtrudeGeometry(plateShape, { depth: CONFIG.endRingThickness, bevelEnabled: true, bevelThickness: 0.1, bevelSize: 0.1, bevelSegments: 1, curveSegments: 24 });
    plateGeo.center();

    const plateMat = new THREE.MeshStandardMaterial({ color: 0xccddee, metalness: 0.9, roughness: 0.2 });
    const frontPlate = new THREE.Mesh(plateGeo, plateMat);
    frontPlate.position.z = (CONFIG.stackHeight / 2) + (CONFIG.endRingThickness / 2) + 0.1;
    parts.cage.add(frontPlate);
    const backPlate = new THREE.Mesh(plateGeo, plateMat);
    backPlate.position.z = -(CONFIG.stackHeight / 2) - (CONFIG.endRingThickness / 2) - 0.1;
    parts.cage.add(backPlate);

    const nubGeo = new THREE.CylinderGeometry(CONFIG.barRadius * 0.9, CONFIG.barRadius * 0.9, CONFIG.endRingThickness + 0.3, 8);
    nubGeo.rotateX(Math.PI / 2);
    const nubs = new THREE.InstancedMesh(nubGeo, cageMaterial, CONFIG.slotCount * 2);
    let idx = 0;
    const frontNubZ = frontPlate.position.z;
    const backNubZ = backPlate.position.z;
    for (let i = 0; i < CONFIG.slotCount; i++) {
        const baseAngle = (i / CONFIG.slotCount) * Math.PI * 2;
        const finalAngle = baseAngle + CONFIG.skewTotalAngle;
        dummy.position.set(cageDist * Math.cos(finalAngle), cageDist * Math.sin(finalAngle), frontNubZ);
        dummy.rotation.set(0, 0, 0); dummy.scale.set(1, 1, 1); dummy.updateMatrix();
        nubs.setMatrixAt(idx++, dummy.matrix);
    }
    for (let i = 0; i < CONFIG.slotCount; i++) {
        const baseAngle = (i / CONFIG.slotCount) * Math.PI * 2;
        dummy.position.set(cageDist * Math.cos(baseAngle), cageDist * Math.sin(baseAngle), backNubZ);
        dummy.rotation.set(0, 0, 0); dummy.scale.set(1, 1, 1); dummy.updateMatrix();
        nubs.setMatrixAt(idx++, dummy.matrix);
    }
    parts.cage.add(nubs);
    group.add(parts.cage);

    return group;
}

// ==========================================
// 2. STATOR GENERATION
// ==========================================

function createStator() {
    parts.stator = new THREE.Group();

    const outerRadius = CONFIG.statorOuterRadius;
    const innerRadius = CONFIG.statorInnerRadius;
    const numSlots = CONFIG.statorSlots;

    // Core Logic
    const shape = new THREE.Shape();
    shape.moveTo(outerRadius, 0);
    shape.absarc(0, 0, outerRadius, 0, Math.PI * 2, false);

    const innerPath = new THREE.Path();
    const slotDepth = (outerRadius - innerRadius) * 0.45;
    const anglePerSlot = (Math.PI * 2) / numSlots;
    const neckLen = slotDepth * 0.25;
    const neckWidthAngle = anglePerSlot * 0.12;
    const bodyWidthAngle = anglePerSlot * 0.50;

    for (let i = 0; i < numSlots; i++) {
        const centerAngle = i * anglePerSlot;
        const startAngle = centerAngle - (anglePerSlot / 2);
        const neckStartA = centerAngle - (neckWidthAngle / 2);
        const neckEndA = centerAngle + (neckWidthAngle / 2);
        const bodyStartA = centerAngle - (bodyWidthAngle / 2);
        const bodyEndA = centerAngle + (bodyWidthAngle / 2);
        const nextAngle = centerAngle + (anglePerSlot / 2);

        const rNeckOuter = innerRadius + neckLen;
        const rBodyBottom = innerRadius + slotDepth;
        const rShoulder = rNeckOuter + (slotDepth * 0.1);
        const bottomCenterR = rBodyBottom - (bodyWidthAngle * innerRadius);

        if (i === 0) innerPath.moveTo(Math.cos(startAngle) * innerRadius, Math.sin(startAngle) * innerRadius);
        innerPath.absarc(0, 0, innerRadius, startAngle, neckStartA, false);
        innerPath.lineTo(Math.cos(neckStartA) * rNeckOuter, Math.sin(neckStartA) * rNeckOuter);
        innerPath.lineTo(Math.cos(bodyStartA) * rShoulder, Math.sin(bodyStartA) * rShoulder);

        innerPath.lineTo(Math.cos(bodyStartA) * bottomCenterR, Math.sin(bodyStartA) * bottomCenterR);
        const steps = 6;
        for (let s = 0; s <= steps; s++) {
            const t = s / steps;
            const ca = bodyStartA + t * (bodyEndA - bodyStartA);
            const normT = (t - 0.5) * 2;
            const rOffset = Math.sqrt(1 - normT * normT) * (rBodyBottom - bottomCenterR);
            innerPath.lineTo(Math.cos(ca) * (bottomCenterR + rOffset), Math.sin(ca) * (bottomCenterR + rOffset));
        }

        innerPath.lineTo(Math.cos(bodyEndA) * rShoulder, Math.sin(bodyEndA) * rShoulder);
        innerPath.lineTo(Math.cos(neckEndA) * rNeckOuter, Math.sin(neckEndA) * rNeckOuter);
        innerPath.lineTo(Math.cos(neckEndA) * innerRadius, Math.sin(neckEndA) * innerRadius);
        innerPath.absarc(0, 0, innerRadius, neckEndA, nextAngle, false);
    }

    shape.holes.push(innerPath);

    const extrudeSettings = { steps: 1, depth: CONFIG.statorLength, bevelEnabled: false, curveSegments: 24 };
    const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);
    geometry.center();

    const canvas = document.createElement('canvas');
    canvas.width = 64; canvas.height = 64;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#AAAAAA'; ctx.fillRect(0, 0, 64, 64);
    ctx.fillStyle = '#999999'; ctx.fillRect(0, 0, 64, 2);
    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping; tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(1, 40);

    const matStator = new THREE.MeshStandardMaterial({
        color: 0xAAAAAA, roughness: 0.5, metalness: 0.6,
        map: tex, bumpMap: tex, bumpScale: 0.05
    });

    const mesh = new THREE.Mesh(geometry, matStator);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    parts.stator.add(mesh);

    // =====================================
    // CREATE DETAILED WINDINGS
    // =====================================
    createWindings(parts.stator);

    return parts.stator;
}

// ==========================================
// 3. WINDING LOGIC
// ==========================================
function createWindings(parentGroup) {
    const windingGroup = new THREE.Group();

    const R = CONFIG.windingRadius;
    const L = CONFIG.statorLength;
    const ext = CONFIG.endTurnExtension;
    const pitchCount = CONFIG.windingPitch;
    const slots = CONFIG.statorSlots;
    const strands = CONFIG.strandsPerCoil;
    const strandR = CONFIG.strandRadius;
    const spread = CONFIG.bundleSpread;

    const pitchAngle = (Math.PI * 2 * pitchCount) / slots;
    const midAngle = pitchAngle / 4;
    const bumpR = R + 2;
    const bumpZ = L / 2 + ext;

    // Define the center path for a single coil
    const basePoints = [
        new THREE.Vector3(R, 0, -L / 2),
        new THREE.Vector3(R, 0, L / 2),
        new THREE.Vector3(R, 0, L / 2 + 0.5),
        new THREE.Vector3(bumpR * Math.cos(midAngle), bumpR * Math.sin(midAngle), bumpZ),
        new THREE.Vector3(R * Math.cos(pitchAngle), R * Math.sin(pitchAngle), L / 2 + 0.5),
        new THREE.Vector3(R * Math.cos(pitchAngle), R * Math.sin(pitchAngle), L / 2),
        new THREE.Vector3(R * Math.cos(pitchAngle), R * Math.sin(pitchAngle), -L / 2),
        new THREE.Vector3(R * Math.cos(pitchAngle), R * Math.sin(pitchAngle), -L / 2 - 0.5),
        new THREE.Vector3(bumpR * Math.cos(midAngle), bumpR * Math.sin(midAngle), -bumpZ),
        new THREE.Vector3(R, 0, -L / 2 - 0.5),
        new THREE.Vector3(R, 0, -L / 2) // Close loop
    ];

    // Realistic copper material
    const copperMaterial = new THREE.MeshStandardMaterial({
        color: 0xb87333,
        metalness: 0.8,
        roughness: 0.2,
        side: THREE.DoubleSide
    });

    // Loop through each slot to place a coil bundle
    for (let i = 0; i < slots; i++) {
        const coilBundle = new THREE.Group();
        const slotAngle = (i / slots) * Math.PI * 2;

        // Create multiple strands for this coil
        for (let j = 0; j < strands; j++) {
            // Calculate a random offset for this strand to create the bundle effect
            const rOffset = Math.random() * spread;
            const aOffset = Math.random() * Math.PI * 2;
            const dx = rOffset * Math.cos(aOffset);
            const dy = rOffset * Math.sin(aOffset);

            // Apply the offset to each point of the base path
            const strandPoints = basePoints.map(p => new THREE.Vector3(p.x + dx, p.y + dy, p.z));

            const curve = new THREE.CatmullRomCurve3(strandPoints);
            curve.closed = true;

            // Lower segments for performance as we have many strands
            const tubeGeo = new THREE.TubeGeometry(curve, 100, strandR, 16, true);
            const strandMesh = new THREE.Mesh(tubeGeo, copperMaterial);
            strandMesh.castShadow = true;
            coilBundle.add(strandMesh);
        }

        // Rotate the entire bundle to its slot position
        coilBundle.rotation.z = slotAngle;
        windingGroup.add(coilBundle);
    }

    parentGroup.add(windingGroup);
}

// ==========================================
// 4. STEEL FRAME/STAND CREATION
// ==========================================
function createThickRing(outerRadius, innerRadius, height, segments = 64) {
    const shape = new THREE.Shape();
    shape.absarc(0, 0, outerRadius, 0, Math.PI * 2, false);

    const hole = new THREE.Path();
    hole.absarc(0, 0, innerRadius, 0, Math.PI * 2, true);
    shape.holes.push(hole);

    const extrudeSettings = {
        depth: height,
        bevelEnabled: false,
        curveSegments: segments
    };

    const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);
    geometry.translate(0, 0, -height / 2);
    geometry.rotateX(Math.PI / 2);

    return geometry;
}

function mergeGeometries(geometries) {
    let totalVertices = 0;
    let totalIndices = 0;

    geometries.forEach(geo => {
        totalVertices += geo.attributes.position.count;
        if (geo.index) {
            totalIndices += geo.index.count;
        } else {
            totalIndices += geo.attributes.position.count;
        }
    });

    const positions = new Float32Array(totalVertices * 3);
    const normals = new Float32Array(totalVertices * 3);
    const indices = new Uint32Array(totalIndices);

    let positionOffset = 0;
    let normalOffset = 0;
    let indexOffset = 0;
    let vertexOffset = 0;

    geometries.forEach(geo => {
        const geoPositions = geo.attributes.position.array;
        const geoNormals = geo.attributes.normal.array;

        positions.set(geoPositions, positionOffset);
        positionOffset += geoPositions.length;

        normals.set(geoNormals, normalOffset);
        normalOffset += geoNormals.length;

        if (geo.index) {
            const geoIndices = geo.index.array;
            for (let i = 0; i < geoIndices.length; i++) {
                indices[indexOffset + i] = geoIndices[i] + vertexOffset;
            }
            indexOffset += geoIndices.length;
        } else {
            const vertexCount = geo.attributes.position.count;
            for (let i = 0; i < vertexCount; i++) {
                indices[indexOffset + i] = vertexOffset + i;
            }
            indexOffset += vertexCount;
        }

        vertexOffset += geo.attributes.position.count;
    });

    const mergedGeometry = new THREE.BufferGeometry();
    mergedGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    mergedGeometry.setAttribute('normal', new THREE.BufferAttribute(normals, 3));
    mergedGeometry.setIndex(new THREE.BufferAttribute(indices, 1));

    return mergedGeometry;
}

function createSteelStand() {
    const frameMaterial = new THREE.MeshStandardMaterial({
        color: 0x404040,
        metalness: 0.7,
        roughness: 0.4,
        side: THREE.DoubleSide
    });

    // Create steel frame ring - bigger to fit motor inside
    const steelframe = createThickRing(11, 9, 15, 64);  // outer: 13, inner: 11, height: 15
    const frame = [steelframe];

    // Create stand base - bigger to support larger frame
    const stand = new THREE.BoxGeometry(20, 15, 2);  // 20x20x3
    const matrix = new THREE.Matrix4().makeTranslation(0, 0, 10);
    stand.applyMatrix4(matrix);
    frame.push(stand);

    // Merge and create mesh
    const framemerged = mergeGeometries(frame);
    const framemesh = new THREE.Mesh(framemerged, frameMaterial);
    framemesh.castShadow = true;
    framemesh.receiveShadow = true;
    framemesh.rotation.x = 1.6;
    
    // Tag as stand to protect from interactions
    framemesh.userData = { type: 'stand', protected: true };
    framemesh.traverse(child => {
        child.userData = { type: 'stand', protected: true };
    });

    return framemesh;
}

// ==========================================
// 5. INTERACTION FUNCTIONS
// ==========================================
function toggleRotation() {
    isRotating = !isRotating;
    const btn = document.getElementById('btn-rotate');
    if (btn) {
        btn.innerText = isRotating ? "Pause Rotation" : "Start Rotation";
    }
}

function toggleWireframe() {
    wireframeMode = !wireframeMode;
    scene.traverse((child) => {
        if (child.isMesh && child.material) {
            if (Array.isArray(child.material)) child.material.forEach(m => m.wireframe = wireframeMode);
            else child.material.wireframe = wireframeMode;
        }
    });
}

function toggleGizmo() {
    gizmoEnabled = !gizmoEnabled;
    transformControl.visible = gizmoEnabled;
    transformControl.enabled = gizmoEnabled;
}

function toggleExplode() {
    isExploded = !isExploded;
    const btn = document.getElementById('btn-explode');
    if (btn) {
        btn.classList.toggle('active');
    }
}

function toggleStator() {
    statorVisible = !statorVisible;
    if (statorGroup) statorGroup.visible = statorVisible;
}

// ==========================================
// 6. INITIALIZATION AND ANIMATION
// ==========================================
function initMotorModel(containerId) {
    const container = document.getElementById(containerId);
    if (!container) {
        console.error('Container not found:', containerId);
        return;
    }

    // --- Scene Setup ---
    scene = new THREE.Scene();
    // Keep transparent/white background


    camera = new THREE.PerspectiveCamera(55, container.clientWidth / container.clientHeight, 0.1, 5000);
    camera.position.set(10, 10, 60); // Optimal position to view all models in frame

    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2; // Enhanced exposure for better metallic highlights
    renderer.outputColorSpace = THREE.SRGBColorSpace; // Better color accuracy for metals
    container.appendChild(renderer.domElement);

    controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.target.set(0, 0, 0); // Look at center point for better view
    controls.maxDistance = 2000; // Prevent zooming out until model disappears
    controls.update();

    // Ensure rotation starts stopped and button shows correct label
    const rotateBtn = document.getElementById('btn-rotate');
    if (rotateBtn) {
        rotateBtn.innerText = "Start Rotation";
    }

    // Gate voltage control until PSU is turned ON
    setVoltageControlEnabled(false);

    // --- Enhanced Lighting for Metallic Shading ---
    // Hemisphere light for realistic ambient environment
    const hemisphereLight = new THREE.HemisphereLight(0xffffff, 0x444444, 0.8);
    hemisphereLight.position.set(0, 50, 0);
    scene.add(hemisphereLight);

    // Ambient light for base illumination
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    // Main directional light (sun-like) with enhanced shadows
    const mainLight = new THREE.DirectionalLight(0xffffff, 2.2);
    mainLight.position.set(-15, 30, 20);
    mainLight.castShadow = true;
    mainLight.shadow.mapSize.width = 2048;
    mainLight.shadow.mapSize.height = 2048;
    mainLight.shadow.camera.near = 0.5;
    mainLight.shadow.camera.far = 100;
    mainLight.shadow.camera.left = -50;
    mainLight.shadow.camera.right = 50;
    mainLight.shadow.camera.top = 50;
    mainLight.shadow.camera.bottom = -50;
    mainLight.shadow.bias = -0.0001;
    scene.add(mainLight);

    // Strong fill light from opposite side
    const fillLight = new THREE.DirectionalLight(0xffffff, 1.4);
    fillLight.position.set(15, 20, -15);
    scene.add(fillLight);

    // Secondary fill light for better coverage
    const fillLight2 = new THREE.DirectionalLight(0xffffff, 1.0);
    fillLight2.position.set(-20, 10, -20);
    scene.add(fillLight2);

    // Overhead workshop light
    const overheadLight = new THREE.PointLight(0xffffee, 1.8, 100);
    overheadLight.position.set(0, 35, 0);
    overheadLight.castShadow = true;
    overheadLight.shadow.mapSize.width = 1024;
    overheadLight.shadow.mapSize.height = 1024;
    scene.add(overheadLight);

    // Enhanced accent rim lights for metallic highlights
    const rimLightBlue = new THREE.PointLight(0x6699ff, 1.2, 70);
    rimLightBlue.position.set(30, 15, -25);
    scene.add(rimLightBlue);

    const rimLightWarm = new THREE.PointLight(0xffbb77, 1.0, 70);
    rimLightWarm.position.set(-30, 10, 20);
    scene.add(rimLightWarm);

    // Additional accent lights for metallic reflections
    const accentLight1 = new THREE.PointLight(0xffffff, 0.8, 60);
    accentLight1.position.set(0, 10, 30);
    scene.add(accentLight1);

    const accentLight2 = new THREE.PointLight(0xffffff, 0.8, 60);
    accentLight2.position.set(0, 10, -30);
    scene.add(accentLight2);

    // Front illumination lights
    const frontLight1 = new THREE.DirectionalLight(0xffffff, 1.5);
    frontLight1.position.set(0, 10, 40);
    scene.add(frontLight1);

    const frontLight2 = new THREE.PointLight(0xffffff, 1.2, 80);
    frontLight2.position.set(10, 5, 35);
    scene.add(frontLight2);

    const frontLight3 = new THREE.PointLight(0xffffff, 1.2, 80);
    frontLight3.position.set(-10, 5, 35);
    scene.add(frontLight3);

    // --- Main Build ---
    mainGroup = new THREE.Group();

    // 1. Build Rotor
    rotorGroup = buildRotor();
    // Individual Rotor Position
    rotorGroup.position.set(0, 0, 0);
    mainGroup.add(rotorGroup);

    // 2. Build Stator (now includes Detailed Windings)
    statorGroup = createStator();
    // Individual Stator Position
    statorGroup.position.set(0, 0, 0);
    mainGroup.add(statorGroup);

    // 3. INTEGRATE IMPORTED MOTOR COVER
    // 3. INTEGRATE IMPORTED MOTOR COVER
    const motorCover = createMotorCover({
        outerRadius: CONFIG.statorOuterRadius, // Match stator size
        innerHubRadius: CONFIG.shaftRadius + 0.1, // Match shaft size with small clearance
        boltCircleRadius: 8.5,
        color: 0x8899aa, // Match rotor core color
        totalHeight: 2.5 // Cover height (for centering calculation)
    });
    // The cover is generated "flat" on the XZ plane (Y-up).
    // The motor is built along the Z-axis.
    // Rotate cover 90 degrees around X to face Z direction.
    motorCover.rotation.x = -Math.PI / 2;

    // Position it at the back of the stator
    // The cover geometry is built from Y=0 to Y=totalHeight
    // After rotation, we need to offset to center it properly
    const coverTotalHeight = 2.5; // Should match totalHeight parameter
    motorCover.position.x = 0;  // Center horizontally
    motorCover.position.y = 0;  // Offset to center after rotation

    // To adjust cover position forward/back, change CONFIG.backCoverZOffset at line 40
    backCoverBaseZ = -CONFIG.statorLength / 2 + CONFIG.backCoverZOffset;
    motorCover.position.z = backCoverBaseZ;

    // Store ref for animation
    parts.backCover = motorCover;
    mainGroup.add(motorCover);

    // 3.1 ADD WIRE HARNESS
    const wireHarness = createWireHarness({
        statorOuterDiameter: CONFIG.statorOuterRadius * 2,
        statorHeight: CONFIG.statorLength
    });
    // Rotate -90 deg around X to point towards -Z (Back of motor)
    wireHarness.rotation.x = -Math.PI / 2;
    mainGroup.add(wireHarness);
    // Create left-side instruction panel for guided steps
    createLeftInstructionPanel();

    // ==========================================
    // INTERACTION LOGIC (Connect Wires)
    // ==========================================
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();
    let selectedItem = null;
    
    // Connection tracking
    const connectionStatus = {
        red: false,
        yellow: false,
        black: false
    };
    let powerBlinkInterval = null; // interval id for blinking the 'power' step
    let isConnecting = false; // Prevent multiple simultaneous connections
    let offButtonBlinkInterval = null;
    let offButtonArmed = false;

    renderer.domElement.addEventListener('pointerdown', onPointerDown);
    // Show instruction popup while hovering wires/knobs
    renderer.domElement.addEventListener('pointermove', onPointerMove);

    function onPointerDown(event) {
        // Calculate mouse position in normalized device coordinates
        const rect = renderer.domElement.getBoundingClientRect();
        mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

        raycaster.setFromCamera(mouse, camera);

        // Raycast against scene
        const intersects = raycaster.intersectObjects(scene.children, true);

        if (intersects.length > 0) {
            // Find the first object with our customUserData (knob or connector)
            const hit = intersects.find(i => {
                // Check the object or its parent/grandparent for userData
                let obj = i.object;
                while (obj) {
                    if (obj.userData && (obj.userData.type === 'knob' || obj.userData.type === 'connector' || obj.userData.type === 'wire' || obj.userData.type === 'offButton' || obj.userData.type === 'motor')) {
                        return true;
                    }
                    obj = obj.parent;
                }
                return false;
            });

            if (hit) {
                // Traverse up to find the actual tagged object
                let target = hit.object;
                while (target && (!target.userData || !target.userData.type)) {
                    target = target.parent;
                }

                if (target) {
                    handleInteraction(target, hit.point);
                }
            } else {
                // Clicked empty space, Deselect
                selectedItem = null;
                console.log("Deselected");
            }
        }
    }

    // Function to find power supply knob by color
    function findPowerSupplyKnob(color) {
        let knob = null;
        scene.traverse((child) => {
            if (child.userData && child.userData.type === 'knob' && child.userData.color === color) {
                knob = child;
            }
        });
        return knob;
    }
    
    // Function to find power supply LED
    function findPowerSupplyLED() {
        let led = null;
        scene.traverse((child) => {
            if (child.userData && child.userData.type === 'powerLED') {
                led = child;
            }
        });
        return led;
    }

    // Function to find OFF button
    function findOffButton() {
        let btn = null;
        scene.traverse((child) => {
            if (child.userData && child.userData.type === 'offButton') {
                btn = child.parent && child.parent.userData && child.parent.userData.type === 'offButton' ? child.parent : child;
            }
        });
        return btn;
    }

    function setOffLabelText(text) {
        const offBtn = findOffButton();
        if (!offBtn || !offBtn.userData || !offBtn.userData.offLabel) return;
        const labelMesh = offBtn.userData.offLabel;
        if (!labelMesh.material) return;

        // Create a new canvas with the desired text
        const canvas = document.createElement('canvas');
        canvas.width = 128; canvas.height = 128;
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, 128, 128);
        ctx.fillStyle = 'white';
        ctx.font = 'bold 50px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(text, 64, 80);

        const tex = new THREE.CanvasTexture(canvas);
        tex.needsUpdate = true;
        if (labelMesh.material.map) {
            labelMesh.material.map.dispose();
        }
        labelMesh.material.map = tex;
        labelMesh.material.needsUpdate = true;
    }

    function disableControlInputs() {
        ['voltageIn', 'freqIn', 'loadIn', 'jIn', 'bIn'].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.disabled = true;
        });
    }

    function setVoltageControlEnabled(enabled) {
        const vEl = document.getElementById('voltageIn');
        if (vEl) vEl.disabled = !enabled;
    }

    let powerOnState = false;

    function powerOnSequence() {
        // Stop prompt blink but keep armed state so user can toggle later
        stopOffButtonBlink();
        stopPowerBlink();

        blinkPowerLED(() => {
            // Don't auto-start motor - let voltage control it
            console.log('Power ON - adjust voltage to start motor');
        });

        // Update label text to "ON"
        setOffLabelText('ON');
        // Change off button color to green to reflect ON state
        const offBtn = findOffButton();
        if (offBtn && offBtn.userData && offBtn.userData.offMesh && offBtn.userData.offMesh.material) {
            offBtn.userData.offMesh.material.color.setHex(0x22aa22);
            offBtn.userData.offMesh.material.emissive = new THREE.Color(0x115511);
            offBtn.userData.offMesh.material.emissiveIntensity = 0.6;
        }

        // Enable voltage slider and set simulation power state
        setVoltageControlEnabled(true);
        if (typeof window !== 'undefined' && typeof window.setPowerOn === 'function') {
            window.setPowerOn(true);
        }
        powerOnState = true;
    }

    function powerOffSequence() {
        // Stop any blinking and ensure OFF visuals
        stopOffButtonBlink();
        // LED steady dim red to indicate standby/off
        const led = findPowerSupplyLED();
        if (led && led.material) {
            // Use color only to be compatible with MeshBasicMaterial
            led.material.color.setHex(0x660000);
        }
        // Update label back to OFF
        setOffLabelText('OFF');
        // Restore button color to red
        const offBtn = findOffButton();
        if (offBtn && offBtn.userData && offBtn.userData.offMesh && offBtn.userData.offMesh.material) {
            offBtn.userData.offMesh.material.color.setHex(0xcc0000);
            // Avoid using emissive on materials that may not support it
            if (offBtn.userData.offMesh.material.emissive) {
                offBtn.userData.offMesh.material.emissive = new THREE.Color(0x000000);
                offBtn.userData.offMesh.material.emissiveIntensity = 0;
            }
        }
        // Disable voltage slider and cut power in simulation
        setVoltageControlEnabled(false);
        if (typeof window !== 'undefined' && typeof window.setPowerOn === 'function') {
            window.setPowerOn(false);
        }
        powerOnState = false;
        // Re-arm and resume OFF button blink to guide user
        offButtonArmed = true;
        blinkOffButton();
    }

    function stopOffButtonBlink() {
        const offBtn = findOffButton();
        if (offButtonBlinkInterval) {
            clearInterval(offButtonBlinkInterval);
            offButtonBlinkInterval = null;
        }
        if (offBtn && offBtn.userData && offBtn.userData.offMesh && offBtn.userData.offMesh.material) {
            offBtn.userData.offMesh.material.emissive = new THREE.Color(0x000000);
            offBtn.userData.offMesh.material.emissiveIntensity = 0;
        }
    }

    function blinkOffButton() {
        const offBtn = findOffButton();
        if (!offBtn || !offBtn.userData || !offBtn.userData.offMesh) return;
        const mesh = offBtn.userData.offMesh;
        if (!mesh.material) return;

        // Avoid multiple intervals
        if (offButtonBlinkInterval) return;

        let state = false;
        offButtonBlinkInterval = setInterval(() => {
            state = !state;
            mesh.material.emissive = new THREE.Color(state ? 0xffaa00 : 0x000000);
            mesh.material.emissiveIntensity = state ? 0.9 : 0;
        }, 300);
    }
    
    // Function to blink power supply LED
    function blinkPowerLED(onComplete) {
        const led = findPowerSupplyLED();
        if (!led || !led.material) return;
        
        const blinkCount = 6;
        const blinkDuration = 400; // ms per blink
        let currentBlink = 0;
        
        const blinkInterval = setInterval(() => {
            if (currentBlink >= blinkCount * 2) {
                // Stay ON after blinking (green)
                led.material.color.setHex(0x00ff00);
                clearInterval(blinkInterval);
                if (onComplete) onComplete();
                return;
            }
            
            if (currentBlink % 2 === 0) {
                // Light ON (Bright Red)
                led.material.color.setHex(0xff0000);
            } else {
                // Light OFF (Dark)
                led.material.color.setHex(0x330000);
            }
            
            currentBlink++;
        }, blinkDuration / 2);
    }
    
    // Check if all wires are connected
    function checkAllConnected() {
        if (connectionStatus.red && connectionStatus.yellow && connectionStatus.black) {
            console.log('All wires connected! Click the OFF button to power on.');
            offButtonArmed = true;
            blinkOffButton();
            // Highlight and start blinking the Power step in the left panel
            setActiveInstruction('power');
            startPowerBlink();
        }
    }

    // Function to create blinking light effect on wire
    function blinkWire(wireObject, color) {
        const emissiveColors = {
            'red': 0xff0000,
            'yellow': 0xffff00,
            'black': 0x888888
        };
        
        const blinkCount = 3;
        const blinkDuration = 500; // ms per blink
        let currentBlink = 0;
        
        const originalEmissive = wireObject.material.emissive ? wireObject.material.emissive.getHex() : 0x000000;
        const originalEmissiveIntensity = wireObject.material.emissiveIntensity || 0;
        
        const blinkInterval = setInterval(() => {
            if (currentBlink >= blinkCount * 2) {
                // Restore original state
                wireObject.material.emissive.setHex(originalEmissive);
                wireObject.material.emissiveIntensity = originalEmissiveIntensity;
                clearInterval(blinkInterval);
                return;
            }
            
            if (currentBlink % 2 === 0) {
                // Light ON
                wireObject.material.emissive.setHex(emissiveColors[color] || 0xffffff);
                wireObject.material.emissiveIntensity = 0.8;
            } else {
                // Light OFF
                wireObject.material.emissive.setHex(originalEmissive);
                wireObject.material.emissiveIntensity = originalEmissiveIntensity;
            }
            
            currentBlink++;
        }, blinkDuration / 2);
    }

    // Function to create blinking effect on knob (emissive pulse)
    function blinkKnob(knobObject, color) {
        const emissiveColors = {
            'red': 0xff4444,
            'yellow': 0xffff88,
            'black': 0x666666
        };

        if (!knobObject) return;

        // Prefer a mesh with a material; if knobObject is a group, find a child mesh
        let mesh = knobObject;
        if (!mesh.material) {
            mesh = null;
            knobObject.traverse(child => {
                if (!mesh && child.isMesh && child.material) mesh = child;
            });
            if (!mesh) return;
        }

        const blinkCount = 4;
        const blinkDuration = 300; // ms per blink
        let currentBlink = 0;

        const originalEmissive = mesh.material.emissive ? mesh.material.emissive.getHex() : 0x000000;
        const originalEmissiveIntensity = mesh.material.emissiveIntensity || 0;

        const blinkInterval = setInterval(() => {
            if (currentBlink >= blinkCount * 2) {
                if (mesh.material.emissive) mesh.material.emissive.setHex(originalEmissive);
                mesh.material.emissiveIntensity = originalEmissiveIntensity;
                clearInterval(blinkInterval);
                return;
            }

            if (currentBlink % 2 === 0) {
                if (mesh.material.emissive) mesh.material.emissive.setHex(emissiveColors[color] || 0xffffff);
                mesh.material.emissiveIntensity = 0.9;
            } else {
                if (mesh.material.emissive) mesh.material.emissive.setHex(originalEmissive);
                mesh.material.emissiveIntensity = originalEmissiveIntensity;
            }

            currentBlink++;
        }, blinkDuration / 2);
    }

    // Small on-screen instruction HUD
    function showInstruction(text) {
        let el = document.getElementById('actionInstruction');
        if (!el) {
            el = document.createElement('div');
            el.id = 'actionInstruction';
            el.style.position = 'fixed';
            el.style.right = '12px';
            el.style.top = '12px';
            el.style.padding = '8px 12px';
            el.style.background = 'rgba(0,0,0,0.7)';
            el.style.color = 'white';
            el.style.fontSize = '13px';
            el.style.borderRadius = '6px';
            el.style.zIndex = 9999;
            // Append popup into motor container if present so it stays within
            // the 3D view area. Fallback to document.body.
            // Always append to body so fixed positioning keeps it stable
            document.body.appendChild(el);
        }
        el.textContent = text;
        el.style.display = 'block';
    }

    function clearInstruction() {
        const el = document.getElementById('actionInstruction');
        if (el) el.style.display = 'none';
    }

    // Show a transient connection popup — keep this popup fixed near the left
    // instruction panel. Do NOT reposition it to follow 3D objects; this keeps
    // the connection step DIV in a stable place as requested.
    function showConnectionPopup(text, timeout = 3500, target = null) {
        let el = document.getElementById('connectionPopup');
        if (!el) {
            el = document.createElement('div');
            el.id = 'connectionPopup';
            el.style.position = 'fixed';
            el.style.padding = '8px 12px';
            el.style.background = 'rgba(0,0,0,0.9)';
            el.style.color = '#fff';
            el.style.fontSize = '13px';
            el.style.borderRadius = '8px';
            el.style.zIndex = 12000;
            el.style.backdropFilter = 'blur(6px)';
            el.style.border = '1px solid rgba(255,255,255,0.06)';
            el.style.boxShadow = '0 12px 36px rgba(0,0,0,0.6)';

            // Place by default adjacent to the left instruction panel if present
            const panel = document.getElementById('leftInstructionPanel');
            if (panel) {
                const rect = panel.getBoundingClientRect();
                el.style.left = (rect.right + 10) + 'px';
                el.style.top = (rect.top + 8) + 'px';
            } else if (renderer && renderer.domElement && renderer.domElement.parentElement) {
                // If no left panel, position relative to motor container
                const crect = renderer.domElement.getBoundingClientRect();
                el.style.left = (crect.left + 12) + 'px';
                el.style.top = (crect.top + 12) + 'px';
            } else {
                el.style.left = '50%';
                el.style.top = '12%';
                el.style.transform = 'translateX(-50%)';
            }

            // Keep connection popup fixed to viewport so it doesn't move while scrolling
            document.body.appendChild(el);
        }

        // Intentionally ignore the `target` parameter — do not move this DIV.
        el.textContent = text;
        el.style.display = 'block';

        if (el._hideTimer) clearTimeout(el._hideTimer);
        el._hideTimer = setTimeout(() => { el.style.display = 'none'; }, timeout);
    }

    // Update the HTML control panel / status message with next steps
    function updateTopPanelAfterConnection(color) {
        const statusEl = document.getElementById('statusMessage');
        const promptEl = document.getElementById('simulationPrompt');

        const colors = ['red', 'yellow', 'black'];
        // Find next unconnected color
        let next = null;
        for (const col of colors) {
            if (!connectionStatus[col]) { next = col; break; }
        }

        if (statusEl) {
            statusEl.textContent = `Connected: ${color} wire → ${color} knob.`;
        }

        if (promptEl) {
            if (!next) {
                promptEl.style.display = 'block';
                promptEl.textContent = 'All wires connected — click the OFF button to power on.';
            } else {
                promptEl.style.display = 'block';
                promptEl.textContent = `Next: connect the ${next} wire.`;
            }
        }
    }

    // LEFT-SIDE INSTRUCTION PANEL (step list)
    function createLeftInstructionPanel() {
        if (document.getElementById('leftInstructionPanel')) return;
        const colors = ['red', 'yellow', 'black'];

        const panel = document.createElement('div');
        panel.id = 'leftInstructionPanel';
        // Keep the instruction panel fixed to the viewport so it remains in
        // one place even when scrolling tabs. Append to body and use `fixed`.
        panel.style.position = 'fixed';
        panel.style.left = '12px';
        // Move panel slightly down and make it a bit smaller
        panel.style.top = '124px';
        panel.style.height = '220px';
        panel.style.width = '180px';
        panel.style.padding = '8px';
        panel.style.background = 'linear-gradient(180deg, rgba(20,20,20,0.95), rgba(12,12,12,0.92))';
        panel.style.backdropFilter = 'blur(6px)';
        panel.style.border = '1px solid rgba(255,255,255,0.06)';
        panel.style.borderRadius = '8px';
        panel.style.color = '#ffffff';
        panel.style.zIndex = 10002;
        panel.style.fontFamily = 'Arial, sans-serif';
        panel.style.overflow = 'hidden';
        panel.style.boxShadow = '0 10px 30px rgba(0,0,0,0.6)';

        const title = document.createElement('div');
        title.textContent = 'Connection Steps';
        title.style.fontWeight = '700';
        title.style.marginBottom = '6px';
        title.style.fontSize = '14px';
        panel.appendChild(title);

        colors.forEach((c, i) => {
            const step = document.createElement('div');
            step.className = 'instr-step' + (i === 0 ? ' active' : '');
            step.dataset.color = c;
            // Slightly smaller compact steps
            step.style.padding = '4px';
            step.style.marginBottom = '6px';
            step.style.borderRadius = '6px';
            step.style.cursor = 'default';
            step.style.fontSize = '12px';
            step.innerHTML = `<strong style="text-transform:capitalize">${c}</strong>: Connect ${c}`;
            panel.appendChild(step);
        });

        // Add a final 'Power' step to instruct powering on after wiring
        const powerStep = document.createElement('div');
        powerStep.className = 'instr-step';
        powerStep.dataset.color = 'power';
        powerStep.style.padding = '5px';
        powerStep.style.marginBottom = '4px';
        powerStep.style.borderRadius = '6px';
        powerStep.style.cursor = 'default';
        powerStep.style.fontSize = '12px';
        powerStep.innerHTML = `<strong>Power</strong>: Click OFF button to power on`;
        panel.appendChild(powerStep);

        document.body.appendChild(panel);
    }

    function setActiveInstruction(color) {
        const panel = document.getElementById('leftInstructionPanel');
        if (!panel) return;
        const steps = panel.querySelectorAll('.instr-step');
        steps.forEach(s => {
            if (s.dataset.color === color) s.classList.add('active');
            else s.classList.remove('active');
        });

        // Append to body so it stays fixed with `position: fixed` above
        document.body.appendChild(panel);
    }

    function markInstructionDone(color) {
        const panel = document.getElementById('leftInstructionPanel');
        if (!panel) return;
        const step = panel.querySelector(`.instr-step[data-color="${color}"]`);
        if (step) {
            step.classList.add('done');
            step.classList.remove('active');
            step.style.textDecoration = 'line-through';
            step.style.opacity = '0.6';
        }

        // Activate next uncompleted step
        const colors = ['red', 'yellow', 'black'];
        for (const c of colors) {
            if (!connectionStatus[c]) { setActiveInstruction(c); blinkStepHighlight(c); break; }
        }
    }

    function startPowerBlink() {
        if (powerBlinkInterval) return; // already blinking
        const panel = document.getElementById('leftInstructionPanel');
        if (!panel) return;
        const step = panel.querySelector('.instr-step[data-color="power"]');
        if (!step) return;
        step.classList.add('active');
        let state = false;
        powerBlinkInterval = setInterval(() => {
            state = !state;
            if (state) step.classList.add('pulse');
            else step.classList.remove('pulse');
        }, 700);
    }

    function stopPowerBlink() {
        if (!powerBlinkInterval) return;
        clearInterval(powerBlinkInterval);
        powerBlinkInterval = null;
        const panel = document.getElementById('leftInstructionPanel');
        if (!panel) return;
        const step = panel.querySelector('.instr-step[data-color="power"]');
        if (step) {
            step.classList.remove('pulse');
            step.classList.remove('active');
            step.classList.add('done');
            step.style.opacity = '0.9';
            step.style.textDecoration = 'none';
        }
    }

    // Small transparent click popup positioned near a 3D target (wire/knob) when provided
    function showClickPopup(text, timeout = 2200, target = null) {
        let el = document.getElementById('clickPopup');
        if (!el) {
            el = document.createElement('div');
            el.id = 'clickPopup';
            el.style.position = 'fixed';
            el.style.padding = '6px 10px';
            el.style.background = 'rgba(0,0,0,0.85)';
            el.style.color = '#fff';
            el.style.borderRadius = '8px';
            el.style.backdropFilter = 'blur(6px)';
            el.style.zIndex = 12000;
            el.style.fontSize = '12px';
            el.style.border = '1px solid rgba(255,255,255,0.06)';
            el.style.boxShadow = '0 10px 28px rgba(0,0,0,0.55)';
            // Append to body so fixed positioning keeps it in viewport
            document.body.appendChild(el);
        }

        // If a 3D target is provided, project its world position to screen
        // coordinates and position the popup near that point (client coords).
        // Use fixed positioning so the popup stays in the viewport when
        // the page scrolls.
        let positioned = false;
        if (target && typeof camera !== 'undefined' && typeof renderer !== 'undefined') {
            try {
                const wp = (target.isVector3 || target instanceof THREE.Vector3) ? target : new THREE.Vector3();
                if (!(target.isVector3 || target instanceof THREE.Vector3)) target.getWorldPosition(wp);
                const v = wp.clone();
                v.project(camera);
                const rect = renderer.domElement.getBoundingClientRect();
                const x = rect.left + (v.x + 1) / 2 * rect.width;
                const y = rect.top + (-v.y + 1) / 2 * rect.height;
                const offsetX = 22; // keep popup away from the wire so it does not cover it
                const offsetY = -52;
                el.style.left = (x + offsetX) + 'px';
                el.style.top = (y + offsetY) + 'px';
                el.style.transform = '';
                positioned = true;
            } catch (err) {
                positioned = false;
            }
        }

        if (!positioned) {
            // Position the click popup at a fixed screen position adjacent to
            // the left instruction panel as a fallback.
            const panel = document.getElementById('leftInstructionPanel');
            if (panel) {
                const rect = panel.getBoundingClientRect();
                el.style.left = (rect.right + 10) + 'px';
                el.style.top = (rect.top + 44) + 'px';
            } else if (renderer && renderer.domElement) {
                const crect = renderer.domElement.getBoundingClientRect();
                el.style.left = (crect.left + 12) + 'px';
                el.style.top = (crect.top + 44) + 'px';
            } else {
                el.style.left = '220px';
                el.style.top = '80px';
            }
        }

        el.textContent = text;
        el.style.display = 'block';
        if (el._t) { clearTimeout(el._t); el._t = null; }
        if (timeout && timeout > 0) {
            el._t = setTimeout(() => { el.style.display = 'none'; el._t = null; }, timeout);
        }
    }

    function hideClickPopup() {
        const el = document.getElementById('clickPopup');
        if (el) {
            if (el._t) { clearTimeout(el._t); el._t = null; }
            el.style.display = 'none';
        }
    }

    function blinkStepHighlight(color) {
        const panel = document.getElementById('leftInstructionPanel');
        if (!panel) return;
        const step = panel.querySelector(`.instr-step[data-color="${color}"]`);
        if (!step) return;
        step.classList.add('pulse');
        setTimeout(() => step.classList.remove('pulse'), 1800);
    }

    // Hide hover state when pointer moves away
    function onPointerMove(event) {
        const rect = renderer.domElement.getBoundingClientRect();
        mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
        raycaster.setFromCamera(mouse, camera);

        const intersects = raycaster.intersectObjects(scene.children, true);
        if (intersects.length > 0) {
            // Find first interactive object (wire/connector/knob)
            const hit = intersects.find(i => {
                let obj = i.object;
                while (obj) {
                    if (obj.userData && (obj.userData.type === 'wire' || obj.userData.type === 'connector' || obj.userData.type === 'knob')) return true;
                    obj = obj.parent;
                }
                return false;
            });

            if (hit) {
                // find tagged object
                let target = hit.object;
                while (target && (!target.userData || !target.userData.type)) target = target.parent;
                if (target) {
                    const ttype = target.userData.type;
                    if (ttype === 'wire' || ttype === 'connector' || ttype === 'knob') {
                        const color = target.userData.color;
                        // Only show hover if not yet connected
                        if (!connectionStatus[color]) {
                            setActiveInstruction(color);
                            // Try to position popup at the wire connector if available
                            const wireData = wireHarness.userData.wires[color];
                            const popupTarget = (wireData && wireData.connector) ? wireData.connector : target;
                            showClickPopup(`${color} — click to start connection`, 0, popupTarget);
                            document.body.style.cursor = 'pointer';
                            return;
                        }
                    }
                }
            }
        }

        // default: hide hover popup and reset cursor
        hideClickPopup();
        // reset left panel active only if nothing is selected
        if (!selectedItem) {
            // highlight first unconnected
            const colors = ['red','yellow','black'];
            const next = colors.find(c => !connectionStatus[c]);
            if (next) setActiveInstruction(next);
        }
        document.body.style.cursor = 'default';
    }

    function handleInteraction(obj, point) {
        console.log("Clicked:", obj.userData.type, obj.userData.color);
        
        // Ignore clicks on protected elements (PSU decorative parts, stand)
        if (obj.userData.protected || obj.userData.type === 'psuBody' || 
            obj.userData.type === 'psuScreen' || obj.userData.type === 'psuKeypad' || 
            obj.userData.type === 'psuButton' || obj.userData.type === 'psuBar' || 
            obj.userData.type === 'stand') {
            console.log('Clicked on protected element, ignoring...');
            return;
        }
        
        // Prevent multiple simultaneous connections
        if (isConnecting) {
            console.log('Connection in progress, please wait...');
            return;
        }

        // Handle OFF button (power on) after all wires connected
        if (obj.userData.type === 'offButton') {
            // Toggle behavior: allow turning OFF even if not armed
            if (!powerOnState) {
                if (!offButtonArmed) {
                    console.log('Connect all wires before powering on.');
                    return;
                }
                powerOnSequence();
            } else {
                powerOffSequence();
            }
            return;
        }

        // Allow clicking the motor body to power on after all wires connected
        if (obj.userData.type === 'motor') {
            if (!powerOnState) {
                if (!offButtonArmed) {
                    console.log('Connect all wires before powering on.');
                    return;
                }
                powerOnSequence();
            } else {
                powerOffSequence();
            }
            return;
        }
        
        // Require deliberate two-click connection: click wire (or connector) and matching knob (either order)
        if (obj.userData.type === 'wire' || obj.userData.type === 'connector' || obj.userData.type === 'knob') {
            const color = obj.userData.color;

            // Check if already connected
            if (connectionStatus[color]) {
                console.log(`${color} wire is already connected!`);
                return;
            }

            const wireData = wireHarness.userData.wires[color];
            if (!wireData || !wireData.mesh) return;

            // If nothing selected yet, treat this as the first click
            if (!selectedItem) {
                selectedItem = obj;
                document.body.style.cursor = 'crosshair';

                if (obj.userData.type === 'wire' || obj.userData.type === 'connector') {
                    // Blink the wire and its matching knob to guide the user
                    blinkWire(wireData.mesh, color);
                    const knob = findPowerSupplyKnob(color);
                    if (knob) blinkKnob(knob, color);
                    // Update left panel and show small transparent popup
                    setActiveInstruction(color);
                    // show popup near the wire connector
                    showClickPopup(`Click the ${color} knob to connect`, 2200, wireData.connector);
                } else if (obj.userData.type === 'knob') {
                    // Blink the knob and the matching wire
                    blinkKnob(obj, color);
                    blinkWire(wireData.mesh, color);
                    setActiveInstruction(color);
                    // show popup near the wire connector
                    showClickPopup(`Click the ${color} wire to connect`, 2200, wireData.connector);
                }

                return;
            }

            // If a previous item is selected, perform connection attempt
            const item1 = selectedItem;
            const item2 = obj;

            // If user clicked same object twice, cancel selection
            if (item1 === item2) {
                selectedItem = null;
                document.body.style.cursor = 'default';
                clearInstruction();
                return;
            }

            // Accept pairs where one is a knob and the other is a connector or wire
            const types = [item1.userData.type, item2.userData.type];
            const hasKnob = types.includes('knob');
            const hasWireLike = types.includes('connector') || types.includes('wire');

            if (hasKnob && hasWireLike) {
                // Ensure colors match
                const color1 = item1.userData.color;
                const color2 = item2.userData.color;
                if (color1 === color2) {
                    const knob = item1.userData.type === 'knob' ? item1 : item2;
                    const c = color1;

                    // Get knob world position and connect immediately
                    const targetPos = new THREE.Vector3();
                    knob.getWorldPosition(targetPos);
                    wireHarness.connectWire(c, targetPos);
                    connectionStatus[c] = true;
                    console.log(`${c} wire connected to power supply!`);
                    // Show popup near the wire connector and update top panel with next steps
                    const wireDataForC = wireHarness.userData.wires[c];
                    const connectionTarget = wireDataForC && wireDataForC.connector ? wireDataForC.connector : knob;
                    showConnectionPopup(`This is the ${c} wire connected to the ${c} knob.`, 3500, connectionTarget);
                    updateTopPanelAfterConnection(c);
                    // mark left panel step done and trigger next highlight
                    markInstructionDone(c);
                    checkAllConnected();
                } else {
                    console.warn('Color mismatch!');
                }
            }

            // Reset selection and UI
            selectedItem = null;
            document.body.style.cursor = 'default';
            clearInstruction();
            return;
        }

        if (!selectedItem) {
            selectedItem = obj;
            // Visual feedback could be added here (highlight)
            document.body.style.cursor = 'crosshair';
        } else {
            // Second click
            const item1 = selectedItem;
            const item2 = obj;

            // Check if valid pair
            const types = [item1.userData.type, item2.userData.type];
            if (types.includes('knob') && types.includes('connector')) {
                // Check color match
                if (item1.userData.color === item2.userData.color) {
                    console.log("Valid Connection!");

                    // Identify which is the knob (target)
                    const knob = item1.userData.type === 'knob' ? item1 : item2;
                    const color = knob.userData.color;

                    // Get knob element's world position
                    const targetPos = new THREE.Vector3();
                    knob.getWorldPosition(targetPos);

                    // If the knob is a group, maybe target the 'cap' or center?
                    // intersecting point is sometimes better, but let's use the object center
                    // Actually, the knob group position is accurate enough.

                    // Adjust target pos slightly to surface
                    // targetPos.add(new THREE.Vector3(0, 0, 0.5)); // heuristic

                    // Perform connection
                    wireHarness.connectWire(color, targetPos);
                } else {
                    console.warn("Color mismatch!");
                }
            }

            // Reset
            selectedItem = null;
            document.body.style.cursor = 'default';
        }
    }


    // 4. Add Power Supply with Workbench (if prower.js is loaded)
    if (typeof window.createWorkbenchWithPSU === 'function') {
        const workbenchWithPSU = window.createWorkbenchWithPSU();
        // Workbench + PSU Group Position (moves both together)
        workbenchWithPSU.position.set(0, 0, -8);
        scene.add(workbenchWithPSU);

        // Access PSU separately (it's the second child: 0=bench, 1=psu)
        const psuInGroup = workbenchWithPSU.children[1];
        if (psuInGroup) {
            // Individual PSU Position (relative to workbench group)
            psuInGroup.position.set(25, -5, 0); // Change these values to move PSU only!
            powerSupplyRef = psuInGroup;
        }
    } else if (typeof window.createPowerSupply === 'function') {
        // Fallback: add PSU alone if workbench function not available
        const psu = window.createPowerSupply();
        // Individual Power Supply Position (X, Y, Z)
        psu.position.set(20, 0, -8);
        psu.rotation.y = -Math.PI / 5;
        powerSupplyRef = psu;
        scene.add(psu);
    } else {
        console.warn('Power supply not added: createPowerSupply() missing (ensure js/prower.js is loaded).');
    }

    // 5. Add Steel Stand/Frame
    const steelStand = createSteelStand();
    // Individual Steel Stand Position (X, Y, Z)
    steelStand.position.set(-10, 0, 0);
    steelStand.renderOrder = -1; // Render behind interactive elements
    scene.add(steelStand);

    // ============================================
    // MASTER GROUP POSITION (Controls Rotor + Stator Together)
    // ============================================
    mainGroup.position.set(-10, 0, 0); // Master position (X, Y, Z)
    mainGroup.rotation.y = 0; // Master rotation Y
    mainGroup.rotation.x = 0; // Master rotation X
    mainGroup.userData = { type: 'motor' };
    // Protect all motor children from being hidden
    mainGroup.traverse(child => {
        if (!child.userData || !child.userData.type) {
            child.userData = { ...child.userData, motorPart: true };
        }
    });
    scene.add(mainGroup);

    // --- Controls ---
    transformControl = new TransformControls(camera, renderer.domElement);
    transformControl.addEventListener('dragging-changed', (e) => controls.enabled = !e.value);
    transformControl.attach(mainGroup);
    transformControl.visible = false;
    transformControl.enabled = false;
    scene.add(transformControl);

    // --- Animation Loop ---
    function animate() {
        requestAnimationFrame(animate);
        controls.update();

        const targetFactor = isExploded ? 1 : 0;
        explodeFactor += (targetFactor - explodeFactor) * 0.05;

        // Explode Animation Logic
        if (parts.shaft && parts.core && parts.cage && parts.stator && parts.backCover) {
            // Stator moves up (Windings move with it because they are children of parts.stator)
            parts.stator.position.y = 12 * explodeFactor;

            parts.shaft.position.z = -18 * explodeFactor;
            parts.cage.position.z = 18 * explodeFactor;

            // Move cover back during explosion (using base position)
            parts.backCover.position.z = backCoverBaseZ - (20 * explodeFactor);
        }

        // Ensure all objects remain visible
        if (mainGroup) mainGroup.visible = true;
        if (statorGroup) statorGroup.visible = statorVisible;
        if (rotorGroup) rotorGroup.visible = true;

        // Rotation Logic
        if (isRotating && !gizmoEnabled) {
            // Optional: Rotate rotor only
            if (parts.core) parts.core.rotateZ(0.02);
            if (parts.cage) parts.cage.rotateZ(0.02);
            if (parts.shaft) parts.shaft.rotateZ(0.02);
        }

        renderer.render(scene, camera);
    }

    // Improved resize handling using ResizeObserver
    const resizeObserver = new ResizeObserver(() => {
        const width = container.clientWidth;
        const height = container.clientHeight;

        if (width > 0 && height > 0) {
            camera.aspect = width / height;
            camera.updateProjectionMatrix();
            renderer.setSize(width, height);
        }
    });
    resizeObserver.observe(container);

    animate();
}

function setRotorAngle(angle) {
    if (parts.core) parts.core.rotation.z = angle;
    if (parts.cage) parts.cage.rotation.z = angle;
    if (parts.shaft) parts.shaft.rotation.z = angle;
}

// Export for use in HTML using ES Modules
// Attach exports to `window` for non-module usage (index.html loads scripts as classic scripts)
if (typeof window !== 'undefined') {
    window.initMotorModel = initMotorModel;
    window.toggleRotation = toggleRotation;
    window.toggleWireframe = toggleWireframe;
    window.toggleGizmo = toggleGizmo;
    window.toggleExplode = toggleExplode;
    window.toggleStator = toggleStator;
    window.setRotorAngle = setRotorAngle;
}
// Also provide ES module exports so this file can be imported with `type="module"`.
export { initMotorModel, toggleRotation, toggleWireframe, toggleGizmo, toggleExplode, toggleStator, setRotorAngle };
import * as THREE from 'three';

/**
 * Creates a procedural 3D Motor Back Cover.
 * * @param {Object} options - Configuration object to override defaults.
 * @param {number} [options.outerRadius=5.5] - Radius of the flange.
 * @param {number} [options.innerHubRadius=2.0] - Radius of the central hub.
 * @param {number} [options.totalHeight=2.5] - Total height of the cover.
 * @param {number} [options.flangeHeight=0.6] - Thickness/height of the base flange.
 * @param {number} [options.ribCount=6] - Number of reinforcement ribs.
 * @param {number} [options.boltCount=4] - Number of mounting holes.
 * @param {number} [options.color=0x99aacc] - Hex color of the metal.
 * @returns {THREE.Group} - A Three.js Group containing the mesh parts.
 */
export function createMotorCover(options = {}) {
    // 1. Merge User Options with Defaults
    const config = {
        outerRadius: 5.5,
        innerHubRadius: 2.0,
        totalHeight: 2.5,
        flangeHeight: 0.6,
        ribCount: 6,
        ribThickness: 0.4,
        boltCount: 4,
        boltCircleRadius: 4.8,
        color: 0x99aacc, 
        metalness: 0.6,
        roughness: 0.5,
        segments: 128,
        ...options // Overrides defaults with any provided options
    };

    const container = new THREE.Group();

    // Shared Material
    const mainMaterial = new THREE.MeshStandardMaterial({
        color: config.color,
        roughness: config.roughness,
        metalness: config.metalness,
        flatShading: false,
        side: THREE.DoubleSide
    });

    // --- PART 1: MAIN DOME (Lathe Geometry) ---
    const points = [];
    points.push(new THREE.Vector2(config.outerRadius, 0));
    points.push(new THREE.Vector2(config.outerRadius, config.flangeHeight));
    
    // Create the curved profile
    const startX = config.outerRadius;
    const startY = config.flangeHeight;
    const endX = config.innerHubRadius;
    const endY = config.totalHeight * 0.7;

    for(let i=0; i<=10; i++) {
        const t = i/10;
        const x = startX + (endX - startX) * t;
        const y = startY + (endY - startY) * Math.sin(t * Math.PI / 2); 
        points.push(new THREE.Vector2(x, y));
    }

    // Top detail
    points.push(new THREE.Vector2(config.innerHubRadius, config.totalHeight));
    points.push(new THREE.Vector2(config.innerHubRadius - 0.4, config.totalHeight));
    points.push(new THREE.Vector2(config.innerHubRadius - 0.4, config.totalHeight - 0.5));
    points.push(new THREE.Vector2(config.innerHubRadius - 1.0, config.totalHeight - 0.5));

    const geometryDome = new THREE.LatheGeometry(points, config.segments);
    const domeMesh = new THREE.Mesh(geometryDome, mainMaterial);
    domeMesh.castShadow = true;
    domeMesh.receiveShadow = true;
    container.add(domeMesh);

    // --- PART 2: FLANGE RING (Extruded Shape with Holes) ---
    const ringShape = new THREE.Shape();
    ringShape.absarc(0, 0, config.outerRadius, 0, Math.PI * 2, false);
    
    // Cut out center so it doesn't overlap the dome inside
    const innerCut = new THREE.Path();
    innerCut.absarc(0, 0, config.outerRadius - 1.0, 0, Math.PI * 2, true);
    ringShape.holes.push(innerCut);

    // Add Bolt Holes
    for (let i = 0; i < config.boltCount; i++) {
        const angle = (Math.PI * 2 / config.boltCount) * i + (Math.PI/4);
        const hx = Math.cos(angle) * config.boltCircleRadius;
        const hy = Math.sin(angle) * config.boltCircleRadius;
        
        const hole = new THREE.Path();
        hole.absarc(hx, hy, 0.35, 0, Math.PI*2, true);
        ringShape.holes.push(hole);
    }

    const ringExtrude = new THREE.ExtrudeGeometry(ringShape, {
        depth: config.flangeHeight,
        bevelEnabled: true,
        bevelThickness: 0.05,
        bevelSize: 0.05,
        curveSegments: 64
    });
    const ringMesh = new THREE.Mesh(ringExtrude, mainMaterial);
    ringMesh.rotation.x = -Math.PI / 2;
    ringMesh.castShadow = true;
    ringMesh.receiveShadow = true;
    container.add(ringMesh);
    
    // --- PART 3: RIBS ---
    const ribGroup = new THREE.Group();
    container.add(ribGroup);
    
    const ribShape = new THREE.Shape();
    ribShape.moveTo(config.innerHubRadius - 0.1, config.totalHeight - 0.5);
    ribShape.lineTo(config.outerRadius - 0.5, config.flangeHeight);
    ribShape.lineTo(config.innerHubRadius - 0.1, config.flangeHeight);
    ribShape.lineTo(config.innerHubRadius - 0.1, config.totalHeight - 0.5);

    const ribGeo = new THREE.ExtrudeGeometry(ribShape, {
        depth: config.ribThickness,
        bevelEnabled: false
    });
    ribGeo.translate(0, 0, -config.ribThickness/2); // Center geometry

    for(let i=0; i<config.ribCount; i++) {
        const angle = (Math.PI * 2 / config.ribCount) * i;
        const rib = new THREE.Mesh(ribGeo, mainMaterial);
        rib.rotation.y = -angle; 
        rib.position.y = 0;
        ribGroup.add(rib);
    }
    container.userData.ribs = ribGroup; // Save ref for toggling if needed

    // --- PART 4: BEARING CAP ---
    const capGeo = new THREE.CylinderGeometry(1.2, 1.2, 0.2, 32);
    const cap = new THREE.Mesh(capGeo, new THREE.MeshStandardMaterial({ color: 0x333333 }));
    cap.position.y = config.totalHeight - 0.5;
    container.add(cap);

    return container;
}
import * as THREE from 'three';

// Wire Insulation Materials
const rubberRoughness = 0.6;
const matRed = new THREE.MeshStandardMaterial({ color: 0xd92b2b, roughness: rubberRoughness });
const matYellow = new THREE.MeshStandardMaterial({ color: 0xf2d62e, roughness: rubberRoughness });
const matBlackWire = new THREE.MeshStandardMaterial({ color: 0x222222, roughness: rubberRoughness });

// Heat Shrink Sleeve Material
const matSleeve = new THREE.MeshStandardMaterial({
    color: 0x1a1a1a,
    roughness: 0.5,
    flatShading: false,
    side: THREE.DoubleSide
});

const matConnectorBase = new THREE.MeshStandardMaterial({
    color: 0x111111,
    roughness: 0.4
});

const goldMaterial = new THREE.MeshStandardMaterial({
    color: 0xffaa00,
    metalness: 0.9,
    roughness: 0.25,
    side: THREE.DoubleSide
});

function createBulletConnector() {
    const group = new THREE.Group();

    const wireRadius = 0.15;

    // Black plastic insulation base (scaled down)
    const baseLen = 1.0;
    const baseRadius = 0.35;
    const baseGeo = new THREE.CylinderGeometry(baseRadius, wireRadius * 1.1, baseLen, 16);
    const baseMesh = new THREE.Mesh(baseGeo, matConnectorBase);
    baseMesh.rotation.z = Math.PI / 2;
    baseMesh.position.x = baseLen / 2;
    group.add(baseMesh);

    // Gold Bullet Tip (scaled down)
    const tipLen = 2.0;
    const tipRadius = 0.3;

    // Shaft
    const tipGeo = new THREE.CylinderGeometry(tipRadius, tipRadius, tipLen - 0.3, 16);
    const tipMesh = new THREE.Mesh(tipGeo, goldMaterial);
    tipMesh.rotation.z = Math.PI / 2;
    tipMesh.position.x = baseLen + (tipLen - 0.3) / 2;

    // Rounded Cap
    const capGeo = new THREE.SphereGeometry(tipRadius, 16, 16, 0, Math.PI * 2, 0, Math.PI / 2);
    const capMesh = new THREE.Mesh(capGeo, goldMaterial);
    capMesh.rotation.z = -Math.PI / 2;
    capMesh.position.x = baseLen + (tipLen - 0.3);

    // Ridge detail (scaled down)
    const ridgeGeo = new THREE.TorusGeometry(tipRadius, 0.04, 8, 20);
    const ridgeMesh = new THREE.Mesh(ridgeGeo, goldMaterial);
    ridgeMesh.rotation.y = Math.PI / 2;
    ridgeMesh.position.x = baseLen + 1;

    group.add(tipMesh);
    group.add(capMesh);
    group.add(ridgeMesh);

    return group;
}

export function createWireHarness(config = {}) {
    const statorHeight = config.statorHeight || 15;
    const statorOuterDiameter = config.statorOuterDiameter || 32;

    const harnessGroup = new THREE.Group();

    // Dimensions
    const sleeveRadius = 0.6;
    const wireRadius = 0.15;

    // Motor position configuration
    const motorTopY = statorHeight / 2;
    // Position at roughly 70% of radius (right side)
    const rightOffset = (statorOuterDiameter / 2 * 0.7);

    // Calculate floor level (bottom of motor plus margin)
    const floorLevel = -(statorOuterDiameter / 2 + 1);

    // --- SLEEVE PATH ---
    const sleevePath = new THREE.CatmullRomCurve3([
        new THREE.Vector3(rightOffset, motorTopY, floorLevel * 0.5), // Start at motor back, Right-Bottom quadrant
        new THREE.Vector3(rightOffset + 2, motorTopY + 5, floorLevel * 0.8), // Back and down
        new THREE.Vector3(rightOffset + 5, motorTopY + 10, floorLevel),    // Touch desk
        new THREE.Vector3(rightOffset + 8, 0, floorLevel),                 // Run forward along desk
        new THREE.Vector3(rightOffset + 8, -12, floorLevel)                // End of sleeve, further front
    ]);

    const sleeveGeo = new THREE.TubeGeometry(sleevePath, 64, sleeveRadius, 16, false);
    const sleeve = new THREE.Mesh(sleeveGeo, matSleeve);
    sleeve.castShadow = true;
    harnessGroup.add(sleeve);

    // --- SLEEVE END CAP ---
    const endPoint = sleevePath.getPoint(1);
    const endTangent = sleevePath.getTangent(1);

    const capGeo = new THREE.CylinderGeometry(sleeveRadius * 0.95, sleeveRadius * 0.95, 0.5, 32);
    const cap = new THREE.Mesh(capGeo, new THREE.MeshStandardMaterial({ color: 0x050505 }));
    cap.position.copy(endPoint);
    const capAxis = new THREE.Vector3(0, 1, 0);
    const capQuat = new THREE.Quaternion().setFromUnitVectors(capAxis, endTangent);
    cap.setRotationFromQuaternion(capQuat);
    cap.translateY(-0.2);
    harnessGroup.add(cap);

    // --- INDIVIDUAL WIRE STRANDS ---
    const materials = [matRed, matYellow, matBlackWire];

    const wireExtensions = [
        { label: 'red', offsetX: -1, offsetZ: 0 },
        { label: 'yellow', offsetX: 0, offsetZ: 0.5 },
        { label: 'black', offsetX: 1, offsetZ: 0 }
    ];

    // Store references for animation/update
    harnessGroup.userData.wires = {};

    wireExtensions.forEach((w, i) => {
        const spreadFactor = 0.8;
        const forwardExtension = 6;

        const p0 = endPoint.clone();

        const p1 = new THREE.Vector3(
            p0.x + w.offsetX * spreadFactor,
            p0.y - forwardExtension * 0.5,
            p0.z + 0.2
        );

        const p2 = new THREE.Vector3(
            p0.x + w.offsetX * spreadFactor * 1.5,
            p0.y - forwardExtension,
            p0.z
        );

        const wireCurve = new THREE.CatmullRomCurve3([p0, p1, p2]);
        const wireGeo = new THREE.TubeGeometry(wireCurve, 32, wireRadius, 8, false);
        const wireMesh = new THREE.Mesh(wireGeo, materials[i]);
        wireMesh.castShadow = true;
        // Tag wire for interaction
        wireMesh.userData = { type: 'wire', color: w.label, originalMaterial: materials[i].clone() };
        harnessGroup.add(wireMesh);

        // Add Connector
        const connector = createBulletConnector();
        // Tag connector for interaction
        connector.userData = { type: 'connector', color: w.label };
        // Traverse to tag children too (interaction raycast hits children)
        connector.traverse(child => {
            child.userData = { type: 'connector', color: w.label, parent: connector };
        });

        const finalPoint = wireCurve.getPoint(1);
        const tangent = wireCurve.getTangent(1);

        connector.position.copy(finalPoint);
        const axis = new THREE.Vector3(1, 0, 0);
        const quaternion = new THREE.Quaternion().setFromUnitVectors(axis, tangent);
        connector.setRotationFromQuaternion(quaternion);

        harnessGroup.add(connector);

        // Save refs for updates
        harnessGroup.userData.wires[w.label] = {
            mesh: wireMesh,
            curve: wireCurve,
            connector: connector,
            p0: p0.clone() // Start point is fixed at sleeve end
        };
    });

    // --- CONNECT FUNCTION ---
    harnessGroup.connectWire = function (color, targetWorldPos) {
        const wireData = this.userData.wires[color];
        if (!wireData) return;

        // Convert target world position to local space
        const localTarget = targetWorldPos.clone();
        this.worldToLocal(localTarget);

        const pStart = wireData.p0; // Fixed Start (Sleeve End)
        const pEnd = localTarget;   // Target (Knob)

        // 1. Tangents
        // Start: Down/Out from sleeve
        const startTan = new THREE.Vector3(0, -1, 0).normalize();
        // End: Into the knob (Local +Y is World -Z, which is 'Into' the front face)
        const endTan = new THREE.Vector3(0, 1, 0).normalize();

        // 2. Control Points
        const dist = pStart.distanceTo(pEnd);
        const controlDist = dist * 0.3; // Handle length

        // kp1: Extend forward from start
        const kp1 = pStart.clone().add(startTan.clone().multiplyScalar(controlDist));

        // kp2: Extend BACK from end (so it is outside the box)
        const kp2 = pEnd.clone().sub(endTan.clone().multiplyScalar(controlDist));

        // 3. Gravity Sag
        // Add sagging to local Z (World Y)
        const sag = Math.max(1.0, dist * 0.2);
        kp1.z -= sag;
        kp2.z -= sag * 0.5; // Less sag near the connector to avoid weird loops

        // Floor Constraint
        kp1.z = Math.max(kp1.z, floorLevel + 0.5);
        kp2.z = Math.max(kp2.z, floorLevel + 0.5);

        // 4. Calculate Connector Offset
        // We want the connector Tip to be at pEnd.
        // Connector length is ~2.8.
        // We need to back up from pEnd in the direction opposite to endTan.
        // Tangent at impact is endTan (approx).
        const connectorLength = 2.8;
        const newCurveEnd = pEnd.clone().sub(endTan.clone().multiplyScalar(connectorLength));

        // Update Curve Points
        // We stop the curve at the connector base
        wireData.curve.type = 'catmullrom';
        wireData.curve.tension = 0.5;
        // Adjust kp2 slightly to point towards newCurveEnd if needed, 
        // but using the original approach path for continuity is usually fine.
        wireData.curve.points = [pStart, kp1, kp2, newCurveEnd];

        // Rebuild Geometry
        wireData.mesh.geometry.dispose();
        wireData.mesh.geometry = new THREE.TubeGeometry(wireData.curve, 64, wireRadius, 8, false);

        // Update Connector transform
        wireData.connector.position.copy(newCurveEnd);

        // Orient connector to look at pEnd
        // By default lookAt points +Z axis at target? No, -Z?
        // THREE.Object3D.lookAt: standard is +Z faces target? No, usually -Z faces target in cameras, but +Z for objects?
        // Actually, let's use Quaternions for precision.
        // Vector from Base to Tip:
        const aimVec = new THREE.Vector3().subVectors(pEnd, newCurveEnd).normalize();
        // Connector internal geometry is along +X axis.
        const axisX = new THREE.Vector3(1, 0, 0);
        wireData.connector.quaternion.setFromUnitVectors(axisX, aimVec);
    };

    return harnessGroup;
}

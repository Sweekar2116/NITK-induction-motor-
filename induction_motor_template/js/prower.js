import * as THREE from 'three';

// ==========================================
// POWER SUPPLY GENERATION (From Image)
// ==========================================
function createPowerSupply() {
    const psuGroup = new THREE.Group();

    // Main Chassis
    const bodyGeo = new THREE.BoxGeometry(18, 12, 14);
    const bodyMat = new THREE.MeshStandardMaterial({ color: 0xaaaaaa });
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.userData = { type: 'psuBody', protected: true };
    psuGroup.add(body);

    // Screen Area
    const screenAreaGeo = new THREE.PlaneGeometry(10, 6);
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#002200';
    ctx.fillRect(0, 0, 512, 256);
    ctx.fillStyle = '#00ff00';
    ctx.font = 'bold 40px Courier New';
    ctx.fillText('CH1 VOLTAGE', 40, 60);
    ctx.font = 'bold 60px Courier New';
    ctx.fillText('9.0V', 40, 140);
    ctx.font = 'bold 40px Courier New';
    ctx.fillText('CH1 CURRENT', 280, 60);
    ctx.font = 'bold 60px Courier New';
    ctx.fillText('0.00A', 280, 140);

    const screenTex = new THREE.CanvasTexture(canvas);
    const screenMat = new THREE.MeshBasicMaterial({ map: screenTex });
    const screen = new THREE.Mesh(screenAreaGeo, screenMat);
    screen.position.set(-3, 0.5, 7.01);
    screen.userData = { type: 'psuScreen', protected: true };
    psuGroup.add(screen);

    // Small Red LED (Power Indicator)
    const ledMat = new THREE.MeshBasicMaterial({ color: 0xff0000 });
    const led = new THREE.Mesh(new THREE.CircleGeometry(0.2, 16), ledMat);
    led.position.set(-7.5, 3, 7.02);
    led.userData = { type: 'powerLED' };
    psuGroup.add(led);
    
    // Store LED reference for external access
    psuGroup.userData.powerLED = led;
    psuGroup.userData.powerLEDMaterial = ledMat;

    // Numeric Keypad Grid
    const btnMat = new THREE.MeshStandardMaterial({ color: 0x333333 });
    const btnGeo = new THREE.BoxGeometry(1, 0.8, 0.2);
    for (let i = 0; i < 4; i++) {
        for (let j = 0; j < 3; j++) {
            const btn = new THREE.Mesh(btnGeo, btnMat);
            btn.userData = { type: 'psuKeypad', protected: true };
            btn.position.set(4 + j * 1.5, 2 - i * 1.2, 7.3);
            psuGroup.add(btn);
        }
    }

    // Red/Blue Circular Buttons
    const rBtn = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.6, 0.5, 16), new THREE.MeshStandardMaterial({ color: 0xaa0000 }));
    rBtn.rotation.x = Math.PI / 2;
    rBtn.position.set(1, -4.5, 7.5);
    rBtn.userData = { type: 'psuButton', protected: true };
    psuGroup.add(rBtn);

    const bBtn = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.6, 0.5, 16), new THREE.MeshStandardMaterial({ color: 0x0000aa }));
    bBtn.rotation.x = Math.PI / 2;
    bBtn.position.set(3, -4.5, 7.5);
    bBtn.userData = { type: 'psuButton', protected: true };
    psuGroup.add(bBtn);

    // 3-Phase Connector Knobs (Red, Yellow, Black)
    const knobGeo = new THREE.CylinderGeometry(0.7, 0.7, 1.0, 32);
    const knobCapGeo = new THREE.CylinderGeometry(0.4, 0.4, 1.2, 32); // Inner post

    // Red Knob
    const kRed = new THREE.Group();
    const kRedMesh = new THREE.Mesh(knobGeo, new THREE.MeshStandardMaterial({ color: 0xff0000 }));
    kRedMesh.rotation.x = Math.PI / 2;
    kRed.add(kRedMesh);
    const kRedCap = new THREE.Mesh(knobCapGeo, new THREE.MeshStandardMaterial({ color: 0x888888 }));
    kRedCap.rotation.x = Math.PI / 2;
    kRed.add(kRedCap);
    kRed.position.set(-2, -3, 7.2);
    kRed.userData = { type: 'knob', color: 'red' }; // Identity for interaction
    // Tag children for raycasting
    kRed.traverse(child => {
        if (child.isMesh) {
            child.userData = { type: 'knob', color: 'red', parent: kRed };
        }
    });
    psuGroup.add(kRed);

    // Yellow Knob
    const kYel = new THREE.Group();
    const kYelMesh = new THREE.Mesh(knobGeo, new THREE.MeshStandardMaterial({ color: 0xffff00 }));
    kYelMesh.rotation.x = Math.PI / 2;
    kYel.add(kYelMesh);
    const kYelCap = new THREE.Mesh(knobCapGeo, new THREE.MeshStandardMaterial({ color: 0x888888 }));
    kYelCap.rotation.x = Math.PI / 2;
    kYel.add(kYelCap);
    kYel.position.set(0, -3, 7.2);
    kYel.userData = { type: 'knob', color: 'yellow' }; // Identity for interaction
    // Tag children for raycasting
    kYel.traverse(child => {
        if (child.isMesh) {
            child.userData = { type: 'knob', color: 'yellow', parent: kYel };
        }
    });
    psuGroup.add(kYel);

    // Black Knob
    const kBlk = new THREE.Group();
    const kBlkMesh = new THREE.Mesh(knobGeo, new THREE.MeshStandardMaterial({ color: 0x111111 }));
    kBlkMesh.rotation.x = Math.PI / 2;
    // Tag children for raycasting
    kBlk.traverse(child => {
        if (child.isMesh) {
            child.userData = { type: 'knob', color: 'black', parent: kBlk };
        }
    });
    kBlk.add(kBlkMesh);
    const kBlkCap = new THREE.Mesh(knobCapGeo, new THREE.MeshStandardMaterial({ color: 0x888888 }));
    kBlkCap.rotation.x = Math.PI / 2;
    kBlk.add(kBlkCap);
    kBlk.position.set(2, -3, 7.2);
    kBlk.userData = { type: 'knob', color: 'black' }; // Identity for interaction
    psuGroup.add(kBlk);

    // Large Red OFF Button
    const offBtnGroup = new THREE.Group();
    const offGeo = new THREE.CylinderGeometry(1.2, 1.2, 0.8, 24);
    const offMesh = new THREE.Mesh(offGeo, new THREE.MeshStandardMaterial({ color: 0xcc0000 }));
    offMesh.rotation.x = Math.PI / 2;
    offBtnGroup.add(offMesh);

    // OFF Label
    const offLabelCanvas = document.createElement('canvas');
    offLabelCanvas.width = 128; offLabelCanvas.height = 128;
    const octx = offLabelCanvas.getContext('2d');
    octx.fillStyle = 'white'; octx.font = 'bold 50px Arial'; octx.textAlign = 'center';
    octx.fillText('OFF', 64, 80);
    const offTex = new THREE.CanvasTexture(offLabelCanvas);
    const offLabel = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 1.5), new THREE.MeshBasicMaterial({ map: offTex, transparent: true }));
    offLabel.position.z = 0.41;
    offBtnGroup.add(offLabel);

    offBtnGroup.position.set(7, -4.5, 7.5);
    // Tag for interaction and store refs
    offBtnGroup.userData = { type: 'offButton', offMesh, offLabel };
    offBtnGroup.traverse(child => {
        if (child.isMesh) {
            child.userData = { type: 'offButton', parent: offBtnGroup };
        }
    });
    psuGroup.userData.offButton = offBtnGroup;
    psuGroup.userData.offButtonMesh = offMesh;
    psuGroup.userData.offButtonLabel = offLabel;
    psuGroup.add(offBtnGroup);

    // Blue Bottom Bar
    const bar = new THREE.Mesh(new THREE.BoxGeometry(10, 1, 0.3), new THREE.MeshStandardMaterial({ color: 0x224488 }));
    bar.position.set(-3.5, -4.5, 7.1);
    bar.userData = { type: 'psuBar', protected: true };
    psuGroup.add(bar);

    return psuGroup;
}

// ==========================================
// WORKBENCH WITH PSU (Fixed to Scene)
// ==========================================
function createWorkbenchWithPSU() {
    const combinedGroup = new THREE.Group();

    // Create and add workbench table top (no legs)
    // Realistic wood workshop bench with natural wood texture
    // BoxGeometry(width, height/thickness, depth)

    // Create procedural wood grain texture
    const woodCanvas = document.createElement('canvas');
    woodCanvas.width = 512;
    woodCanvas.height = 512;
    const ctx = woodCanvas.getContext('2d');

    // Base wood color
    const gradient = ctx.createLinearGradient(0, 0, 0, 512);
    gradient.addColorStop(0, '#8B6F47');
    gradient.addColorStop(0.5, '#7A5C3D');
    gradient.addColorStop(1, '#6B4E35');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 512, 512);

    // Add wood grain lines
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.1)';
    ctx.lineWidth = 2;
    for (let i = 0; i < 20; i++) {
        ctx.beginPath();
        const y = Math.random() * 512;
        ctx.moveTo(0, y);
        ctx.bezierCurveTo(128, y + Math.random() * 10 - 5, 384, y + Math.random() * 10 - 5, 512, y);
        ctx.stroke();
    }

    const woodTexture = new THREE.CanvasTexture(woodCanvas);
    woodTexture.wrapS = THREE.RepeatWrapping;
    woodTexture.wrapT = THREE.RepeatWrapping;
    woodTexture.repeat.set(4, 2);

    const benchMaterial = new THREE.MeshStandardMaterial({
        map: woodTexture,           // Wood texture
        color: 0xAA8866,            // Natural wood tone
        roughness: 0.65,            // Realistic wood roughness
        metalness: 0.0,             // Wood is not metallic
        bumpMap: woodTexture,       // Add surface detail
        bumpScale: 0.02
    });
    const bench = new THREE.Mesh(new THREE.BoxGeometry(80, 3, 45), benchMaterial);
    bench.position.y = -12;
    bench.castShadow = true;
    bench.receiveShadow = true;
    combinedGroup.add(bench);

    // Create and add power supply fixed on the bench
    const psu = createPowerSupply();
    psu.position.set(0, -5, 0);  // positioned on top of the bench surface (closes the gap)
    combinedGroup.add(psu);

    return combinedGroup;
}

// ==========================================
// MAIN BUILD AND SCENE SETUP
// ==========================================
function initializeScene() {
    // --- Main Build ---
    scene.add(createWorkbenchWithPSU());

    const psu = createPowerSupply();
    psu.position.set(20, -7, 0);
    scene.add(psu);

    mainGroup = new THREE.Group();
    rotorGroup = buildRotor();
    mainGroup.add(rotorGroup);
    statorGroup = createStator();
    mainGroup.add(statorGroup);

    // Add stand/motor frame separately - it stays fixed
    if (parts.standFrame) {
        parts.standFrame.position.set(-10, 0, 0);
        parts.standFrame.rotation.y = Math.PI / 6;
        scene.add(parts.standFrame);  // Add to scene, not mainGroup
    }

    mainGroup.position.x = -10; // Shift motor left to make room for PSU
    mainGroup.rotation.y = Math.PI / 6;
    scene.add(mainGroup);

    transformControl = new THREE.TransformControls(camera, renderer.domElement);
    transformControl.addEventListener('dragging-changed', (e) => controls.enabled = !e.value);
    transformControl.attach(mainGroup);
    transformControl.visible = false;
    scene.add(transformControl);

    // --- Controls ---
    function toggleRotation() {
        isRotating = !isRotating;
        const btn = document.getElementById('btn-rotate');
        btn.innerText = isRotating ? "Pause Rotation" : "Start Rotation";
    }
    function toggleWireframe() {
        wireframeMode = !wireframeMode;
        scene.traverse(c => { if (c.isMesh) c.material.wireframe = wireframeMode; });
    }
    function toggleGizmo() {
        gizmoEnabled = !gizmoEnabled;
        transformControl.visible = transformControl.enabled = gizmoEnabled;
    }
    function toggleExplode() { isExploded = !isExploded; }
    function toggleStator() { statorVisible = !statorVisible; statorGroup.visible = statorVisible; }

    // --- Animation Loop ---
    function animate() {
        requestAnimationFrame(animate);
        controls.update();
        const targetFactor = isExploded ? 1 : 0;
        explodeFactor += (targetFactor - explodeFactor) * 0.05;

        // Lock stand and motor frame position - they never move
        if (parts.standFrame) {
            parts.standFrame.position.set(-10, 0, 0);
            parts.standFrame.rotation.set(0, Math.PI / 6, 0);
        }

        parts.stator.position.y = 0; // Stator stays fixed - no movement
        // parts.stator.position.y = 12 * explodeFactor; // DISABLED
        parts.shaft.position.z = -18 * explodeFactor;
        parts.cage.position.z = 18 * explodeFactor;

        if (isRotating && !gizmoEnabled) {
            parts.core.rotateZ(0.02);
            parts.shaft.rotateZ(0.02);
        }
        renderer.render(scene, camera);
    }

    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    });
    animate();
}

// Export functions for use in other modules
export { createPowerSupply, createWorkbenchWithPSU };
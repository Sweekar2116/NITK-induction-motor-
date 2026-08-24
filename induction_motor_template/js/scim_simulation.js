
import { setRotorAngle } from './motor-model.js';

class InductionMotor {
    constructor() {
        // Parameters from gym-electric-motor
        this.mp = {
            p: 2,
            l_m: 143.75e-3,
            l_sigs: 5.87e-3,
            l_sigr: 5.87e-3,
            j_rotor: 0.1,
            r_s: 2.9338,
            r_r: 1.355,
        };

        // Mechanical parameters
        this.friction = 0.01; // B

        // Initialize derived constants
        this.updateModel();

        // State: [i_salpha, i_sbeta, psi_ralpha, psi_rbeta, epsilon]
        this.state = [0, 0, 0, 0, 0];

        // Mechanical state (omega_mech)
        this.omega = 0;
    }

    updateModel() {
        const mp = this.mp;
        const l_s = mp.l_m + mp.l_sigs;
        const l_r = mp.l_m + mp.l_sigr;
        const sigma = (l_s * l_r - Math.pow(mp.l_m, 2)) / (l_s * l_r);
        const tau_r = l_r / mp.r_r;
        const tau_sig = sigma * l_s / (mp.r_s + mp.r_r * Math.pow(mp.l_m, 2) / Math.pow(l_r, 2));

        // Precompute constants
        this.constants = {
            sigma, l_s, l_r, tau_r, tau_sig
        };
    }

    getDerivative(state, u_salphabeta, omega) {
        const { i_salpha, i_sbeta, psi_ralpha, psi_rbeta, epsilon } = {
            i_salpha: state[0],
            i_sbeta: state[1],
            psi_ralpha: state[2],
            psi_rbeta: state[3],
            epsilon: state[4]
        };

        const { u_salpha, u_sbeta } = { u_salpha: u_salphabeta[0], u_sbeta: u_salphabeta[1] };
        // Rotor voltages are 0 for SCIM
        const u_ralpha = 0;
        const u_rbeta = 0;

        const mp = this.mp;
        const { sigma, l_s, l_r, tau_r, tau_sig } = this.constants;

        // Terms from the Python matrix
        const di_salpha =
            (-1 / tau_sig) * i_salpha
            + (mp.l_m * mp.r_r / (sigma * l_s * Math.pow(l_r, 2))) * psi_ralpha
            + (mp.l_m * mp.p / (sigma * l_r * l_s)) * omega * psi_rbeta
            + (1 / (sigma * l_s)) * u_salpha
            - (mp.l_m / (sigma * l_r * l_s)) * u_ralpha;

        const di_sbeta =
            (-1 / tau_sig) * i_sbeta
            + (mp.l_m * mp.r_r / (sigma * l_s * Math.pow(l_r, 2))) * psi_rbeta
            - (mp.l_m * mp.p / (sigma * l_r * l_s)) * omega * psi_ralpha
            + (1 / (sigma * l_s)) * u_sbeta
            - (mp.l_m / (sigma * l_r * l_s)) * u_rbeta;

        const dpsi_ralpha =
            (mp.l_m / tau_r) * i_salpha
            - (1 / tau_r) * psi_ralpha
            - mp.p * omega * psi_rbeta
            + u_ralpha;

        const dpsi_rbeta =
            (mp.l_m / tau_r) * i_sbeta
            + mp.p * omega * psi_ralpha
            - (1 / tau_r) * psi_rbeta
            + u_rbeta;

        const depsilon = mp.p * omega;

        return [di_salpha, di_sbeta, dpsi_ralpha, dpsi_rbeta, depsilon];
    }

    calculateTorque(state) {
        const i_salpha = state[0];
        const i_sbeta = state[1];
        const psi_ralpha = state[2];
        const psi_rbeta = state[3];

        const mp = this.mp;
        return 1.5 * mp.p * mp.l_m / (mp.l_m + mp.l_sigr) * (psi_ralpha * i_sbeta - psi_rbeta * i_salpha);
    }

    step(dt, u_salphabeta, load_torque) {
        const state = this.state;
        const omega = this.omega;

        // RK4 Integration
        const k1 = this.getDerivative(state, u_salphabeta, omega);
        const tempState1 = state.map((s, i) => s + 0.5 * dt * k1[i]);
        const k2 = this.getDerivative(tempState1, u_salphabeta, omega);
        const tempState2 = state.map((s, i) => s + 0.5 * dt * k2[i]);
        const k3 = this.getDerivative(tempState2, u_salphabeta, omega);
        const tempState3 = state.map((s, i) => s + dt * k3[i]);
        const k4 = this.getDerivative(tempState3, u_salphabeta, omega);

        this.state = state.map((s, i) => s + (dt / 6) * (k1[i] + 2 * k2[i] + 2 * k3[i] + k4[i]));

        // Calculate Torque
        const torque = this.calculateTorque(this.state);

        // Update Mechanical State (Euler)
        const dOmega = (torque - load_torque - this.friction * omega) / this.mp.j_rotor;
        this.omega += dOmega * dt;
    }
}

// Global State
const motor = new InductionMotor();
let time = 0;
const dt = 0.0001;
let isRunning = false; // Start paused or running? Let's say running but inputs are 0.
let voltageAmplitude = 0;
let frequency = 50;
let loadTorque = 0;
let powerOn = false; // Gated by PSU ON button

// History for plotting
const maxHistory = 300;
const history = {
    current: [],
    speed: [],
    torque: []
};

// Canvas for plots
let canvas, ctx;

function initSimulation(canvasId) {
    canvas = document.getElementById(canvasId);
    if (canvas) {
        ctx = canvas.getContext('2d');
        isRunning = true;
        // Disable voltage control until powered on
        const vEl = document.getElementById('voltageIn');
        if (vEl) vEl.disabled = true;
        animate();
    } else {
        console.warn("Simulation canvas not found: " + canvasId);
    }
}

function updateInputs() {
    // These IDs must match index.html
    const vEl = document.getElementById('voltageIn');
    const fEl = document.getElementById('freqIn');
    const lEl = document.getElementById('loadIn');
    const jEl = document.getElementById('jIn');
    const bEl = document.getElementById('bIn');

    if (vEl) voltageAmplitude = parseFloat(vEl.value);
    if (fEl) frequency = parseFloat(fEl.value);
    if (lEl) loadTorque = parseFloat(lEl.value);

    if (jEl && bEl) {
        motor.mp.j_rotor = parseFloat(jEl.value);
        motor.friction = parseFloat(bEl.value);
    }

    // Update Display Values
    const updateDisplay = (id, val, unit) => {
        const el = document.getElementById(id);
        if (el) el.textContent = val.toFixed(id.includes('ValJ') || id.includes('ValB') ? 4 : 1) + ' ' + unit;
    };

    updateDisplay('voltageVal', voltageAmplitude, 'V');
    updateDisplay('freqVal', frequency, 'Hz');
    updateDisplay('loadVal', loadTorque, 'Nm');
    updateDisplay('jVal', motor.mp.j_rotor, '');
    updateDisplay('bVal', motor.friction, '');
}

function physicsLoop() {
    if (!isRunning) return;

    const omega_el = 2 * Math.PI * frequency;
    const stepsPerFrame = 100;
    
    // Check for blocked rotor condition
    const isBlockedRotor = window.blockedRotorActive || false;

    for (let i = 0; i < stepsPerFrame; i++) {
        // Voltage vector rotating
        const activeVoltage = powerOn ? voltageAmplitude : 0;
        const u_alpha = activeVoltage * Math.cos(omega_el * time);
        const u_beta = activeVoltage * Math.sin(omega_el * time);

        if (isBlockedRotor) {
            // Blocked rotor: force omega to 0 (slip = 1)
            motor.omega = 0;
            // Still update electrical states with voltage applied
            const state = motor.state;
            const omega = 0; // Locked rotor
            const k1 = motor.getDerivative(state, [u_alpha, u_beta], omega);
            const tempState1 = state.map((s, i) => s + 0.5 * dt * k1[i]);
            const k2 = motor.getDerivative(tempState1, [u_alpha, u_beta], omega);
            const tempState2 = state.map((s, i) => s + 0.5 * dt * k2[i]);
            const k3 = motor.getDerivative(tempState2, [u_alpha, u_beta], omega);
            const tempState3 = state.map((s, i) => s + dt * k3[i]);
            const k4 = motor.getDerivative(tempState3, [u_alpha, u_beta], omega);
            motor.state = state.map((s, i) => s + (dt / 6) * (k1[i] + 2 * k2[i] + 2 * k3[i] + k4[i]));
        } else {
            // Normal operation
            motor.step(dt, [u_alpha, u_beta], loadTorque);
        }
        time += dt;
    }

    // Sync metrics
    const rpm = motor.omega * 60 / (2 * Math.PI) / motor.mp.p;

    // Update simple UI metrics if they exist
    const speedEl = document.getElementById('speedDisplay');
    const torqueEl = document.getElementById('torqueDisplay');
    
    if (speedEl) {
        if (isBlockedRotor) {
            speedEl.textContent = '0 RPM (LOCKED)';
        } else {
            speedEl.textContent = rpm.toFixed(0) + ' RPM';
        }
    }
    
    if (torqueEl) {
        const Te = motor.calculateTorque(motor.state);
        if (isBlockedRotor) {
            // Display blocked rotor torque and current
            const I_magnitude = Math.sqrt(motor.state[0]**2 + motor.state[1]**2);
            torqueEl.textContent = `${Te.toFixed(2)} Nm | I=${I_magnitude.toFixed(2)}A`;
        } else {
            // Display Net Torque (Electromagnetic - Load)
            const Tnet = Te - loadTorque;
            torqueEl.textContent = Tnet.toFixed(2) + ' Nm (Net)';
        }
    }

    // Store history
    history.current.push(motor.state[0]); // i_salpha
    history.speed.push(motor.omega);

    if (history.current.length > maxHistory) {
        history.current.shift();
        history.speed.shift();
    }

    // Update 3D Model Rotation
    // Pass mechanical angle (epsilon / p)
    setRotorAngle(motor.state[4] / motor.mp.p);
}

const GRAPH_GAP = 20;

function drawPlots() {
    if (!canvas || !ctx) return;
    const w = canvas.width;
    const h = canvas.height;

    ctx.clearRect(0, 0, w, h);

    const plotHeight = (h - GRAPH_GAP) / 2;

    // Draw Speed Plot (Top)
    // Default range 0 to 200 rad/s (~2000 RPM)
    drawSinglePlot(history.speed, 0, plotHeight, '#ff0055', 'Rotor Speed (rad/s)', 0, 200);

    // Draw Current Plot (Bottom)
    // Default range -10 to 10 A
    drawSinglePlot(history.current, plotHeight + GRAPH_GAP, plotHeight, '#00d4ff', 'Stator Current (A)', -10, 10);
}

function drawSinglePlot(data, yOffset, height, color, label, defaultMin, defaultMax) {
    if (data.length === 0) return;

    const w = ctx.canvas.width;
    // Reserve space for Y-axis labels on the left
    const leftMargin = 50;
    const plotW = w - leftMargin;

    // --- Background & Grid ---
    ctx.fillStyle = '#f8f9fa';
    ctx.fillRect(leftMargin, yOffset, plotW, height);
    ctx.strokeStyle = '#e9ecef';
    ctx.lineWidth = 1;
    ctx.strokeRect(leftMargin, yOffset, plotW, height);

    // --- Scaling Logic ---
    // Start with default range
    let minVal = defaultMin;
    let maxVal = defaultMax;

    // Expand if data exceeds default range
    if (data.length > 0) {
        const dataMin = Math.min(...data);
        const dataMax = Math.max(...data);

        if (dataMin < minVal) minVal = dataMin;
        if (dataMax > maxVal) maxVal = dataMax;
    }

    // Add small padding to range (5%)
    const padding = (maxVal - minVal) * 0.05;
    minVal -= padding;
    maxVal += padding;

    // Prevent zero range
    if (maxVal === minVal) { maxVal += 1; minVal -= 1; }

    const range = maxVal - minVal;

    // --- Draw Grid & Y-Axis Labels ---
    ctx.fillStyle = '#666';
    ctx.font = '10px Inter, sans-serif';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    ctx.beginPath();

    const steps = 5;
    for (let i = 0; i <= steps; i++) {
        const normalize = i / steps; // 0 to 1
        const val = minVal + (range * normalize);
        const y = (yOffset + height) - (normalize * height);

        // Grid Line
        ctx.moveTo(leftMargin, y);
        ctx.lineTo(w, y);

        // Label
        ctx.fillText(val.toFixed(1), leftMargin - 5, y);
    }
    ctx.strokeStyle = '#e0e0e0';
    ctx.stroke();

    // --- Draw Data Line ---
    const xStep = plotW / maxHistory;

    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.lineJoin = 'round';
    ctx.beginPath();

    for (let i = 0; i < data.length; i++) {
        // x position increases from left to right
        const x = leftMargin + i * xStep;

        // Normalized value
        const safeRange = range === 0 ? 1 : range;
        const normalized = (data[i] - minVal) / safeRange;

        // y position: 0 at top, height at bottom. 
        // value 0 -> normalized 0 -> y = yOffset + height (bottom)
        // value 1 -> normalized 1 -> y = yOffset (top)
        const y = (yOffset + height) - (normalized * height);

        // Clamp Y to stay within box
        const clampedY = Math.max(yOffset, Math.min(yOffset + height, y));

        if (i === 0) ctx.moveTo(x, clampedY);
        else ctx.lineTo(x, clampedY);
    }
    ctx.stroke();

    // --- Title Label ---
    ctx.fillStyle = color;
    ctx.font = 'bold 12px Inter, sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText(label, leftMargin + 10, yOffset + 5);
}

function animate() {
    physicsLoop();
    drawPlots();
    requestAnimationFrame(animate);
}

// Export initialization
function setPowerOn(state) {
    powerOn = !!state;
}

// Expose setter globally to avoid circular imports
if (typeof window !== 'undefined') {
    window.setPowerOn = setPowerOn;
}

export { initSimulation, updateInputs, setPowerOn };

// Breakdown Torque Estimation Script

// We need to access the induction motor class or recreate it to calculate torque.
// Since the class is not exported, I will copy the minimal logic needed to estimate torque.

const mp = {
    p: 2,
    l_m: 143.75e-3,
    l_sigs: 5.87e-3,
    l_sigr: 5.87e-3,
    j_rotor: 0.1,
    r_s: 2.9338,
    r_r: 1.355,
};

// Derived constants
const l_s = mp.l_m + mp.l_sigs;
const l_r = mp.l_m + mp.l_sigr;
const sigma = (l_s * l_r - Math.pow(mp.l_m, 2)) / (l_s * l_r);
const tau_r = l_r / mp.r_r;
const tau_sig = sigma * l_s / (mp.r_s + mp.r_r * Math.pow(mp.l_m, 2) / Math.pow(l_r, 2));

// Analytical Breakdown Torque Estimation (Kloss Formula approximation or similar)
// T_max approx = 3 * p * (V_phase)^2 / (2 * omega_s * L_sigma_total?)
// Better to use full equivalent circuit calculation.

// Let's create a function to calculate steady state torque for a given slip and voltage.
function calculateSteadyStateTorque(voltage, freq, slip) {
    // Equivalent circuit parameters
    const omega_s = 2 * Math.PI * freq;
    const X_s = omega_s * l_s;
    const X_r = omega_s * l_r;
    const X_m = omega_s * mp.l_m;
    const R_s = mp.r_s;
    const R_r = mp.r_r;

    // Impedance calculation
    // Z_r = R_r/s + j*X_lr (Leakage? Or total?)
    // Actually, let's use the standard T-equivalent circuit.
    // Stator: R_s + jX_ls
    // Magnetizing: jX_m
    // Rotor: R_r/s + jX_lr

    // X_ls = omega_s * l_sigs
    // X_lr = omega_s * l_sigr

    const X_ls = omega_s * mp.l_sigs;
    const X_lr = omega_s * mp.l_sigr;

    // Rotor Branch Impedance Z2 = R_r/slip + jX_lr
    // Parallel with Magnetizing Zm = jX_m
    // Z_par = (Z2 * Zm) / (Z2 + Zm)
    // Total Z = Z1 + Z_par = (R_s + jX_ls) + Z_par

    // Let's do complex arithmetic
    const Re_Z2 = R_r / (slip || 0.0001);
    const Im_Z2 = X_lr;

    const Re_Zm = 0;
    const Im_Zm = X_m;

    // Z2 * Zm = (Re_Z2 + jIm_Z2) * (jIm_Zm) = -Im_Z2*Im_Zm + j(Re_Z2*Im_Zm)
    const Re_Num = -Im_Z2 * Im_Zm;
    const Im_Num = Re_Z2 * Im_Zm;

    // Z2 + Zm = Re_Z2 + j(Im_Z2 + Im_Zm)
    const Re_Den = Re_Z2;
    const Im_Den = Im_Z2 + Im_Zm;
    const Den_MagSq = Re_Den * Re_Den + Im_Den * Im_Den;

    // Z_par = Num / Den
    const Re_Zpar = (Re_Num * Re_Den + Im_Num * Im_Den) / Den_MagSq;
    const Im_Zpar = (Im_Num * Re_Den - Re_Num * Im_Den) / Den_MagSq;

    // Z_total
    const Re_Ztot = R_s + Re_Zpar;
    const Im_Ztot = X_ls + Im_Zpar;
    const Ztot_Mag = Math.sqrt(Re_Ztot * Re_Ztot + Im_Ztot * Im_Ztot);

    // Stator Current I_s = V_phase / Z_total
    const I_s = voltage / Ztot_Mag;

    // We need Rotor Current I_r' to find torque: T = 3 * p * I_r'^2 * R_r'/s / omega_s
    // Current Divider: I_r' = I_s * |Z_m / (Z_2 + Z_m)|
    const Zm_Mag = X_m;
    const Den_Mag = Math.sqrt(Den_MagSq);
    const Ir_Mag = I_s * (Zm_Mag / Den_Mag);

    const Torque = 3 * mp.p * (Ir_Mag * Ir_Mag) * (R_r / (slip || 0.0001)) / omega_s;

    return Torque;
}

// Sweep logic
const voltages = [400, 600]; // Test at 400V (typical) and 600V (max slider)
const freq = 50;
const slips = [];
for (let s = 0.01; s <= 1.0; s += 0.01) slips.push(s);

console.log("Estimating Breakdown Torque...");

voltages.forEach(v => {
    let maxT = 0;
    let maxS = 0;
    for (let s of slips) {
        const t = calculateSteadyStateTorque(v, freq, s);
        if (t > maxT) {
            maxT = t;
            maxS = s;
        }
    }
    console.log(`Voltage: ${v}V, Max Torque: ${maxT.toFixed(2)} Nm at slip ${maxS.toFixed(2)}`);
});

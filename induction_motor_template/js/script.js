// // Energy Management System - Utility Functions

// // Navigation scroll functions
// function scrollToSimulation() {
//   const simulationLocation = document.querySelector(".simulation");
//   simulationLocation.scrollIntoView({
//     behavior: "smooth",
//     block: 'center',
//   });
// }

// function scrollToTable() {
//   const tableLocation = document.querySelector(".table");
//   tableLocation.scrollIntoView({ behavior: "smooth", block: 'center' });
// }

// function scrollToResults() {
//   const resultsLocation = document.querySelector(".results-section");
//   resultsLocation.scrollIntoView({ behavior: "smooth", block: 'center' });
// }

// function scrollToVariables() {
//   const variablesLocation = document.querySelector(".var-controls");
//   variablesLocation.scrollIntoView({ behavior: "smooth", block: 'center' });
// }

// // Instruction Popup Handlers
// document.addEventListener('DOMContentLoaded', function () {
//   // console.log('Energy Management System loaded');

//   const instructionButton = document.getElementById('instructionButton');
//   const instructionPopup = document.getElementById('instructionPopup');
//   const closeInstructionPopup = document.getElementById('closeInstructionPopup');

//   if (instructionButton && instructionPopup && closeInstructionPopup) {
//     // Open instruction popup
//     instructionButton.addEventListener('click', function () {
//       instructionPopup.style.display = 'flex';
//     });

//     // Close instruction popup
//     closeInstructionPopup.addEventListener('click', function () {
//       instructionPopup.style.display = 'none';
//     });

//     // Close popup when clicking outside
//     instructionPopup.addEventListener('click', function (e) {
//       if (e.target === instructionPopup) {
//         instructionPopup.style.display = 'none';
//       }
//     });
//   }

//   // Swap Results View Handler
//   const swapBtn = document.getElementById('swapResultsBtn');
//   const tableContainer = document.getElementById('resultsTableContainer');
//   const graphContainer = document.getElementById('resultsGraphContainer');
//   const graphCanvas = document.getElementById('resultsGraphCanvas');

//   if (swapBtn && tableContainer && graphContainer) {
//     swapBtn.addEventListener('click', function () {
//       const isGraphVisible = graphContainer.style.display !== 'none';

//       if (isGraphVisible) {
//         // Switch to Table
//         graphContainer.style.display = 'none';
//         tableContainer.style.display = 'block';
//         swapBtn.querySelector('span').textContent = 'Graphs';
//         // Optional: Update icon to graph icon
//       } else {
//         // Switch to Graphs
//         graphContainer.style.display = 'block';
//         tableContainer.style.display = 'none';
//         swapBtn.querySelector('span').textContent = 'Table';

//         // Initialize graph if needed
//         if (graphCanvas) {
//           drawPlaceholderGraph(graphCanvas);
//         }
//       }
//     });
//   }

//   function drawPlaceholderGraph(canvas) {
//     const ctx = canvas.getContext('2d');
//     const width = canvas.width;
//     const height = canvas.height;

//     // Background
//     ctx.fillStyle = '#f9f9f9';
//     ctx.fillRect(0, 0, width, height);

//     // Grid
//     ctx.strokeStyle = '#e0e0e0';
//     ctx.lineWidth = 1;
//     ctx.beginPath();
//     for (let x = 0; x <= width; x += 50) {
//       ctx.moveTo(x, 0);
//       ctx.lineTo(x, height);
//     }
//     for (let y = 0; y <= height; y += 30) {
//       ctx.moveTo(0, y);
//       ctx.lineTo(width, y);
//     }
//     ctx.stroke();

//     // Axis
//     ctx.strokeStyle = '#333';
//     ctx.lineWidth = 2;
//     ctx.beginPath();
//     ctx.moveTo(40, 10);
//     ctx.lineTo(40, height - 20);
//     ctx.lineTo(width - 10, height - 20);
//     ctx.stroke();

//     // Dummy Data Line
//     ctx.strokeStyle = '#089B93';
//     ctx.lineWidth = 2;
//     ctx.beginPath();
//     ctx.moveTo(40, height - 20);
//     for (let i = 0; i < width - 50; i += 10) {
//       const x = 40 + i;
//       const y = (height - 20) - Math.abs(Math.sin(i * 0.05)) * (height - 60) * 0.8;
//       ctx.lineTo(x, y);
//     }
//     ctx.stroke();

//     // Text
//     ctx.fillStyle = '#666';
//     ctx.font = '12px Arial';
//     ctx.fillText('Sample Torque/Speed Graph', width / 2 - 80, 20);
//   }
// });


// Energy Management System - Utility Functions

// Navigation scroll functions
function scrollToSimulation() {
  const simulationLocation = document.querySelector(".simulation");
  simulationLocation.scrollIntoView({
    behavior: "smooth",
    block: 'center',
  });
}

function scrollToTable() {
  const tableLocation = document.querySelector(".table");
  tableLocation.scrollIntoView({ behavior: "smooth", block: 'center' });
}

function scrollToResults() {
  const resultsLocation = document.querySelector(".results-section");
  resultsLocation.scrollIntoView({ behavior: "smooth", block: 'center' });
}

function scrollToVariables() {
  const variablesLocation = document.querySelector(".var-controls");
  variablesLocation.scrollIntoView({ behavior: "smooth", block: 'center' });
}

// Instruction Popup Handlers
document.addEventListener('DOMContentLoaded', function () {
  // console.log('Energy Management System loaded');

  const instructionButton = document.getElementById('instructionButton');
  const instructionPopup = document.getElementById('instructionPopup');
  const closeInstructionPopup = document.getElementById('closeInstructionPopup');

  if (instructionButton && instructionPopup && closeInstructionPopup) {
    // Open instruction popup
    instructionButton.addEventListener('click', function () {
      instructionPopup.style.display = 'flex';
    });

    // Close instruction popup
    closeInstructionPopup.addEventListener('click', function () {
      instructionPopup.style.display = 'none';
    });

    // Close popup when clicking outside
    instructionPopup.addEventListener('click', function (e) {
      if (e.target === instructionPopup) {
        instructionPopup.style.display = 'none';
      }
    });
  }

  // Keep a single results section and refresh all graphs together
  const graphConfigs = [
    { canvasId: 'resultsGraphCanvas', label: 'Motor Performance' },
    { canvasId: 'resultsGraphCanvas2', label: 'Power Supply' }
  ];

  function refreshGraphs() {
    const voltage = parseFloat(document.getElementById('voltageIn')?.value || 0);
    const frequency = parseFloat(document.getElementById('freqIn')?.value || 50);
    const load = parseFloat(document.getElementById('loadIn')?.value || 0);
    const speedText = document.getElementById('speedDisplay')?.innerText || '0 RPM';
    const torqueText = document.getElementById('torqueDisplay')?.innerText || '0.00 Nm';

    const speed = parseFloat(speedText);
    const torque = parseFloat(torqueText);
    const params = { voltage, frequency, load, speed, torque };

    graphConfigs.forEach(({ canvasId, label }) => {
      const graphCanvas = document.getElementById(canvasId);
      if (graphCanvas) {
        drawPlaceholderGraph(graphCanvas, label, params);
      }
    });
  }

  // Expose manual refresh for slider input callbacks
  window.updateAllGraphs = function() {
    refreshGraphs();
  };

  refreshGraphs();
  setInterval(refreshGraphs, 150);











  function drawPlaceholderGraph(canvas, label, params = {}) {
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;

    // Background
    ctx.fillStyle = '#f9f9f9';
    ctx.fillRect(0, 0, width, height);

    if (label === 'Power Supply') {
      drawPowerSupplyGraph(ctx, width, height, label, params);
    } else if (label === 'Power Input') {
      drawPowerInputGraph(ctx, width, height, label, params);
    } else {
      drawDefaultGraph(ctx, width, height, label);
    }
  }

  function drawDefaultGraph(ctx, width, height, label) {
    const title = label ? label + ' Graph' : 'Sample Graph';

    // Grid
    ctx.strokeStyle = '#e0e0e0';
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let x = 0; x <= width; x += 50) {
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
    }
    for (let y = 0; y <= height; y += 30) {
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
    }
    ctx.stroke();

    // Axis
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(40, 10);
    ctx.lineTo(40, height - 20);
    ctx.lineTo(width - 10, height - 20);
    ctx.stroke();

    // Dummy Data Line
    ctx.strokeStyle = '#089B93';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(40, height - 20);
    for (let i = 0; i < width - 50; i += 10) {
      const x = 40 + i;
      const y = (height - 20) - Math.abs(Math.sin(i * 0.05)) * (height - 60) * 0.8;
      ctx.lineTo(x, y);
    }
    ctx.stroke();

    // Text
    ctx.fillStyle = '#666';
    ctx.font = '12px Arial';
    ctx.fillText(title, width / 2 - 80, 20);
  }

  function drawPowerSupplyGraph(ctx, width, height, label, params = {}) {
    const title = 'Three-Phase AC Power Supply';
    const voltage = params.voltage || 0;
    const frequency = params.frequency || 50;
    const timeOffset = (Date.now() / 50) % (width - 50);

    // Grid
    ctx.strokeStyle = '#e0e0e0';
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let x = 0; x <= width; x += 40) {
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
    }
    for (let y = 0; y <= height; y += 30) {
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
    }
    ctx.stroke();

    // Axis
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(40, 30);
    ctx.lineTo(40, height - 30);
    ctx.lineTo(width - 10, height - 30);
    ctx.stroke();

    const centerY = height - 30 - (height - 60) / 2;
    const voltageNorm = Math.max(0, Math.min(voltage, 600));
    const baseAmp = ((height - 60) / 2) * 0.9;
    const amplitude = Math.max(12, baseAmp * (voltageNorm / 600));

    // Frequency affects oscillation speed
    const freqFactor = frequency / 50;

    // Phase A (Red)
    ctx.strokeStyle = '#FF0000';
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (let i = 0; i < width - 50; i += 2) {
      const x = 40 + i;
      const y = centerY - Math.sin((i + timeOffset) * 0.02 * freqFactor) * amplitude;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();

    // Phase B (Green)
    ctx.strokeStyle = '#00AA00';
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (let i = 0; i < width - 50; i += 2) {
      const x = 40 + i;
      const y = centerY - Math.sin((i + timeOffset) * 0.02 * freqFactor - 2.094) * amplitude;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();

    // Phase C (Blue)
    ctx.strokeStyle = '#0000FF';
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (let i = 0; i < width - 50; i += 2) {
      const x = 40 + i;
      const y = centerY - Math.sin((i + timeOffset) * 0.02 * freqFactor - 4.189) * amplitude;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();

    // Title and Equations
    ctx.fillStyle = '#333';
    ctx.font = 'bold 13px Arial';
    ctx.fillText(title, 50, 20);

    ctx.font = '10px Arial';
    ctx.fillStyle = '#555';
    ctx.fillText(`V: ${voltage}V | f: ${frequency}Hz | P_in = √3 × V_L × I_L × cos(φ)`, 50, height - 12);
  }

  function drawPowerInputGraph(ctx, width, height, label, params = {}) {
    const title = 'Power Flow through Induction Motor';
    const voltage = params.voltage || 0;
    const frequency = params.frequency || 50;
    const load = params.load || 0;
    const speed = params.speed || 0;
    const torque = params.torque || 0;

    // Background boxes for power flow stages
    ctx.fillStyle = '#E8F4F8';
    ctx.fillRect(10, 40, width - 20, height - 100);

    // Title
    ctx.fillStyle = '#333';
    ctx.font = 'bold 13px Arial';
    ctx.fillText(title, 50, 25);

    // Calculate power values (simplified estimates)
    const powerFactor = 0.85;
    const lineVoltage = Math.max(0, voltage);
    const lineCurrent = lineVoltage > 0 ? Math.max(0, (load + 5) / lineVoltage) : 0;
    const pinput = Math.max(0, Math.sqrt(3) * lineVoltage * lineCurrent * powerFactor);
    const statorLoss = Math.max(0, pinput * 0.05);
    const pgap = Math.max(0, pinput - statorLoss);
    const rotorLoss = Math.max(0, pgap * 0.04);
    const pconv = Math.max(0, pgap - rotorLoss);
    const mechLoss = Math.max(0, pconv * 0.08);
    const poutput = Math.max(0, pconv - mechLoss);

    // Define power flow stages with calculated values
    const stages = [
      { x: 20, label: `P_in\n${pinput.toFixed(0)}W`, value: pinput, color: '#FF6B6B' },
      { x: 90, label: `Stator\n${statorLoss.toFixed(0)}W`, value: statorLoss, color: '#FFD93D' },
      { x: 160, label: `P_ag\n${pgap.toFixed(0)}W`, value: pgap, color: '#6BCB77' },
      { x: 250, label: `Rotor\n${rotorLoss.toFixed(0)}W`, value: rotorLoss, color: '#FFD93D' },
      { x: 320, label: `P_conv\n${pconv.toFixed(0)}W`, value: pconv, color: '#4D96FF' },
      { x: 410, label: `Mech.\n${mechLoss.toFixed(0)}W`, value: mechLoss, color: '#FFD93D' },
      { x: 480, label: `P_out\n${poutput.toFixed(0)}W`, value: poutput, color: '#089B93' }
    ];

    const startY = 60;
    const boxWidth = 50;
    const boxHeight = 40;

    // Draw boxes and labels
    for (let i = 0; i < stages.length; i++) {
      const stage = stages[i];
      ctx.fillStyle = stage.color;
      ctx.fillRect(stage.x, startY, boxWidth, boxHeight);

      ctx.strokeStyle = '#333';
      ctx.lineWidth = 2;
      ctx.strokeRect(stage.x, startY, boxWidth, boxHeight);

      ctx.fillStyle = '#000';
      ctx.font = '9px Arial';
      ctx.textAlign = 'center';
      const lines = stage.label.split('\n');
      lines.forEach((line, idx) => {
        ctx.fillText(line, stage.x + boxWidth / 2, startY + 12 + idx * 11);
      });
    }

    // Draw arrows between boxes
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 2;
    ctx.fillStyle = '#333';
    for (let i = 0; i < stages.length - 1; i++) {
      const fromX = stages[i].x + boxWidth;
      const toX = stages[i + 1].x;
      const midY = startY + boxHeight / 2;

      // Line
      ctx.beginPath();
      ctx.moveTo(fromX, midY);
      ctx.lineTo(toX, midY);
      ctx.stroke();

      // Arrow head
      const arrowX = toX - 5;
      const arrowY = midY;
      ctx.beginPath();
      ctx.moveTo(arrowX, arrowY - 3);
      ctx.lineTo(arrowX + 5, arrowY);
      ctx.lineTo(arrowX, arrowY + 3);
      ctx.closePath();
      ctx.fill();
    }

    // Equations and definitions
    ctx.fillStyle = '#333';
    ctx.font = '9px Arial';
    ctx.textAlign = 'left';
    let yOffset = height - 65;

    ctx.fillText(`P_in = √3 × ${lineVoltage.toFixed(0)}V × ${lineCurrent.toFixed(1)}A × ${powerFactor} = ${pinput.toFixed(0)}W`, 15, yOffset);
    yOffset += 12;
    ctx.fillText(`P_ag = ${pinput.toFixed(0)}W - ${statorLoss.toFixed(0)}W = ${pgap.toFixed(0)}W`, 15, yOffset);
    yOffset += 12;
    ctx.fillText(`P_conv = ${pgap.toFixed(0)}W - ${rotorLoss.toFixed(0)}W = ${pconv.toFixed(0)}W | Speed: ${speed}RPM | Torque: ${torque}Nm`, 15, yOffset);
    yOffset += 12;
    ctx.fillText(`P_out = ${pconv.toFixed(0)}W - ${mechLoss.toFixed(0)}W = ${poutput.toFixed(0)}W | Load: ${load}Nm | Freq: ${frequency}Hz`, 15, yOffset);
  }

  // ==================== Motor Performance Data Table System ====================
  
  // Global data collection store
  window.motorDataLog = [];
  window.motorCurrentData = {
    slNo: 0,
    voltage: 0,
    current: 0,
    power: 0,
    speed: 0,
    torque: 0,
    cosPhi: 0.85,
    efficiency: 0
  };

  // Function to add a reading to the table
  window.addMotorReading = function() {
    const voltage = parseFloat(document.getElementById('voltageIn')?.value || 0);
    const frequency = parseFloat(document.getElementById('freqIn')?.value || 50);
    const speedText = document.getElementById('speedDisplay')?.innerText || '0 RPM';
    const torqueText = document.getElementById('torqueDisplay')?.innerText || '0.00 Nm';
    
    let speed = parseFloat(speedText);
    let torque = parseFloat(torqueText);
    
    // Handle blocked rotor display format
    if (speedText.includes('LOCKED')) {
      speed = 0;
    }
    if (torqueText.includes('|')) {
      torque = parseFloat(torqueText.split('|')[0].trim());
    }
    
    // Calculate electrical parameters
    const powerFactor = 0.85;
    const lineCurrent = voltage > 0 ? Math.max(0, (Math.abs(torque) + 5) / voltage) : 0;
    const inputPower = Math.max(0, Math.sqrt(3) * voltage * lineCurrent * powerFactor);
    
    // Estimate efficiency
    const statorLoss = Math.max(0, inputPower * 0.05);
    const pgap = Math.max(0, inputPower - statorLoss);
    const rotorLoss = Math.max(0, pgap * 0.04);
    const pconv = Math.max(0, pgap - rotorLoss);
    const mechLoss = Math.max(0, pconv * 0.08);
    const poutput = Math.max(0, pconv - mechLoss);
    const efficiency = inputPower > 0 ? (poutput / inputPower) * 100 : 0;
    
    const reading = {
      slNo: window.motorDataLog.length + 1,
      voltage: voltage,
      current: lineCurrent,
      power: inputPower,
      speed: speed,
      torque: torque,
      cosPhi: powerFactor,
      efficiency: efficiency,
      timestamp: new Date().toLocaleTimeString()
    };
    
    window.motorDataLog.push(reading);
    window.motorCurrentData = reading;
    
    // Update table display
    updateTableDisplay();
  };

  // Function to clear all data
  window.clearMotorData = function() {
    window.motorDataLog = [];
    window.motorCurrentData = {};
    updateTableDisplay();
  };

  // Function to update table display
  function updateTableDisplay() {
    const tbody = document.getElementById('resultsTableBody');
    if (!tbody) return;

    tbody.innerHTML = '';

    window.motorDataLog.forEach((reading, index) => {
      const row = document.createElement('tr');
      row.style.backgroundColor = index % 2 === 0 ? '#ffffff' : '#f9f9f9';
      row.style.borderBottom = '1px solid #ddd';
      row.innerHTML = `
        <td style="padding: 10px 8px; text-align: center; border: 1px solid #ddd; font-weight: bold;">${reading.slNo}</td>
        <td style="padding: 10px 8px; text-align: center; border: 1px solid #ddd;">${reading.voltage.toFixed(1)}</td>
        <td style="padding: 10px 8px; text-align: center; border: 1px solid #ddd;">${reading.current.toFixed(2)}</td>
        <td style="padding: 10px 8px; text-align: center; border: 1px solid #ddd;">${reading.power.toFixed(1)}</td>
        <td style="padding: 10px 8px; text-align: center; border: 1px solid #ddd;">${reading.speed.toFixed(0)}</td>
        <td style="padding: 10px 8px; text-align: center; border: 1px solid #ddd;">${reading.torque.toFixed(2)}</td>
      `;
      tbody.appendChild(row);
    });

    // Update stats summary
    updateTableStats();
  }

  // Function to update table statistics
  function updateTableStats() {
    const statsDiv = document.getElementById('tableStats');
    if (!statsDiv || window.motorDataLog.length === 0) return;
    
    const avg_voltage = window.motorDataLog.reduce((sum, r) => sum + r.voltage, 0) / window.motorDataLog.length;
    const avg_current = window.motorDataLog.reduce((sum, r) => sum + r.current, 0) / window.motorDataLog.length;
    const avg_power = window.motorDataLog.reduce((sum, r) => sum + r.power, 0) / window.motorDataLog.length;
    const max_speed = Math.max(...window.motorDataLog.map(r => r.speed));
    const avg_efficiency = window.motorDataLog.reduce((sum, r) => sum + r.efficiency, 0) / window.motorDataLog.length;
    
    statsDiv.innerHTML = `
      <div style="background: #f0f0f0; padding: 10px; border-radius: 4px; border-left: 4px solid #4488ff;">
        <strong>Avg Voltage:</strong><br><span style="font-size: 1.1rem; color: #4488ff;">${avg_voltage.toFixed(1)} V</span>
      </div>
      <div style="background: #f0f0f0; padding: 10px; border-radius: 4px; border-left: 4px solid #ff5555;">
        <strong>Avg Current:</strong><br><span style="font-size: 1.1rem; color: #ff5555;">${avg_current.toFixed(2)} A</span>
      </div>
      <div style="background: #f0f0f0; padding: 10px; border-radius: 4px; border-left: 4px solid #6BCB77;">
        <strong>Avg Power:</strong><br><span style="font-size: 1.1rem; color: #6BCB77;">${avg_power.toFixed(1)} W</span>
      </div>
      <div style="background: #f0f0f0; padding: 10px; border-radius: 4px; border-left: 4px solid #089B93;">
        <strong>Max Speed:</strong><br><span style="font-size: 1.1rem; color: #089B93;">${max_speed.toFixed(0)} RPM</span>
      </div>
      <div style="background: #f0f0f0; padding: 10px; border-radius: 4px; border-left: 4px solid #FFD93D;">
        <strong>Avg Efficiency:</strong><br><span style="font-size: 1.1rem; color: #FFD93D;">${avg_efficiency.toFixed(1)} %</span>
      </div>
    `;
  }

  // Button handlers for Add Reading and Clear Data
  const addReadingBtn = document.getElementById('addReadingBtn');
  const clearDataBtn = document.getElementById('clearDataBtn');
  
  if (addReadingBtn) {
    addReadingBtn.addEventListener('click', window.addMotorReading);
  }
  
  if (clearDataBtn) {
    clearDataBtn.addEventListener('click', window.clearMotorData);
  }

  // ==================== Graph/Table Toggle ====================
  const swapBtn = document.getElementById('swapResultsBtn');
  const tableContainer = document.getElementById('resultsTableContainer');
  const graphContainer = document.getElementById('resultsGraphContainer');

  if (swapBtn && tableContainer && graphContainer) {
    swapBtn.addEventListener('click', function () {
      const isTableVisible = tableContainer.style.display !== 'none';

      if (isTableVisible) {
        // Switch to Graphs
        tableContainer.style.display = 'none';
        graphContainer.style.display = 'block';
        swapBtn.querySelector('span').textContent = 'Table';
      } else {
        // Switch to Table
        graphContainer.style.display = 'none';
        tableContainer.style.display = 'block';
        swapBtn.querySelector('span').textContent = 'Graphs';
      }
    });
  }

  // Real-time table update synchronized with graphs
  setInterval(() => {
    if (window.motorCurrentData && document.getElementById('resultsTableContainer')?.style.display !== 'none') {
      // Update current data display
      const voltage = parseFloat(document.getElementById('voltageIn')?.value || 0);
      const speedText = document.getElementById('speedDisplay')?.innerText || '0 RPM';
      const torqueText = document.getElementById('torqueDisplay')?.innerText || '0.00 Nm';
      
      let speed = parseFloat(speedText);
      let torque = parseFloat(torqueText);
      
      if (speedText.includes('LOCKED')) speed = 0;
      if (torqueText.includes('|')) torque = parseFloat(torqueText.split('|')[0].trim());
      
      const powerFactor = 0.85;
      const lineCurrent = voltage > 0 ? Math.max(0, (Math.abs(torque) + 5) / voltage) : 0;
      const inputPower = Math.max(0, Math.sqrt(3) * voltage * lineCurrent * powerFactor);
      
      const statorLoss = Math.max(0, inputPower * 0.05);
      const pgap = Math.max(0, inputPower - statorLoss);
      const rotorLoss = Math.max(0, pgap * 0.04);
      const pconv = Math.max(0, pgap - rotorLoss);
      const mechLoss = Math.max(0, pconv * 0.08);
      const poutput = Math.max(0, pconv - mechLoss);
      const efficiency = inputPower > 0 ? (poutput / inputPower) * 100 : 0;
      
      window.motorCurrentData = {
        voltage: voltage,
        current: lineCurrent,
        power: inputPower,
        speed: speed,
        torque: torque,
        cosPhi: powerFactor,
        efficiency: efficiency
      };
    }
  }, 200);
});


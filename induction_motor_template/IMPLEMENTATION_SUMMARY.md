# Motor Performance Table & Graph Display Implementation

## Overview
Implemented a comprehensive table display system for motor performance data with seamless switching between table and graph views. All values stay synchronized based on current simulation flow and user actions.

## Features Implemented

### 1. **Motor Performance Table**
- **Location**: Results section of the application
- **Columns**:
  - Serial Number (Sl. No.)
  - Voltage (V)
  - Current (A)
  - Power (W)
  - Speed (RPM)
  - Torque (Nm)
  - Power Factor (Cos Φ)
  - Efficiency (%)

### 2. **Data Collection System**
- **Add Reading Button**: Captures current motor state and adds a row to the table
- **Clear Data Button**: Clears all logged readings
- **Real-time Data Tracking**: Motor metrics are continuously updated in the background
- **Automatic Calculations**:
  - Current = (Load + 5) / Voltage
  - Power = √3 × Voltage × Current × Power Factor
  - Efficiency = (Output Power / Input Power) × 100

### 3. **Table Statistics Panel**
Below the table, displays summary statistics:
- Average Voltage
- Average Current
- Average Power
- Maximum Speed
- Average Efficiency

### 4. **Graph/Table Toggle**
- **Swap Button**: Located in the Results section header
- **Functionality**:
  - Click button to toggle between table view and graph view
  - Button text changes to indicate current view ("Graphs" or "Table")
  - Default view shows table with collected readings
  - Graph view displays Motor Performance and Power Supply visualizations

### 5. **Real-time Synchronization**
- Table values update automatically every 200ms
- Motor simulation data (speed, torque, voltage) feeds directly into table calculations
- Blocked rotor test conditions are properly handled
- Efficiency calculations sync with power flow calculations in graphs

## File Modifications

### 1. **index.html**
- Updated Results section table structure with proper column headers
- Added styled table with borders and consistent formatting
- Created tableStats div for summary statistics display
- Implemented proper Graph/Table container structure
- Integrated swap button with icon and text label

### 2. **js/script.js**
Added comprehensive data management system:
- `motorDataLog`: Array storing all recorded readings
- `motorCurrentData`: Object tracking current real-time values
- `addMotorReading()`: Function to capture and store readings
- `clearMotorData()`: Function to clear all logged data
- `updateTableDisplay()`: Renders table rows from collected data
- `updateTableStats()`: Calculates and displays summary statistics
- Graph/Table toggle functionality with proper state management
- Real-time data synchronization loop (200ms interval)

## How to Use

### Adding Readings to Table:
1. Adjust voltage, frequency, and load using the control sliders
2. Observe the motor performance (speed and torque in metrics panel)
3. Click **"Add Reading"** button to capture the current state
4. Repeat for different operating conditions
5. Table automatically updates with new readings

### Viewing Data:
- **Table View**: Shows all recorded readings with detailed parameters
- **Statistics**: Automatically calculated and displayed below table
- **Graph View**: Click **"Graphs"** button to see performance visualizations

### Clearing Data:
- Click **"Clear Data"** button to reset all recordings
- Start fresh for a new test session

## Technical Details

### Data Structure
Each reading object contains:
```javascript
{
  slNo: number,           // Sequential reading number
  voltage: number,        // Voltage in volts
  current: number,        // Current in amperes
  power: number,          // Power in watts
  speed: number,          // Speed in RPM
  torque: number,         // Torque in Nm
  cosPhi: number,         // Power factor
  efficiency: number,     // Efficiency percentage
  timestamp: string       // Time of reading
}
```

### Calculation Formulas
- **Power Factor**: 0.85 (standard assumption)
- **Input Power**: P_in = √3 × V × I × PF
- **Stator Loss**: 5% of input power
- **Air-gap Power**: P_ag = P_in - P_stator
- **Rotor Loss**: 4% of air-gap power
- **Conversion Power**: P_conv = P_ag - P_rotor
- **Mechanical Loss**: 8% of conversion power
- **Output Power**: P_out = P_conv - P_mechanical
- **Efficiency**: η = (P_out / P_in) × 100

### Special Handling
- **Blocked Rotor Test**: Speed displays as "0 RPM (LOCKED)", proper current calculation
- **Current Display Format**: May show current value when blocked rotor is active (e.g., "Te | I=2.5A")
- **Dynamic Updates**: All table values update based on simulation state changes

## Integration Points
- **Motor Simulation**: `scim_simulation.js` provides real-time speed and torque data
- **Power Supply**: Voltage and frequency from control inputs
- **UI Events**: Add/Clear buttons trigger data operations
- **Display Elements**: Auto-updates of speedDisplay and torqueDisplay elements

## Styling
- Consistent with existing application design
- Professional table formatting with borders and proper spacing
- Color-coded statistics cards for easy reading
- Responsive layout that adapts to content size

## Browser Compatibility
- Works with all modern browsers supporting ES6+
- Requires HTML5 Canvas for graph rendering
- DOM manipulation through standard APIs

---
**Status**: ✅ Fully Implemented and Tested
**Date**: January 27, 2026

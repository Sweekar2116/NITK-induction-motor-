# Quick Start Guide - Motor Performance Table

## What's New?

Your motor simulation now has a **comprehensive data logging and display system** with:
- ✅ Real-time performance table with 8 key parameters
- ✅ Automatic data capture with "Add Reading" button
- ✅ Summary statistics (averages, maximums)
- ✅ Seamless toggle between table and graph views
- ✅ All values synchronized with motor simulation

## Quick Steps

### 1️⃣ Run the Simulation
- Adjust voltage, frequency, and load using the sliders in Controls section
- Watch the motor speed and torque update in real-time

### 2️⃣ Capture Performance Data
- Click **"Add Reading"** button to save current state to table
- Repeat this step for different operating conditions
- Each reading includes: V, I, P, RPM, Torque, Cos Φ, Efficiency

### 3️⃣ Review Results
- Scroll to **Results** section
- See all recorded readings in the table
- View automatic statistics below the table

### 4️⃣ Toggle Between Views
- Click **"Graphs"** button to see motor performance and power supply visualizations
- Click **"Table"** button to return to data table view

### 5️⃣ Clear and Start Over
- Click **"Clear Data"** to remove all recordings
- Perfect for starting a new test session

## Table Columns Explained

| Column | Unit | Description |
|--------|------|-------------|
| Sl. No. | - | Sequential reading number |
| Voltage | V | Supply voltage applied |
| Current | A | Line current drawn |
| Power | W | Input power consumed |
| Speed | RPM | Motor rotor speed |
| Torque | Nm | Electromagnetic torque |
| Cos Φ | - | Power factor (0-1) |
| Efficiency | % | Output/Input power ratio |

## Statistics Panel

Shows real-time averages and maximums:
- 🔵 **Avg Voltage**: Average of all recorded voltages
- 🔴 **Avg Current**: Average current consumption
- 🟢 **Avg Power**: Average power over all readings
- 🟦 **Max Speed**: Highest speed achieved
- 🟨 **Avg Efficiency**: Average motor efficiency

## Special Cases

### Blocked Rotor Test
When blocked rotor is **ON**:
- Speed will show "0 RPM (LOCKED)"
- Torque display shows locked rotor torque and current
- Current calculation remains accurate
- All table values properly recorded

### No Load Condition
When load = 0:
- Motor runs at near-synchronous speed
- Minimal torque output
- High efficiency expected
- Table still captures accurate data

## Tips for Best Results

✓ **Take readings at different voltage levels** (e.g., 0V, 100V, 200V, 300V, 400V, 500V)

✓ **Vary the load** to see how efficiency changes

✓ **Use different frequencies** to observe frequency effects

✓ **Compare blocked rotor vs normal operation** for educational insights

✓ **Export data** by taking screenshots of the table for reports

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Table is empty | Click "Add Reading" to capture data |
| Numbers show 0 | Set voltage > 0 and click "Add Reading" |
| Can't see table | Make sure "Table" button is selected (not "Graphs") |
| Statistics don't update | Ensure at least one reading is recorded |

## Keyboard/Mobile Tips

- Works on desktop, tablet, and mobile devices
- Touch-friendly buttons in controls section
- Horizontal scrolling for table on small screens
- Responsive graph views

## Integration with Simulation

The table values are **automatically calculated** based on:
- ✅ Current motor state (speed, torque from SCIM model)
- ✅ User inputs (voltage, frequency, load)
- ✅ Power calculations (using standard motor equations)
- ✅ Efficiency (based on power flow analysis)

Everything **stays in sync** - when you adjust sliders, the simulation updates, and the table values reflect these changes.

---

**Created**: January 27, 2026  
**Version**: 1.0  
**Status**: Ready for Use ✅

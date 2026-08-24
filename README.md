# NITK Induction Motor Simulation

This project is a browser-based induction motor simulation and performance analysis interface built for educational and laboratory use. It allows users to explore motor characteristics, view live performance metrics, capture readings, and compare table and graph modes.

<img width="1890" height="850" alt="image" src="https://github.com/user-attachments/assets/df75bb39-b13d-4fad-9fa5-488b636ed823" />
<img width="1902" height="865" alt="image" src="https://github.com/user-attachments/assets/4bdc948d-1fd3-41d7-afe4-6115a16f37c5" />



## Project Structure

- `induction_motor_template/` — main application files
  - `index.html` — simulation UI
  - `css/` — styling and responsive layout
  - `js/` — simulation logic and calculations
  - `images/` — assets and icons

## Features

- Live induction motor simulation controls
- Voltage, frequency, and load adjustment
- Real-time speed, torque, and power calculations
- Performance table with recorded readings
- Statistical summary for logged values
- Graph/table toggle for result visualization
- Blocked rotor and operating condition handling
- Responsive web interface

## Run Locally

From the project root, start a local web server:

```bash
cd blocked-Rotor_final1/induction_motor_template
python -m http.server 8000
```

Then open:

```text
http://localhost:8000/index.html
```

## Files Included

- `induction_motor_template/index.html`
- `induction_motor_template/css/`
- `induction_motor_template/js/`
- `induction_motor_template/images/`
- `induction_motor_template/IMPLEMENTATION_SUMMARY.md`
- `induction_motor_template/QUICK_START.md`

## Notes

This project is intended for simulation and demonstration of induction motor behavior in a classroom/lab environment. The table and graph views are synchronized with the live motor state to help visualize performance changes under different operating conditions.

## License

This repository is intended for academic and educational use.

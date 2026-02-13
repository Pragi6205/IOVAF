# OBU (On-Board Unit) simulator

Files added:
- `obu/src`: client, utils, runner and Streamlit UI
- `obu/scripts/manage_obu.py`: start/stop/list multiple OBUs
- `obu/vehicles.json`: sample vehicles list
- `obu/requirements.txt`: python dependencies

Quick start examples:

Start a single OBU runner (register + periodic sensor processing):
```bash
python3 obu/src/obu_runner.py --private-key "<PK>" --vehicle-id veh_1 --category 0 --register
```

Run the Streamlit UI:
```bash
pip install -r obu/requirements.txt
streamlit run obu/src/ui_app.py
```

Start multiple OBUs from the sample list:
```bash
python3 obu/scripts/manage_obu.py start --vehicles-file obu/vehicles.json
python3 obu/scripts/manage_obu.py list
python3 obu/scripts/manage_obu.py stop
```

Notes:
- Edge servers: set environment `OBU_EDGE_SERVERS` as JSON array or comma-separated list, e.g. `export OBU_EDGE_SERVERS='["http://localhost:3000"]'`
- Vehicles require a private key and id. These can be provided via `vehicles.json` or command-line args.

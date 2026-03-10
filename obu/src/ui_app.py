"""Streamlit UI to simulate vehicles and interact with Edge Server via OBU client."""
import streamlit as st
import os
from obu_client import VehicleOBU
import config

st.set_page_config(page_title='OBU Vehicle Simulator', layout='centered')

st.title('OBU Vehicle Simulator')

# Check if vehicle data is provided via environment variables (multi-instance mode)
env_vehicle_id = os.environ.get('OBU_VEHICLE_ID')
env_private_key = os.environ.get('OBU_PRIVATE_KEY')
env_category = os.environ.get('OBU_CATEGORY')
env_edge_server = os.environ.get('OBU_EDGE_SERVER')

with st.form('vehicle_form'):
    private_key = st.text_area('Vehicle Private Key', value=env_private_key or '', height=100)
    vehicle_id = st.text_input('Vehicle ID', value=env_vehicle_id or 'veh_'+str(st.session_state.get('next_id', 1)))
    category = st.selectbox('Vehicle Category', options=[0, 1, 2], format_func=lambda x: {0:'NORMAL',1:'EMERGENCY',2:'RSU'}[x], index=int(env_category) if env_category else 0)
    edge_choice = st.selectbox('Edge Server (or choose Random)', options=['RANDOM'] + config.EDGE_SERVERS, index=0 if not env_edge_server else (config.EDGE_SERVERS.index(env_edge_server) + 1 if env_edge_server in config.EDGE_SERVERS else 0))
    register_btn = st.form_submit_button('Register Vehicle')

if register_btn:
    edge = None if edge_choice == 'RANDOM' else edge_choice
    obu = VehicleOBU(private_key, vehicle_id, category, edge_servers=[edge] if edge else None)
    res = obu.register()
    st.write('Register response:')
    st.json(res)

st.markdown('---')

st.subheader('Send Alert')
with st.form('alert_form'):
    pk = st.text_area('Vehicle Private Key (for sending)', height=100)
    msg = st.text_input('Alert Message', value='Road hazard ahead')
    alert_type = st.selectbox('Alert Type', options=[0,1,2,3], format_func=lambda x: {0:'ACCIDENT',1:'HAZARD',2:'CONGESTION',3:'EMERGENCY'}[x])
    priority = st.selectbox('Priority', options=[0,1,2], format_func=lambda x: {0:'LOW',1:'MEDIUM',2:'HIGH'}[x])
    server = st.selectbox('Edge Server (or RANDOM)', options=['RANDOM'] + config.EDGE_SERVERS)
    send_btn = st.form_submit_button('Send Alert')

if send_btn:
    edge = None if server == 'RANDOM' else server
    obu = VehicleOBU(pk, vehicle_id or 'ui-vehicle', 1 if alert_type==3 else 0, edge_servers=[edge] if edge else None)
    res = obu.send_alert(msg, alert_type, priority)
    st.write('Send response:')
    st.json(res)

st.markdown('---')

st.subheader('Emergency Broadcast')
with st.form('em_form'):
    pk2 = st.text_area('Private Key (emergency vehicle)', height=100)
    em_msg = st.text_input('Emergency Message', value='Ambulance approaching')
    em_server = st.selectbox('Edge Server (or RANDOM)', options=['RANDOM'] + config.EDGE_SERVERS, key='em_server')
    em_btn = st.form_submit_button('Broadcast Emergency')

if em_btn:
    edge = None if em_server == 'RANDOM' else em_server
    obu = VehicleOBU(pk2, vehicle_id or 'ui-vehicle', 1, edge_servers=[edge] if edge else None)
    res = obu.emergency_broadcast(em_msg, alert_type=3)
    st.write('Emergency response:')
    st.json(res)

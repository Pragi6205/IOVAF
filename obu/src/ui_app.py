"""Streamlit UI to simulate vehicles and interact with Edge Server via OBU client."""
import streamlit as st
import os
from datetime import datetime
from obu_client import VehicleOBU
import config

st.set_page_config(page_title='OBU Vehicle Simulator', layout='wide')

st.title('OBU Vehicle Simulator')

# Initialize session state for vehicle
if 'vehicle_private_key' not in st.session_state:
    env_private_key = os.environ.get('OBU_PRIVATE_KEY')
    if env_private_key:
        st.session_state.vehicle_private_key = env_private_key
        st.info(f'✓ Vehicle private key loaded from environment (OBU_PRIVATE_KEY)')
    else:
        st.session_state.vehicle_private_key = None

# Check if vehicle data is provided via environment variables (multi-instance mode)
env_vehicle_id = os.environ.get('OBU_VEHICLE_ID')
env_private_key = os.environ.get('OBU_PRIVATE_KEY')
env_category = os.environ.get('OBU_CATEGORY')
env_edge_server = os.environ.get('OBU_EDGE_SERVER')

# Sidebar: Vehicle configuration
with st.sidebar:
    st.subheader('Vehicle Configuration')
    if st.session_state.vehicle_private_key:
        st.success('✓ Private Key: Set from environment')
        if st.button('Clear Private Key'):
            st.session_state.vehicle_private_key = None
            st.rerun()
    else:
        st.session_state.vehicle_private_key = st.text_area(
            'Vehicle Private Key',
            value=env_private_key or '',
            height=100,
            key='pk_input'
        )
    
    st.session_state.vehicle_id = st.text_input(
        'Vehicle ID',
        value=env_vehicle_id or 'veh_'+str(st.session_state.get('next_id', 1))
    )
    st.session_state.vehicle_category = st.selectbox(
        'Vehicle Category',
        options=[0, 1, 2],
        format_func=lambda x: {0:'NORMAL',1:'EMERGENCY',2:'RSU'}[x],
        index=int(env_category) if env_category else 0
    )
    st.session_state.edge_server = st.selectbox(
        'Edge Server (or RANDOM)',
        options=['RANDOM'] + config.EDGE_SERVERS,
        index=0 if not env_edge_server else (config.EDGE_SERVERS.index(env_edge_server) + 1 if env_edge_server in config.EDGE_SERVERS else 0)
    )

# Main content tabs
tab1, tab2, tab3, tab4 = st.tabs(['Register Vehicle', 'Send Alert', 'Emergency Broadcast', 'View Alerts'])


with tab1:
    st.subheader('Register Vehicle')
    if st.session_state.vehicle_private_key:
        if st.button('Register Vehicle'):
            edge = None if st.session_state.edge_server == 'RANDOM' else st.session_state.edge_server
            obu = VehicleOBU(st.session_state.vehicle_private_key, st.session_state.vehicle_id,
                           st.session_state.vehicle_category, edge_servers=[edge] if edge else None)
            res = obu.register()
            st.write('Register response:')
            st.json(res)
    else:
        st.warning('Please set vehicle private key in the sidebar')

with tab2:
    st.subheader('Send Alert')
    if st.session_state.vehicle_private_key:
        col1, col2 = st.columns(2)
        with col1:
            msg = st.text_input('Alert Message', value='Road hazard ahead')
            alert_type = st.selectbox('Alert Type',
                                     options=[0,1,2,3],
                                     format_func=lambda x: {0:'ACCIDENT',1:'HAZARD',2:'CONGESTION',3:'EMERGENCY'}[x],
                                     key='alert_type')
        with col2:
            priority = st.selectbox('Priority',
                                   options=[0,1,2],
                                   format_func=lambda x: {0:'LOW',1:'MEDIUM',2:'HIGH'}[x],
                                   key='priority')
        
        if st.button('Send Alert'):
            edge = None if st.session_state.edge_server == 'RANDOM' else st.session_state.edge_server
            obu = VehicleOBU(st.session_state.vehicle_private_key, st.session_state.vehicle_id,
                           st.session_state.vehicle_category, edge_servers=[edge] if edge else None)
            res = obu.send_alert(msg, alert_type, priority)
            st.write('Send response:')
            st.json(res)
    else:
        st.warning('Please set vehicle private key in the sidebar')

with tab3:
    st.subheader('Emergency Broadcast')
    if st.session_state.vehicle_private_key:
        if st.session_state.vehicle_category == 1:
            em_msg = st.text_input('Emergency Message', value='Ambulance approaching')
            if st.button('Broadcast Emergency'):
                edge = None if st.session_state.edge_server == 'RANDOM' else st.session_state.edge_server
                obu = VehicleOBU(st.session_state.vehicle_private_key, st.session_state.vehicle_id,
                               st.session_state.vehicle_category, edge_servers=[edge] if edge else None)
                res = obu.emergency_broadcast(em_msg, alert_type=3)
                st.write('Emergency response:')
                st.json(res)
        else:
            st.warning('Only EMERGENCY vehicles can broadcast emergencies')
    else:
        st.warning('Please set vehicle private key in the sidebar')

with tab4:
    st.subheader('Alerts from Other Vehicles')
    if 'last_alert_fetch' not in st.session_state:
        st.session_state.last_alert_fetch = None
    
    col1, col2, col3 = st.columns([2, 2, 1])
    with col1:
        alert_filter = st.radio('Filter by:', ['All Alerts', 'Emergency Only', 'By Type'], horizontal=False)
    with col2:
        if alert_filter == 'By Type':
            selected_type = st.selectbox('Alert Type',
                                       options=[0,1,2,3],
                                       format_func=lambda x: {0:'ACCIDENT',1:'HAZARD',2:'CONGESTION',3:'EMERGENCY'}[x],
                                       key='query_type')
    with col3:
        refresh_btn = st.button('🔄 Refresh', use_container_width=True)
    
    if refresh_btn:
        try:
            # Use any vehicle OBU to query (the private key doesn't matter for GET requests)
            dummy_obu = VehicleOBU('0x' + '0' * 64, 'query_only', 0)
            
            if alert_filter == 'All Alerts':
                result = dummy_obu.get_all_alerts()
            elif alert_filter == 'Emergency Only':
                result = dummy_obu.get_emergency_alerts()
            else:
                result = dummy_obu.get_alerts_by_type(selected_type)
            
            st.session_state.last_alert_fetch = result
            st.success(f'✓ Fetched {result.get("totalAlerts", 0)} alerts')
        except Exception as e:
            st.error(f'Error fetching alerts: {str(e)}')
    
    if st.session_state.last_alert_fetch:
        result = st.session_state.last_alert_fetch
        if result.get('alerts'):
            for i, alert in enumerate(result['alerts'], 1):
                with st.expander(f"**#{i}** {alert.get('alertType', 'N/A'):15} | {alert.get('message', 'N/A')[:45]}"):
                    col1, col2 = st.columns(2)
                    with col1:
                        st.write(f"**From:** `{alert.get('sender', 'Unknown')[:16]}...`")
                        st.write(f"**Type:** {alert.get('alertType', 'N/A')}")
                        st.write(f"**Priority:** {alert.get('priority', 'N/A')}")
                    with col2:
                        st.write(f"**Message:** {alert.get('message', 'N/A')}")
                        st.write(f"**Time:** {alert.get('timestamp', 'N/A')}")
                    if alert.get('isEmergencyBroadcast'):
                        st.warning('⚠️ EMERGENCY BROADCAST')
        else:
            st.info('No alerts found')


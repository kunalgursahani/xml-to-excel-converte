from http.server import BaseHTTPRequestHandler
import json
import pandas as pd
import xml.etree.ElementTree as ET
import base64
import tempfile
import os

def convert_xml_to_excel(xml_content):
    # Parse XML
    root = ET.fromstring(xml_content)
    
    # Extract data
    data = []
    for record in root.findall('.//record'):
        record_data = {}
        for child in record:
            record_data[child.tag] = child.text
        data.append(record_data)
    
    # Create DataFrame
    df = pd.DataFrame(data)
    
    # Create Excel file in memory
    with tempfile.NamedTemporaryFile(delete=False, suffix='.xlsx') as tmp:
        df.to_excel(tmp.name, index=False)
        with open(tmp.name, 'rb') as f:
            excel_data = f.read()
    
    # Clean up
    os.unlink(tmp.name)
    
    return excel_data

class handler(BaseHTTPRequestHandler):
    def do_POST(self):
        content_length = int(self.headers['Content-Length'])
        post_data = self.rfile.read(content_length)
        
        try:
            # Parse the JSON request
            request_data = json.loads(post_data.decode('utf-8'))
            xml_content = request_data.get('xml_content')
            
            if not xml_content:
                self.send_error(400, "No XML content provided")
                return
            
            # Convert XML to Excel
            excel_data = convert_xml_to_excel(xml_content)
            
            # Send response
            self.send_response(200)
            self.send_header('Content-type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
            self.send_header('Content-Disposition', 'attachment; filename=converted.xlsx')
            self.end_headers()
            self.wfile.write(excel_data)
            
        except Exception as e:
            self.send_error(500, str(e)) 
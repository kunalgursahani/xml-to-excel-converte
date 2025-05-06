import pandas as pd
import xml.etree.ElementTree as ET
import sys
import os
from typing import Tuple
import traceback

def validate_xml_structure(xml_file_path: str) -> Tuple[bool, str]:
    """Validate the basic structure of the XML file."""
    try:
        print(f"Reading XML file: {xml_file_path}")
        if not os.path.exists(xml_file_path):
            return False, f"File not found: {xml_file_path}"
            
        tree = ET.parse(xml_file_path)
        root = tree.getroot()
        
        print(f"Root element: {root.tag}")
        
        # Check if root has children
        if not list(root):
            return False, "XML file is empty or has no valid data"
            
        # Check if first child has sub-elements
        first_child = list(root)[0]
        if not list(first_child):
            return False, "XML structure is invalid: no data elements found"
            
        return True, "XML structure is valid"
    except ET.ParseError as e:
        return False, f"Invalid XML format: {str(e)}"
    except Exception as e:
        return False, f"Error validating XML: {str(e)}\n{traceback.format_exc()}"

def convert_xml_to_excel(xml_file_path: str, output_excel_path: str) -> Tuple[bool, str]:
    """Convert XML file to Excel format with improved error handling."""
    try:
        print(f"Starting conversion: {xml_file_path} -> {output_excel_path}")
        
        # Validate XML structure first
        is_valid, message = validate_xml_structure(xml_file_path)
        if not is_valid:
            return False, message

        # Parse the XML file
        tree = ET.parse(xml_file_path)
        root = tree.getroot()

        # Convert XML to DataFrame
        data = []
        for child in root:
            row = {}
            for subchild in child:
                row[subchild.tag] = subchild.text if subchild.text is not None else ''
            data.append(row)

        if not data:
            return False, "No data found in XML file"

        print(f"Found {len(data)} rows of data")

        # Create DataFrame
        df = pd.DataFrame(data)

        # Validate DataFrame
        if df.empty:
            return False, "No valid data found in XML file"

        print("Saving to Excel...")
        # Save to Excel
        df.to_excel(output_excel_path, index=False)
        print("Conversion successful!")
        return True, "Conversion successful"
    except pd.errors.EmptyDataError:
        return False, "No data found in XML file"
    except Exception as e:
        return False, f"Error during conversion: {str(e)}\n{traceback.format_exc()}"

if __name__ == "__main__":
    if len(sys.argv) != 3:
        print("Usage: python xml_to_excel.py <input_xml_file> <output_excel_file>")
        sys.exit(1)

    input_file = sys.argv[1]
    output_file = sys.argv[2]

    print(f"Input file: {input_file}")
    print(f"Output file: {output_file}")

    # Check if input file exists
    if not os.path.exists(input_file):
        print(f"Error: Input file '{input_file}' does not exist")
        sys.exit(1)

    success, message = convert_xml_to_excel(input_file, output_file)
    print(message)
    sys.exit(0 if success else 1)

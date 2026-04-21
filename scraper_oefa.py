import requests
import csv
import time
import json

BASE_URL = "https://pifa.oefa.gob.pe/arcgis/rest/services/CiudadanoAmb/alertarrss_WebVisor/MapServer/0/query"

# Mapeo de estados según investigación
ESTADO_MAP = {
    3: "No atendido",
    4: "No atendido",
    5: "Atendido por Municipalidad",
    6: "Atendido por Municipalidad"
}

def get_total_count():
    params = {
        'where': '1=1',
        'returnCountOnly': 'true',
        'f': 'json'
    }
    response = requests.get(BASE_URL, params=params)
    data = response.json()
    return data.get('count', 0)

def fetch_data():
    total = get_total_count()
    print(f"Total de registros a extraer: {total}")
    
    batch_size = 1000
    offset = 0
    all_data = []
    
    fieldnames = [
        'OBJECTID', 'ESTADO_DESC', 'ESTADO_COD', 'NOMBDEP', 'NOMBPROV', 
        'NOMBDIST', 'FECHATOMA', 'LATITUD', 'LONGITUD'
    ]
    
    with open('alertas_residuos.csv', 'w', newline='', encoding='utf-8-sig') as csvfile:
        writer = csv.DictWriter(csvfile, fieldnames=fieldnames)
        writer.writeheader()
        
        while offset < total:
            params = {
                'where': '1=1',
                'outFields': '*',
                'resultOffset': offset,
                'resultRecordCount': batch_size,
                'f': 'json',
                'outSR': 4326 # WGS84 para lat/long
            }
            
            try:
                response = requests.get(BASE_URL, params=params)
                if response.status_code != 200:
                    print(f"Error en la petición: {response.status_code}")
                    break
                
                data = response.json()
                features = data.get('features', [])
                
                if not features:
                    break
                
                for feature in features:
                    attrs = feature.get('attributes', {})
                    geom = feature.get('geometry', {})
                    estado_cod = attrs.get('ESTADO')
                    
                    row = {
                        'OBJECTID': attrs.get('OBJECTID'),
                        'ESTADO_DESC': ESTADO_MAP.get(estado_cod, f"Otro ({estado_cod})"),
                        'ESTADO_COD': estado_cod,
                        'NOMBDEP': attrs.get('NOMBDEP'),
                        'NOMBPROV': attrs.get('NOMBPROV'),
                        'NOMBDIST': attrs.get('NOMBDIST'),
                        'FECHATOMA': attrs.get('FECHATOMA'),
                        'LATITUD': geom.get('y'),
                        'LONGITUD': geom.get('x')
                    }
                    writer.writerow(row)
                
                offset += len(features)
                print(f"Progreso: {offset}/{total} registros extraídos...")
                
            except Exception as e:
                print(f"Error durante la extracción: {e}")
                time.sleep(2)
                continue
                
    print(f"Extracción completada. Archivo guardado como 'alertas_residuos.csv'")

if __name__ == "__main__":
    fetch_data()

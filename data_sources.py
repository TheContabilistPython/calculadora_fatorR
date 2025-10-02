# data_sources.py
# Funções para carregar tabelas oficiais (via URL ou arquivo local).
# Nota: não tenta parsear PDFs complexos — prefira JSON/CSV oficiais.
import requests
import json
from datetime import datetime

class TablesStore:
    def __init__(self):
        self.tables = {}
        self.meta = {}

    def load_from_url(self, name, url, as_json=True, timeout=15):
        r = requests.get(url, timeout=timeout)
        r.raise_for_status()
        if as_json:
            data = r.json()
        else:
            data = r.text
        self.tables[name] = data
        self.meta[name] = {'source': url, 'loaded_at': datetime.utcnow().isoformat()}
        return data

    def load_from_file(self, name, path):
        with open(path, 'r', encoding='utf-8') as f:
            data = json.load(f)
        self.tables[name] = data
        self.meta[name] = {'source': path, 'loaded_at': datetime.utcnow().isoformat()}
        return data

    def get(self, name):
        return self.tables.get(name)

    def status(self):
        return self.meta
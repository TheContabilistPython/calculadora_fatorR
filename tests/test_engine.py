# tests/test_engine.py
from tax_engine import calc_simples_from_tables, calc_presumido, calc_prolabore_taxes
import json, os

def load_sample():
    p = os.path.join(os.path.dirname(__file__),'..','config','sample_tables.json')
    return json.load(open(p,'r',encoding='utf-8'))

def test_simples_vs_presumido_example():
    tables = load_sample()
    annual_revenue = 600000.0
    annual_payroll = 180000.0
    simples = calc_simples_from_tables(annual_revenue, annual_payroll, tables, atividade='servicos')
    presumido = calc_presumido(annual_revenue, 0.32, 0.12, 0.0065, 0.03, 0.03)
    assert simples['tax_annual'] > 0
    assert 'tax_monthly' in simples
    assert presumido['total_annual'] > 0

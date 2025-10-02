from flask import Flask, request, jsonify
from data_sources import TablesStore
from tax_engine import calc_simples_from_tables, calc_presumido, calc_prolabore_taxes, calc_simples_scenarios, calc_all_anexos
import os, json

app = Flask(__name__)
store = TablesStore()

from flask_cors import CORS
CORS(app)


# Carregar tabelas de exemplo no startup
def load_defaults():
    sample_path = os.path.join(os.path.dirname(__file__), 'config', 'sample_tables.json')
    try:
        store.load_from_file('tax_tables', sample_path)
        print("Tabelas padrão carregadas com sucesso.")
    except Exception as e:
        print("Não foi possível carregar sample_tables.json:", e)

# chama no startup (não depende mais de decorator removido)
load_defaults()

@app.route('/', methods=['GET'])
def index():
    return jsonify({
        'message': 'API Calculadora Tributária - Backend',
        'status': 'online',
        'endpoints': {
            '/tables/status': 'GET - Status das tabelas fiscais',
            '/upload_tables': 'POST - Upload de tabelas customizadas',
            '/compare': 'POST - Comparar cenários tributários'
        }
    })

@app.route('/tables/status', methods=['GET'])
def tables_status():
    return jsonify(store.status())

@app.route('/upload_tables', methods=['POST'])
def upload_tables():
    data = request.get_json()
    if not data:
        return jsonify({'error': 'envie JSON'}), 400
    store.tables['tax_tables'] = data
    store.meta['tax_tables'] = {
        'source': 'upload',
        'loaded_at': __import__('datetime').datetime.utcnow().isoformat()
    }
    return jsonify({'ok': True})

@app.route('/compare', methods=['POST'])
def compare():
    body = request.get_json()
    if not body:
        return jsonify({'error': 'JSON esperado'}), 400

    monthly_revenue = float(body.get('monthly_revenue', 0.0))
    annual_revenue = float(body.get('annual_revenue', monthly_revenue * 12.0))
    annual_payroll = float(body.get('annual_payroll', 0.0))
    pro_labore = float(body.get('pro_labore_monthly', 0.0))
    atividade = body.get('atividade', 'servicos')
    tables = store.get('tax_tables') or {}

    scenarios = calc_simples_scenarios(
        annual_revenue, annual_payroll, pro_labore, tables,
        atividade=atividade, cnae=None, force_anexo=body.get('force_anexo'),
        monthly_revenue=monthly_revenue
    )
    simples = scenarios['chosen']
    presumido = calc_presumido(
        annual_revenue,
        presumption_percent=body.get('presumption_percent', 0.32),
        csll_percent=body.get('csll_presumption_percent', 0.32),
        pis_rate=body.get('pis_rate', 0.0065),
        cofins_rate=body.get('cofins_rate', 0.03),
        iss_rate=body.get('iss_rate', 0.02),
        monthly_revenue=monthly_revenue,
        annual_payroll=annual_payroll,
        pro_labore_monthly=pro_labore,
        inss_patronal_rate=body.get('inss_patronal_rate', 0.20)
    )
    irrf_table = tables.get('irrf_table', [])
    prolab = calc_prolabore_taxes(
        pro_labore, irrf_table,
        inss_rate_effective=body.get('inss_rate_effective', 0.11)
    )

    # Somar IRRF e INSS do pró-labore ao cenário com Fator R (total anual/mensal)
    prolab_total_m = (prolab.get('inss', 0.0) + prolab.get('irrf', 0.0)) if prolab else 0.0
    prolab_total_a = prolab_total_m * 12.0
    irrf_total_a = (prolab.get('irrf', 0.0) * 12.0) if prolab else 0.0
    inss_total_a = (prolab.get('inss', 0.0) * 12.0) if prolab else 0.0
    wf = scenarios.get('with_factor_r') or {}
    if wf:
        wf['total_monthly_including_prolabore'] = round((wf.get('tax_monthly', 0.0) or 0.0) + prolab_total_m, 2)
        wf['total_annual_including_prolabore'] = round((wf.get('tax_annual', 0.0) or 0.0) + prolab_total_a, 2)
        # Considerar compensação de 50% do IRRF do pró‑labore ao final do ano
        total_anual_irrf50 = (wf.get('tax_annual', 0.0) or 0.0) + inss_total_a + max(0.0, irrf_total_a * 0.5)
        wf['total_annual_including_prolabore_irrf50'] = round(total_anual_irrf50, 2)
        wf['total_monthly_including_prolabore_irrf50'] = round(total_anual_irrf50 / 12.0, 2)

    # Calcular todos os anexos I-V
    simples_all = calc_all_anexos(annual_revenue, tables, monthly_revenue=monthly_revenue)

    # metadados das tabelas
    tables_meta = store.meta.get('tax_tables', {})

    return jsonify({
        'inputs': {
            'monthly_revenue': monthly_revenue,
            'annual_revenue': annual_revenue,
            'annual_payroll': annual_payroll,
            'pro_labore_monthly': pro_labore,
            'atividade': atividade
        },
        'simples': simples,
        'simples_all': simples_all,
        'simples_scenarios': {
            'with_factor_r': wf,
            'without_factor_r': scenarios['without_factor_r'],
            'decision_reason': scenarios['decision_reason'],
            'cheaper_scenario': scenarios['cheaper_scenario']
        },
        'presumido': presumido,
        'prolabore': prolab,
        'tables_used': {
            'meta': tables_meta,
            'tables': tables
        }
    })

if __name__ == '__main__':
    import os
    port = int(os.environ.get('PORT', 5000))
    app.run(debug=True, host='0.0.0.0', port=port)

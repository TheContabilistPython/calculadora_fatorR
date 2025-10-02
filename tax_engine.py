"""
tax_engine.py
Motor de cálculo: Simples x Presumido, pró-labore, IRPJ adicional, etc.

Regras do Fator R (Simples Nacional):
- Para diversas atividades de serviços, quando o Fator R (folha/receita) for
    igual ou superior a 28% (0,28), a tributação pode ocorrer no Anexo III;
    caso contrário, no Anexo V. Esta implementação reflete essa lógica de forma
    simplificada e orientada por tabelas pré-carregadas (config/sample_tables.json).

IMPORTANTE: A legislação do Simples possui exceções e detalhamentos por CNAE e
atividade específica. Este motor é didático e simplificado. Ajuste conforme o
seu escopo real e tabelas oficiais.
"""
from decimal import Decimal, ROUND_HALF_UP
import math

def round2(x):
    return float(Decimal(x).quantize(Decimal('0.01'), rounding=ROUND_HALF_UP))

# Utilitário: calcula fator R
def calc_factor_r(annual_payroll, annual_revenue):
    if annual_revenue == 0:
        return 0.0
    return annual_payroll / annual_revenue


# Determina anexo do Simples via Fator R (simplificado)
def determine_simples_anexo(annual_payroll, annual_revenue, atividade='servicos', *, threshold=0.28, force_anexo=None, cnae_mode=None, use_factor_r=True):
    """
    Retorna 'III' ou 'V' conforme:
    - Se force_anexo for 'III' ou 'V', respeita a força.
    - Se cnae_mode for 'III' ou 'V', respeita o CNAE.
    - Caso contrário, se use_factor_r e atividade == 'servicos' e fator_r >= threshold => 'III'; senão 'V'.

    Parâmetros
    - annual_payroll: folha anual (float)
    - annual_revenue: receita anual (float)
    - atividade: 'servicos' ou outras categorias simplificadas
    - threshold: limite do Fator R (padrão 0.28)
    - force_anexo: None, 'III' ou 'V'
    """
    if force_anexo in ('III', 'V'):
        return force_anexo
    if cnae_mode in ('III', 'V'):
        return cnae_mode
    factor_r = calc_factor_r(annual_payroll, annual_revenue)
    if use_factor_r and atividade == 'servicos' and factor_r >= threshold:
        return 'III'
    return 'V'

# Simples: espera tabelas com formato:
# { "anexo_III": [ {"min":0,"max":180000,"aliquota":0.06,"deduz":0.0}, ... ], "anexo_V": [...] }
def calc_simples_from_tables(annual_revenue, annual_payroll, tables, atividade='servicos', force_anexo=None, cnae=None, use_factor_r=True, pro_labore_monthly=0.0, prolabore_taxes_monthly=0.0, monthly_revenue=None):
    # Fator R considera folha anual + pró‑labore bruto anual; NÃO somar INSS/IRRF do pró‑labore na base
    effective_payroll = annual_payroll + (pro_labore_monthly or 0.0) * 12.0
    factor_r = calc_factor_r(effective_payroll, annual_revenue)
    # validar CNAE nas tabelas
    cnae_mode = None
    rules = tables.get('cnae_rules', {}) or {}
    if cnae and isinstance(cnae, str):
        raw = rules.get(cnae)
        if raw == 'III':
            cnae_mode = 'III'
        elif raw == 'V':
            cnae_mode = 'V'
        elif raw == 'fator_r':
            cnae_mode = None  # deixa o fator R decidir

    chosen = determine_simples_anexo(
        effective_payroll, annual_revenue, atividade,
        threshold=0.28, force_anexo=force_anexo, cnae_mode=cnae_mode, use_factor_r=use_factor_r
    )
    key = 'anexo_III' if chosen == 'III' else 'anexo_V'
    brackets = tables.get(key, [])
    # localizar faixa anual
    for br in brackets:
        if annual_revenue <= br['max']:
            aliquota = br['aliquota']
            deduz = br.get('deduz', 0.0)
            break
    else:
        # último bracket
        br = brackets[-1]
        aliquota = br['aliquota']
        deduz = br.get('deduz', 0.0)
    tax_annual = max(0.0, annual_revenue * aliquota - deduz)
    # Cálculo correto do imposto mensal do Simples: alíquota efetiva sobre a receita mensal informada
    effective_rate = (tax_annual / annual_revenue) if annual_revenue > 0 else 0.0
    mr = monthly_revenue if (monthly_revenue is not None and monthly_revenue >= 0) else (annual_revenue / 12.0)
    tax_monthly = effective_rate * mr
    return {
        'anexo': chosen,
        'factor_r': round2(factor_r),
        'aliquota': aliquota,
        'deduz': deduz,
        'tax_annual': round2(tax_annual),
        'tax_monthly': round2(tax_monthly)
    }


def calc_simples_scenarios(annual_revenue, annual_payroll, pro_labore_monthly, tables, atividade='servicos', cnae=None, force_anexo=None, inss_rate_effective=0.11, monthly_revenue=None):
    """Retorna os dois cenários no Simples:
    - with_factor_r: Considera Fator R (com pró-labore incluso na folha)
    - without_factor_r: Ignora Fator R (usa V, a menos de força/CNAE)
    Também retorna a escolha aplicada e uma razão textual.
    """
    # calcular tributos do pró-labore para incluir no Fator R
    irrf_table = tables.get('irrf_table', [])
    prolab_taxes = calc_prolabore_taxes(pro_labore_monthly, irrf_table, inss_rate_effective=inss_rate_effective)
    prolabore_taxes_monthly = (prolab_taxes.get('inss', 0.0) + prolab_taxes.get('irrf', 0.0)) if prolab_taxes else 0.0

    with_factor_r = calc_simples_from_tables(
        annual_revenue, annual_payroll, tables,
        atividade=atividade, force_anexo=force_anexo, cnae=cnae,
        use_factor_r=True, pro_labore_monthly=pro_labore_monthly,
        prolabore_taxes_monthly=0.0, monthly_revenue=monthly_revenue
    )
    without_factor_r = calc_simples_from_tables(
        annual_revenue, annual_payroll, tables,
        atividade=atividade, force_anexo=force_anexo, cnae=cnae,
        use_factor_r=False, pro_labore_monthly=pro_labore_monthly,
        prolabore_taxes_monthly=0.0, monthly_revenue=monthly_revenue
    )

    # Decisão: pela regra do Fator R quando aplicável (não necessariamente o menor imposto)
    factor = with_factor_r.get('factor_r', 0.0)
    threshold = 0.28
    reason = ''

    # Se força/CNAE definiu explicitamente o anexo, a decisão segue isso
    chosen = with_factor_r if with_factor_r['anexo'] in ('III', 'V') and with_factor_r['anexo'] == without_factor_r['anexo'] else None
    if chosen is None:
        # Se os anexos são distintos por causa do Fator R, decide conforme fator
        if factor >= threshold:
            chosen = with_factor_r
            reason = f"Escolhi Fator R (Anexo III) pois a folha (inclui pró-labore) é >= 28% do faturamento (fator_r={round2(factor*100)}%)."
        else:
            chosen = without_factor_r
            reason = f"Não apliquei Fator R (Anexo V) pois a folha (inclui pró-labore) é < 28% do faturamento (fator_r={round2(factor*100)}%)."
    else:
        # Quando força/CNAE determina o anexo, explicamos
        reason = f"Anexo definido por CNAE/forçamento: {chosen['anexo']}. Fator R informado: {round2(factor*100)}%."

    cheaper = 'with_factor_r' if with_factor_r['tax_annual'] < without_factor_r['tax_annual'] else 'without_factor_r'

    return {
        'with_factor_r': with_factor_r,
        'without_factor_r': without_factor_r,
        'chosen': chosen,
        'decision_reason': reason,
        'cheaper_scenario': cheaper
    }


def calc_simples_for_key(annual_revenue, tables, key, monthly_revenue=None):
    """Calcula o imposto no Simples para um anexo específico presente em tables,
    retornando estrutura padronizada. Não aplica regra do Fator R aqui; apenas lê a tabela.
    """
    brackets = tables.get(key, [])
    if not brackets:
        return None
    # localizar faixa anual
    for br in brackets:
        if annual_revenue <= br['max']:
            aliquota = br['aliquota']
            deduz = br.get('deduz', 0.0)
            break
    else:
        br = brackets[-1]
        aliquota = br['aliquota']
        deduz = br.get('deduz', 0.0)
    tax_annual = max(0.0, annual_revenue * aliquota - deduz)
    effective_rate = (tax_annual / annual_revenue) if annual_revenue > 0 else 0.0
    mr = monthly_revenue if (monthly_revenue is not None and monthly_revenue >= 0) else (annual_revenue / 12.0)
    tax_monthly = effective_rate * mr
    label = key.split('_', 1)[-1].upper()  # anexo_I -> I
    return {
        'anexo': label,
        'aliquota': aliquota,
        'deduz': deduz,
        'tax_annual': round2(tax_annual),
        'tax_monthly': round2(tax_monthly)
    }


def calc_all_anexos(annual_revenue, tables, monthly_revenue=None):
    """Retorna um dicionário com o cálculo para Anexos I, II, III, IV e V (se existirem nas tabelas)."""
    result = {}
    for key in ('anexo_I', 'anexo_II', 'anexo_III', 'anexo_IV', 'anexo_V'):
        item = calc_simples_for_key(annual_revenue, tables, key, monthly_revenue=monthly_revenue)
        if item:
            result[item['anexo']] = item
    return result

# Lucro Presumido
def calc_presumido(
    annual_revenue,
    presumption_percent,
    csll_percent,
    pis_rate,
    cofins_rate,
    iss_rate,
    irpj_additional_threshold_monthly=20000.0,
    monthly_revenue=None,
    *,
    annual_payroll: float = 0.0,
    pro_labore_monthly: float = 0.0,
    inss_patronal_rate: float = 0.20,
):
    base_irpj = annual_revenue * presumption_percent
    irpj = base_irpj * 0.15
    # adicional: 10% sobre parcela que exceder (R$20.000,00 / mês)
    monthly_base = base_irpj / 12.0
    adicional = 0.0
    if monthly_base > irpj_additional_threshold_monthly:
        excedente = monthly_base - irpj_additional_threshold_monthly
        adicional = excedente * 12.0 * 0.10  # anual
    csll = annual_revenue * csll_percent * 0.09  # observação: ajustar alíquota CSLL conforme legislação/atividade
    pis = annual_revenue * pis_rate
    cofins = annual_revenue * cofins_rate
    # ISS: calcular com base na receita mensal informada (mensal * aliquota), anualizando ao final
    if monthly_revenue is None or monthly_revenue <= 0:
        iss_monthly = (annual_revenue / 12.0) * iss_rate
    else:
        iss_monthly = monthly_revenue * iss_rate
    iss = iss_monthly * 12.0
    total_annual = irpj + adicional + csll + pis + cofins + iss

    # INSS Patronal: em regra ~20% sobre folha + pró-labore (podendo variar com RAT/terceiros)
    payroll_monthly = (annual_payroll or 0.0) / 12.0
    patronal_base_monthly = payroll_monthly + (pro_labore_monthly or 0.0)
    inss_patronal_monthly = patronal_base_monthly * (inss_patronal_rate or 0.0)
    inss_patronal_annual = inss_patronal_monthly * 12.0
    total_annual_with_patronal = total_annual + inss_patronal_annual
    return {
        'base_irpj': round2(base_irpj),
        'irpj': round2(irpj),
        'irpj_adicional': round2(adicional),
        'csll': round2(csll),
        'pis': round2(pis),
        'cofins': round2(cofins),
        'iss': round2(iss),
        'iss_monthly': round2(iss_monthly),
        'total_annual': round2(total_annual),
        'total_monthly': round2(total_annual/12.0),
        'inss_patronal_monthly': round2(inss_patronal_monthly),
        'inss_patronal_annual': round2(inss_patronal_annual),
        'total_annual_with_patronal': round2(total_annual_with_patronal),
        'total_monthly_with_patronal': round2(total_annual_with_patronal/12.0),
        # Expor parâmetros/aliquotas usadas para transparência
        'rates_used': {
            'presumption_percent_irpj': presumption_percent,
            'irpj_rate': 0.15,
            'irpj_additional_rate': 0.10,
            'irpj_additional_threshold_monthly': irpj_additional_threshold_monthly,
            'presumption_percent_csll': csll_percent,
            'csll_rate': 0.09,
            'pis_rate': pis_rate,
            'cofins_rate': cofins_rate,
            'iss_rate': iss_rate,
            'inss_patronal_rate': inss_patronal_rate,
            'inss_patronal_base_monthly': round2(patronal_base_monthly),
        }
    }

# Pró-labore: precisa tabela IRRF (lista de faixas: {"max":..., "aliquota":..., "deducao":...})
def calc_prolabore_taxes(pro_labore_monthly, irrf_table, inss_rate_effective=0.11):
    """
    Calcula INSS e IRRF do pró-labore mensal.
    Atendendo ao pedido do usuário, o IRRF será calculado sobre o valor bruto
    do pró-labore (sem deduzir INSS), aplicando a faixa: base * aliquota - deducao.
    """
    inss = pro_labore_monthly * inss_rate_effective
    base = pro_labore_monthly  # IRRF sobre o bruto (não deduz INSS)
    irrf = 0.0
    for f in irrf_table:
        if base <= f['max']:
            irrf = max(0.0, base * f['aliquota'] - f.get('deducao', 0.0))
            break
    else:
        # acima do último
        f = irrf_table[-1]
        irrf = max(0.0, base * f['aliquota'] - f.get('deducao', 0.0))
    return {'inss': round2(inss), 'irrf': round2(irrf)}

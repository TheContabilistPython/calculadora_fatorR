import React, { useState } from 'react';

function CompareForm() {
  const parseBrNumber = (str) => {
    if (typeof str === 'number') return str;
    if (!str) return 0;
    const cleaned = String(str).replace(/\./g, '').replace(',', '.');
    const n = parseFloat(cleaned);
    return isNaN(n) ? 0 : n;
  };

  const formatBr = (value) => {
    if (value === null || value === undefined || value === '') return '';
    const num = typeof value === 'number' ? value : parseBrNumber(value);
    if (isNaN(num)) return '';
    return new Intl.NumberFormat('pt-BR', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
      useGrouping: true,
    }).format(num);
  };

  const [inputs, setInputs] = useState({
    monthly_revenue: '50.000',
    annual_revenue: '600.000',
    annual_payroll: '180.000',
    pro_labore_monthly_a: '8.000',
    pro_labore_monthly_b: '15.000',
    iss_rate_percent: '2,00',
    inss_patronal_percent: '20,00',
    atividade: 'servicos',
  });
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setInputs((prev) => ({ ...prev, [name]: value }));
  };

  const handleNumberBlur = (name) => () => {
    setInputs((prev) => ({ ...prev, [name]: formatBr(prev[name]) }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const API_URL = process.env.REACT_APP_API_URL || 'http://192.168.1.142:5000';
      const base = {
        monthly_revenue: parseBrNumber(inputs.monthly_revenue),
        annual_revenue: parseBrNumber(inputs.annual_revenue),
        annual_payroll: parseBrNumber(inputs.annual_payroll),
        iss_rate: parseBrNumber(inputs.iss_rate_percent) / 100,
        inss_patronal_rate: parseBrNumber(inputs.inss_patronal_percent) / 100,
        atividade: inputs.atividade,
      };
      const pA = { ...base, pro_labore_monthly: parseBrNumber(inputs.pro_labore_monthly_a) };
      const pB = { ...base, pro_labore_monthly: parseBrNumber(inputs.pro_labore_monthly_b) };

      const call = async (payload) => {
        try {
          const res = await fetch(`${API_URL}/compare`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          });
          if (!res.ok) {
            const errorText = await res.text();
            throw new Error(`API retornou erro ${res.status}: ${errorText}`);
          }
          return res.json();
        } catch (fetchError) {
          console.error('Erro detalhado:', fetchError);
          throw new Error(`Falha na conexão com API: ${fetchError.message}`);
        }
      };

      const [dataA, dataB] = await Promise.all([call(pA), call(pB)]);
      setResults([dataA, dataB]);
    } catch (err) {
      console.error('Erro completo:', err);
      setError(err.message || 'Erro inesperado');
    } finally {
      setLoading(false);
    }
  };

  const CalcView = ({ title, data }) => {
    const [showOtherAnnexes, setShowOtherAnnexes] = useState(false);
    if (!data) return null;
    const r = data;
    return (
      <div style={{ border: '2px solid #ccc', borderRadius: 8, padding: 12 }}>
        <h2 style={{ marginTop: 0 }}>{title}</h2>
        {r.simples && (
          <div style={{ marginBottom: 16 }}>
            <strong>Anexo escolhido:</strong> {r.simples.anexo} | <strong>Fator R:</strong> {(r.simples.factor_r * 100).toFixed(2)}%<br />
            {r.inputs?.annual_revenue > 0 && (
              <div><strong>Alíquota efetiva do escolhido:</strong> {((r.simples.tax_annual / r.inputs.annual_revenue) * 100).toFixed(2)}%</div>
            )}
            {r.simples_scenarios?.decision_reason && (
              <div style={{ marginTop: 8 }}>
                <em>{r.simples_scenarios.decision_reason}</em>
              </div>
            )}
          </div>
        )}
        {r.simples_scenarios && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 16 }}>
            <div style={{ border: '1px solid #ddd', padding: 12, borderRadius: 6 }}>
              <h3>Com Fator R</h3>
              {r.simples_scenarios.with_factor_r.anexo !== 'III' && (
                <div style={{ color: 'red', fontWeight: 'bold' }}>não entra no FATOR R</div>
              )}
              <div>Anexo: {r.simples_scenarios.with_factor_r.anexo}</div>
              <div>Fator R: {(r.simples_scenarios.with_factor_r.factor_r * 100).toFixed(2)}%</div>
              <div>Imposto anual: R$ {r.simples_scenarios.with_factor_r.tax_annual.toLocaleString('pt-BR')}</div>
              <div><strong>Imposto mensal: R$ {r.simples_scenarios.with_factor_r.tax_monthly.toLocaleString('pt-BR')}</strong></div>
              {r.inputs?.annual_revenue > 0 && (
                <div>Alíquota efetiva: {((r.simples_scenarios.with_factor_r.tax_annual / r.inputs.annual_revenue) * 100).toFixed(2)}%</div>
              )}
              {typeof r.simples_scenarios.with_factor_r.total_annual_including_prolabore === 'number' && (
                <>
                  <div style={{ marginTop: 8, fontWeight: 'bold' }}>Total anual (inclui IRRF+INSS do pró-labore): R$ {r.simples_scenarios.with_factor_r.total_annual_including_prolabore.toLocaleString('pt-BR')}</div>
                  <div><strong>Total mensal (inclui IRRF+INSS do pró-labore): R$ {r.simples_scenarios.with_factor_r.total_monthly_including_prolabore.toLocaleString('pt-BR')}</strong></div>
                  {typeof r.simples_scenarios.with_factor_r.total_annual_including_prolabore_irrf50 === 'number' && (
                    <>
                      <div style={{ marginTop: 8, fontWeight: 'bold' }}>Total anual (compensando 50% do IRRF): R$ {r.simples_scenarios.with_factor_r.total_annual_including_prolabore_irrf50.toLocaleString('pt-BR')}</div>
                      <div><strong>Total mensal (compensando 50% do IRRF): R$ {r.simples_scenarios.with_factor_r.total_monthly_including_prolabore_irrf50.toLocaleString('pt-BR')}</strong></div>
                    </>
                  )}
                  <div style={{ marginTop: 8 }}>
                    <div style={{ fontWeight: 'bold' }}>Composição do pró‑labore:</div>
                    <ul style={{ margin: '6px 0 0 18px' }}>
                      <li>INSS mensal: R$ {(r.prolabore?.inss || 0).toLocaleString('pt-BR')} | anual: R$ {(((r.prolabore?.inss || 0) * 12)).toLocaleString('pt-BR')}</li>
                      <li>IRRF mensal: R$ {(r.prolabore?.irrf || 0).toLocaleString('pt-BR')} | anual: R$ {(((r.prolabore?.irrf || 0) * 12)).toLocaleString('pt-BR')}</li>
                    </ul>
                    <div style={{ fontSize: 12, color: '#666', marginTop: 4 }}>
                      Observação: o IRRF do pró‑labore pode ser compensado (ao menos parcialmente) na apuração do IRPF, conforme regras vigentes. Esta simulação inclui um cenário hipotético com 50% de compensação do IRRF.
                    </div>
                  </div>
                </>
              )}
            </div>
            <div style={{ border: '1px solid #ddd', padding: 12, borderRadius: 6 }}>
              <h3>Sem Fator R</h3>
              <div>Anexo: {r.simples_scenarios.without_factor_r.anexo}</div>
              <div>Fator R: {(r.simples_scenarios.without_factor_r.factor_r * 100).toFixed(2)}%</div>
              <div>Imposto anual: R$ {r.simples_scenarios.without_factor_r.tax_annual.toLocaleString('pt-BR')}</div>
              <div><strong>Imposto mensal: R$ {r.simples_scenarios.without_factor_r.tax_monthly.toLocaleString('pt-BR')}</strong></div>
              {r.inputs?.annual_revenue > 0 && (
                <div>Alíquota efetiva: {((r.simples_scenarios.without_factor_r.tax_annual / r.inputs.annual_revenue) * 100).toFixed(2)}%</div>
              )}
            </div>
          </div>
        )}
        {r.simples_all && (
          <div style={{ marginTop: 20 }}>
            <h3>Todos os Anexos (I–V)</h3>
            <div style={{ margin: '8px 0 12px' }}>
              <button type="button" onClick={() => setShowOtherAnnexes((v) => !v)}>
                {showOtherAnnexes ? 'Ocultar anexos I, II e IV' : 'Mostrar anexos I, II e IV'}
              </button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
              {(showOtherAnnexes
                ? Object.entries(r.simples_all)
                : Object.entries(r.simples_all).filter(([anexo]) => anexo === 'III' || anexo === 'V')
              ).map(([anexo, info]) => (
                <div key={anexo} style={{ border: '1px solid #eee', padding: 10, borderRadius: 6 }}>
                  <div style={{ fontWeight: 'bold' }}>Anexo {anexo}</div>
                  <div>Alíquota: {(info.aliquota * 100).toFixed(2)}%</div>
                  <div>Dedução: R$ {info.deduz.toLocaleString('pt-BR')}</div>
                  <div>Imposto anual: R$ {info.tax_annual.toLocaleString('pt-BR')}</div>
                  <div><strong>Imposto mensal: R$ {info.tax_monthly.toLocaleString('pt-BR')}</strong></div>
                  {r.inputs?.annual_revenue > 0 && (
                    <div>Alíquota efetiva: {((info.tax_annual / r.inputs.annual_revenue) * 100).toFixed(2)}%</div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
        {r.presumido && (
          <div style={{ marginTop: 20 }}>
            <h3>Lucro Presumido</h3>
            <div style={{ border: '1px solid #ddd', padding: 12, borderRadius: 6 }}>
              <div>Somente tributos federais (sem ISS) — anual: R$ {(r.presumido.total_annual - (r.presumido.iss || 0)).toLocaleString('pt-BR')}</div>
              <div>Somente tributos federais (sem ISS) — mensal: R$ {(r.presumido.total_monthly - (r.presumido.iss_monthly || 0)).toLocaleString('pt-BR')}</div>
              <div style={{ marginTop: 6, fontWeight: 'bold' }}>Total anual (só federais – Presumido): R$ {(r.presumido.total_annual - (r.presumido.iss || 0)).toLocaleString('pt-BR')}</div>
              <div><strong>Total mensal (só federais – Presumido): R$ {(r.presumido.total_monthly - (r.presumido.iss_monthly || 0)).toLocaleString('pt-BR')}</strong></div>
              <div style={{ marginTop: 6 }}>ISS mensal: R$ {(r.presumido.iss_monthly || 0).toLocaleString('pt-BR')} | ISS anual: R$ {(r.presumido.iss || 0).toLocaleString('pt-BR')}</div>
              <div style={{ marginTop: 6 }}>INSS patronal mensal: R$ {(r.presumido.inss_patronal_monthly || 0).toLocaleString('pt-BR')} | anual: R$ {(r.presumido.inss_patronal_annual || 0).toLocaleString('pt-BR')}</div>
              <div style={{ marginTop: 8, fontWeight: 'bold' }}>Total anual (Presumido + ISS): R$ {r.presumido.total_annual.toLocaleString('pt-BR')}</div>
              <div><strong>Total mensal (Presumido + ISS): R$ {r.presumido.total_monthly.toLocaleString('pt-BR')}</strong></div>
              <div style={{ marginTop: 8, fontWeight: 'bold' }}>Total anual (Presumido + ISS + INSS patronal): R$ {(r.presumido.total_annual_with_patronal || 0).toLocaleString('pt-BR')}</div>
              <div><strong>Total mensal (Presumido + ISS + INSS patronal): R$ {(r.presumido.total_monthly_with_patronal || 0).toLocaleString('pt-BR')}</strong></div>
              {r.inputs?.annual_revenue > 0 && (
                <div>Alíquota efetiva: {((r.presumido.total_annual / r.inputs.annual_revenue) * 100).toFixed(2)}%</div>
              )}
              {/* Totais incluindo pró-labore INSS + IRRF */}
              {typeof r.prolabore?.inss === 'number' && typeof r.prolabore?.irrf === 'number' && (
                <div style={{ marginTop: 8 }}>
                  <div style={{ fontWeight: 'bold' }}>
                    Total anual (inclui IRRF+INSS do pró‑labore): R$ {(r.presumido.total_annual + (r.prolabore.inss + r.prolabore.irrf) * 12).toLocaleString('pt-BR')}
                  </div>
                  <div><strong>
                    Total mensal (inclui IRRF+INSS do pró‑labore): R$ {(r.presumido.total_monthly + (r.prolabore.inss + r.prolabore.irrf)).toLocaleString('pt-BR')}
                  </strong></div>
                  <div style={{ marginTop: 8 }}>
                    <div style={{ fontWeight: 'bold' }}>Composição do pró‑labore:</div>
                    <ul style={{ margin: '6px 0 0 18px' }}>
                      <li>INSS mensal: R$ {(r.prolabore.inss || 0).toLocaleString('pt-BR')} | anual: R$ {((r.prolabore.inss || 0) * 12).toLocaleString('pt-BR')}</li>
                      <li>IRRF mensal: R$ {(r.prolabore.irrf || 0).toLocaleString('pt-BR')} | anual: R$ {((r.prolabore.irrf || 0) * 12).toLocaleString('pt-BR')}</li>
                    </ul>
                    <div style={{ fontSize: 12, color: '#666', marginTop: 4 }}>
                      Observação: o IRRF do pró‑labore pode ser compensado (ao menos parcialmente) na apuração do IRPF, conforme regras vigentes.
                    </div>
                  </div>
                </div>
              )}
              <details style={{ marginTop: 8 }}>
                <summary>Ver detalhamento</summary>
                <ul>
                  <li>Base IRPJ: R$ {r.presumido.base_irpj.toLocaleString('pt-BR')}</li>
                  <li>IRPJ: R$ {r.presumido.irpj.toLocaleString('pt-BR')} ({((r.presumido.rates_used?.irpj_rate || 0) * 100).toFixed(2)}% sobre base presumida de {(r.presumido.rates_used?.presumption_percent_irpj*100 || 0).toFixed(2)}%)</li>
                  <li>IRPJ Adicional: R$ {r.presumido.irpj_adicional.toLocaleString('pt-BR')} ({((r.presumido.rates_used?.irpj_additional_rate || 0) * 100).toFixed(2)}% sobre excedente mensal acima de R$ {(r.presumido.rates_used?.irpj_additional_threshold_monthly || 0).toLocaleString('pt-BR')})</li>
                  <li>CSLL: R$ {r.presumido.csll.toLocaleString('pt-BR')} ({((r.presumido.rates_used?.csll_rate || 0) * 100).toFixed(2)}% sobre base presumida de {(r.presumido.rates_used?.presumption_percent_csll*100 || 0).toFixed(2)}%)</li>
                  <li>PIS: R$ {r.presumido.pis.toLocaleString('pt-BR')} ({((r.presumido.rates_used?.pis_rate || 0) * 100).toFixed(4)}%)</li>
                  <li>COFINS: R$ {r.presumido.cofins.toLocaleString('pt-BR')} ({((r.presumido.rates_used?.cofins_rate || 0) * 100).toFixed(2)}%)</li>
                  <li>ISS: R$ {r.presumido.iss.toLocaleString('pt-BR')} (mensal: R$ {(r.presumido.iss_monthly || 0).toLocaleString('pt-BR')}) ({((r.presumido.rates_used?.iss_rate || 0) * 100).toFixed(2)}% sobre receita mensal)</li>
                  <li>INSS patronal: R$ {(r.presumido.inss_patronal_annual || 0).toLocaleString('pt-BR')} (mensal: R$ {(r.presumido.inss_patronal_monthly || 0).toLocaleString('pt-BR')}) ({((r.presumido.rates_used?.inss_patronal_rate || 0) * 100).toFixed(2)}% sobre base mensal de R$ {(r.presumido.rates_used?.inss_patronal_base_monthly || 0).toLocaleString('pt-BR')})</li>
                </ul>
              </details>
            </div>
          </div>
        )}
        {r.tables_used && (
          <div style={{ marginTop: 24 }}>
            <h3>Tabelas em uso</h3>
            <div style={{ fontSize: 12, color: '#666', marginBottom: 8 }}>
              Fonte: {String(r.tables_used.meta?.source || 'desconhecida')} | Carregado em: {String(r.tables_used.meta?.loaded_at || '')}
            </div>
            <details>
              <summary>Ver anexos (brackets)</summary>
              <pre style={{ whiteSpace: 'pre-wrap' }}>
{JSON.stringify({
  anexo_I: r.tables_used.tables?.anexo_I,
  anexo_II: r.tables_used.tables?.anexo_II,
  anexo_III: r.tables_used.tables?.anexo_III,
  anexo_IV: r.tables_used.tables?.anexo_IV,
  anexo_V: r.tables_used.tables?.anexo_V,
}, null, 2)}
              </pre>
            </details>
            <details style={{ marginTop: 8 }}>
              <summary>Ver tabela IRRF</summary>
              <pre style={{ whiteSpace: 'pre-wrap' }}>
{JSON.stringify(r.tables_used.tables?.irrf_table, null, 2)}
              </pre>
            </details>
          </div>
        )}
      </div>
    );
  };

  return (
  <div style={{ padding: 20, maxWidth: 1000 }}>
      <h1>Comparador Tributário</h1>
      <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 8 }}>
        <label>
          Receita mensal:
          <input
            type="text"
            step="0.01"
            name="monthly_revenue"
            value={inputs.monthly_revenue}
            onChange={handleChange}
            onBlur={handleNumberBlur('monthly_revenue')}
          />
        </label>
        <label>
          Receita anual:
          <input
            type="text"
            step="0.01"
            name="annual_revenue"
            value={inputs.annual_revenue}
            onChange={handleChange}
            onBlur={handleNumberBlur('annual_revenue')}
          />
        </label>
        <label>
          Folha anual:
          <input
            type="text"
            step="0.01"
            name="annual_payroll"
            value={inputs.annual_payroll}
            onChange={handleChange}
            onBlur={handleNumberBlur('annual_payroll')}
          />
        </label>
        <fieldset style={{ border: '1px solid #ddd', borderRadius: 6, padding: 8 }}>
          <legend>Pró‑labore (comparar dois cenários)</legend>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <label>
              Pró‑labore A (mensal):
              <input
                type="text"
                step="0.01"
                name="pro_labore_monthly_a"
                value={inputs.pro_labore_monthly_a}
                onChange={handleChange}
                onBlur={handleNumberBlur('pro_labore_monthly_a')}
              />
            </label>
            <label>
              Pró‑labore B (mensal):
              <input
                type="text"
                step="0.01"
                name="pro_labore_monthly_b"
                value={inputs.pro_labore_monthly_b}
                onChange={handleChange}
                onBlur={handleNumberBlur('pro_labore_monthly_b')}
              />
            </label>
          </div>
        </fieldset>
        <label>
          ISS (%) no Presumido:
          <input
            type="text"
            step="0.01"
            name="iss_rate_percent"
            value={inputs.iss_rate_percent}
            onChange={handleChange}
            onBlur={handleNumberBlur('iss_rate_percent')}
          />
          <span style={{ fontSize: 12, color: '#666', marginLeft: 6 }}>(geralmente 2% a 5%)</span>
        </label>
        <label>
          INSS Patronal (% sobre folha + pró‑labore):
          <input
            type="text"
            step="0.01"
            name="inss_patronal_percent"
            value={inputs.inss_patronal_percent}
            onChange={handleChange}
            onBlur={handleNumberBlur('inss_patronal_percent')}
          />
          <span style={{ fontSize: 12, color: '#666', marginLeft: 6 }}>padrão ~20% (pode variar com RAT/terceiros)</span>
        </label>
        <label>
          Atividade:
          <select name="atividade" value={inputs.atividade} onChange={handleChange}>
            <option value="servicos">Serviços</option>
            <option value="outras">Outras</option>
          </select>
        </label>
        <button type="submit" disabled={loading}>
          {loading ? 'Calculando…' : 'Calcular'}
        </button>
      </form>
      {error && (
        <div style={{ color: 'red', marginTop: 12 }}>Erro: {error}</div>
      )}
      {results && results.length > 0 && (
        <div style={{ marginTop: 20 }}>
          <h2>Resultados</h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <CalcView title={`Cálculo A (Pró‑labore ${inputs.pro_labore_monthly_a})`} data={results[0]} />
            <CalcView title={`Cálculo B (Pró‑labore ${inputs.pro_labore_monthly_b})`} data={results[1]} />
          </div>
        </div>
      )}
    </div>
  );
}

export default CompareForm;

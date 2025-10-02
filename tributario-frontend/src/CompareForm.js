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
    pro_labore_monthly_a: '0',
    pro_labore_monthly_b: '16.000',
    iss_rate_percent: '2,00',
    inss_patronal_percent: '20,00',
    atividade: 'servicos',
  });
  
  const [displayOptions, setDisplayOptions] = useState({
    showCalculoA: true,
    showCalculoB: true,
    showPresumido: true,
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

  const CalcView = ({ title, data, bgColor }) => {
    const [showProLaboreDetails, setShowProLaboreDetails] = useState(false);
    const [showOtherAnnexes, setShowOtherAnnexes] = useState(false);
    
    if (!data) return null;
    const r = data;
    
    return (
      <div style={{ border: '2px solid #ccc', borderRadius: 8, padding: 16, backgroundColor: bgColor }}>
        <h2 style={{ marginTop: 0, color: '#1976d2' }}>{title}</h2>
        
        {/* Anexo Escolhido */}
        {r.simples && (
          <div style={{ marginBottom: 16, padding: 12, backgroundColor: 'rgba(255,255,255,0.7)', borderRadius: 6 }}>
            <strong>Anexo escolhido:</strong> {r.simples.anexo} | <strong>Fator R:</strong> {(r.simples.factor_r * 100).toFixed(2)}%<br />
            {r.inputs?.annual_revenue > 0 && (
              <div><strong>Alíquota efetiva do escolhido:</strong> {((r.simples.tax_annual / r.inputs.annual_revenue) * 100).toFixed(2)}%</div>
            )}
            {r.simples_scenarios?.decision_reason && (
              <div style={{ marginTop: 8, fontStyle: 'italic', color: '#666' }}>
                {r.simples_scenarios.decision_reason}
              </div>
            )}
          </div>
        )}

        {/* Com/Sem Fator R */}
        {r.simples_scenarios && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
            {/* Com Fator R */}
            <div style={{ backgroundColor: '#e3f2fd', padding: 12, borderRadius: 6 }}>
              <h3 style={{ marginTop: 0, color: '#1565c0' }}>Com Fator R</h3>
              {r.simples_scenarios.with_factor_r.anexo !== 'III' && (
                <div style={{ color: 'red', fontWeight: 'bold', marginBottom: 8 }}>não entra no FATOR R</div>
              )}
              <div><strong>Anexo:</strong> {r.simples_scenarios.with_factor_r.anexo}</div>
              <div><strong>Fator R:</strong> {(r.simples_scenarios.with_factor_r.factor_r * 100).toFixed(2)}%</div>
              <div><strong>Imposto mensal:</strong> R$ {r.simples_scenarios.with_factor_r.tax_monthly.toLocaleString('pt-BR')}</div>
              <div><strong>Imposto anual:</strong> R$ {r.simples_scenarios.with_factor_r.tax_annual.toLocaleString('pt-BR')}</div>
              {r.inputs?.annual_revenue > 0 && (
                <div><strong>Alíquota efetiva:</strong> {((r.simples_scenarios.with_factor_r.tax_annual / r.inputs.annual_revenue) * 100).toFixed(2)}%</div>
              )}
              
              {/* Com pró-labore */}
              {typeof r.simples_scenarios.with_factor_r.total_monthly_including_prolabore === 'number' && (
                <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid #90caf9' }}>
                  <div style={{ fontWeight: 'bold' }}>Total mensal (inclui IRRF+INSS do pró-labore):</div>
                  <div style={{ fontSize: '1.1em', color: '#0d47a1' }}>R$ {r.simples_scenarios.with_factor_r.total_monthly_including_prolabore.toLocaleString('pt-BR')}</div>
                  <div style={{ fontWeight: 'bold', marginTop: 4 }}>Total anual (inclui IRRF+INSS do pró-labore):</div>
                  <div>R$ {r.simples_scenarios.with_factor_r.total_annual_including_prolabore.toLocaleString('pt-BR')}</div>
                  
                  {/* Detalhes do pró-labore */}
                  <div style={{ marginTop: 8 }}>
                    <button
                      type="button"
                      onClick={() => setShowProLaboreDetails(!showProLaboreDetails)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#1976d2',
                        cursor: 'pointer',
                        padding: 0,
                        textDecoration: 'underline'
                      }}
                    >
                      {showProLaboreDetails ? '▼' : '▶'} Composição do pró-labore:
                    </button>
                    {showProLaboreDetails && (
                      <div style={{ marginTop: 8, paddingLeft: 16 }}>
                        <div><strong>INSS mensal:</strong> R$ {(r.prolabore?.inss || 0).toLocaleString('pt-BR')} | <strong>anual:</strong> R$ {(((r.prolabore?.inss || 0) * 12)).toLocaleString('pt-BR')}</div>
                        <div><strong>INSS Patronal mensal:</strong> R$ {(r.presumido?.inss_patronal_monthly || 0).toLocaleString('pt-BR')} | <strong>anual:</strong> R$ {(r.presumido?.inss_patronal_annual || 0).toLocaleString('pt-BR')}</div>
                        <div><strong>IRRF mensal:</strong> R$ {(r.prolabore?.irrf || 0).toLocaleString('pt-BR')} | <strong>anual:</strong> R$ {(((r.prolabore?.irrf || 0) * 12)).toLocaleString('pt-BR')}</div>
                        <div style={{ fontSize: 12, color: '#666', marginTop: 8 }}>
                          Observação: o IRRF do pró-labore pode ser compensado (ao menos parcialmente) na apuração do IRPF.
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Sem Fator R */}
            <div style={{ backgroundColor: '#f5f5f5', padding: 12, borderRadius: 6 }}>
              <h3 style={{ marginTop: 0, color: '#616161' }}>Sem Fator R</h3>
              <div><strong>Anexo:</strong> {r.simples_scenarios.without_factor_r.anexo}</div>
              <div><strong>Fator R:</strong> {(r.simples_scenarios.without_factor_r.factor_r * 100).toFixed(2)}%</div>
              <div><strong>Imposto mensal:</strong> R$ {r.simples_scenarios.without_factor_r.tax_monthly.toLocaleString('pt-BR')}</div>
              <div><strong>Imposto anual:</strong> R$ {r.simples_scenarios.without_factor_r.tax_annual.toLocaleString('pt-BR')}</div>
              {r.inputs?.annual_revenue > 0 && (
                <div><strong>Alíquota efetiva:</strong> {((r.simples_scenarios.without_factor_r.tax_annual / r.inputs.annual_revenue) * 100).toFixed(2)}%</div>
              )}
            </div>
          </div>
        )}

        {/* Todos os Anexos */}
        {r.simples_all && displayOptions.showPresumido && (
          <div style={{ marginTop: 16 }}>
            <h3>Todos os Anexos (I–V)</h3>
            <div style={{ margin: '8px 0 12px' }}>
              <button 
                type="button" 
                onClick={() => setShowOtherAnnexes(!showOtherAnnexes)}
                style={{
                  padding: '6px 12px',
                  backgroundColor: '#90caf9',
                  color: 'white',
                  border: 'none',
                  borderRadius: 4,
                  cursor: 'pointer'
                }}
              >
                {showOtherAnnexes ? 'Ocultar anexos I, II e IV' : 'Mostrar anexos I, II e IV'}
              </button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
              {(showOtherAnnexes
                ? Object.entries(r.simples_all)
                : Object.entries(r.simples_all).filter(([anexo]) => anexo === 'III' || anexo === 'V')
              ).map(([anexo, info]) => (
                <div key={anexo} style={{ backgroundColor: '#fff3e0', padding: 10, borderRadius: 6, border: '1px solid #ffb74d' }}>
                  <div style={{ fontWeight: 'bold', color: '#e65100' }}>Anexo {anexo}</div>
                  <div><strong>Alíquota:</strong> {(info.aliquota * 100).toFixed(2)}%</div>
                  <div><strong>Dedução:</strong> R$ {info.deduz.toLocaleString('pt-BR')}</div>
                  <div><strong>Imposto mensal:</strong> R$ {info.tax_monthly.toLocaleString('pt-BR')}</div>
                  <div><strong>Imposto anual:</strong> R$ {info.tax_annual.toLocaleString('pt-BR')}</div>
                  {r.inputs?.annual_revenue > 0 && (
                    <div><strong>Alíquota efetiva:</strong> {((info.tax_annual / r.inputs.annual_revenue) * 100).toFixed(2)}%</div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Lucro Presumido */}
        {r.presumido && displayOptions.showPresumido && (
          <div style={{ marginTop: 16 }}>
            <h3>Lucro Presumido</h3>
            <div style={{ backgroundColor: '#fffde7', padding: 12, borderRadius: 6, border: '1px solid #fdd835' }}>
              <div><strong>Total mensal (só federais):</strong> R$ {(r.presumido.total_monthly - (r.presumido.iss_monthly || 0)).toLocaleString('pt-BR')}</div>
              <div><strong>Total anual (só federais):</strong> R$ {(r.presumido.total_annual - (r.presumido.iss || 0)).toLocaleString('pt-BR')}</div>
              
              <div style={{ marginTop: 8, paddingTop: 8, borderTop: '1px dashed #fbc02d' }}>
                <div><strong>ISS mensal:</strong> R$ {(r.presumido.iss_monthly || 0).toLocaleString('pt-BR')} | <strong>anual:</strong> R$ {(r.presumido.iss || 0).toLocaleString('pt-BR')}</div>
              </div>
              
              <div style={{ marginTop: 8, paddingTop: 8, borderTop: '1px dashed #fbc02d' }}>
                <div><strong>Total mensal (Presumido + ISS):</strong> R$ {r.presumido.total_monthly.toLocaleString('pt-BR')}</div>
                <div><strong>Total anual (Presumido + ISS):</strong> R$ {r.presumido.total_annual.toLocaleString('pt-BR')}</div>
              </div>
              
              <div style={{ marginTop: 8, paddingTop: 8, borderTop: '1px dashed #fbc02d' }}>
                <div><strong>INSS Patronal mensal:</strong> R$ {(r.presumido.inss_patronal_monthly || 0).toLocaleString('pt-BR')} | <strong>anual:</strong> R$ {(r.presumido.inss_patronal_annual || 0).toLocaleString('pt-BR')}</div>
              </div>
              
              <div style={{ marginTop: 8, paddingTop: 8, borderTop: '1px solid #fbc02d', fontWeight: 'bold' }}>
                <div style={{ fontSize: '1.1em', color: '#f57f17' }}>Total mensal (Presumido + ISS + INSS patronal):</div>
                <div style={{ fontSize: '1.2em', color: '#e65100' }}>R$ {(r.presumido.total_monthly_with_patronal || 0).toLocaleString('pt-BR')}</div>
                <div style={{ marginTop: 4 }}>Total anual (Presumido + ISS + INSS patronal):</div>
                <div>R$ {(r.presumido.total_annual_with_patronal || 0).toLocaleString('pt-BR')}</div>
              </div>

              {/* Com pró-labore */}
              {typeof r.prolabore?.inss === 'number' && typeof r.prolabore?.irrf === 'number' && (
                <div style={{ marginTop: 12, paddingTop: 12, borderTop: '2px solid #fbc02d' }}>
                  <div style={{ fontWeight: 'bold' }}>Total mensal (inclui IRRF+INSS do pró-labore):</div>
                  <div style={{ fontSize: '1.1em', color: '#e65100' }}>
                    R$ {(r.presumido.total_monthly_with_patronal + (r.prolabore.inss + r.prolabore.irrf)).toLocaleString('pt-BR')}
                  </div>
                  <div style={{ fontWeight: 'bold', marginTop: 4 }}>Total anual (inclui IRRF+INSS do pró-labore):</div>
                  <div>
                    R$ {(r.presumido.total_annual_with_patronal + (r.prolabore.inss + r.prolabore.irrf) * 12).toLocaleString('pt-BR')}
                  </div>
                  
                  {/* Detalhes do pró-labore */}
                  <div style={{ marginTop: 8 }}>
                    <button
                      type="button"
                      onClick={() => setShowProLaboreDetails(!showProLaboreDetails)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#f57f17',
                        cursor: 'pointer',
                        padding: 0,
                        textDecoration: 'underline'
                      }}
                    >
                      {showProLaboreDetails ? '▼' : '▶'} Composição do pró-labore:
                    </button>
                    {showProLaboreDetails && (
                      <div style={{ marginTop: 8, paddingLeft: 16 }}>
                        <div><strong>INSS (Previdência Pública) mensal:</strong> R$ {(r.prolabore.inss || 0).toLocaleString('pt-BR')} | <strong>anual:</strong> R$ {((r.prolabore.inss || 0) * 12).toLocaleString('pt-BR')}</div>
                        <div><strong>INSS Patronal mensal:</strong> R$ {(r.presumido.inss_patronal_monthly || 0).toLocaleString('pt-BR')} | <strong>anual:</strong> R$ {(r.presumido.inss_patronal_annual || 0).toLocaleString('pt-BR')}</div>
                        <div><strong>IRRF mensal:</strong> R$ {(r.prolabore.irrf || 0).toLocaleString('pt-BR')} | <strong>anual:</strong> R$ {((r.prolabore.irrf || 0) * 12).toLocaleString('pt-BR')}</div>
                        <div style={{ fontSize: 12, color: '#666', marginTop: 8 }}>
                          Observação: o IRRF do pró-labore pode ser compensado (ao menos parcialmente) na apuração do IRPF.
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
              
              {r.inputs?.annual_revenue > 0 && (
                <div style={{ marginTop: 8 }}><strong>Alíquota efetiva:</strong> {((r.presumido.total_annual / r.inputs.annual_revenue) * 100).toFixed(2)}%</div>
              )}
              
              <details style={{ marginTop: 12 }}>
                <summary style={{ cursor: 'pointer', color: '#f57f17', fontWeight: 'bold' }}>Ver detalhamento</summary>
                <ul style={{ marginTop: 8 }}>
                  <li><strong>Base IRPJ:</strong> R$ {r.presumido.base_irpj.toLocaleString('pt-BR')}</li>
                  <li><strong>IRPJ:</strong> R$ {r.presumido.irpj.toLocaleString('pt-BR')} ({((r.presumido.rates_used?.irpj_rate || 0) * 100).toFixed(2)}% sobre base presumida de {(r.presumido.rates_used?.presumption_percent_irpj*100 || 0).toFixed(2)}%)</li>
                  <li><strong>IRPJ Adicional:</strong> R$ {r.presumido.irpj_adicional.toLocaleString('pt-BR')} ({((r.presumido.rates_used?.irpj_additional_rate || 0) * 100).toFixed(2)}% sobre excedente)</li>
                  <li><strong>CSLL:</strong> R$ {r.presumido.csll.toLocaleString('pt-BR')} ({((r.presumido.rates_used?.csll_rate || 0) * 100).toFixed(2)}% sobre base presumida de {(r.presumido.rates_used?.presumption_percent_csll*100 || 0).toFixed(2)}%)</li>
                  <li><strong>PIS:</strong> R$ {r.presumido.pis.toLocaleString('pt-BR')} ({((r.presumido.rates_used?.pis_rate || 0) * 100).toFixed(4)}%)</li>
                  <li><strong>COFINS:</strong> R$ {r.presumido.cofins.toLocaleString('pt-BR')} ({((r.presumido.rates_used?.cofins_rate || 0) * 100).toFixed(2)}%)</li>
                  <li><strong>ISS:</strong> R$ {r.presumido.iss.toLocaleString('pt-BR')} (mensal: R$ {(r.presumido.iss_monthly || 0).toLocaleString('pt-BR')}) ({((r.presumido.rates_used?.iss_rate || 0) * 100).toFixed(2)}%)</li>
                  <li><strong>INSS patronal:</strong> R$ {(r.presumido.inss_patronal_annual || 0).toLocaleString('pt-BR')} (mensal: R$ {(r.presumido.inss_patronal_monthly || 0).toLocaleString('pt-BR')}) ({((r.presumido.rates_used?.inss_patronal_rate || 0) * 100).toFixed(2)}%)</li>
                </ul>
              </details>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div style={{ padding: 20, maxWidth: 1400 }}>
      <h1>Planejamento Tributário</h1>
      
      <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 12, marginBottom: 20 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 12 }}>
          <label>
            <strong>Receita mensal:</strong>
            <input
              type="text"
              name="monthly_revenue"
              value={inputs.monthly_revenue}
              onChange={handleChange}
              onBlur={handleNumberBlur('monthly_revenue')}
              style={{ width: '100%', padding: 8, marginTop: 4 }}
            />
          </label>
          <label>
            <strong>Receita anual:</strong>
            <input
              type="text"
              name="annual_revenue"
              value={inputs.annual_revenue}
              onChange={handleChange}
              onBlur={handleNumberBlur('annual_revenue')}
              style={{ width: '100%', padding: 8, marginTop: 4 }}
            />
          </label>
          <label>
            <strong>Folha anual:</strong>
            <input
              type="text"
              name="annual_payroll"
              value={inputs.annual_payroll}
              onChange={handleChange}
              onBlur={handleNumberBlur('annual_payroll')}
              style={{ width: '100%', padding: 8, marginTop: 4 }}
            />
          </label>
        </div>

        <fieldset style={{ border: '2px solid #90caf9', borderRadius: 8, padding: 12, backgroundColor: '#e3f2fd' }}>
          <legend style={{ fontWeight: 'bold', color: '#1976d2' }}>Pró-labore (comparar dois cenários)</legend>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <label>
              <strong>Pró-labore A (mensal):</strong>
              <input
                type="text"
                name="pro_labore_monthly_a"
                value={inputs.pro_labore_monthly_a}
                onChange={handleChange}
                onBlur={handleNumberBlur('pro_labore_monthly_a')}
                style={{ width: '100%', padding: 8, marginTop: 4 }}
              />
            </label>
            <label>
              <strong>Pró-labore B (mensal):</strong>
              <input
                type="text"
                name="pro_labore_monthly_b"
                value={inputs.pro_labore_monthly_b}
                onChange={handleChange}
                onBlur={handleNumberBlur('pro_labore_monthly_b')}
                style={{ width: '100%', padding: 8, marginTop: 4 }}
              />
            </label>
          </div>
        </fieldset>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 12 }}>
          <label>
            <strong>ISS (%) no Presumido:</strong>
            <input
              type="text"
              name="iss_rate_percent"
              value={inputs.iss_rate_percent}
              onChange={handleChange}
              onBlur={handleNumberBlur('iss_rate_percent')}
              style={{ width: '100%', padding: 8, marginTop: 4 }}
            />
            <span style={{ fontSize: 12, color: '#666' }}>(geralmente 2% a 5%)</span>
          </label>
          <label>
            <strong>INSS Patronal (%):</strong>
            <input
              type="text"
              name="inss_patronal_percent"
              value={inputs.inss_patronal_percent}
              onChange={handleChange}
              onBlur={handleNumberBlur('inss_patronal_percent')}
              style={{ width: '100%', padding: 8, marginTop: 4 }}
            />
            <span style={{ fontSize: 12, color: '#666' }}>(padrão ~20%)</span>
          </label>
          <label>
            <strong>Atividade:</strong>
            <select 
              name="atividade" 
              value={inputs.atividade} 
              onChange={handleChange}
              style={{ width: '100%', padding: 8, marginTop: 4 }}
            >
              <option value="servicos">Serviços</option>
              <option value="outras">Outras</option>
            </select>
          </label>
        </div>

        <button 
          type="submit" 
          disabled={loading}
          style={{
            padding: '12px 24px',
            backgroundColor: loading ? '#ccc' : '#1976d2',
            color: 'white',
            border: 'none',
            borderRadius: 8,
            fontSize: '1.1em',
            fontWeight: 'bold',
            cursor: loading ? 'not-allowed' : 'pointer'
          }}
        >
          {loading ? 'Calculando…' : 'Calcular'}
        </button>
      </form>

      {error && (
        <div style={{ 
          color: 'white', 
          backgroundColor: '#d32f2f', 
          padding: 12, 
          borderRadius: 8,
          marginBottom: 20 
        }}>
          <strong>Erro:</strong> {error}
        </div>
      )}

      {results && results.length > 0 && (
        <>
          {/* Opções de Exibição */}
          <div style={{ 
            marginBottom: 20, 
            padding: 16, 
            backgroundColor: '#f5f5f5', 
            borderRadius: 8,
            border: '2px solid #90caf9'
          }}>
            <h3 style={{ marginTop: 0 }}>Opções de Exibição:</h3>
            <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
              <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={displayOptions.showCalculoA}
                  onChange={(e) => setDisplayOptions({ ...displayOptions, showCalculoA: e.target.checked })}
                  style={{ marginRight: 8, transform: 'scale(1.2)' }}
                />
                <strong>Cálculo A (Pró-labore {inputs.pro_labore_monthly_a})</strong>
              </label>
              <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={displayOptions.showCalculoB}
                  onChange={(e) => setDisplayOptions({ ...displayOptions, showCalculoB: e.target.checked })}
                  style={{ marginRight: 8, transform: 'scale(1.2)' }}
                />
                <strong>Cálculo B (Pró-labore {inputs.pro_labore_monthly_b})</strong>
              </label>
              <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={displayOptions.showPresumido}
                  onChange={(e) => setDisplayOptions({ ...displayOptions, showPresumido: e.target.checked })}
                  style={{ marginRight: 8, transform: 'scale(1.2)' }}
                />
                <strong>Mostrar Presumido</strong>
              </label>
            </div>
          </div>

          <h2>Resultados</h2>
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: displayOptions.showCalculoA && displayOptions.showCalculoB ? '1fr 1fr' : '1fr',
            gap: 16 
          }}>
            {displayOptions.showCalculoA && (
              <CalcView 
                title={`Cálculo A (Pró-labore ${inputs.pro_labore_monthly_a})`} 
                data={results[0]} 
                bgColor="#fafafa"
              />
            )}
            {displayOptions.showCalculoB && (
              <CalcView 
                title={`Cálculo B (Pró-labore ${inputs.pro_labore_monthly_b})`} 
                data={results[1]} 
                bgColor="#f5f5f5"
              />
            )}
          </div>
        </>
      )}
    </div>
  );
}

export default CompareForm;

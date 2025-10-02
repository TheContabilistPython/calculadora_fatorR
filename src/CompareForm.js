import React, { useState } from "react";

function CompareForm() {
  const [inputs, setInputs] = useState({
    monthly_revenue: 50000,
    annual_revenue: 600000,
    annual_payroll: 180000,
    pro_labore_monthly: 8000,
    atividade: "servicos"
  });
  const [result, setResult] = useState(null);

  const handleChange = (e) => {
    setInputs({ ...inputs, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const res = await fetch("http://127.0.0.1:5000/compare", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(inputs),
    });
    const data = await res.json();
    setResult(data);
  };

  return (
    <div style={{ padding: "20px" }}>
      <h1>Comparador Tributário</h1>
      <form onSubmit={handleSubmit}>
        <label>Receita mensal:</label>
        <input type="number" name="monthly_revenue" value={inputs.monthly_revenue} onChange={handleChange} /><br />

        <label>Receita anual:</label>
        <input type="number" name="annual_revenue" value={inputs.annual_revenue} onChange={handleChange} /><br />

        <label>Folha anual:</label>
        <input type="number" name="annual_payroll" value={inputs.annual_payroll} onChange={handleChange} /><br />

        <label>Pró-labore mensal:</label>
        <input type="number" name="pro_labore_monthly" value={inputs.pro_labore_monthly} onChange={handleChange} /><br />

        <button type="submit">Calcular</button>
      </form>

      {result && (
        <div style={{ marginTop: "20px" }}>
          <h2>Resultado</h2>
          <pre>{JSON.stringify(result, null, 2)}</pre>
        </div>
      )}
    </div>
  );
}

export default CompareForm;

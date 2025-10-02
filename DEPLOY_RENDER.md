# Calculadora Tributária - Deploy no Render

## 📋 Pré-requisitos

1. Conta no GitHub
2. Conta no Render (gratuita): https://render.com
3. Código commitado em um repositório Git

## 🚀 Passo a Passo para Deploy

### 1. Preparar o Repositório Git

```bash
cd C:\Users\suporte\Documents\calculo_tributario

# Inicializar git (se ainda não tiver)
git init

# Criar .gitignore
echo "venv/" > .gitignore
echo "__pycache__/" >> .gitignore
echo "*.pyc" >> .gitignore
echo "node_modules/" >> .gitignore
echo ".env.local" >> .gitignore

# Adicionar arquivos
git add .
git commit -m "Preparar para deploy no Render"

# Criar repositório no GitHub e fazer push
# (Você precisa criar o repositório no GitHub primeiro)
git remote add origin https://github.com/SEU_USUARIO/calculo-tributario.git
git branch -M main
git push -u origin main
```

### 2. Deploy do Backend (Flask API)

1. Entre no Render: https://dashboard.render.com
2. Clique em **"New +"** → **"Web Service"**
3. Conecte seu repositório GitHub
4. Configure:
   - **Name**: `calculo-tributario-api`
   - **Environment**: `Python 3`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `python app.py`
   - **Plan**: `Free`
5. Em **Environment Variables**, adicione:
   - `PYTHON_VERSION` = `3.11.0`
6. Clique em **"Create Web Service"**

**Aguarde o deploy terminar!** Você receberá uma URL como:
```
https://calculo-tributario-api.onrender.com
```

### 3. Deploy do Frontend (React)

1. No Render, clique em **"New +"** → **"Static Site"**
2. Conecte o mesmo repositório GitHub
3. Configure:
   - **Name**: `calculo-tributario-frontend`
   - **Root Directory**: `tributario-frontend`
   - **Build Command**: `npm install && npm run build`
   - **Publish Directory**: `build`
   - **Plan**: `Free`
4. Em **Environment Variables**, adicione:
   - `REACT_APP_API_URL` = `https://calculo-tributario-api.onrender.com`
     (Use a URL do backend que você recebeu no passo 2)
5. Clique em **"Create Static Site"**

**Aguarde o build terminar!** Você receberá uma URL como:
```
https://calculo-tributario-frontend.onrender.com
```

### 4. Testar

Acesse a URL do frontend e teste a calculadora!

## ⚠️ Importante - Plano Gratuito do Render

O plano gratuito tem algumas limitações:

1. **Backend "dorme" após 15 minutos de inatividade**
   - Primeira requisição pode demorar 30-60 segundos para "acordar"
   - Requisições seguintes são rápidas

2. **750 horas/mês de uptime grátis**
   - Suficiente para uso normal

3. **Build pode demorar 5-10 minutos**

## 🔄 Atualizações

Para atualizar o site:

```bash
# Faça suas alterações no código
git add .
git commit -m "Descrição das mudanças"
git push

# O Render vai fazer deploy automaticamente!
```

## 🆘 Troubleshooting

### Backend retorna erro 500
- Veja os logs no Render Dashboard
- Verifique se todas as dependências estão no `requirements.txt`

### Frontend não conecta com backend
- Verifique se `REACT_APP_API_URL` está corretamente configurada
- A variável deve apontar para a URL do backend no Render

### Build falha
- Verifique os logs de build no Render
- Teste localmente primeiro: `npm run build`

## 📱 Para uso local

```bash
# Backend
cd C:\Users\suporte\Documents\calculo_tributario
& C:/Users/suporte/Documents/calculo_tributario/venv/Scripts/Activate.ps1
python app.py

# Frontend (outro terminal)
cd C:\Users\suporte\Documents\calculo_tributario\tributario-frontend
npm start
```

## 🌐 URLs

**Local:**
- Frontend: http://192.168.1.142:3000
- Backend: http://192.168.1.142:5000

**Produção (Render):**
- Frontend: https://calculo-tributario-frontend.onrender.com
- Backend: https://calculo-tributario-api.onrender.com

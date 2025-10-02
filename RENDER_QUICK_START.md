# 🚀 Como Hospedar no Render - GUIA RÁPIDO

## ✅ Arquivos Criados

- `render.yaml` - Configuração automática do Render
- `Procfile` - Instruções de inicialização
- `.gitignore` - Arquivos a ignorar no Git
- `DEPLOY_RENDER.md` - Guia completo de deploy
- `prepare-deploy.ps1` - Script de preparação
- `.env.example` - Exemplo de variáveis de ambiente

## 📝 Resumo Rápido

### 1️⃣ Preparar Git e GitHub (5 min)

```powershell
# Execute o script automático
.\prepare-deploy.ps1

# Depois, crie repo no GitHub e faça push
git remote add origin https://github.com/SEU_USUARIO/seu-repo.git
git branch -M main
git push -u origin main
```

### 2️⃣ Deploy no Render (10 min)

**Backend (API):**
1. Render → New Web Service
2. Conectar GitHub
3. Build: `pip install -r requirements.txt`
4. Start: `python app.py`
5. Copiar URL (ex: `https://seu-app-api.onrender.com`)

**Frontend:**
1. Render → New Static Site
2. Root: `tributario-frontend`
3. Build: `npm install && npm run build`
4. Publish: `build`
5. Variável: `REACT_APP_API_URL` = URL do backend

### 3️⃣ Pronto! 🎉

Site estará em: `https://seu-app-frontend.onrender.com`

## 💰 Custo

**GRATUITO!** Plano free inclui:
- 750 horas/mês
- Backend + Frontend
- SSL automático
- ⚠️ Backend "dorme" após 15 min inativo

## 🔄 Atualizar Site

```bash
git add .
git commit -m "Suas mudanças"
git push
# Deploy automático! ✨
```

## 📚 Mais Detalhes

Veja `DEPLOY_RENDER.md` para:
- Troubleshooting
- Configurações avançadas
- URLs de teste

## ⚡ Testando Localmente Agora

O código já está preparado para usar variáveis de ambiente!

Reinicie o frontend:
```powershell
# No terminal do frontend, pressione Ctrl+C
# Depois:
npm start
```

O site continuará funcionando localmente em:
- Frontend: http://192.168.1.142:3000
- Backend: http://192.168.1.142:5000

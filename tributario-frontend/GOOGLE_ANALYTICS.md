# 📊 Como Configurar Google Analytics

## Passo 1: Criar Conta no Google Analytics

1. Acesse: https://analytics.google.com/
2. Clique em **"Começar a medir"** (ou "Start measuring")
3. Crie uma **Conta** (ex: "Pronta Contabilidade")
4. Crie uma **Propriedade** (ex: "Planejamento Tributário")
5. Selecione **"Web"** como plataforma
6. Digite a URL: `https://calculo-tributario-frontend.onrender.com`
7. Copie o **ID de medição** (formato: `G-XXXXXXXXXX`)

## Passo 2: Configurar no Render

1. Acesse: https://dashboard.render.com
2. Clique no serviço **calculo-tributario-frontend**
3. Vá em **"Environment"** (menu lateral)
4. Clique em **"Add Environment Variable"**
5. Adicione:
   - **Key:** `REACT_APP_GA_MEASUREMENT_ID`
   - **Value:** `G-XXXXXXXXXX` (seu ID do Google Analytics)
6. Clique em **"Save Changes"**
7. Aguarde o redeploy automático (~3-5 minutos)

## Passo 3: Verificar Funcionamento

1. Acesse: `https://calculo-tributario-frontend.onrender.com/`
2. Abra o **Console do Navegador** (F12)
3. Vá na aba **"Network"**
4. Procure por requisições para `google-analytics.com` ou `googletagmanager.com`
5. No Google Analytics, vá em **"Relatórios" → "Tempo real"**
6. Você deve ver sua visita aparecendo em tempo real!

## 📈 O que você poderá ver no Google Analytics:

- ✅ Número de visitantes (únicos e totais)
- ✅ Páginas mais acessadas
- ✅ Tempo médio de permanência
- ✅ Localização geográfica dos visitantes
- ✅ Dispositivos utilizados (desktop, mobile, tablet)
- ✅ Navegadores e sistemas operacionais
- ✅ Horários de pico de acesso
- ✅ Taxa de rejeição (bounce rate)

## 🔒 Privacidade

O Google Analytics coleta apenas dados anônimos:
- Não identifica nome ou email dos visitantes
- Apenas rastreia comportamento de navegação
- Respeita as leis de privacidade (LGPD/GDPR)

## 🆘 Troubleshooting

Se o Analytics não aparecer:
1. Verifique se a variável `REACT_APP_GA_MEASUREMENT_ID` está configurada no Render
2. Limpe o cache do navegador (Ctrl + Shift + R)
3. Aguarde até 24h para dados aparecerem nos relatórios (tempo real funciona imediatamente)
4. Verifique se o ID está correto (formato: G-XXXXXXXXXX)

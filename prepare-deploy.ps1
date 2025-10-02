# Script para preparar deploy no Render

Write-Host "==================================" -ForegroundColor Cyan
Write-Host "Preparando projeto para o Render" -ForegroundColor Cyan
Write-Host "==================================" -ForegroundColor Cyan
Write-Host ""

# 1. Verificar se Git está instalado
Write-Host "1. Verificando Git..." -ForegroundColor Yellow
try {
    git --version | Out-Null
    Write-Host "   ✓ Git instalado" -ForegroundColor Green
} catch {
    Write-Host "   ✗ Git não encontrado. Instale em: https://git-scm.com" -ForegroundColor Red
    exit 1
}

# 2. Inicializar repositório
Write-Host ""
Write-Host "2. Inicializando repositório Git..." -ForegroundColor Yellow
if (Test-Path ".git") {
    Write-Host "   ✓ Repositório já existe" -ForegroundColor Green
} else {
    git init
    Write-Host "   ✓ Repositório criado" -ForegroundColor Green
}

# 3. Adicionar arquivos
Write-Host ""
Write-Host "3. Adicionando arquivos..." -ForegroundColor Yellow
git add .
Write-Host "   ✓ Arquivos adicionados" -ForegroundColor Green

# 4. Fazer commit
Write-Host ""
Write-Host "4. Fazendo commit..." -ForegroundColor Yellow
git commit -m "Preparar para deploy no Render"
Write-Host "   ✓ Commit realizado" -ForegroundColor Green

# 5. Instruções finais
Write-Host ""
Write-Host "==================================" -ForegroundColor Cyan
Write-Host "PRÓXIMOS PASSOS:" -ForegroundColor Cyan
Write-Host "==================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. Crie um repositório no GitHub:" -ForegroundColor White
Write-Host "   https://github.com/new" -ForegroundColor Gray
Write-Host ""
Write-Host "2. Execute os comandos (substitua SEU_USUARIO e NOME_DO_REPO):" -ForegroundColor White
Write-Host "   git remote add origin https://github.com/SEU_USUARIO/NOME_DO_REPO.git" -ForegroundColor Gray
Write-Host "   git branch -M main" -ForegroundColor Gray
Write-Host "   git push -u origin main" -ForegroundColor Gray
Write-Host ""
Write-Host "3. Siga as instruções em DEPLOY_RENDER.md" -ForegroundColor White
Write-Host ""
Write-Host "Pressione qualquer tecla para continuar..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")

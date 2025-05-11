#!/bin/bash

# Script para criar um pacote completo para deploy no Netlify
echo "Criando pacote do Vale Cashback para deploy no Netlify..."

# Criar diretório temporário
TEMP_DIR="./temp_build"
mkdir -p $TEMP_DIR

# Copiar arquivos essenciais
echo "Copiando arquivos do projeto..."
cp -r client $TEMP_DIR/
cp -r server $TEMP_DIR/
cp -r shared $TEMP_DIR/
cp -r netlify $TEMP_DIR/
cp package.json $TEMP_DIR/
cp package-lock.json $TEMP_DIR/
cp netlify.toml $TEMP_DIR/
cp vite.config.ts $TEMP_DIR/
cp tsconfig.json $TEMP_DIR/
cp drizzle.config.ts $TEMP_DIR/
cp tailwind.config.ts $TEMP_DIR/
cp postcss.config.js $TEMP_DIR/

# Criar diretório para o banco de dados
mkdir -p $TEMP_DIR/db_backup

# Criar arquivo README com instruções
cat > $TEMP_DIR/README.md << 'EOL'
# Vale Cashback - Pacote de Deploy

Este é o pacote completo do Vale Cashback para deploy no Netlify, incluindo banco de dados integrado.

## Instruções de Deploy

### 1. Faça upload deste repositório para o GitHub

```
git init
git add .
git commit -m "Primeiro commit"
git remote add origin seu-repositorio-no-github
git push -u origin main
```

### 2. Configure o Deploy no Netlify

1. Crie uma conta no Netlify (se ainda não tiver)
2. Clique em "New site from Git"
3. Selecione o GitHub como provedor Git
4. Selecione o repositório onde você fez o upload
5. Configure as opções de build:
   - Build command: `npm run build`
   - Publish directory: `dist`
6. Defina as variáveis de ambiente:
   - DATABASE_URL: URL do seu banco de dados PostgreSQL (opcional)
   - SESSION_SECRET: Uma string secreta para as sessões

### 3. Banco de Dados

O aplicativo funciona com dois modos:
- Modo com banco de dados completo se você configurar a variável DATABASE_URL
- Modo de banco de dados local via IndexedDB (padrão)

## Credenciais de Teste

Você pode usar estas credenciais para testar o aplicativo:

- **Administrador**:
  - Email: admin@valecashback.com
  - Senha: senha123

- **Cliente**:
  - Email: cliente@valecashback.com
  - Senha: senha123

- **Lojista**:
  - Email: lojista@valecashback.com
  - Senha: senha123

## Recursos Adicionais

- O aplicativo inclui suporte a PWA (Progressive Web App) e pode ser instalado em dispositivos móveis
- Dados são sincronizados automaticamente quando online
- Suporte a operações offline via IndexedDB
EOL

# Adicionar arquivo package.json de dependências do Netlify
mkdir -p $TEMP_DIR/netlify/functions
cat > $TEMP_DIR/netlify/functions/package.json << 'EOL'
{
  "name": "vale-cashback-api",
  "version": "1.0.0",
  "description": "API serverless do Vale Cashback",
  "main": "api.js",
  "dependencies": {
    "express": "^4.18.2",
    "serverless-http": "^3.2.0",
    "pg": "^8.11.3",
    "express-session": "^1.17.3",
    "body-parser": "^1.20.2",
    "cors": "^2.8.5"
  }
}
EOL

# Criar arquivo TAR com todos os arquivos
echo "Criando arquivo TAR..."
cd $TEMP_DIR
tar -czvf ../vale-cashback-netlify-package.tar.gz .
cd ..

# Limpar diretório temporário
rm -rf $TEMP_DIR

echo "Pacote criado com sucesso: vale-cashback-netlify-package.zip"
echo "Você pode fazer o download deste arquivo e implantá-lo no Netlify."
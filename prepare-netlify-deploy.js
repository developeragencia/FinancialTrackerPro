const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

// Diretório onde será gerado o build
const buildDir = path.join(__dirname, 'dist');
// Diretório onde será criado o arquivo ZIP para o Netlify
const deployDir = path.join(__dirname, 'netlify-deploy');

// Função para executar comandos do shell
function runCommand(command, cwd = __dirname) {
  return new Promise((resolve, reject) => {
    console.log(`Executando: ${command}`);
    exec(command, { cwd }, (error, stdout, stderr) => {
      if (error) {
        console.error(`Erro ao executar comando: ${error.message}`);
        return reject(error);
      }
      if (stderr) console.log(`stderr: ${stderr}`);
      console.log(`stdout: ${stdout}`);
      resolve(stdout);
    });
  });
}

// Função principal
async function prepareNetlifyDeploy() {
  try {
    console.log('Iniciando preparação dos arquivos para o Netlify...');

    // Certifique-se de que o diretório de deploy existe
    if (!fs.existsSync(deployDir)) {
      fs.mkdirSync(deployDir, { recursive: true });
    }

    // 1. Construir o projeto
    console.log('Etapa 1: Construindo o projeto...');
    await runCommand('npm run build');

    // 2. Copiar os arquivos de build para a pasta de deploy
    console.log('Etapa 2: Copiando arquivos de build...');
    await runCommand(`cp -r ${buildDir}/* ${deployDir}/`);

    // 3. Copiar netlify.toml para a raiz
    console.log('Etapa 3: Criando arquivo de configuração netlify.toml...');
    const netlifyConfig = `[build]
  publish = "/"
  command = "npm run build"

[build.environment]
  NODE_VERSION = "18"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200

[[headers]]
  for = "/*"
    [headers.values]
    Cache-Control = "public, max-age=0, must-revalidate"
`;

    fs.writeFileSync(path.join(deployDir, 'netlify.toml'), netlifyConfig);

    // 4. Criar arquivo _redirects para o Netlify
    console.log('Etapa 4: Criando arquivo _redirects...');
    fs.writeFileSync(path.join(deployDir, '_redirects'), '/* /index.html 200');

    // 5. Empacotar tudo em um arquivo ZIP
    console.log('Etapa 5: Criando arquivo ZIP...');
    await runCommand(`zip -r vale-cashback-netlify-deploy.zip .`, deployDir);

    // Mover o ZIP para a raiz
    await runCommand(`mv ${deployDir}/vale-cashback-netlify-deploy.zip ./`);

    console.log('Preparação concluída!');
    console.log('Arquivo gerado: vale-cashback-netlify-deploy.zip');
    console.log('Este arquivo contém todos os arquivos necessários para deploy no Netlify.');

  } catch (error) {
    console.error('Erro durante a preparação:', error);
    process.exit(1);
  }
}

// Executar
prepareNetlifyDeploy();
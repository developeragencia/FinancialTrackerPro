# Instruções para hospedar no Netlify

## Opção 1: Hospedar apenas a página de download

1. Descompacte o arquivo `vale-cashback-netlify-download.tar.gz`
   ```
   tar -xzvf vale-cashback-netlify-download.tar.gz -C netlify_download
   ```

2. Crie um repositório no GitHub e envie os arquivos:
   ```
   cd netlify_download
   git init
   git add .
   git commit -m "Vale Cashback Download Page"
   git remote add origin https://github.com/seu-usuario/vale-cashback-download.git
   git push -u origin main
   ```

3. Acesse o Netlify (https://netlify.com) e faça login com sua conta
4. Clique em "New site from Git" e selecione o repositório
5. As configurações de build já estão definidas no arquivo netlify.toml
6. Clique em "Deploy site"
7. Após a implantação, você terá um site público hospedando a página de download

## Opção 2: Hospedar o aplicativo completo

1. Descompacte o arquivo `vale-cashback-netlify-package.tar.gz`
   ```
   tar -xzvf vale-cashback-netlify-package.tar.gz -C vale-cashback
   ```

2. Crie um repositório no GitHub e envie os arquivos:
   ```
   cd vale-cashback
   git init
   git add .
   git commit -m "Vale Cashback App"
   git remote add origin https://github.com/seu-usuario/vale-cashback.git
   git push -u origin main
   ```

3. Acesse o Netlify (https://netlify.com) e faça login com sua conta
4. Clique em "New site from Git" e selecione o repositório
5. As configurações de build já estão definidas no arquivo netlify.toml
6. Clique em "Deploy site"
7. Após a implantação, você terá o Vale Cashback completo funcionando online

## Observações importantes

- O pacote `vale-cashback-netlify-package.tar.gz` contém o aplicativo completo
- O pacote `vale-cashback-netlify-download.tar.gz` contém apenas a página de download
- As correções do build do Netlify estão incluídas no pacote completo
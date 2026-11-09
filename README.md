# ⏰ TimeClock
Sistema de Controle de Ponto desenvolvido como projeto acadêmico.

# 📋 Descrição
O TimeClock é uma aplicação voltada para o registro e acompanhamento da jornada de trabalho dos funcionários.

O sistema permite:

Login de usuários

Cadastro de novos usuários

Visualização de perfil

Registro de entrada e saída

Consulta do histórico de ponto

Relacionamento entre empresa, usuário e registros

# 🛠 Tecnologias Utilizadas

Front-end

HTML5

CSS3

Banco de Dados

MySQL

Ferramentas

MySQL Workbench

Git

GitHub

Figma

# 🗄 Estrutura do Banco de Dados
O banco é composto por três entidades principais:

Empresa
Armazena as empresas cadastradas no sistema.


Usuario
Armazena os dados dos funcionários.


RegistroPonto
Armazena os registros de entrada e saída realizados pelos usuários.

# 🔗 Relacionamentos
Empresa → Usuario
Relacionamento 1:N

Uma empresa pode possuir vários usuários.

Usuario → RegistroPonto
Relacionamento 1:N

Um usuário pode possuir vários registros de ponto.

# 📚 Normalização

O banco foi desenvolvido seguindo os conceitos de:

1ª Forma Normal (1FN)

2ª Forma Normal (2FN)

3ª Forma Normal (3FN)


# 👨‍💻 Integrantes

Kevin Peres Carvalho

Rafael Faria Bueno

Davi Leal

Douglas William

# 🚀 Status do Projeto

✅ Modelagem concluída

✅ Banco de dados concluído

✅ Documentação concluída

✅ Front-end concluído

# 🔄 Integração Node.js

O navegador se comunica com uma API Node.js; somente o servidor acessa o MySQL.
As senhas sao armazenadas como hashes e a sessao usa um cookie `HttpOnly`.

## Executar localmente

1. Instale o Node.js (versao 18 ou superior) e o MySQL.
2. Execute o arquivo `TimeClockDB.sql` no MySQL Workbench para criar o banco e a empresa de exemplo.
3. Instale as dependencias na pasta raiz do projeto:

   ```sh
   npm install
   ```

4. Copie `.env.example` para `.env` e preencha as credenciais do seu MySQL. Defina `JWT_SECRET` como uma chave aleatoria com pelo menos 32 caracteres.
5. Inicie o servidor:

   ```sh
   npm start
   ```

6. Abra `http://localhost:3000/login.html` no navegador. Nao abra os arquivos HTML diretamente pelo explorador, pois a API precisa estar em execucao.

O cadastro precisa de uma empresa existente na tabela `Empresa`. O SQL de exemplo cria uma empresa; para adicionar outras, insira registros nessa tabela.

## Rotas da API

- `GET /api/empresas` — lista as empresas para o cadastro.
- `POST /api/auth/register` — cria uma conta.
- `POST /api/auth/login` — autentica com CPF e senha.
- `GET /api/auth/me` — retorna os dados da conta autenticada.
- `POST /api/auth/logout` — encerra a sessao.
- `GET /api/registros` e `POST /api/registros` — consulta e cria marcacoes do dia.

Em producao, use HTTPS e configure `NODE_ENV=production` para que o cookie de sessao seja marcado como `Secure`.

# 📄 Licença
Projeto desenvolvido exclusivamente para fins educacionais.

-- =====================================================================================
-- PROJETO: SISTEMA DE CONTROLE DE PONTO
-- BANCO DE DADOS: TimeClockDB
--
-- FINALIDADE:
-- Armazenar empresas, usuários e registros de entrada/saída dos funcionários.
--
-- DESENVOLVEDOR:
-- Kevin Peres Carvalho
-- =====================================================================================


-- =====================================================================================
-- CRIAÇÃO DO BANCO DE DADOS
-- =====================================================================================

-- Cria o banco principal do sistema
CREATE DATABASE TimeClockDB;

-- Define que os próximos comandos serão executados dentro do banco TimeClockDB
USE TimeClockDB;


-- =====================================================================================
-- TABELA EMPRESA
-- =====================================================================================
--
-- Esta tabela armazena as empresas cadastradas no sistema.
-- Um usuário pertence a uma empresa.
--
-- Exemplo:
-- id_empresa = 1
-- nome_empresa = Empresa XPTO
-- =====================================================================================

CREATE TABLE Empresa
(
    -- Identificador único da empresa
    id_empresa INT AUTO_INCREMENT PRIMARY KEY,

    -- Nome da empresa
    nome_empresa VARCHAR(100) NOT NULL
);


-- =====================================================================================
-- TABELA USUARIO
-- =====================================================================================
--
-- Esta tabela armazena os funcionários que utilizarão o sistema.
--
-- Informações armazenadas:
-- Nome
-- CPF
-- E-mail
-- Telefone
-- Senha
-- Status da conta
-- Empresa vinculada
--
-- =====================================================================================

CREATE TABLE Usuario
(
    -- Identificador único do usuário
    id_usuario INT AUTO_INCREMENT PRIMARY KEY,

    -- Nome completo do usuário
    nome VARCHAR(100) NOT NULL,

    -- CPF do usuário
    cpf VARCHAR(14) NOT NULL,

    -- E-mail do usuário
    email VARCHAR(100) NOT NULL,

    -- Telefone para contato
    telefone VARCHAR(20) NULL,

    -- Senha de acesso
    senha VARCHAR(255) NOT NULL,

    -- Define se a conta está ativa 
    ativo BOOLEAN DEFAULT TRUE,

    -- Empresa à qual o usuário pertence
    id_empresa INT NULL
);

-- Impede que dois usuários possuam o mesmo CPF
ALTER TABLE Usuario
ADD CONSTRAINT UQ_USUARIO_CPF
UNIQUE (cpf);

-- Impede que dois usuários possuam o mesmo e-mail
ALTER TABLE Usuario
ADD CONSTRAINT UQ_USUARIO_EMAIL
UNIQUE (email);

-- Cria relacionamento entre Usuario e Empresa
ALTER TABLE Usuario
ADD CONSTRAINT FK_USUARIO_EMPRESA
FOREIGN KEY (id_empresa)
REFERENCES Empresa(id_empresa);
    -- (Aponta para onde essa chave estrangeira deve olhar)

-- =====================================================================================
-- TABELA REGISTROPONTO
-- =====================================================================================
--
-- Esta tabela registra todas as batidas de ponto.
--
-- Exemplo:
-- Entrada - 08:00
-- Saída   - 12:00
-- Entrada - 13:00
-- Saída   - 18:00
--
-- Cada registro pertence a um usuário.
--
-- =====================================================================================

CREATE TABLE RegistroPonto
(
    -- Identificador único do registro
    id_registro INT AUTO_INCREMENT PRIMARY KEY,

    -- Usuário responsável pela batida
    id_usuario INT NOT NULL,

    -- Tipo da batida
    -- Valores permitidos:
    -- Entrada
    -- Saida
    tipo ENUM('Entrada','Saida') NOT NULL,
        -- ( "ENUM" é um tipo de dado que funciona como uma lista de valores fixos e pré-definidos )

    -- Data e horário da batida
    data_hora DATETIME NOT NULL
);

-- Relaciona cada registro ao usuário que realizou a ação
ALTER TABLE RegistroPonto
ADD CONSTRAINT FK_REGISTROPONTO_USUARIO
FOREIGN KEY (id_usuario)
REFERENCES Usuario(id_usuario);


-- =====================================================================================
-- DADOS DE TESTE
-- =====================================================================================
--
-- Esta seção existe apenas para comprovar que o banco funciona.
-- Pode ser removida futuramente quando o sistema estiver conectado ao JavaScript.
--
-- =====================================================================================

-- Cadastra uma empresa de exemplo
INSERT INTO Empresa
(nome_empresa)
VALUES
(
    'Empresa XPTO'
);

-- Cadastra um usuário de exemplo
INSERT INTO Usuario
(
    nome,
    cpf,
    email,
    telefone,
    senha,
    id_empresa
)
VALUES
(
    'ALLzitus',
    '12345678900',
    'allzitus@gmail.com',
    '398767623',
    '123456',
    1
);

-- Registra uma entrada inicial para testes
INSERT INTO RegistroPonto
(
    id_usuario,
    tipo,
    data_hora
)
VALUES
(
    1,
    'Entrada',
    NOW()
);


-- =====================================================================================
-- CONSULTAS DO SISTEMA
-- =====================================================================================
--
-- ATENÇÃO:
-- Os símbolos "?" representam valores que serão enviados pelo JavaScript.
--
-- Estes comandos servem como referência para a integração futura.
--
-- =====================================================================================


-- =====================================================================================
-- LOGIN
-- =====================================================================================
--
-- Verifica se existe um usuário com o CPF e senha informados.
--
-- Dados recebidos:
-- CPF
-- Senha
--
-- =====================================================================================

SELECT *
FROM Usuario
WHERE cpf = ?
AND senha = ?;


-- =====================================================================================
-- CADASTRO DE USUÁRIO
-- =====================================================================================
--
-- Cria um novo usuário no sistema.
--
-- =====================================================================================

INSERT INTO Usuario
(
    nome,
    cpf,
    email,
    telefone,
    senha,
    id_empresa
)
VALUES
(
    ?, ?, ?, ?, ?, ?
);


-- =====================================================================================
-- PERFIL DO USUÁRIO
-- =====================================================================================
--
-- Recupera as informações da tela "Minha Conta".
--
-- =====================================================================================

SELECT
    nome,
    cpf,
    email,
    telefone,
    ativo
FROM Usuario
WHERE id_usuario = ?;


-- =====================================================================================
-- HISTÓRICO DE PONTO
-- =====================================================================================
--
-- Recupera todos os registros do usuário,
-- ordenando do mais recente para o mais antigo.
--
-- =====================================================================================

SELECT
    tipo,
    data_hora
FROM RegistroPonto
WHERE id_usuario = ?
ORDER BY data_hora DESC;


-- =====================================================================================
-- REGISTRAR ENTRADA
-- =====================================================================================
--
-- Executado quando o usuário clicar em:
-- "Registrar Entrada"
--
-- =====================================================================================

INSERT INTO RegistroPonto
(
    id_usuario,
    tipo,
    data_hora
)
VALUES
(
    ?,
    'Entrada',
    NOW()
);


-- =====================================================================================
-- REGISTRAR SAÍDA
-- =====================================================================================
--
-- Executado quando o usuário clicar em:
-- "Registrar Saída"
--
-- =====================================================================================

INSERT INTO RegistroPonto
(
    id_usuario,
    tipo,
    data_hora
)
VALUES
(
    ?,
    'Saida',
    NOW()
);


-- =====================================================================================
-- ALTERAR E-MAIL
-- =====================================================================================
--
-- Atualiza o e-mail do usuário.
--
-- =====================================================================================

UPDATE Usuario
SET email = ?
WHERE id_usuario = ?;


-- =====================================================================================
-- ALTERAR TELEFONE
-- =====================================================================================
--
-- Atualiza o telefone do usuário.
--
-- =====================================================================================

UPDATE Usuario
SET telefone = ?
WHERE id_usuario = ?;


-- =====================================================================================
-- ALTERAR SENHA
-- =====================================================================================
--
-- Atualiza a senha do usuário.
--
-- =====================================================================================

UPDATE Usuario
SET senha = ?
WHERE id_usuario = ?;


-- =====================================================================================
-- TESTES DO BANCO DE DADOS
-- =====================================================================================
--
-- Utilize estes comandos para verificar se as tabelas foram criadas
-- corretamente e se os relacionamentos estão funcionando.
--
-- =====================================================================================


-- =====================================================
-- VISUALIZAR TODAS AS EMPRESAS
-- =====================================================

SELECT *
FROM Empresa;

DELETE FROM Empresa
WHERE id_empresa = 2;

-- =====================================================
-- VISUALIZAR TODOS OS USUÁRIOS
-- =====================================================

SELECT *
FROM Usuario;


-- =====================================================
-- VISUALIZAR TODOS OS REGISTROS DE PONTO
-- =====================================================

SELECT *
FROM RegistroPonto;


-- =====================================================
-- TESTAR RELACIONAMENTO EMPRESA -> USUARIO
-- =====================================================
--
-- Mostra qual empresa cada usuário pertence.
--
-- =====================================================

SELECT
    Usuario.nome,
    Empresa.nome_empresa
FROM Usuario
INNER JOIN Empresa
ON Usuario.id_empresa = Empresa.id_empresa;


-- =====================================================
-- TESTAR RELACIONAMENTO USUARIO -> TimeClockDB
-- =====================================================
--
-- Mostra quem realizou cada registro de ponto.
--
-- =====================================================

SELECT
    Usuario.nome,
    RegistroPonto.tipo,
    RegistroPonto.data_hora

FROM Usuario

INNER JOIN RegistroPonto

ON Usuario.id_usuario = RegistroPonto.id_usuario;


-- =====================================================
-- TESTE COMPLETO DO SISTEMA
-- =====================================================
--
-- Mostra:
-- Nome do usuário
-- Empresa
-- Tipo de registro
-- Data e hora
--
-- =====================================================

SELECT
    Usuario.nome,
    Empresa.nome_empresa,
    RegistroPonto.tipo,
    RegistroPonto.data_hora
FROM RegistroPonto
INNER JOIN Usuario
ON RegistroPonto.id_usuario = Usuario.id_usuario

INNER JOIN Empresa
ON Usuario.id_empresa = Empresa.id_empresa

ORDER BY RegistroPonto.data_hora DESC;

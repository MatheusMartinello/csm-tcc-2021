CREATE TABLE Usuario
(
IdUsuario      serial NOT NULL,
Nome           varchar(50) NOT NULL,
Email          varchar(50) NOT NULL,
CPF            numeric NOT NULL,
statusdocument numeric NOT NULL,
RG             numeric NOT NULL,
DataNascimento date NOT NULL,
Senha          varchar(250) NOT NULL,
Login          varchar(250) NOT NULL,
CONSTRAINT PK_usuario PRIMARY KEY ( IdUsuario )
);

-- ************************************** Oficina

CREATE TABLE Oficina
(
 IdOficina   bigserial NOT NULL,
 Nome        varchar(50) NOT NULL,
 RazaoSocial varchar(50) NOT NULL,
 Cnpj        integer NOT NULL,
 Login       varchar(50) NOT NULL,
 Email       varchar(50) NOT NULL,
 Senha       varchar(50) NOT NULL,
 DataCriacao date NOT NULL,
 CONSTRAINT PK_oficina PRIMARY KEY ( IdOficina )
);
CREATE TABLE Pecas
(
 IdPeca        serial NOT NULL,
 Nome          varchar(50) NOT NULL,
 ValorUnitario decimal(18,0) NOT NULL,
 CONSTRAINT PK_pecas PRIMARY KEY ( IdPeca )
);

-- ************************************** Servicos

CREATE TABLE Servicos
(
 IdServico   serial NOT NULL,
 IdOficina   bigint NOT NULL,
 Nome        varchar(50) NOT NULL,
 Descricao   varchar(50) NOT NULL,
 Custo       numeric(18,8) NOT NULL,
 Responsavel varchar(250) NULL,
 CONSTRAINT PK_servicos PRIMARY KEY ( IdServico, IdOficina ),
 CONSTRAINT FK_56 FOREIGN KEY ( IdOficina ) REFERENCES Oficina ( IdOficina )
);

CREATE INDEX fkIdx_57 ON Servicos
(
 IdOficina
);



CREATE TABLE Endereco
(
 IdEndereco  serial NOT NULL,
 Rua         varchar(250) NULL,
 Numero      integer NULL,
 Complemento varchar(50)  NULL,
 IdOficina   bigint  NULL,
 IdUsuario   integer  NULL,
 Latitude    varchar(250)  NULL,
 Longitude   varchar(250)  NULL,
 Cep         varchar(50) NOT NULL,
 CONSTRAINT PK_endereco PRIMARY KEY ( IdEndereco ),
 CONSTRAINT FK_106 FOREIGN KEY ( IdOficina ) REFERENCES Oficina ( IdOficina ),
 CONSTRAINT FK_131 FOREIGN KEY ( IdUsuario ) REFERENCES Usuario ( IdUsuario )
);

CREATE INDEX fkIdx_107 ON Endereco
(
 IdOficina
);

CREATE INDEX fkIdx_132 ON Endereco
(
 IdUsuario
);





-- ************************************** Agenda

CREATE TABLE Agenda
(
 IdAgenda    serial NOT NULL,
 DataHorario date NOT NULL,
 IdUsuario   integer NOT NULL,
 IdServico   integer NOT NULL,
 IdOficina   bigint NOT NULL,
 CONSTRAINT PK_agenda PRIMARY KEY ( IdAgenda ),
 CONSTRAINT FK_116 FOREIGN KEY ( IdUsuario ) REFERENCES Usuario ( IdUsuario ),
 CONSTRAINT FK_119 FOREIGN KEY ( IdServico, IdOficina ) REFERENCES Servicos ( IdServico, IdOficina )
);

CREATE INDEX fkIdx_117 ON Agenda
(
 IdUsuario
);

CREATE INDEX fkIdx_120 ON Agenda
(
 IdServico,
 IdOficina
);


-- ************************************** Carro

CREATE TABLE Carro
(
 IdCarro   serial NOT NULL,
 IdUsuario integer NOT NULL,
 Placa     varchar(50) NOT NULL,
 Modelo    varchar(50) NOT NULL,
 Marca     varchar(50) NOT NULL,
 Renavam   varchar(50) NOT NULL,
 CONSTRAINT PK_carro PRIMARY KEY ( IdCarro, IdUsuario ),
 CONSTRAINT FK_26 FOREIGN KEY ( IdUsuario ) REFERENCES Usuario ( IdUsuario )
);

CREATE INDEX fkIdx_27 ON Carro
(
 IdUsuario
);




-- ************************************** DadosImagem

CREATE TABLE DadosImagem
(
 IdDadosImagem serial NOT NULL,
 URLDocumento  varchar NOT NULL,
 TipoDocumento numeric NOT NULL,
 IdOficina     bigint,
 IdUsuario     integer,
 IdCarro       integer,
 CONSTRAINT PK_dadosimagem PRIMARY KEY ( IdDadosImagem ),
 CONSTRAINT FK_109 FOREIGN KEY ( IdCarro, IdUsuario ) REFERENCES Carro ( IdCarro, IdUsuario ),
 CONSTRAINT FK_40 FOREIGN KEY ( IdOficina ) REFERENCES Oficina ( IdOficina ),
 CONSTRAINT FK_43 FOREIGN KEY ( IdUsuario ) REFERENCES Usuario ( IdUsuario )
);

CREATE INDEX fkIdx_110 ON DadosImagem
(
 IdUsuario,
 IdCarro
);

CREATE INDEX fkIdx_41 ON DadosImagem
(
 IdOficina
);

CREATE INDEX fkIdx_44 ON DadosImagem
(
 IdUsuario
);

-- ************************************** OrdemDeServico

CREATE TABLE OrdemDeServico
(
 IdOrdemDeServico serial NOT NULL,
 IdServico        integer NOT NULL,
 IdOficina        bigint NOT NULL,
 IdCarro          integer NOT NULL,
 IdUsuario        integer NOT NULL,
 CONSTRAINT PK_ordemdeservico PRIMARY KEY ( IdOrdemDeServico, IdServico, IdOficina, IdCarro, IdUsuario ),
 CONSTRAINT FK_67 FOREIGN KEY ( IdServico, IdOficina ) REFERENCES Servicos ( IdServico, IdOficina ),
 CONSTRAINT FK_71 FOREIGN KEY ( IdCarro, IdUsuario ) REFERENCES Carro ( IdCarro, IdUsuario )
);

CREATE INDEX fkIdx_68 ON OrdemDeServico
(
 IdServico,
 IdOficina
);

CREATE INDEX fkIdx_72 ON OrdemDeServico
(
 IdCarro,
 IdUsuario
);

-- ************************************** DescricaoServico

CREATE TABLE DescricaoServico
(
 IdOrdemDeServico integer NOT NULL,
 IdServico        integer NOT NULL,
 IdOficina        bigint NOT NULL,
 IdCarro          integer NOT NULL,
 IdUsuario        integer NOT NULL,
 IdPeca           integer NOT NULL,
 Quantidade       integer NOT NULL,
 Valor            numeric(18,0) NOT NULL,
 CONSTRAINT PK_table_77 PRIMARY KEY ( IdOrdemDeServico, IdServico, IdOficina, IdCarro, IdUsuario, IdPeca ),
 CONSTRAINT FK_77 FOREIGN KEY ( IdOrdemDeServico, IdServico, IdOficina, IdCarro, IdUsuario ) REFERENCES OrdemDeServico ( IdOrdemDeServico, IdServico, IdOficina, IdCarro, IdUsuario ),
 CONSTRAINT FK_85 FOREIGN KEY ( IdPeca ) REFERENCES Pecas ( IdPeca )
);

CREATE INDEX fkIdx_78 ON DescricaoServico
(
 IdOrdemDeServico,
 IdServico,
 IdOficina,
 IdCarro,
 IdUsuario
);

CREATE INDEX fkIdx_86 ON DescricaoServico
(
 IdPeca
);

-- ************************************** Telefone

CREATE TABLE Telefone
(
 IdTelefone       serial NOT NULL,
 Nacionalidade    int NOT NULL,
 TelefoneCompleto int NOT NULL,
 IdOficina        bigint NOT NULL,
 IdUsuario        integer NOT NULL,
 CONSTRAINT PK_telefone PRIMARY KEY ( IdTelefone ),
 CONSTRAINT FK_143 FOREIGN KEY ( IdOficina ) REFERENCES Oficina ( IdOficina ),
 CONSTRAINT FK_146 FOREIGN KEY ( IdUsuario ) REFERENCES Usuario ( IdUsuario )
);

CREATE INDEX fkIdx_144 ON Telefone
(
 IdOficina
);

CREATE INDEX fkIdx_147 ON Telefone
(
 IdUsuario
);
-- ************************************** UsuariosAdmin

CREATE TABLE UsuariosAdmin
(
 IdUsuarioAdmin serial NOT NULL,
 Login          varchar(50) NOT NULL,
 Senha          varchar(50) NOT NULL,
 CONSTRAINT PK_usuariosadmin PRIMARY KEY ( IdUsuarioAdmin )
);





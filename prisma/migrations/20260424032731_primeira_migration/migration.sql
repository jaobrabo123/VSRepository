-- CreateTable
CREATE TABLE "usuario" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "nome" VARCHAR(150) NOT NULL,
    "email" VARCHAR(254) NOT NULL,
    "senha" VARCHAR(255) NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "data_criacao" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "data_atualizacao" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "usuario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "perfil_usuario" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "biografia" VARCHAR(500),
    "avatar_url" VARCHAR(255),
    "telefone" VARCHAR(20),
    "usuario_id" UUID NOT NULL,

    CONSTRAINT "perfil_usuario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "postagem" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "titulo" VARCHAR(200) NOT NULL,
    "conteudo" TEXT NOT NULL,
    "publicado" BOOLEAN NOT NULL DEFAULT false,
    "data_criacao" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "data_atualizacao" TIMESTAMPTZ(6) NOT NULL,
    "autor_id" UUID NOT NULL,

    CONSTRAINT "postagem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "categoria" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "nome" VARCHAR(50) NOT NULL,
    "descricao" VARCHAR(200),

    CONSTRAINT "categoria_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_categoriaTopostagem" (
    "A" UUID NOT NULL,
    "B" UUID NOT NULL,

    CONSTRAINT "_categoriaTopostagem_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "usuario_email_key" ON "usuario"("email");

-- CreateIndex
CREATE INDEX "usuario_email_idx" ON "usuario"("email");

-- CreateIndex
CREATE UNIQUE INDEX "perfil_usuario_usuario_id_key" ON "perfil_usuario"("usuario_id");

-- CreateIndex
CREATE INDEX "postagem_autor_id_publicado_idx" ON "postagem"("autor_id", "publicado");

-- CreateIndex
CREATE UNIQUE INDEX "categoria_nome_key" ON "categoria"("nome");

-- CreateIndex
CREATE INDEX "categoria_nome_idx" ON "categoria"("nome");

-- CreateIndex
CREATE INDEX "_categoriaTopostagem_B_index" ON "_categoriaTopostagem"("B");

-- AddForeignKey
ALTER TABLE "perfil_usuario" ADD CONSTRAINT "perfil_usuario_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "postagem" ADD CONSTRAINT "postagem_autor_id_fkey" FOREIGN KEY ("autor_id") REFERENCES "usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_categoriaTopostagem" ADD CONSTRAINT "_categoriaTopostagem_A_fkey" FOREIGN KEY ("A") REFERENCES "categoria"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_categoriaTopostagem" ADD CONSTRAINT "_categoriaTopostagem_B_fkey" FOREIGN KEY ("B") REFERENCES "postagem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

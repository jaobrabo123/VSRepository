-- AlterTable
ALTER TABLE "usuario" ADD COLUMN     "data_atualizacao" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "data_criacao" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ALTER COLUMN "nome" SET DATA TYPE VARCHAR(150);

-- CreateTable
CREATE TABLE "produto" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "nome" VARCHAR(100) NOT NULL,
    "preco" DECIMAL(12,2) NOT NULL,
    "codigo" VARCHAR(100) NOT NULL,
    "usuario_id" UUID NOT NULL,
    "data_criacao" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "data_atualizacao" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "produto_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "produto_usuario_id_codigo_key" ON "produto"("usuario_id", "codigo");

-- AddForeignKey
ALTER TABLE "produto" ADD CONSTRAINT "produto_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuario"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

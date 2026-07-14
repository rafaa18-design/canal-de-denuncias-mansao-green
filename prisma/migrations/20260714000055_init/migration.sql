-- CreateEnum
CREATE TYPE "StatusDenuncia" AS ENUM ('RECEBIDA', 'EM_ANALISE', 'TRATADA', 'ARQUIVADA');

-- CreateEnum
CREATE TYPE "TipoHistorico" AS ENUM ('MUDANCA_STATUS', 'NOTA_INTERNA', 'RESPOSTA_PUBLICA', 'ATRIBUICAO', 'PRIORIDADE', 'PRAZO');

-- CreateEnum
CREATE TYPE "PrioridadeDenuncia" AS ENUM ('ALTA', 'MEDIA', 'BAIXA');

-- CreateEnum
CREATE TYPE "AutoriaMensagem" AS ENUM ('DENUNCIANTE', 'EQUIPE');

-- CreateEnum
CREATE TYPE "RoleAdmin" AS ENUM ('ADMIN', 'ANALISTA');

-- CreateTable
CREATE TABLE "Categoria" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "descricao" TEXT,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "ordem" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Categoria_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Denuncia" (
    "id" TEXT NOT NULL,
    "protocolo" TEXT NOT NULL,
    "categoriaId" TEXT NOT NULL,
    "relato" TEXT NOT NULL,
    "status" "StatusDenuncia" NOT NULL DEFAULT 'RECEBIDA',
    "prioridade" "PrioridadeDenuncia" NOT NULL DEFAULT 'MEDIA',
    "prazo" TIMESTAMP(3),
    "responsavelId" TEXT,
    "respostaPublica" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Denuncia_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MensagemDenuncia" (
    "id" TEXT NOT NULL,
    "denunciaId" TEXT NOT NULL,
    "autoria" "AutoriaMensagem" NOT NULL,
    "autorId" TEXT,
    "corpo" TEXT NOT NULL,
    "lidaPelaEquipe" BOOLEAN NOT NULL DEFAULT false,
    "lidaPeloDenunciante" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MensagemDenuncia_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HistoricoTriagem" (
    "id" TEXT NOT NULL,
    "denunciaId" TEXT NOT NULL,
    "autorId" TEXT NOT NULL,
    "tipo" "TipoHistorico" NOT NULL,
    "statusDe" "StatusDenuncia",
    "statusPara" "StatusDenuncia",
    "nota" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HistoricoTriagem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdminUser" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "senhaHash" TEXT NOT NULL,
    "role" "RoleAdmin" NOT NULL DEFAULT 'ANALISTA',
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AdminUser_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PushSubscription" (
    "id" TEXT NOT NULL,
    "adminUserId" TEXT NOT NULL,
    "endpoint" TEXT NOT NULL,
    "p256dh" TEXT NOT NULL,
    "auth" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PushSubscription_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Categoria_nome_key" ON "Categoria"("nome");

-- CreateIndex
CREATE INDEX "Categoria_ativo_ordem_idx" ON "Categoria"("ativo", "ordem");

-- CreateIndex
CREATE UNIQUE INDEX "Denuncia_protocolo_key" ON "Denuncia"("protocolo");

-- CreateIndex
CREATE INDEX "Denuncia_status_createdAt_idx" ON "Denuncia"("status", "createdAt");

-- CreateIndex
CREATE INDEX "Denuncia_categoriaId_idx" ON "Denuncia"("categoriaId");

-- CreateIndex
CREATE INDEX "Denuncia_responsavelId_idx" ON "Denuncia"("responsavelId");

-- CreateIndex
CREATE INDEX "Denuncia_prioridade_idx" ON "Denuncia"("prioridade");

-- CreateIndex
CREATE INDEX "MensagemDenuncia_denunciaId_createdAt_idx" ON "MensagemDenuncia"("denunciaId", "createdAt");

-- CreateIndex
CREATE INDEX "HistoricoTriagem_denunciaId_createdAt_idx" ON "HistoricoTriagem"("denunciaId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "AdminUser_email_key" ON "AdminUser"("email");

-- CreateIndex
CREATE UNIQUE INDEX "PushSubscription_endpoint_key" ON "PushSubscription"("endpoint");

-- CreateIndex
CREATE INDEX "PushSubscription_adminUserId_idx" ON "PushSubscription"("adminUserId");

-- AddForeignKey
ALTER TABLE "Denuncia" ADD CONSTRAINT "Denuncia_categoriaId_fkey" FOREIGN KEY ("categoriaId") REFERENCES "Categoria"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Denuncia" ADD CONSTRAINT "Denuncia_responsavelId_fkey" FOREIGN KEY ("responsavelId") REFERENCES "AdminUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MensagemDenuncia" ADD CONSTRAINT "MensagemDenuncia_denunciaId_fkey" FOREIGN KEY ("denunciaId") REFERENCES "Denuncia"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MensagemDenuncia" ADD CONSTRAINT "MensagemDenuncia_autorId_fkey" FOREIGN KEY ("autorId") REFERENCES "AdminUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HistoricoTriagem" ADD CONSTRAINT "HistoricoTriagem_denunciaId_fkey" FOREIGN KEY ("denunciaId") REFERENCES "Denuncia"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HistoricoTriagem" ADD CONSTRAINT "HistoricoTriagem_autorId_fkey" FOREIGN KEY ("autorId") REFERENCES "AdminUser"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PushSubscription" ADD CONSTRAINT "PushSubscription_adminUserId_fkey" FOREIGN KEY ("adminUserId") REFERENCES "AdminUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;

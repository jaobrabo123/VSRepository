// * Importando PrimaClient da pasta Generated e o adaptador para Postgres
import { PrismaClient } from '../generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

// * Configurando o dotenv para acessar as variáveis de ambiente
import 'dotenv/config'

// * Configurando adaptador
const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL
});

// * Criando e exportando instância do PrismaClient
const prisma = new PrismaClient({ adapter });
export default prisma;

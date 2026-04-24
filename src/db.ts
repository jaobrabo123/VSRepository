// * Prisma
import { PrismaClient } from './generated/prisma/client.js';

import { PrismaPg } from '@prisma/adapter-pg';

import 'dotenv/config.js'

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL
});

const prisma = new PrismaClient({ adapter });

export default prisma;
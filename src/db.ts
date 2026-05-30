// * Prisma
import { PrismaClient } from '@vsrepo/prisma/types';

import { PrismaPg } from '@prisma/adapter-pg';

import 'dotenv/config'

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL
});

const prisma = new PrismaClient({ adapter });

export default prisma;
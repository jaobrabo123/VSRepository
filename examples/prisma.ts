// * Importing PrismaClient from the generated folder and the Postgres adapter
import { PrismaClient } from '../generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

// * Setting up dotenv to access environment variables
import 'dotenv/config'

// * Configuring the adapter
const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL
});

// * Creating and exporting the PrismaClient instance
const prisma = new PrismaClient({ adapter });
export default prisma;

import { registerAs } from '@nestjs/config';

export default registerAs('app', () => ({
  database: {
    type: process.env.DB_TYPE as 'postgres',
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT),
    database: process.env.DB_DATABASE,
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    autoloadEntities: Boolean(process.env.DB_AUTOLOAD_ENTITIES), // Loads entities from forFeature() modules
    synchronize: Boolean(process.env.DB_SYNCHRONIZE), // Syncs schema with DB. Do not use in production
  },
  environment: process.env.NODE_ENV || 'development',
}));

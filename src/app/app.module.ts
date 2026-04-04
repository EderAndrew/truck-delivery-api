/* eslint-disable @typescript-eslint/require-await */
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigType } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { TrackingModule } from '../tracking/tracking.module.js';
import { TenantsModule } from '../tenants/tenants.module.js';
import { UsersModule } from '../users/users.module.js';
import { TrucksModule } from '../trucks/trucks.module.js';
import { JobsModule } from '../jobs/jobs.module.js';
import { TripsModule } from '../trips/trips.module.js';
import { AuthModule } from '../auth/auth.module.js';
import appConfig from './app.config.js';

@Module({
  imports: [
    ConfigModule.forRoot(),
    ConfigModule.forFeature(appConfig),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule.forFeature(appConfig)],
      inject: [appConfig.KEY],
      useFactory: async (appConfigurations: ConfigType<typeof appConfig>) => {
        return {
          type: appConfigurations.database.type,
          host: appConfigurations.database.host,
          port: appConfigurations.database.port,
          username: appConfigurations.database.username,
          password: appConfigurations.database.password,
          database: appConfigurations.database.database,
          autoLoadEntities: appConfigurations.database.autoloadEntities,
          synchronize: appConfigurations.database.synchronize,
        };
      },
    }),
    AuthModule,
    TrackingModule,
    TenantsModule,
    UsersModule,
    TrucksModule,
    JobsModule,
    TripsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

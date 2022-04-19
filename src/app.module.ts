import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { LatinoGateway } from './latino.gateway';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClientModule } from './client/client.module';
import { ClientEntity } from './client/models/client.entity';
import { ClientsService } from './client/clients/clients.service';
import { ProcessEntity } from './client/models/process.entity';
import { ProcessesService } from './client/clients/processes.service';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'sqlite',
      database: './data/db',
      entities: [__dirname + '/**/*.entity{.ts,.js}'],
      synchronize: true,
    }),

    TypeOrmModule.forFeature([ClientEntity, ProcessEntity]),

    ClientModule,
  ],
  controllers: [AppController],
  providers: [AppService, LatinoGateway, ClientsService, ProcessesService],
})
export class AppModule {}

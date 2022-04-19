import { Module } from '@nestjs/common';
import { ClientsService } from './clients/clients.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClientEntity } from './models/client.entity';
import { ProcessEntity } from './models/process.entity';
import { ProcessesService } from './clients/processes.service';

@Module({
  imports: [TypeOrmModule.forFeature([ClientEntity, ProcessEntity])],
  providers: [ClientsService, ProcessesService],
})
export class ClientModule {}

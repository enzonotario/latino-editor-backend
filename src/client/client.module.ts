import { Module } from '@nestjs/common';
import { ClientsService } from './clients/clients.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClientEntity } from './models/client.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ClientEntity])],
  providers: [ClientsService],
})
export class ClientModule {}

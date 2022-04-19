import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ClientEntity } from '../models/client.entity';
import { DeleteResult, Repository, UpdateResult } from 'typeorm';

@Injectable()
export class ClientsService {
  constructor(
    @InjectRepository(ClientEntity)
    private clientRepository: Repository<ClientEntity>,
  ) {}

  async findAll(): Promise<ClientEntity[]> {
    return await this.clientRepository.find();
  }

  async findByWsId(wsId: string): Promise<ClientEntity> {
    return await this.clientRepository.findOne({
      wsId,
    });
  }

  async create(client: ClientEntity): Promise<ClientEntity> {
    return await this.clientRepository.save(client);
  }

  async update(client: ClientEntity): Promise<UpdateResult> {
    return await this.clientRepository.update(client.id, client);
  }

  async delete(id): Promise<DeleteResult> {
    return await this.clientRepository.delete(id);
  }
}

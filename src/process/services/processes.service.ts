import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ProcessEntity } from '../models/process.entity';
import { DeleteResult, Repository, UpdateResult } from 'typeorm';

@Injectable()
export class ProcessesService {
  constructor(
    @InjectRepository(ProcessEntity)
    private processRepository: Repository<ProcessEntity>,
  ) {}

  async findAll(): Promise<ProcessEntity[]> {
    return await this.processRepository.find();
  }

  async findAllByWsId(wsId: string): Promise<ProcessEntity[]> {
    return await this.processRepository.find({
      where: {
        wsId,
      },
    });
  }

  async findByPid(pid: number): Promise<ProcessEntity> {
    return await this.processRepository.findOne({
      pid,
    });
  }

  async create(process: ProcessEntity): Promise<ProcessEntity> {
    return await this.processRepository.save(process);
  }

  async update(process: ProcessEntity): Promise<UpdateResult> {
    return await this.processRepository.update(process.id, process);
  }

  async delete(id): Promise<DeleteResult> {
    return await this.processRepository.delete(id);
  }
}

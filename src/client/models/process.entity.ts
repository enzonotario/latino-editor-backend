import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum ProcessStatus {
  running = 'running',
  finished = 'finished',
}

@Entity()
export class ProcessEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  wsId: string;

  @Column({
    nullable: true,
  })
  pid: number;

  @Column({ enum: ProcessStatus })
  status: ProcessStatus;

  @CreateDateColumn()
  public createdAt: Date;

  @UpdateDateColumn()
  public updatedAt: Date;
}

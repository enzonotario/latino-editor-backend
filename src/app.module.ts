import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { LatinoGateway } from './latino.gateway';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProcessEntity } from './process/models/process.entity';
import { ProcessesService } from './process/services/processes.service';
import { ProcessModule } from './process/process.module';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'sqlite',
      database: './data/latino-editor.db',
      entities: [__dirname + '/**/*.entity{.ts,.js}'],
      synchronize: true,
    }),

    TypeOrmModule.forFeature([ProcessEntity]),

    ProcessModule,
  ],
  controllers: [AppController],
  providers: [AppService, LatinoGateway, ProcessesService],
})
export class AppModule {}

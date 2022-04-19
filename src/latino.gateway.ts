import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
} from '@nestjs/websockets';
import {
  checkIfFileOrDirectoryExists,
  createFile,
  deleteFile,
} from './helpers/storage';
import { v4 as uuidv4 } from 'uuid';
import { Logger } from '@nestjs/common';
import { ProcessesService } from './client/clients/processes.service';
import { ProcessEntity, ProcessStatus } from './client/models/process.entity';
import { isRunning } from './helpers/utils';
import { exec } from 'child_process';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const pty = require('node-pty-prebuilt-multiarch');

@WebSocketGateway({
  cors: true,
})
export class LatinoGateway implements OnGatewayConnection, OnGatewayDisconnect {
  private logger: Logger;

  private processesService: ProcessesService;

  constructor(processesService: ProcessesService) {
    this.logger = new Logger('LatinoGateway');
    this.processesService = processesService;
  }

  @SubscribeMessage('execute')
  async executeLatino(client: any, payload: any) {
    this.logger.log(['executeLatino', client.id]);

    await this.killClientRunningProcesses(client.id);

    const filename = `${uuidv4()}.lat`;

    const filepath = __dirname + '/' + filename;

    createFile(__dirname, filename, payload);

    this.logger.log(['created file', filepath]);

    const ptyProcess = pty.spawn('latino', [filepath], {
      name: 'xterm-color',
      cols: 80,
      rows: 24,
      cwd: process.env.HOME,
      env: process.env,
    });

    this.logger.log(['pty process', ptyProcess.pid]);

    ptyProcess.on('data', (data) => {
      client.emit('output', data);

      if (checkIfFileOrDirectoryExists(filepath)) {
        deleteFile(filepath);
        this.logger.log(['file deleted', filepath]);
      }
    });

    ptyProcess.on('exit', async (code) => {
      this.logger.log(['pty exit code', code]);

      await this.killPtyProcess(ptyProcess);

      await this.deleteProcessEntity(ptyProcess.pid);
    });

    client.on('input', (data) => {
      ptyProcess.write(data);
    });

    setTimeout(async () => {
      await this.persistProcessIfStillRunning(client.id, ptyProcess.pid);
    }, 500);
  }

  async persistProcessIfStillRunning(wsId: string, pid: number) {
    if (!isRunning(pid)) {
      return;
    }

    console.log(['----will persist ----']);

    await this.processesService.create(<ProcessEntity>{
      wsId,
      pid,
      status: ProcessStatus.running,
    });
  }

  async deleteProcessEntity(pid: number) {
    const processEntity: ProcessEntity = await this.processesService.findByPid(
      pid,
    );

    if (!processEntity) {
      this.logger.log('No ProcessEntity found for PID: ' + pid);
      return;
    }

    this.logger.log('ProcessEntity found for PID: ' + pid);

    await this.processesService.delete(processEntity.id);
  }

  async killClientRunningProcesses(wsId: string) {
    const processes = await this.processesService.findAllByWsId(wsId);

    this.logger.log('Killing running proccesses for ', wsId, processes.length);

    processes.forEach((processInstance: ProcessEntity) => {
      if (this.tryToKillProcessByPid(processInstance.pid)) {
        this.processesService.delete(processInstance.id);
      }
    });
  }

  tryToKillProcessByPid(pid: number): boolean {
    this.logger.log('Trying to kill process by PID: ' + pid);
    try {
      exec('kill -9 ' + pid);
      this.logger.log('Process PID: ' + pid + ' killed');
      return true;
    } catch (error) {
      this.logger.error('Cant kill process PID: ' + pid);
      return false;
    }
  }

  async killPtyProcess(ptyProcess: any) {
    if (!ptyProcess || !ptyProcess.pid) {
      this.logger.error('trying to exit from non existent process');
      return;
    }

    try {
      ptyProcess.kill();
      this.logger.log(['killPtyProcess', ptyProcess.pid, 'killed']);
    } catch (error) {
      this.logger.error(error);
    }
  }

  async handleConnection(client: any) {
    this.logger.log(['on connect', client.id]);
  }

  async handleDisconnect(client: any) {
    this.logger.log(['on disconnect', client.id]);

    await this.killClientRunningProcesses(client.id);
  }
}

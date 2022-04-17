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
import { ClientsService } from './client/clients/clients.service';
import { ClientEntity } from './client/models/client.entity';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const pty = require('node-pty-prebuilt-multiarch');

@WebSocketGateway({
  cors: true,
})
export class LatinoGateway implements OnGatewayConnection, OnGatewayDisconnect {
  private logger: Logger;

  private clientsService: ClientsService;

  constructor(clientsService: ClientsService) {
    this.logger = new Logger('LatinoGateway');
    this.clientsService = clientsService;
  }

  @SubscribeMessage('execute')
  async executeLatino(client: any, payload: any) {
    const clientInstance: ClientEntity = await this.clientsService.findByWsId(
      client.id,
    );

    if (!clientInstance) {
      throw new Error('No client found');
    }

    if (clientInstance && clientInstance.ptyPid) {
      this.killClientPtyProcess(clientInstance);
    }

    this.logger.log(['executeLatino', clientInstance]);

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

    ptyProcess.on('exit', (code) => {
      this.logger.log(['pty exit', code]);

      this.queueProcessExit(ptyProcess, clientInstance);
    });

    client.on('input', (data) => {
      ptyProcess.write(data);
    });

    clientInstance.filename = filename;
    clientInstance.ptyPid = ptyProcess.pid;
    await this.clientsService.update(clientInstance);
  }

  queueProcessExit(ptyProcess: any, clientInstance: ClientEntity) {
    if (!ptyProcess || !ptyProcess.pid) {
      this.logger.error('trying to exit from non existent process');
      return;
    }
    this.logger.log(['queueProcessExit', ptyProcess.pid]);
    setTimeout(async () => {
      ptyProcess.kill();
      this.logger.log(['queueProcessExit', ptyProcess.pid, 'killed']);

      clientInstance.ptyPid = null;
      await this.clientsService.update(clientInstance);
    }, 250);
  }

  killClientPtyProcess(clientInstance: ClientEntity) {
    this.logger.log([
      'killing client ptyProcess',
      clientInstance.id,
      clientInstance.ptyPid,
    ]);
    try {
      process.kill(clientInstance.ptyPid);
    } catch (error) {
      this.logger.error(error);
    }
  }

  async handleConnection(client: any) {
    const clientInstance = await this.clientsService.create(<ClientEntity>{
      wsId: client.id,
    });

    this.logger.log(['on connect', clientInstance.id, clientInstance.wsId]);
  }

  async handleDisconnect(client: any) {
    const clientInstance: ClientEntity = await this.clientsService.findByWsId(
      client.id,
    );

    this.logger.log(['on disconnect', clientInstance.id, clientInstance.wsId]);

    if (clientInstance && clientInstance.ptyPid) {
      this.killClientPtyProcess(clientInstance);
    }
  }
}

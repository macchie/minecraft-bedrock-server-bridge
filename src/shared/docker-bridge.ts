import fs from 'fs';
import Dockerode from 'dockerode';
import { EventEmitter } from 'events';

export const DOCKER_SERVER_LABEL = process.env.BDS_CONTAINER_LABEL || 'minecraft_bedrock_server';

export class BridgeCommand {
  channel!: 'api' | 'telegram';
  command!: string;
  chatId?: number;
  response?: string;

  constructor(channel, command, chatId?) {
    this.channel = channel;
    this.command = command;
    this.chatId = chatId;
  }
}

export class DockerBridge extends EventEmitter {

  private client!: Dockerode;
  private serverContainer!: Dockerode.Container;
  private currentCommand!: BridgeCommand | null;
  private responseTimeout?;
  private writeInterval?;
  private queue: BridgeCommand[] = [];

  constructor() {
    super();
  }

  get isAttached() {
    return this.serverContainer !== undefined;
  }

  public async init() {
    if (fs.existsSync('/var/run/docker.sock') && this.client === undefined) {
      try {
        this.client = new Dockerode({socketPath: '/var/run/docker.sock'});
        console.log(`Docker UNIX Socket found!`);
      } catch (error) {
        console.log(`No Docker UNIX Socket found!`);
      }
    }

    await this.setServerContainer();
    await this.attachToContainer();
  }

  public async sendMessage(command: BridgeCommand) {
    this.queue.push(command);
    return this.queue.length;
  }

  // private

  private async attachToContainer() {
    /// Create the transform stream:
    if (this.serverContainer) {
      this.serverContainer.attach({stream: true, stdin: true, stdout: true, stderr: true}, (err, stream) => {
        if (err) {
          console.log(err);
          return;
        }
        if (!stream) {
          console.log(`no stream`)
          return;
        }

        this.handleRead(stream);
        this.handleWrite(stream);

        console.log(`Attached to Server container!`);
      });
    } else {
      console.log(`No Server container was found!`);
    }
  }

  private async setServerContainer() {
    const containers = await this.client.listContainers();

    for (const container of containers) {
      for (const label of Object.keys(container.Labels)) {
        if (label === DOCKER_SERVER_LABEL) {
          console.log(`Server container found!`);
          this.serverContainer = this.client.getContainer(container.Id);
        }
      }
    }
  }

  private async handleRead(stream: NodeJS.ReadWriteStream) {
    stream.on('data', (data) => {
      const out = data.toString();

      if (out.toLowerCase().startsWith('[info]')) {
        return;
      }

      if (this.responseTimeout) {
        clearTimeout(this.responseTimeout);
      }

      this.responseTimeout = setTimeout(() => {
        if (this.currentCommand) {
          if (this.currentCommand.command.trim() !== out.trim()) {
            this.emit(`${this.currentCommand.channel}-response`, { ...this.currentCommand, response: out })
          } else {
            this.emit(`${this.currentCommand.channel}-response`, { ...this.currentCommand, response: `Command executed.` })
          }
          
          this.currentCommand = null;
        }
      }, 100);
    });
  }

  private async handleWrite(stream: NodeJS.ReadWriteStream) {
    if (this.writeInterval) {
      clearInterval(this.writeInterval);
    }

    this.writeInterval = setInterval(async () => {
      if (this.currentCommand) {
        return;
      }

      if (stream && this.queue[0]) {
        this.currentCommand = this.queue[0];
        this.queue.shift();
        stream.write(`${this.currentCommand.command}\n`);
      }
    }, 50);
  }
}
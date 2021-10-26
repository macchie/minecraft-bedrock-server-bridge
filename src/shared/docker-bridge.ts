import fs from 'fs';
import Dockerode from 'dockerode';
import { EventEmitter } from 'events';
import { Transform } from 'stream';

export const DOCKER_SERVER_LABEL = process.env.BDS_CONTAINER_LABEL || 'minecraft_bedrock_server';

export class BridgeCommand {
  channel!: 'api' | 'telegram';
  command!: string;
  chatId?: number;
  executed: boolean = false;
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
  private outStream!: NodeJS.ReadWriteStream;
  private currentCommand!: BridgeCommand;
  private responseTimeout?;
  private queue: BridgeCommand[] = [];

  private streamFilter = new Transform({
    decodeStrings: false
  });

  constructor() {
    super();
  }

  get isAttached() {
    return this.serverContainer !== undefined;
  }

  public async init() {
    if (fs.existsSync('/var/run/docker.sock')) {
      this.client = new Dockerode({socketPath: '/var/run/docker.sock'});
      console.log(`Docker UNIX Socket found!`);
    } else {
      console.log(`No Docker UNIX Socket found!`);
      return;
    }

    this.setStreamFilter();
    await this.setServerContainer();
    await this.attachToContainer();

    setInterval(() => {
      if (this.currentCommand && this.currentCommand.executed === false) {
        return;
      }

      if (this.outStream && this.queue[0]) {
        this.currentCommand = this.queue[0];
        this.queue.shift();
        this.outStream.write(`${this.currentCommand.command}\n`);
      }
    }, 50);
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
        if (!stream) {
          return;
        }

        stream.pipe(this.streamFilter)
        this.outStream = stream;
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

  private setStreamFilter() {
    this.streamFilter._transform = (chunk, encoding, done) => {
      const out = chunk.toString();

      if (this.responseTimeout) {
        clearTimeout(this.responseTimeout);
      }

      this.responseTimeout = setTimeout(() => {
        if (this.currentCommand.command.trim() !== out.trim()) {
          this.emit(`${this.currentCommand.channel}-response`, { ...this.currentCommand, response: out })
        } else {
          this.emit(`${this.currentCommand.channel}-response`, { ...this.currentCommand, response: `Command executed.` })
        }
        this.currentCommand.executed = true;
      }, 200)
      
      return done(null, out);
    };
  }
}
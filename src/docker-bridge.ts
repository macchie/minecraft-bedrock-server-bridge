import fs from 'fs';
import Dockerode from 'dockerode';

export class DockerBridge {

  private static client: Dockerode;
  private static serverContainer: Dockerode.Container;
  private static stream: NodeJS.ReadWriteStream;

  static get isAttached() {
    return this.serverContainer !== undefined;
  }

  public static async init() {
    if (fs.existsSync('/var/run/docker.sock')) {
      this.client = new Dockerode({socketPath: '/var/run/docker.sock'});
      console.log(`Docker UNIX Socket found!`);
    } else {
      console.log(`No Docker UNIX Socket found!`);
      return;
    }

    await this.setServerContainer();
    await this.attachToContainer();
  }

  public static sendMessage(msg: string) {
    if (this.stream) {
      this.stream.write(`${msg}\n`);
    }
  }

  // private

  private static async attachToContainer() {
    if (this.serverContainer) {
      this.serverContainer.attach({stream: true, stdin: true, stdout: true, stderr: true}, (err, stream) => {
        if (!stream) {
          return;
        }
        
        this.stream = stream;
        console.log(`Attached to Server container!`);
      });
    } else {
      console.log(`No Server container was found!`);
    }
  }

  private static async setServerContainer() {
    const containers = await this.client.listContainers();

    for (const container of containers) {
      for (const label of Object.keys(container.Labels)) {
        if (label === 'minecraft_bedrock_server') {
          console.log(`Server container found!`);
          this.serverContainer = this.client.getContainer(container.Id);
        }
      }
    }
  }
}
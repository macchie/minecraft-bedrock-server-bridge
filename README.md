[![Docker Pulls](https://img.shields.io/docker/pulls/itzg/minecraft-bedrock-server.svg)](https://hub.docker.com/r/itzg/minecraft-bedrock-server/)
[![GitHub Issues](https://img.shields.io/github/issues-raw/itzg/docker-minecraft-bedrock-server.svg)](https://github.com/itzg/docker-minecraft-bedrock-server/issues)
[![Build](https://github.com/itzg/docker-minecraft-bedrock-server/workflows/Build/badge.svg)](https://github.com/itzg/docker-minecraft-bedrock-server/actions?query=workflow%3ABuild)
[![Discord](https://img.shields.io/discord/660567679458869252?label=Discord&logo=discord)](https://discord.gg/ScbTrAw)
[![](https://img.shields.io/badge/Donate-Buy%20me%20a%20coffee-orange.svg)](https://www.buymeacoffee.com/itzg)

# Minecraft Bedrock Server Bridge

`RCON` replacement for Mincraft Bedrock Dedicated Servers. 

### How to Use

Extend your `itzg/docker-minecraft-bedrock-server` `docker-compose.yml` file to produce something similar:

```yaml
version: '3.4'

services:
  bds:
    image: itzg/minecraft-bedrock-server
    environment:
      EULA: "TRUE"
      GAMEMODE: creative
      SERVER_NAME: Your Server Name
      LEVEL_SEED: 2111844826
      VERSION: 1.17.34.02
    ports:
      - 19132:19132/udp
#      - 39132:39132
#      - 39132:39132/udp
#      - 39133:39133
#      - 39133:39133/udp
    volumes:
      - /path/to/data:data
    labels:
      minecraft_bedrock_server: "true"
    stdin_open: true
    tty: true
    sysctls:
      net.ipv4.ip_local_port_range: 39132 39133
  
  bds_bridge:
    image: macchie/minecraft-bedrock-server-bridge
    environment:
      - TELEGRAM_BOT_TOKEN=12345
      - TELEGRAM_BOT_ADMINS=username1,username2
    volume:
      - /var/run/docker.sock:/var/run/docker.sock
```

Make sure you set your Server with:

```yaml
stdin_open: true
tty: true
labels:
  minecraft_bedrock_server: "true"
```

`stdin_open` and `tty` allows you attach to the Docker container to run commands through the console.
Adding a `labels` entry with a label `minecraft_bedrock_server` (label value is not important, this is just to flag which container is the Minecraft Server)

Also add a new `bds_bridge` service:

```yaml
bds_bridge:
  image: macchie/minecraft-bedrock-server-bridge
  environment:
    - TELEGRAM_BOT_TOKEN=12345
    - TELEGRAM_BOT_ADMINS=username1,username2
  volume:
    - /var/run/docker.sock:/var/run/docker.sock
```

### To-Do

- Implement HTTP API protocol to send commands

### Notes

- Currently working **ONLY** in combination with: [itzg/docker-minecraft-bedrock-server](https://github.com/itzg/docker-minecraft-bedrock-server) **in a Docker Environment**
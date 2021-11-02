#!/usr/bin/env node

const fs = require('fs')
const http = require('http')

const request = async (data) => {
  return new Promise((resolve) => {
    const options = {
      hostname: process.env.SERVER_IP || '127.0.0.1',
      port: process.env.SERVER_PORT || 17394,
      path: '/execute',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 3000
    }
  
    const req = http.request(options, res => {
      res.on('data', d => {
        console.log(d.toString())
        return resolve(d);
      })
    })
  
    req.on('error', error => {
      return resolve(null);
    })

    req.write(JSON.stringify(data))
    req.end()
  })
};

const main = async () => {

  const inputFilePath = process.argv[2];
  let inputData = {};

  try {
    inputData = JSON.parse(fs.readFileSync(inputFilePath).toString());
  } catch (error) {
    console.log(`Error opening input file!`);
    process.exit(1);
  }
  
  try {
    if (inputData.init && inputData.init.message) {
      await request({ command: `say ${inputData.init.message}`})
    }
    
    if (inputData.build && inputData.build.layers && inputData.build.layers.length > 0) {
      let [ startX, startY, startZ ] = inputData.build.start || [];

      if (process.argv[3] && process.argv[4] && process.argv[5]) {
        try {
          startX = parseInt(process.argv[3]);
          startY = parseInt(process.argv[4]);
          startZ = parseInt(process.argv[5]);
        } catch (error) {
          
        }
      }

      if (startX === undefined || startY === undefined || startZ === undefined) {
        console.log(`start position not provided`)
      }

      let maxX = 0;
      let maxY = inputData.build.layers.length;
      let maxZ = 0;

      for (const layer of inputData.build.layers) {
        maxZ = Math.max(maxZ, layer.length)
        
        for (const row of layer) {
          maxX = Math.max(maxX, row.length)
        }
      }

      if (inputData.build.center) {
        startX = startX >= 0 ? startX - Math.floor(maxX/2) : startX + Math.floor(maxX/2);
        startZ = startZ >= 0 ? startZ - Math.floor(maxZ/2) : startZ + Math.floor(maxZ/2);
      }

      if (inputData.build.base) {
        const baseBorderSize = inputData.build.borderSize || 0; 
        const endX = startX + (maxX-1) + baseBorderSize;
        const endZ = startZ + (maxZ-1) + baseBorderSize;
        await request({ command: `fill ${startX-baseBorderSize} ${startY-1} ${startZ-baseBorderSize} ${endX} ${startY-1} ${endZ} ${inputData.build.base}`});
        await sleep()
      }

      if (inputData.build.clean) {
        const endX = startX + maxX +2;
        const endY = startY + maxY +2;
        const endZ = startZ + maxZ +2;
        await request({ command: `fill ${startX-2} ${startY} ${startZ-2} ${endX} ${endY} ${endZ} air`});
        await sleep()
      }
      
      let startAtLayer = 0;
      let direction = 1;
      let offset = 0;

      if (inputData.build.direction && inputData.build.direction === 'down') {
        inputData.build.layers.reverse();
        startAtLayer = inputData.build.layers.length - 1;
        direction = -1;
        offset = - inputData.build.layers.length - 1;
      }

      for (let y = startAtLayer; y < inputData.build.layers.length; y = y + direction) {
        const layer = inputData.build.layers[y];
        
        for (let z = 0; z < layer.length; z++) {
          const row = layer[z];
          let sameBlockCount = 0;
          let sameBlockStart = 0;

          for (let x = 0; x < row.length; x++) {
            let block = row[x];

            if (!block) {
              sameBlockCount = 0;
              sameBlockStart = 0;
              continue;
            }

            if (block && row[x+1] && row[x+1] === block) {
              if (sameBlockCount === 0) { 
                sameBlockStart = x;
              }
              sameBlockCount++;
              continue;
            }

            if (sameBlockCount > 0) {
              const material = row[sameBlockStart];
              await request({ command: `fill ${startX+sameBlockStart} ${startY+y+offset} ${startZ+z} ${startX+sameBlockStart+sameBlockCount} ${startY+y+offset} ${startZ+z} ${material}`});
              sameBlockCount = 0;
              sameBlockStart = 0;
              await sleep()
              continue;
            }
            
            await request({ command: `fill ${startX+x} ${startY+y+offset} ${startZ+z} ${startX+x} ${startY+y+offset} ${startZ+z} ${block}`});
            await sleep()
          }
        }
      }
    }
  } catch (error) {
    console.log(error)
  }
};

const sleep = async (amt = 100) => {
  return new Promise((res) => {
    setTimeout(()=>{
      return res();
    }, amt)
  })
}

main();
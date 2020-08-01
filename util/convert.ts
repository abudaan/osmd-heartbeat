import fs from 'fs';
import path from 'path';

const run = async () => {
  const dev = process.argv[2] === 'true';
  // console.log(dev);
  const p = path.join('../', 'package.json');
  const f = await fs.promises.readFile(p, 'utf-8');
  const j = JSON.parse(f);
  if (dev) {
    j.dependencies['heartbeat-sequencer'] = '../heartbeat';
    j.dependencies['webdaw-modules'] = '../WebDAW';
  } else {
    j.dependencies['heartbeat-sequencer'] = '0.0.21';
    j.dependencies['webdaw-modules'] = '0.0.8';
  }
  await fs.promises.writeFile(p, JSON.stringify(j));
};

run();

import fs from 'fs';
import path from 'path';

// process.args: string dev or pub, string version heartbeat, string version WebDAW
const run = async () => {
  const dev = process.argv[2] === 'dev';
  // console.log(dev);
  const p = path.join('../', 'package.json');
  const f = await fs.promises.readFile(p, 'utf-8');
  const j = JSON.parse(f);
  if (dev) {
    j.dependencies['heartbeat-sequencer'] = '../heartbeat';
    j.dependencies['webdaw-modules'] = '../WebDAW';
  } else {
    j.dependencies['heartbeat-sequencer'] = process.argv[3];
    j.dependencies['webdaw-modules'] = process.argv[4];
  }
  await fs.promises.writeFile(p, JSON.stringify(j));
};

run();

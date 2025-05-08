const { program } = require('commander');
const express = require('express');

program
  .requiredOption('-h, --host <host>', 'Server host')
  .requiredOption('-p, --port <port>', 'Server port')
  .requiredOption('-c, --cache <cache>', 'Cache directory')
  .parse(process.argv);

const { host, port, cache } = program.opts();

const app = express();

const startServer = () => {
  app.listen(port, host, () => {
    console.log(`Server running at http://${host}:${port}/`);
  });
};

startServer();
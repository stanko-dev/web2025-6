const { program } = require('commander');
const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const multer = require('multer');

program
  .requiredOption('-h, --host <host>', 'server host')
  .requiredOption('-p, --port <port>', 'server port')
  .requiredOption('-c, --cache <cache>', 'cache directory')
  .parse(process.argv);

const { host, port, cache } = program.opts();

const app = express();

// middleware to parse text body for put requests
app.use(express.text());

// setup multer for form-data
const storage = multer.memoryStorage();
const upload = multer({ storage });

// ensure cache directory exists
const ensureCacheDir = async () => {
  try {
    await fs.mkdir(cache, { recursive: true });
  } catch (err) {
    console.error('error creating cache directory:', err);
    process.exit(1);
  }
};

// get note by name
app.get('/notes/:noteName', async (req, res) => {
  const noteName = req.params.noteName;
  const notePath = path.join(cache, `${noteName}.txt`);
  try {
    const data = await fs.readFile(notePath, 'utf8');
    res.status(200).send(data);
  } catch (err) {
    if (err.code === 'ENOENT') {
      res.status(404).send('Not Found');
    } else {
      res.status(500).send('Server Error');
    }
  }
});

// update note
app.put('/notes/:noteName', async (req, res) => {
  const noteName = req.params.noteName;
  const notePath = path.join(cache, `${noteName}.txt`);
  try {
    await fs.access(notePath); // check if note exists
    await fs.writeFile(notePath, req.body, 'utf8');
    res.status(200).send('Updated');
  } catch (err) {
    if (err.code === 'ENOENT') {
      res.status(404).send('Not Found');
    } else {
      res.status(500).send('Server Error');
    }
  }
});

// delete note
app.delete('/notes/:noteName', async (req, res) => {
  const noteName = req.params.noteName;
  const notePath = path.join(cache, `${noteName}.txt`);
  try {
    await fs.unlink(notePath);
    res.status(200).send('Deleted');
  } catch (err) {
    if (err.code === 'ENOENT') {
      res.status(404).send('Not Found');
    } else {
      res.status(500).send('Server Error');
    }
  }
});

// get list of all notes
app.get('/notes', async (req, res) => {
  try {
    const files = await fs.readdir(cache);
    const notes = await Promise.all(
      files
        .filter(file => file.endsWith('.txt'))
        .map(async file => {
          const name = file.replace('.txt', '');
          const text = await fs.readFile(path.join(cache, file), 'utf8');
          return { name, text };
        })
    );
    res.status(200).json(notes);
  } catch (err) {
    res.status(500).send('Server Error');
  }
});

// serve upload form
app.get('/UploadForm.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'UploadForm.html'));
});

// create new note via form
app.post('/write', upload.fields([{ name: 'note_name' }, { name: 'note' }]), async (req, res) => {
  const noteName = req.body.note_name;
  const noteText = req.body.note;
  const notePath = path.join(cache, `${noteName}.txt`);

  try {
    await fs.access(notePath); // check if note exists
    res.status(400).send('Note already exists');
  } catch (err) {
    if (err.code === 'ENOENT') {
      await fs.writeFile(notePath, noteText, 'utf8');
      res.status(201).send('Created');
    } else {
      res.status(500).send('Server Error');
    }
  }
});

// start server
const startServer = async () => {
  await ensureCacheDir();
  app.listen(port, host, () => {
    console.log(`server running at http://${host}:${port}/`);
  });
};

startServer();
const { program } = require('commander');
const express = require('express');
const fs = require('fs');
const fsPromises = require('fs').promises;
const path = require('path');
const multer = require('multer');
const swaggerUi = require('swagger-ui-express');
const YAML = require('js-yaml');

program
  .requiredOption('-h, --host <host>', 'server host')
  .requiredOption('-p, --port <port>', 'server port')
  .requiredOption('-c, --cache <cache>', 'cache directory')
  .parse(process.argv);

const { host, port, cache } = program.opts();

const app = express();

// load swagger docs
const swaggerDocument = YAML.load(fs.readFileSync(path.join(__dirname, 'swagger.yaml'), 'utf8'));
app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// middleware to parse text body for put requests
app.use(express.text());

// setup multer for form-data
const storage = multer.memoryStorage();
const upload = multer({ storage });

// ensure cache directory exists
const ensureCacheDir = async () => {
  try {
    await fsPromises.mkdir(cache, { recursive: true });
  } catch (err) {
    console.error('error creating cache directory:', err);
    process.exit(1);
  }
};

/**
 * @swagger
 * /notes/{noteName}:
 *   get:
 *     summary: retrieve a note by name
 *     parameters:
 *       - name: noteName
 *         in: path
 *         required: true
 *         type: string
 *     responses:
 *       200:
 *         description: returns the note text
 *       404:
 *         description: note not found
 */
app.get('/notes/:noteName', async (req, res) => {
  const noteName = req.params.noteName;
  const notePath = path.join(cache, `${noteName}.txt`);
  try {
    const data = await fsPromises.readFile(notePath, 'utf8');
    res.status(200).send(data);
  } catch (err) {
    if (err.code === 'ENOENT') {
      res.status(404).send('Not Found');
    } else {
      res.status(500).send('Server Error');
    }
  }
});

/**
 * @swagger
 * /notes/{noteName}:
 *   put:
 *     summary: update an existing note
 *     parameters:
 *       - name: noteName
 *         in: path
 *         required: true
 *         type: string
 *       - name: body
 *         in: body
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: note updated successfully
 *       404:
 *         description: note not found
 */
app.put('/notes/:noteName', async (req, res) => {
  const noteName = req.params.noteName;
  const notePath = path.join(cache, `${noteName}.txt`);
  try {
    await fsPromises.access(notePath); // check if note exists
    await fsPromises.writeFile(notePath, req.body, 'utf8');
    res.status(200).send('Updated');
  } catch (err) {
    if (err.code === 'ENOENT') {
      res.status(404).send('Not Found');
    } else {
      res.status(500).send('Server Error');
    }
  }
});

/**
 * @swagger
 * /notes/{noteName}:
 *   delete:
 *     summary: delete a note
 *     parameters:
 *       - name: noteName
 *         in: path
 *         required: true
 *         type: string
 *     responses:
 *       200:
 *         description: note deleted successfully
 *       404:
 *         description: note not found
 */
app.delete('/notes/:noteName', async (req, res) => {
  const noteName = req.params.noteName;
  const notePath = path.join(cache, `${noteName}.txt`);
  try {
    await fsPromises.unlink(notePath);
    res.status(200).send('Deleted');
  } catch (err) {
    if (err.code === 'ENOENT') {
      res.status(404).send('Not Found');
    } else {
      res.status(500).send('Server Error');
    }
  }
});

/**
 * @swagger
 * /notes:
 *   get:
 *     summary: list all notes
 *     responses:
 *       200:
 *         description: returns a list of notes
 *         schema:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               text:
 *                 type: string
 */
app.get('/notes', async (req, res) => {
  try {
    const files = await fsPromises.readdir(cache);
    const notes = await Promise.all(
      files
        .filter(file => file.endsWith('.txt'))
        .map(async file => {
          const name = file.replace('.txt', '');
          const text = await fsPromises.readFile(path.join(cache, file), 'utf8');
          return { name, text };
        })
    );
    res.status(200).json(notes);
  } catch (err) {
    res.status(500).send('Server Error');
  }
});

/**
 * @swagger
 * /UploadForm.html:
 *   get:
 *     summary: serve the upload form
 *     responses:
 *       200:
 *         description: returns the html upload form
 */
app.get('/UploadForm.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'UploadForm.html'));
});

/**
 * @swagger
 * /write:
 *   post:
 *     summary: create a new note
 *     consumes:
 *       - multipart/form-data
 *     parameters:
 *       - name: note_name
 *         in: formData
 *         required: true
 *         type: string
 *       - name: note
 *         in: formData
 *         required: true
 *         type: string
 *     responses:
 *       201:
 *         description: note created successfully
 *       400:
 *         description: note already exists
 */
app.post('/write', upload.fields([{ name: 'note_name' }, { name: 'note' }]), async (req, res) => {
  const noteName = req.body.note_name;
  const noteText = req.body.note;
  const notePath = path.join(cache, `${noteName}.txt`);

  try {
    await fsPromises.access(notePath); // check if note exists
    res.status(400).send('Note already exists');
  } catch (err) {
    if (err.code === 'ENOENT') {
      await fsPromises.writeFile(notePath, noteText, 'utf8');
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

import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();
app.use(express.static(path.join(__dirname, 'public')));

const port = Number(process.env.PORT || 5188);
app.listen(port, () => {
  console.log(`Majin Island Reception running at http://localhost:${port}`);
});

const express = require('express');
const { validateUrl } = require('./lib/validateUrl');

const app = express();

app.use(express.json());
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'yes' });
});

app.post('/links', (req, res) => {
 const { url } = req.body;

  if (!url) {
    return res.status(400).json({ error: 'url is required' });
  }

  const validation = validateUrl(url);
  if (!validation.valid) {
    return res.status(400).json({ error: validation.error });
  }

  res.status(200).json({ received: url });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`API listening on port ${PORT}`);
});
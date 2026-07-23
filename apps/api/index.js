const express = require('express');
const app = express();

app.use(express.json());
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'yes' });
});

app.post('/links', (req, res) => {
  console.log('Received body:', req.body);
  res.status(200).json({ received: req.body });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`API listening on port ${PORT}`);
});
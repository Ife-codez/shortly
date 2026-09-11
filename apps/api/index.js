const express = require('express');
const app = express();

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'yes' });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`API listening on port ${PORT}`);
});

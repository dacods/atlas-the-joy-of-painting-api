const app = require('./src/app');
const port = process.env.PORT || 3000;

app.listen(port, () => {
  console.log(`API server running on http://localhost:${port}`);
});
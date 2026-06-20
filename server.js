const express = require('express');
const cors = require('cors');
const sequelize = require('./config/database');
const rubikController = require('./controllers/rubikController');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

sequelize.sync({ force: false })
  .then(() => console.log('Database MariaDB synchronized successfully.'))
  .catch((err) => console.error('Failed to sync database:', err.message));

app.get('/health', rubikController.getHealth);
app.get('/schema', rubikController.getSchema);

app.get('/rubiks', rubikController.getAllRubiks);
app.get('/rubiks/:id', rubikController.getRubikById);
app.post('/rubiks', rubikController.createRubik);
app.put('/rubiks/:id', rubikController.updateRubik);
app.delete('/rubiks/:id', rubikController.deleteRubik);

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
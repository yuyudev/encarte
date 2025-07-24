// src/app.js

require('dotenv').config(); 
const express = require('express');
const session = require('express-session');
const path = require('path');
const cronJobs = require('./utils/cronJobs');

const db = require('./config/db'); 

const authRoutes = require('./routes/authRoutes');
const produtoRoutes = require('./routes/produtoRoutes');
const encarteRoutes = require('./routes/encarteRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const uploadRouter = require('./routes/uploadRoutes');
const fabricantesRoutes = require('./routes/fabricanteRoutes');


const app = express();
const port = process.env.PORT || 3000;

app.use(express.static(path.join(__dirname, 'public')));

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');


db.sync() 
  .then(async () => {
    console.log('Tabelas sincronizadas com sucesso!');
  })
  .catch(console.error);


app.use(express.json());
app.use(express.urlencoded({ extended: true, limit: '1000mb', parameterLimit: 50000 }));

app.use(
  session({
    secret: 'chave-secreta-super-segura',
    resave: false,
    saveUninitialized: false
  })
);

app.get('/', (req, res) => {
  res.send('Hello world! Este é meu app de encartes em Node.');
});

app.use('/auth', authRoutes);
app.use('/produtos', produtoRoutes);
app.use('/encartes', encarteRoutes);
app.use('/fabricantes', fabricantesRoutes);
app.use('/', dashboardRoutes);
app.use('/', uploadRouter);

cronJobs.initCronJobs();

app.listen(port, () => {
  console.log(`Servidor rodando em http://localhost:${port}`);
  console.log(path.join(__dirname, 'public'))
});

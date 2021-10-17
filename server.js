const express = require('express');
const req = require('express/lib/request');
const path = require('path');
const app = express();
const port = 5000;

app.get('/', (req, res) => {
    res.sendFile('index.html', {root: __dirname});      // server responds by sending the index.html file to the client's browser
});

app.use(express.static(path.join(__dirname, 'public')));

app.listen(port, () => {
    console.log("now listening on port " + port);
});


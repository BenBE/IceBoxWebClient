var express = require('express');
var app = express();
var path = require('path');
var cors = require('cors');
var bonjour = require('bonjour')();
var exec = require('exec');
var request = require('request');
var fs = require('fs');

cors({
  credentials: true,
  origin: true
});
app.use(cors()); // Support cross origin requests

app.apihost = process.env.ICEBOX_API_HOST || "127.0.0.1";
app.apiport = process.env.ICEBOX_API_PORT || 8081;

bonjour.find(
  { type: 'icebox' },
  function(service) {
    console.log(JSON.stringify(service));
    app.apihost = service.host;
    app.apiport = service.port;
  });

app.get('/serviceip', function(req, res) {
  res.json({ ip: app.apihost, port: app.apiport });
});

app.get('/doreset', function(req, res) {
  console.log("calling reset.");
  exec('./restart.sh', function(a, b, c) {
    exec('./restart.sh', function(a, b, c) {
      res.json({ok: true});
    });
  });
});

app.use('/proxy/:icebox/', function(req, res) {
  if(req.params.icebox !== app.apihost + ':' + app.apiport) {
    res.error(403);
  }

  var upstream_url = 'http://' + app.apihost + ':' + app.apiport + req.url;
  req.pipe(request(upstream_url)).pipe(res);
});

app.get(
  '/image/:file.png',
  function(req, res) {
    if(/^\/image\/[^.]+?\.png$/.test(req.path)) {
      if(fs.existsSync(path.join(__dirname + '/static' + req.path))) {
        res.sendFile(path.join(__dirname + '/static' + req.path));
        return;
      }
    }
    res.sendFile(path.join(__dirname + '/static/image/bottle.png'));
  });

app.get(
  '/',
  function(req, res) {
    app.use(express.static(__dirname + '/static/'));
    res.sendFile(path.join(__dirname + '/static/index.html'));
  });

app.get(
  '/isiceboxdown',
  function(req, res) {
    res.sendFile(path.join(__dirname + '/static/reset.html'));
  });

console.log("starting to server on port " + (process.env.ICEBOX_WEB_PORT || 80));
app.listen(process.env.ICEBOX_WEB_PORT || 80);

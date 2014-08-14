var http = require("http")
var querystring = require("querystring");
var st = require("st");
// var db = require('level');
var Router = require("routes-router")
var sendJson = require("send-data/json")
var useragent = require('useragent');
var PeerServer = require('peer').PeerServer;
var pServer = new PeerServer({port: 9000, path: '/peers', debug: true, timeout: 50000});

var ffClients = [];
var chromeClients = [];

function removeConnection(id) {
  for (var i = ffClients.length-1; i >= 0; i--) {
    if (ffClients[i].id == id) {
      ffClients.splice(i, 1);
      break;
    }
  }

  for (var i = chromeClients.length-1; i >= 0; i--) {
    if (chromeClients[i].id == id) {
      chromeClients.splice(i, 1);
      break;
    }
  }
}

var app = Router()

app.addRoute("/connections", function (req, res) {
  var agent = useragent.parse(req.headers['user-agent']);
  console.log(agent.family);
  if (agent.family === 'Firefox') {
    sendJson(req, res, {
      connections: ffClients
    });
  } else {
    sendJson(req, res, {
      connections: chromeClients
    });
  }
});

app.addRoute("/connect/:params", function (req, res, opts) {
  var agent = useragent.parse(req.headers['user-agent']);

  var connection = querystring.parse(opts.params.params);
  if (agent.family === 'Firefox') {
    ffClients.push(connection);
    sendJson(req, res, {
      connections: ffClients
    });
  } else {
    chromeClients.push(connection);
    sendJson(req, res, {
      connections: chromeClients
    });
  }
});

app.addRoute("/*", st({
  path: __dirname + "/static",
  url: '/',
  index: 'index.html'
}));

pServer.on('connection', function(id) {
  console.log('connection', id);
})

pServer.on('disconnect', function(id) {
  removeConnection(id);
})

var server = http.createServer(app)
server.listen(3000)
console.log('server running on port: ', 3000);
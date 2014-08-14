var uniqID = function(){return Math.random().toString(16).slice(2);};
var connections = {};

var me = {
  id: uniqID(),
  online: false
};

var peer = new Peer(me.id, {debug: 3, host: 'localhost', port: 9000, path: '/peers'});
var connectionList = document.querySelector(".connections");
var connectEl = document.querySelector('.connect');
var msgs = document.querySelector('.msg');
var outgoing = document.querySelector('.outgoing');

outgoing.addEventListener('keydown', function(ev) {
  if (ev.keyCode === 13) {
    var keys = Object.keys(connections);

    keys.forEach(function(key) {
      var msg = {
        type: 'chat',
        from: me,
        time: new Date().toTimeString(),
        msg: outgoing.value.trim()
      };
      connections[key].send(JSON.stringify(msg));
    });

    outgoing.value = '';
  }
})

// var poll =
window.setInterval(getConnections, 2000);

connectEl.addEventListener("click", connect);

peer.on('connection', function(conn) {
  conn.on('data', function(data) {
    var msg = JSON.parse(data);
    if (msg.type === 'chat') {
      var p = document.createElement('p');
      p.innerText = msg.from.username + '(' + msg.time + '): ' + msg.msg;
      msgs.appendChild(p);
    }
  });

  conn.on('error', function(err) {
    console.warn(err);
  });

  conn.on('close', function() {
    window.alert(conn.peer + ' has left the chat.');
  });
});

function makeConnection(id) {
  var c = peer.connect(id, {
    label: 'chat',
    reliable: true,
    serialization: 'none',
    metadata: {message: 'hi i want to chat with you!'}
  });

  c.on('open', function(){
    var msg = {
      type: 'chat',
      from: me,
      time: new Date().toTimeString(),
      msg: 'Joined'
    };

    c.send(JSON.stringify(msg));
  });

  return c;
}

function renderPeer(peerObj) {
  var anchor = document.createElement('a');
  anchor.addEventListener('click', function(ev) {
    var id = ev.target.attributes['data-id'].value;
    makeConnection(id);
  });
  anchor.setAttribute("data-id", peerObj.id);
  anchor.innerText = peerObj.name;
  var li = document.createElement('li');
  li.appendChild(anchor);
  connectionList.appendChild(li);
}

function connectionsUpdate(freshConnections) {
  connectionList.innerHTML = '';
  freshConnections.forEach(function(result) {
    if (!connections[result.id] && me.online) {
      connections[result.id] = makeConnection(result.id);
    }
    if (result.id !== me.id) renderPeer(result);
  });
}

function connected(ev) {
  console.log('Connection: you are connected!');
}

function connect() {
  me.username = window.prompt("Choose a username");
  var params = "id="+ me.id +"&name="+ me.username;
  console.log('get connections called!');
  var xhr = new XMLHttpRequest();
  xhr.open('POST', '/connect/' + params, true);

  xhr.onloadend = function(ev) {
    var response = JSON.parse(ev.target.response);
    me.online = true;
    connectionsUpdate(response.connections);
  };
  xhr.send();
}

function getConnections() {
  var xhr = new XMLHttpRequest();
  xhr.open('GET', '/connections');

  xhr.onloadend = function(ev) {
    var response = JSON.parse(ev.target.response);
    connectionsUpdate(response.connections);
  };
  xhr.send();
}

function phoneHome() {
  var xhr = new XMLHttpRequest();
  xhr.open('POST', '/connect');
  xhr.onloadend = connected;
  xhr.send();
}

window.onunload = window.onbeforeunload = function(e) {
                    if (!!peer && !peer.destroyed) {
                      peer.destroy();
                    }
                  };

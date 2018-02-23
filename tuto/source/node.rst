*************************
Le WebSocket avec Node.js
*************************

Les modules de WebSocket
========================

Il existe différents modules sur npm pour faire du socket avec Node.js:

- socket
- socket.io
- ws
- ...

Par la suite, nous allons vous présenter socket.io (https://socket.io/).

Socket.io
=========

Comme nous l'avons vu précédemment, socket permet une communication bidirectionnelle en temps réel (sans avoir à rafaîchir la page) entre un client et un serveur.
Socket.IO fonctionne avec :

- un serveur HTTP en Node.JS : socket.io
- une librairie côté navigateur (client): socket.io-client

Le principe est de s'échanger des informations à travers certains canaux de communication. Sur un canal, le serveur et le client vont pouvoir soit émettre soit recevoir ces informations. On émet avec '.emit' et on reçoit avec '.on'.

Voici comment initialiser le côté serveur lorsqu'on utilise express: ::

    var app = require('express')();
    var server = require('http').Server(app);
    var io = require('socket.io')(server);

    server.listen(80);

    app.get('/', function (req, res) {
      res.sendfile(__dirname + '/index.html');
    });

    io.on('connection', function (socket) {
      socket.emit('news', { hello: 'world' });
      socket.on('my other event', function (data) {
        console.log(data);
      });
    });

Ici, dès qu'un client entre dans le 'io.on('connection', ...' grâce à un 'var socket = io.connect('http://localhost');', le canal de communication est créé, on va executer ce qu'il y a dans la 'function'.
Plus précisement, on va envoyer au client connecté sur le canal des évènements de type 'news' contenant des informations, qui constituent ici un fichier JSON '{ hello: 'world' }'. Il ne pourra les traiter que si il a de son côté un '.on' spécifique aux évènements 'news'.
On va également attendre des évènements de type 'my other event' et dès leur réception, on va afficher à la console les 'data' qui nous on été envoyées.

et côté client: ::

    <script src="/socket.io/socket.io.js"></script>
    <script>
      var socket = io.connect('http://localhost');
      socket.on('news', function (data) {
        console.log(data);
        socket.emit('my other event', { my: 'data' });
      });
    </script>

Il suffit d'un 'io.connect()' pour demander la création du canal de communication avec le serveur. On écoute avec un 'socket.on()', ici on attend pour les évènements de type 'news'. Si on en reçoit un, on va executer la 'function' avec les 'data', donc les informations, qui nous ont été envoyées par le serveur avec un '.emit'.
Enfin 'socket.emit' permet d'envoyer sur le canal 'my other event' des données de type JSON, ici '{ my: 'data' }'.

Voila pour le fonctionnement de base, maintenant nous allons entrer un peu dans les détails.

Côté serveur, il existe donc un 'io.on('connection', ...' qui permet de savoir quand un utilisateur se connecte. Il existe aussi un 'disconnect' afin de gérer la déconnexion des clients: ::

    socket.on('disconnect', function () {
        io.emit('user disconnected');
      });

Le reste du temps on personnalise le premier paramètre comme on le faisait précédemment avec 'news' ou 'my other event' afin de personnaliser les actions.

Il existe plusieurs moyens depuis le serveur d'envoyer des informations:

- Soit on les envoie à tout le monde avec un 'io.emit'
- Soit on ne les envoie qu'au client qui déclenche la fonction avec un 'socket.emit'
- Soit on les envoie à tout le monde sauf au client qui déclenche la fonction avec un 'socket.broadcast.emit'
- On peut les envoyer également à un personne en particulier, pour cela il suffit de sauvegarder les socket des gens connectés dans une liste et d'y faire appel : 'socketdelapersonne.emit'


Voilà pour ce qu'il y a principalement à comprendre pour le tuto, mais Socket.IO permet aussi de:

- multiplexer une connection grâce à un système de noms pour les connections
- envoyer des messages volatiles (ils ne seront traités que si le client est en capacité de le faire à ce moment là)
- confirmer la réception d'un message
- parametrer la connection (pingTimeout...)
- gérer les erreurs
- ...

Pour plus d'informations à propos de ces fonctionnalités, n'hésitez pas à aller voir la doc qui est très détaillée: https://socket.io/docs/.

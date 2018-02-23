var express = require('express')
var app = express()

var http = require('http').Server(app);
var io = require('socket.io')(http);

// Pour utiliser ejs:
app.set('view engine', 'ejs')
// Pour accéder aux fichiers 'static' comme les images:
app.use("/static", express.static(__dirname + '/assets'))

// On créé le chemin vers la page d'accueil qui est home.ejs
app.get('/', (request, response) => {
    response.render("home")
})

// On créé le chemin vers l'aide en ligne qui est websocketdemo.ejs
app.get('/websocketdemo', (request, response) => {
    response.render("websocketdemo")
})

// Si aucun des chemins précédents ne correspond, on envoie la page 404:
app.use(function (req, res, next) {
    res.status(404).render("404")
})

// Variables communes a tous les utilisateurs
var dicostatus = {"Tous": ""}; // Associe a un nom le statut (prof ou eleve)
var dicosocket = {}; // Associe a un nom le socket associe a ce nom

// Ecoute les évènements 'connection' qui arrivent et affiche un message à la console
io.on('connection', function(socket){
  console.log('a user connected');
  // Variable associee a chaque utilisateur
  var name;

  socket.on('chat message', function(obj){
      if (name != undefined){ // En cas de deconnexion d'internet, le 'name' devient 'undefined', impossible de continuer avec ce nom donc on déconnecte l'utilisateur dans le else.
        if (obj.namedestination == 'Tous'){ // Si le radio bouton 'Tous' est selectionne
          var myObj = { "name": name, "message":obj.privatemessage}; // On recupere le champ 'privatemessage' de 'obj' pour le renvoyer a tout le monde
          console.log(name + ' : ' + obj.privatemessage);
          // Quand on utilise 'io.emit' c'est pour envoyer a tout le monde (inclus celui qui envoie)
          io.emit('chat message', myObj);
        }else{ // Dans le cas ou on veut parler a une personne en particulier
          var myObj = {"nameemetteur": name, "namedestination":obj.namedestination, "message":obj.privatemessage};
          console.log(name + ' a '+ obj.namedestination + ' : ' + obj.privatemessage);
          if(obj.namedestination in dicosocket){ // Si le nom de la personne a qui on veut envoyer le message est bien dans notre dictionnaire (si elle ne s'est pas deconnectee entre temps)
            dicosocket[obj.namedestination].emit('private message', myObj); // On recupere le socket de la personne pour lui envoyer un message individuellement grace à dicosocket : ca n'envoie le message qu'a la personne
            socket.emit('private message', myObj); // On s'envoie aussi le message qu'a nous grace a 'socket.emit'
          }else{
            console.log("Message de" + name + ' a '+ obj.namedestination + " non envoyé!");
          }
        }
      }else{
        socket.disconnect(); // On deconnecte la personne si on perd son nom
      }

    });


    socket.on('drawing', function(data) { // Fonctionne de la meme facon que socket.on('chat message' ...
      if (name != undefined){
        if (data.dest == 'Tous'){
          io.emit('drawing', data);
        }else{
          if(data.dest in dicosocket){
            dicosocket[data.dest].emit('drawing', data);
            socket.emit('drawing', data);
          }else{
            console.log("Message de" + name + ' a '+ data.namedestination + " non envoyé!");
          }
        }
      }else{
        socket.disconnect();
      }
      });


  socket.on('user name', function(msg){// Quand une personne est sur l'ecran de connexion
      var name_existing = false; // On ne veut pas lui redonner le meme pseudo qu'une personne deja connectee
      for (var i in dicostatus){
        if (i == msg.name){ // Si le nom existe deja
          // socket.emit : on envoie qu'a celui qui envoie
          socket.emit('wrong name', name); // On signale a socket.js que ce nom existe deja
          name_existing = true;}
      }
      if (!name_existing){ // Si le nom n'existe pas
          name = msg.name; // On attribue a la variable 'name' le nom que la personne a choisi
          dicostatus[name] = msg.status; // On met le statut qu'elle a indique dans le dicostatus
          dicosocket[name] = socket; // On rajoute son socket dans le dicosocket pour que les gens puissent s'addresser a elle en privee
          console.log('user name: ' + name +' (' + msg.status +  ')');
          //on envoie qu'a celui qui envoie
          socket.emit('username available', name); // On signale que le nom est bon
          // envoyer a tous sauf celui qui envoie
          socket.broadcast.emit('user connect', name); // On diffuse le message a tout le monde (sauf a nous grace au .broadcast) que nous nous sommes connecte
          // io : pour envoyer a tout le monde inclus celui qui envoie
          io.emit('user list', dicostatus); // Pour reactualiser la liste des gens connectes
      }
      });


  socket.on('disconnect', function(){ // A la deconnexion d'un utilisateur
    console.log(name + ' disconnected');
    delete dicosocket[name]; // On supprime la personne des dictionnaires
    delete dicostatus[name];
    io.emit('user list', dicostatus); // On met a jour la liste des gens connectes
    if (name != null){
      socket.broadcast.emit('user disconnect', name); // On signale a tout le monde que cette personne s'est deconnectee
    }

  });
});


port = 3000
//port = 10416
http.listen(port, function() {
  console.log("Listening on: http://localhost:" + port.toString())
})

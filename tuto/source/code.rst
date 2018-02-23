****
Code
****

app.js
======

::

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
    http.listen(port, function() {
      console.log("Listening on: http://localhost:" + port.toString())
    })


package.json (à la source du projet)
====================================

::

    {
      "name": "web",
      "version": "1.0.0",
      "description": "",
      "main": "app.js",
      "scripts": {
        "test": "echo \"Error: no test specified\" && exit 1"
      },
      "repository": {
        "type": "git",
        "url": "git+https://marion_puggioni@bitbucket.org/marie_marion/web.git"
      },
      "author": "",
      "license": "ISC",
      "homepage": "https://bitbucket.org/marie_marion/web#readme",
      "dependencies": {
        "ejs": "^2.5.7",
        "express": "^4.16.2",
        "socket.io": "^2.0.4"
      }
    }

websocketdemo.ejs
=================

::

    <html>

     <head>
         <meta charset="utf-8" />
         <title>Aide en ligne</title>
         <!--Permet d'inclure les imports pour la police, materialize et css-->
         <% include partials/header_imports.ejs %>

     </head>
     <body>
         <!--Permet d'inclure le menu-->
         <canvas class="whiteboard" id= "whiteboard" ></canvas>
        <% include partials/navbar.ejs %>

      <div class="row" id="screen1">
          <div class="image">
            <div class="col s4 offset-s4" id="formulaire">
             <p> Bienvenue sur l'aide en ligne! <p>
             </br>
             <form action="" id="inputname">
                    <p>
                      <input name="group1" type="radio" id="e" required="required" value="eleve"/>
                      <label for="e">Eleve</label>
                    </p>
                    <p>
                      <input name="group1" type="radio" id="p" required="required" value="prof"/>
                      <label for="p">Prof</label>
                   </p>
                   </br>
                      <input id="mbis" autocomplete="off" placeholder="Entrez un pseudo!" required="required" />
                   </br></br>
                      <button type="submit" class="waves-effect waves-light btn green darken-2" id="submitbutton"> Entrer </button>
              </form>
            </div>
          </div>
      </div>

      <div class="row" id="screen2">

            <div class="col s7">
                <div class="divcolored">

                  <div class="row">
                   <div class="col s3">
                     <form action="" id="listusers">
                     </form>
                   </div>

                   <div class="col s9" >
                     <div class="row">
                       <div class="col s12" >
                        <ul id="messages"></ul>
                        </div>
                        <div class="col s11" >
                        <form action="" id="inputmessage">
                          <input id="m" autocomplete="off" placeholder="Tapez un message ..."/>
                        </form>
                        </div>
                      </div>
                    </div>

                  </div>
              </div>
            </div>

            <div class="eraser">
                    <a class="btn-floating btn-large waves-effect waves-light black" ><i class="material-icons">clear</i></a>
            </div>
            <div class="fixed-action-btn vertical" id="palette">
            <a class="btn-floating btn-large red waves-effect waves-light">
              <i class="large material-icons">palette</i>
            </a>
            <ul class="colors" id="colors">
              <li class="color red"></li>
              <li class="color yellow"></li>
              <li class="color green"></li>
              <li class="color blue"></li>
              <li class="color black"></li>
            </ul>
          </div>

      </div>
         <!--Permet d'inclure les imports pour jquery, materialize et js-->
         <% include partials/js_import.ejs %>
          <script src="/static/socket.js"></script>
     </body>
    </html>



home.ejs
========

::

    <html>

     <head>
         <meta charset="utf-8" />
         <title>Maths en ligne</title>
         <!--Permet d'inclure les imports pour la police, materialize et css-->
         <% include partials/header_imports.ejs %>

     </head>
     <body>
         <!--Permet d'inclure le menu-->
         <% include partials/navbar.ejs %>

           <div id="fond_home">
             <div class="container">
               <h1 class="header">Bienvenue!</h1>
               <h5 class="grey-text text-darken-3 lighten-3">Besoin d'un coup de main en maths? Sur ce site vous pouvez bénéficier de cours et d'explications en ligne!</h5>
               </br></br>

             <div class="row" >
               <div class="col l4 m12 s12">
                 <div class="row">
                   <div class="col s12" style="text-align:center">
                     <i class="material-icons" style="font-size: 150px">lightbulb_outline</i>
                   </div>
                   <div class="col s12" style="text-align:center">
                     <h4>Pratique:</h4> Tous vos cours expliqués avec des exercices corrigés!
                   </div>
                </div>
              </div>
              <div class="col l4 m12 s12">
                <div class="row">
                  <div class="col s12" style="text-align:center">
                    <i class="material-icons" style="font-size: 150px">person</i>
                  </div>
                  <div class="col s12" style="text-align:center">
                    <h4>Personnalisé: </h4> Avec l'aide en ligne, tu pourras directement poser tes questions!
                  </div>
               </div>
             </div>
             <div class="col l4 m12 s12">
               <div class="row">
                 <div class="col s12" style="text-align:center">
                   <i class="material-icons" style="font-size: 150px">computer</i>
                 </div>
                 <div class="col s12" style="text-align:center">
                  <h4>En ligne: </h4> Tu peux travailler facilement depuis l'école ou la maison!
                 </div>
               </div>
            </div>
          </div>

            </br></br></br></br></br>

      </div>
    </div>

    <div class="section white" id="footer">
        <p class="grey-text text-darken-3 lighten-3">Projet WEB 3A - WEBSOCKET - Marie LECAM & Marion PUGGIONI</p>
    </div>

         <!--Permet d'inclure les imports pour jquery, materialize et js-->
         <% include partials/js_import.ejs %>
     </body>
     </html>


404.ejs
=======

::

    <html>
          <head>
              <meta charset="utf-8" />
              <title>404</title>
              <link rel="stylesheet" type="text/css" href="/static/main.css">
          </head>

          <body>
              <h1> Page 404 !</h1>
          </body>
    </html>



navbar.ejs
==========

::

    <header>
        <div class="navbar-fixed ">
            <nav>
                <div class="nav-wrapper">
                    <a href="#" data-activates="mobile-demo" class="button-collapse"><i class="material-icons">menu</i></a>
                    <ul class="left hide-on-med-and-down">
                        <li><a href="/" class="brand-logo" style="">Maths en ligne(s)</a></li>
                    </ul>
                    <ul class="right hide-on-med-and-down">
                        <li><a href="#">Cours</a></li>
                        <li><a href="/websocketdemo">Aide en ligne</a></li>
                    </ul>
                </div>
            </nav>
        </div>
        <ul class="side-nav" id="mobile-demo">
          <li><a href="/" class="brand-logo" style="">Maths en ligne(s)</a></li>
          <li><a href="#">Cours</a></li>
          <li><a href="/websocketdemo">Aide en ligne</a></li>
        </ul>
    </header>

js_import.ejs
=============

::

    <!-- Attention à respecter l'ordre d'appel des imports! -->
    <script src="https://ajax.googleapis.com/ajax/libs/jquery/1.9.1/jquery.min.js"></script>
    <script src="https://code.jquery.com/jquery-1.11.1.js"></script>
    <script type="text/javascript" src="/static/node_modules/jquery/dist/jquery.min.js"></script>
    <script type="text/javascript" src="/static/node_modules/materialize-css/dist/js/materialize.min.js"></script>
    <script src="/socket.io/socket.io.js"></script>
    <script src="/static/javascript.js"></script>


header_imports.ejs
==================

::

    <!-- Attention à respecter l'ordre d'appel des imports! -->
    <link href="https://fonts.googleapis.com/icon?family=Material+Icons" rel="stylesheet">
    <link type="text/css" rel="stylesheet" href="/static/node_modules/materialize-css/dist/css/materialize.min.css" media="screen,projection"/>
    <link rel="stylesheet" type="text/css" href="/static/main.css">


javascript.js
=============

::

    // pour le menu sur le cote
    jQuery( document ).ready(function($){
    $('.button-collapse').sideNav({
          closeOnClick: true
        }
      );

    // pour les radio buttons
    $('select').material_select();

    // pour l'effet parallax sur la page home
    $('.parallax').parallax();
    });


main.css
========

::

    html{
      min-height: 100%;
      position: relative;
    }
    body{
      margin:0px;
      padding:0px;
    }

    div{
      margin:0px;
      padding:0px;
    }

    h1{
      margin-top:0px;
      padding-top: 80px;
    }

    /**
     * Accueil
     */

    #fond_home{
      position:relative;
      width:100%;
      min-height:90%;
      margin:0;
      padding:0;
      background-image:url('images/books_opacity.jpg');
      background-position: center center;
      background-repeat: no-repeat;
      background-attachment: fixed;
      background-size: cover;
    }

    #footer{
      padding: 0px;
      position: absolute;
      left: 0;
      bottom: 0;
      height: 50px;
      width: 100%;
      overflow:hidden;
    }

    /**
    *Formulaire
    */

    #formulaire{
      border: solid 1px;
      border-color: grey;
      border-radius: 3px;
      width: 400px;
      height: 325px;

      position: absolute;
      top:0;
      bottom: 0;
      left: 0;
      right: 0;

      margin: auto;

      background-color: white;
      text-align: center;
    }

    #submitbutton{
      float: right;
    }

    .image{
      position:fixed;
      width:100%;
      height:100%;
      margin:0;
      padding:0;
      background-image:url('images/online.jpg');
      background-position: center center;
      background-repeat: no-repeat;
      background-attachment: fixed;
      background-size: cover;

    }

    /**
    *Chat
    */

    #inputmessage{
    }

    #m{
      width: 100%;
    }

    #messages {
      list-style-type: none;
      height: 80%;
      overflow: auto;
      word-wrap: break-word;
    }

    #messages li { padding: 5px 10px; }

    .divcolored{
      height: 85%;
      border: solid 1px grey;
      border-radius: 3px;
      background-color:white;
      position: relative;
    }


    /**
    *Utilisateurs
    */

    #listusers{
      margin-top: 0px;
      height: 100%;
      overflow-y: auto;
      overflow-x: hidden;
    }

    .chip{
      overflow: hidden;
    }

    /**
    *Bouton, radio button, input field
    */

    button{
      background-color: #388e3c;
    }

    [type="radio"]:checked+label:after, [type="radio"].with-gap:checked+label:after{
      background-color: #388e3c;
    }

    [type="radio"]:checked+label:after, [type="radio"].with-gap:checked+label:before, [type="radio"].with-gap:checked+label:after{
      background-color: #388e3c;
    }

    [type="radio"]:checked+label:after, [type="radio"].with-gap:checked+label:before, [type="radio"].with-gap:checked+label:after{
      background-color: #388e3c;
    }

    [type="radio"]:checked+label:after, [type="radio"].with-gap:checked+label:after{
      background-color: #388e3c;
    }

    [type="radio"]:checked+label:after, [type="radio"].with-gap:checked+label:before, [type="radio"].with-gap:checked+label:after{
      border-color: #388e3c;
    }

    input:not([type]):focus:not([readonly]), input[type=text]:not(.browser-default):focus:not([readonly]), input[type=password]:not(.browser-default):focus:not([readonly]), input[type=email]:not(.browser-default):focus:not([readonly]){
      border-color: #388e3c;
      box-shadow: 0 1px 0 0 #388e3c;
    }

    /**
    *Navbar
    */

    .nav-wrapper {
      background-color: #424242;
    }

    .nav-wrapper a:hover{
      background-color: #505050;
    }


    /**
     * Canvas
     */

     .whiteboard {
       position:fixed;
       width:100%;
       height:100%;
       margin:0;
       padding:0;
       cursor: hand;
       background-image:url('images/quadrillage.png');
       background-position: center center;
       background-attachment: fixed;
     }


    /**
     * Buttons whiteboard
     */

    .colors {
      position: fixed;
    }

    .color {
      display: inline-block;
      border-radius: 50px;
      height: 40px;
      width: 40px;
    }

    #palette{
      margin-bottom: 70px;
    }

    .eraser{
      position:fixed;
      bottom: 0px;
      right: 23px;
      margin-bottom: 20px;
    }


package.json (dans assets)
==========================

::

    {
      "name": "assets",
      "version": "1.0.0",
      "description": "",
      "main": "index.js",
      "scripts": {
        "test": "echo \"Error: no test specified\" && exit 1"
      },
      "author": "",
      "license": "ISC",
      "dependencies": {
        "materialize-css": "^0.100.2"
      }
    }


socket.js
=========

::

    /*
    Fonction qui renvoie la valeur associee au radio button coche
    */
    function getRadioVal(form, name) {
        var val;
        // get list of radio buttons with specified name
        var radios = form.elements[name];
        // loop through list of radio buttons
        for (var i=0, len=radios.length; i<len; i++) {
            if ( radios[i].checked ) { // radio checked?
                val = radios[i].value; // if so, hold its value in val
                break; // and break out of for loop
            }
        }
        return val; // return value of checked radio or undefined if none checked
    }


    $(function () {

        var socket = io(); // On initie une nouvelle session
        var myName = ""; // Variable pour connaitre le nom de la personne

        // Pour faire apparaitre l'ecran de connexion
        $('#screen2').hide();
        $('#screen1').show();

      // Pour initialiser le canvas
      var canvas = document.getElementsByClassName('whiteboard')[0];
      var colors = document.getElementsByClassName('color');
      var context = canvas.getContext('2d');
      var current = {
        color: 'black'
      };
      var drawing = false;
      canvas.addEventListener('mousedown', onMouseDown, false);
      canvas.addEventListener('mouseup', onMouseUp, false);
      canvas.addEventListener('mouseout', onMouseUp, false);
      canvas.addEventListener('mousemove', throttle(onMouseMove, 10), false);
      for (var i = 0; i < colors.length; i++){
        colors[i].addEventListener('click', onColorUpdate, false);
      }




        $('#inputname').submit(function(){ // Quand on recoit les donnees du formulaire de connexion
          var myObj = { "name": $('#mbis').val(), "status":getRadioVal(document.getElementById('inputname'), 'group1')}; // On met les donnees dans un dico
          socket.emit('user name', myObj); // On les envoie au serveur
          $('#mbis').val(''); // On nettoie le formulaire
          return false;
        });

        socket.on('wrong name', function(myObj){ // Si le serveur nous repond que le nom est deja pris
          Materialize.toast('Ce pseudo a déjà été pris!', 4000) // On affiche un message a l'utilisateur de tenter un autre nom
          $('#mbis').val('');
        });

        socket.on('username available', function(name){ // Si le nom est libre
          // On affiche le chat :
          $('#messages').empty();
          context.clearRect(0, 0, canvas.width, canvas.height);
          $('#screen1').hide();
          $('#screen2').show();
          myName = name; // On recupere le nom
          $('#messages').append($('<li style="color:DarkGreen;font-weight:bold;">').text("Bienvenue sur la discussion "+name+" !")); // On affiche un message de bienvenue à la personne qui vient de se connecter
        });

        $('#inputmessage').submit(function(){ // Pour envoyer un message sur le chat
          var input = $('#m').val();
          var namedestination = getRadioVal(document.getElementById('listusers'), 'group2'); // On recupere le destinataire grace au radio button
          // Pour la premiere connexion
          if (namedestination == undefined){ // Au cas ou une personne se deconnecte on revient sur 'Tous'
            namedestination ="Tous";
          }
          $('#m').val('');
          console.log(namedestination);
          var privatemessage = input;
          var myObj = { "namedestination": namedestination, "privatemessage":privatemessage};
          socket.emit('chat message', myObj); // On envoie le message au serveur qui s'occupera d'addresser le message a la bonne personne
          return false;
        });

        socket.on('chat message', function(myObj){ // Quand on recoit un message destine a tout le monde retransmis par le serveur
          $('#messages').append($('<li>').text(myObj.name +" : "+ myObj.message)); // On l'ajoute au chat
          // Pour scroll automatiquement vers le bas:
          var elem = document.getElementById('messages');
          elem.scrollTop = elem.scrollHeight;
        });

        socket.on('private message', function(myObj){ // Quand on recoit un message prive retransmis par le serveur
          $('#messages').append($('<li>').text(myObj.nameemetteur +" à "+ myObj.namedestination+" : "+ myObj.message)); // On l'ajoute au chat
          // Pour scroll automatiquement vers le bas:
          var elem = document.getElementById('messages');
          elem.scrollTop = elem.scrollHeight;
        });

        socket.on('user list', function(myDico){ // Pour mettre a jour la liste des personnes connectees
          $('#listusers').empty(); // On la nettoie
          for (var index in myDico){ // On la re-remplie
            if (index == "Tous"){ // On fait un texte sans le statut
              $('#listusers').append('<p><input name="group2" type="radio" id='+index+' value="'+index+'" checked/> <label for='+index+'>'+ index +'</label></p>');
            }else if (index == myName){// On ne se met pas dans la liste
            }else{// On fait un texte avec le statut
            $('#listusers').append('<p><input name="group2" type="radio" id='+index+' value="'+index+'"/> <label for='+index+'>'+ index+' ('+myDico[index]+')</label></p>');}
          }
        });

        socket.on('user connect', function(name){ // Quand le serveur nous dit qu'un utilisateur est connecte on affiche un message
          $('#messages').append($('<li style="color:grey;font-style:italic;">').text(".. "+ name + " vient de se connecter!"));
        });
        socket.on('user disconnect', function(name){ // Quand le serveur nous dit qu'un utilisateur est deconnecte on affiche un message
          $('#messages').append($('<li style="color:grey;font-style:italic;">>').text(".. "+ name + " vient de se déconnecter!"));
        });



          // Bouton pour effacer le canvas (cela n'efface que notre canvas, cela laisse nos dessins sur le canvas des autres du coup)
          $('.eraser').click(function(){context.clearRect(0, 0, canvas.width, canvas.height);})

          // Quand le serveur nous dit que quelqu'un nous a fait un dessin, on lance la fonction 'onDrawingEvent' qui lance 'drawLine'
          socket.on('drawing', onDrawingEvent);

          // Efface le dessin si l'utilisateur retrecit ou agrandit la fenetre
          window.addEventListener('resize', onResize, false);
          onResize();


          function drawLine(x0, y0, x1, y1, color, emit){ // Est active quand on fait un dessin (onMouseUp ... ) ou quand on recoit un dessin
            context.beginPath();
            context.moveTo(x0, y0);
            context.lineTo(x1, y1);
            context.strokeStyle = color;
            context.lineWidth = 2;
            context.stroke();
            context.closePath();

            if (!emit) { return; } // Si emit est false, on n'envoie rien

            // Si emit est a true:
            var w = canvas.width;
            var h = canvas.height;

            // Pour envoyer a la personne desiree
            var namedestination = getRadioVal(document.getElementById('listusers'), 'group2');
            // Pour la premiere connexion
            if (namedestination == undefined){
              namedestination ="Tous";
            }


            socket.emit('drawing', { // Envoie des points du dessin au serveur
              "x0": x0 / w,
              "y0": y0 / h,
              "x1": x1 / w,
              "y1": y1 / h,
              "color": color,
              "dest":namedestination
            });
            return 0;
          }

          function onMouseDown(e){
            drawing = true;
            current.x = e.clientX;
            current.y = e.clientY;
          }

          function onMouseUp(e){
            if (!drawing) { return; }
            drawing = false;
            drawLine(current.x, current.y, e.clientX, e.clientY, current.color, true);
          }

          function onMouseMove(e){
            if (!drawing) { return; }
            drawLine(current.x, current.y, e.clientX, e.clientY, current.color, true);
            current.x = e.clientX;
            current.y = e.clientY;
          }

          function onColorUpdate(e){
            current.color = e.target.className.split(' ')[1];
          }

          // limit the number of events per second
          function throttle(callback, delay) {
            var previousCall = new Date().getTime();
            return function() {
              var time = new Date().getTime();

              if ((time - previousCall) >= delay) {
                previousCall = time;
                callback.apply(null, arguments);
              }
            };
          }

          function onDrawingEvent(data){
            var w = canvas.width;
            var h = canvas.height;
            drawLine(data.x0 * w, data.y0 * h, data.x1 * w, data.y1 * h, data.color, false);
          }

          // make the canvas fill its parent
          function onResize() {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
          }


      });

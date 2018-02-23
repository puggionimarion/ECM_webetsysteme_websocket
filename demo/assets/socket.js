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

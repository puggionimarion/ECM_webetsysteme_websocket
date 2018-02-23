*************************
Introduction au WebSocket
*************************

Qu'est-ce que WebSocket?
========================

Le protocole WebSocket vise à développer un canal de communication full-duplex
sur un socket TCP pour les navigateurs et les serveurs web.
Un socket TCP sert à communiquer entre deux hôtes appelés Client/ Serveur à
l'aide d'une adresse IP et d'un port ; ce socket permet de gérer des flux
entrant et sortant afin d'assurer une communication entre les deux (le client
et le serveur).


A quoi ça sert?
===============

Habituellement, sur le Web, la communication est asynchrone. Le Web a toujours
été conçu comme ça : le client demande et
le serveur répond.
Les navigateurs devenant de plus en plus performants, les applications web
doivent devenir de plus en plus interactives, il est devenu nécessaire de
développer des techniques de communications bidirectionnelles entre
l'application web et les processus serveur.

WebSocket est une nouveauté du Web qui permet de laisser une sorte de "tuyau"
de communication ouvert entre le client et le serveur. Le navigateur et le
serveur restent connectés entre eux et peuvent s'échanger des messages dans un
sens comme dans l'autre dans ce tuyau.

Il permet :

- de notifier le client lors d'un changement du serveur.
- d'envoyer des données du serveur au client sans que celui-ci n'est besoin de faire une requête.

Exemples d'applications
=======================

- Chat, messagerie instantanée
- Documents et outils collaboratifs
- Analyse de données en temps réel
- Afficher les nouveaux tweets sur votre page web en temps réel
- ...

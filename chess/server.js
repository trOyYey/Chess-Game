const express = require("express");
const http = require("http");
const WebSocket = require("ws");
//Change Port on next variable if needed
const Port = 3000;
const app = express();
const server = http.createServer(app);
const webSocServ = new WebSocket.Server({ server });

let clientList = [];
let gameDetails = {
  GameStillRunning: false,
  fen: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
  moves: [],
  whiteToPlay:true,
  players: {},
  fenAry:[],
  pgn:""
};
// Next Line is representation of piece positioning at start of each game for both colors,
gameDetails.fenAry.push("rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1");
// cannot join same room if 2 players already connected
webSocServ.on("connection", (ws) => {
  if (clientList.length >= 2) {
    ws.send(JSON.stringify({ type: "error", message: "2 Players already joined" }));
    ws.close();
    return;
  }
// connect players using websocket while there is less than 2 players
  ws.on("message", (message) => {
    const data = JSON.parse(message);
    if (data.type === "join") {
      clientList.push({ ws, username: data.username });
      const players = clientList.map(client => client.username);
      clientList.forEach(client => {
        client.ws.send(JSON.stringify({ type: "playerList", players }));
      }); // if  2 players connected, asign colors and start the game
      if (clientList.length === 2) {
        setRandomWBcolors();
        gameDetails.GameStillRunning = true;
      }
    } else if (data.type === "move") {
      console.log("Received move from client:", data);
      clientList.forEach(client => {
        console.log(`Checking client: ${client.username}, WebSocket state: ${client.ws.readyState}`);

        if (client.ws !== ws) 
          {
            console.log(`Sending move to ${client.username}`);

            client.ws.send(JSON.stringify({
              type: "move",
              startSquare: data.startSquare,
              endSquare: data.endSquare,
              promotedTo: data.promotedTo
            }));
        }
      }); // log the movements in the server console
      if(clientList.length>1)
      console.log("move push "+data.startSquare+" - "+data.endSquare + " length= "+ clientList.length+"  "+clientList[0].username+"   "+clientList[1].username);
      gameDetails.moves.push({
        from: data.startSquare,
        to: data.endSquare,
        pieceType: data.pieceType,
        pieceColor: data.pieceColor,
        captured: data.captured,
        promotedTo: data.promotedTo,
      });
      // if one player resigns' assign winner and resset the game 
    } else if (data.type === "resign") {
      clientList.forEach(client => {
        if (client.ws !== ws) {
          client.ws.send(JSON.stringify({
            type: "resign",
            winner: data.winner,
          }));
        }
      });
      RestartGame();
      console.log("game resetted");
      // incase of disconnect we retrive game state using fen, console log for server 
    } else if (data.type === "reconnect") {
      console.log("fen="+gameDetails.fen);

      if(!gameDetails.GameStillRunning) return;
      const playerColor = gameDetails.players[data.username];
      const opponent = Object.keys(gameDetails.players).find(name => name !== data.username);
      ws.send(JSON.stringify({
        type: "reconnect",
        color: playerColor,
        GameStillRunning: gameDetails.GameStillRunning,
        fen: gameDetails.fen,
        moves: gameDetails.moves,
        opponent: opponent || null,
        fenAry: gameDetails.fenAry,
        pgn: gameDetails.pgn
      }));

      const CurrentClients = clientList.find(client => client.username === data.username);
       {

        console.log("clientList.length="+clientList.length);

        if (CurrentClients) {
          CurrentClients.ws = ws;
        } else {
          if(clientList.length<2) 
           clientList.push({ ws, username: data.username });
          console.log("clientList.length 2 = "+clientList.length+" "+data.username);
        }
      }
     
    }
    else if (data.type === "fen") {
      clientList.forEach(client => {
        if (client.ws !== ws) {
          client.ws.send(JSON.stringify({
            type: "fen",
            fen: data.fen,
          }));
        }
      });
      gameDetails.fen = data.fen;
      gameDetails.fenAry.push(data.fen);
    }    
    else if (data.type === "pgn") {
      clientList.forEach(client => {
        if (client.ws !== ws) {
          client.ws.send(JSON.stringify({
            type: "pgn",
            pgn: data.pgn,
          }));
        }
      });
      gameDetails.pgn = data.pgn;
    }

  });
    // register the disconnects and update player list
  ws.on('close', () => {
    const index = clientList.findIndex(client => client.ws === ws);
    if (index !== -1) {
      clientList.splice(index, 1);
    }
  });
});
// generate random index between 1 and 0 ,asign each to index for the players
function setRandomWBcolors() {
  const PlayerColors = Math.random() < 0.5 ? ["white", "black"] : ["black", "white"];
  clientList[0].ws.send(JSON.stringify({ type: "color", color: PlayerColors[0] }));
  clientList[1].ws.send(JSON.stringify({ type: "color", color: PlayerColors[1] }));
  gameDetails.players[clientList[0].username] = PlayerColors[0];
  gameDetails.players[clientList[1].username] = PlayerColors[1];
}

function RestartGame() {
    clientList = [];
    clientList.length =0;
    gameDetails = {
    GameStillRunning: false,
    fen: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
    moves: [],
    whiteToPlay:true,
    players: {},
    fenAry:[],
    pgn:""
  };
  gameDetails.fenAry.push("rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1");
}
server.listen(Port, () => {
  console.log(`Server is listening on port ${Port}`);
});
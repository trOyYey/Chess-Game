let ws;
//change the Port here if needed
const Port = 3000;
let username;
let color;


// handles connecting to game using websocket with other different related events
function joinGame() {
  username = document.getElementById("usernameInput").value;
  if (!username) {
    alert("invalid Username, please Enter your Username");
    return;
  }
  //use localstorage to store username
  localStorage.setItem("username", username);
  join.style.display = "none";
  newWebSocket();
}

function newWebSocket() {
  ws = new WebSocket(`ws://localhost:${Port}`);
  // send a join request and username when we open websocket connection
  ws.onopen = () => {
    ws.send(JSON.stringify({ type: "join", username }));
  };
  // on recieving data from websocket
  ws.onmessage = (event) => {
    const data = JSON.parse(event.data);

    if (data.type === "playerList") {
      players = data.players;
      // game starts when there is 2 players,
      updatePlayerInfo();
      if (players.length === 2) {
        let countdown = 3;
        const updateCounter = () => {
          if (countdown > 0) {
            counter.innerText = countdown;
            countdown--;
          } else {
            clearInterval(intervalId);
            counter.innerText = "";
          }
        };
        updateCounter();
        const intervalId = setInterval(updateCounter, 1000);
        setTimeout(() => {
          assignColors();
          document.getElementById("join").style.display = "none";
          document.querySelector(".container").style.display = "flex";
          gamePlayerInfo.style.display = "flex";
          playerInfo.style.display = "none";
        }, 3000);
      }
    }
    //assign color for the username
    if (data.type === "color") {
      color = data.color;
      if (color === "black") {
        blackboard();
      }
    }
    if (data.type === "move") {
      console.log(username + " received move", data.startSquare, data.endSquare);
      const startSquare = data.startSquare;
      const endSquare = data.endSquare;
      const promotedTo = data.promotedTo;
      showMove(startSquare, endSquare, promotedTo,true);
      highlightCertainMv(positionArray.length-1);

    }
    if (data.type === "resign") {
      movement = false;
      if(data.winner!= "")
       showAlert(data.winner + " Wins!");
    }
    if (data.type === "reconnect") {
      color = data.color;
      if (color === "black") {
        blackboard();
      }
      if (data.GameStillRunning) {
        document.getElementById("join").style.display = "none";
        document.querySelector(".container").style.display = "flex";
        gamePlayerInfo.style.display = "flex";
        playerInfo.style.display = "none";
        if (data.opponent) {
          players = [username, data.opponent];
          updatePlayerInfo();
          loadFEN(data.fen);
          pgn = data.pgn;
          newHTMLPNG(data.pgn);
          moves = data.moves;
          whiteToPlay = moves.length % 2 === 0 ? true : false;
          positionArray = [...new Set(data.fenArray)];
          IDv = positionArray.length-1;
        }
      } else {

      }
    }
    if(data.type === "fen") {
      fenposition = data.fen;
    }
    if(data.type === "pgn") {
      pgn = data.pgn;
    }
    
    
  };
  ws.onclose = () => {
    alert("Disconnected from the server");
  };
}

function updatePlayerInfo() {
  const playerInfoDiv = document.getElementById("playerInfo");
  playerInfoDiv.innerHTML = `Player 1: ${players[0] || 'Waiting...'} - Player 2: ${players[1] || 'Waiting...'}`;
  player1.innerText = username;
  if (username === players[0]) {
    player2.innerText = players[1];
  } else {
    player2.innerText = players[0];
  }
}

function assignColors() {
  const randomColor = Math.random() < 0.5 ? ["white", "black"] : ["black", "white"];
  ws.send(JSON.stringify({ type: "assignColors", colors: randomColor }));
}

function sendMove(startSquare, endSquare,pieceType,pieceColor,captured, promotedTo = "blank") {
  if (!startSquare || !endSquare) {
    alert("Invalid move");
    return;
  }
  const move = { type: "move", username, startSquare, endSquare,pieceType,pieceColor,captured, promotedTo };
  ws.send(JSON.stringify(move));
}

function sendResign(winner) {
  ws.send(JSON.stringify({ type: "resign", winner }));
}

function sendFen(fen) {
  ws.send(JSON.stringify({ type: "fen", fen }));
}
function sendPgn(pgn) {
  ws.send(JSON.stringify({ type: "pgn", pgn }));
}

// Retrieve username from local storage on page load and attempt reconnect
window.onload = () => {

  const savedUsername = localStorage.getItem("username");
  if (savedUsername) {
    username = savedUsername;
    newWebSocket();
    ws.onopen = () => {
      ws.send(JSON.stringify({ type: "reconnect", username }));
    };
 
  }
};

const BdSq = document.getElementsByClassName("square");
const pieces = document.getElementsByClassName("piece");
let fenposition = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
let FENv = fenposition;
let IDv = 0;
const piecesImages = document.getElementsByTagName("img");
const chessBoard = document.querySelector(".chessBoard");
let BdSqAry = [];
let positionArray=[];
let moves = [];
const castlingSquares = ["g1", "g8", "c1", "c8"];
let whiteToPlay = true;
let enPassSq = "blank";
let movement = true;
let pgn = "";
let whiteEnemy = false;


positionArray.push(fenposition);


setupBdSq();
setPieces();
fillBdSqAry();
const startingPosition = chessBoard.innerHTML;


// generates descriptive map of the chess board, each 8 letters represent file,
function makeNewFEN(BdSq){
  let fen="";
  let rank=8;
  while(rank>=1){
    for(let file="a";file<="h";file=String.fromCharCode(file.charCodeAt(0)+1)){
      const square = BdSq.find((element)=>element.squareId===`${file}${rank}`);
      if(square && square.pieceType){
        let pieceNotation ="";
        switch (square.pieceType){
          case "pawn":
            pieceNotation = "p";
            break;
            case "bishop":
            pieceNotation = "b";
            break;
            case "knight":
            pieceNotation = "n";
            break;
            case "rook":
            pieceNotation = "r";
            break;
            case "queen":
            pieceNotation = "q";
            break;
            case "king":
            pieceNotation = "k";
            break;
            case "blank":
            pieceNotation = "blank";
            break;
        }
        fen+=square.pieceColor === "white" ? pieceNotation.toUpperCase() : pieceNotation;
      }
    }
    if(rank>1) {
      fen+="/";
    }
    rank--;
  }
  fen=fen.replace(new RegExp("blankblankblankblankblankblankblankblank","g"),"8");
  fen=fen.replace(new RegExp("blankblankblankblankblankblankblank","g"),"7");
  fen=fen.replace(new RegExp("blankblankblankblankblankblank","g"),"6");
  fen=fen.replace(new RegExp("blankblankblankblankblank","g"),"5");
  fen=fen.replace(new RegExp("blankblankblankblank","g"),"4");
  fen=fen.replace(new RegExp("blankblankblank","g"),"3");
  fen=fen.replace(new RegExp("blankblank","g"),"2");
  fen=fen.replace(new RegExp("blank","g"),"1");

  fen+= whiteToPlay ? " w " : " b ";

  let castlingString="";

  let shortCastlePossibleForWhite = !kingHasMoved("white") &&!rookHasMoved("white","h1");
  let longCastlePossibleForWhite = !kingHasMoved("white") &&!rookHasMoved("white","a1");
  let shortCastlePossibleForBlack = !kingHasMoved("black") &&!rookHasMoved("black","h8");
  let longCastlePossibleForBlack = !kingHasMoved("black") &&!rookHasMoved("black","a8");

  if(shortCastlePossibleForWhite) castlingString+="K";
  if(longCastlePossibleForWhite) castlingString+="Q";
  if(shortCastlePossibleForBlack) castlingString+="k";
  if(longCastlePossibleForBlack) castlingString+="q";
  if(castlingString=="") castlingString+="-";
  castlingString+=" ";
  fen+=castlingString;

  fen+=enPassSq=="blank" ? "-" : enPassSq;

  let fiftyMovesRuleCount=calcFiftymoveRule();
  fen+=" "+fiftyMovesRuleCount;
  let moveCount=Math.floor(moves.length/2)+1;
  fen+=" "+moveCount;
  //console.log(fen);
  return fen;


}
// casling rule for the king
function doCastle(
  piece,
  pieceColor,
  startingSquareId,
  destinationSquareId,
  BdSqAry
) {
  let rookId, rookDestinationSquareId, checkSquareId;
  if (destinationSquareId == "g1") {
    rookId = "rookh1";
    rookDestinationSquareId = "f1";
    checkSquareId = "f1";
  } else if (destinationSquareId == "c1") {
    rookId = "rooka1";
    rookDestinationSquareId = "d1";
    checkSquareId = "d1";
  } else if (destinationSquareId == "g8") {
    rookId = "rookh8";
    rookDestinationSquareId = "f8";
    checkSquareId = "f8";
  } else if (destinationSquareId == "c8") {
    rookId = "rooka8";
    rookDestinationSquareId = "d8";
    checkSquareId = "d8";
  }
  if (isKingInCheck(checkSquareId, pieceColor, BdSqAry)) return;
  let rook = document.getElementById(rookId);
  let rookDestinationSquare = document.getElementById(rookDestinationSquareId);
  rookDestinationSquare.appendChild(rook);
  updateBdSqAry(
    rook.id.slice(-2),
    rookDestinationSquare.id,
    BdSqAry
  );

  const destinationSquare = document.getElementById(destinationSquareId);
  destinationSquare.appendChild(piece);
  whiteToPlay = !whiteToPlay;
  updatingPGN(startingSquareId,destinationSquareId,whiteToPlay);
  updateBdSqAry(
    startingSquareId,
    destinationSquareId,
    BdSqAry
  );
  let captured = false;

  doMove(startingSquareId, destinationSquareId, "king", pieceColor, captured);
  weAreEndGame();
  return;
}
// enPassant Rule for pawns
function doEnPassant(
  piece,
  pieceColor,
  startingSquareId,
  destinationSquareId
) {
  let file = destinationSquareId[0];
  let rank = parseInt(destinationSquareId[1]);
  rank += pieceColor === "white" ? -1 : 1;
  let squareBhndId = file + rank;

  const squareBhndElement = document.getElementById(squareBhndId);
  while (squareBhndElement.firstChild) {
    squareBhndElement.removeChild(squareBhndElement.firstChild);
  }

  let squareBhnd = BdSqAry.find(
    (element) => element.squareId === squareBhndId
  );
  squareBhnd.pieceColor = "blank";
  squareBhnd.pieceType = "blank";
  squareBhnd.pieceId = "blank";

  const destinationSquare = document.getElementById(destinationSquareId);
  destinationSquare.appendChild(piece);
  whiteToPlay = !whiteToPlay;

  updatingPGN(startingSquareId,destinationSquareId,whiteToPlay);

  updateBdSqAry(
    startingSquareId,
    destinationSquareId,
    BdSqAry
  );
  let captured = true;
  doMove(startingSquareId, destinationSquareId, "pawn", pieceColor, captured);

  enPassSq="blank";
  weAreEndGame();
  return;
} 
// promotion window pop up when pawns reach end of file
function showPromotion(
  pieceId,
  pieceColor,
  startingSquareId,
  destinationSquareId,
  captured,
  promotedTo = "blank"
) {
  if(promotedTo != "blank") {
    promote(pieceId,promotedTo,pieceColor,startingSquareId,destinationSquareId,captured);
    return;
  }

  let file = destinationSquareId[0];
  let rank = parseInt(destinationSquareId[1]);
  let rank1 = pieceColor === "white" ? rank - 1 : rank + 1;
  let rank2 = pieceColor === "white" ? rank - 2 : rank + 2;
  let rank3 = pieceColor === "white" ? rank - 3 : rank + 3;

  let squareBhndId1 = file + rank1;
  let squareBhndId2 = file + rank2;
  let squareBhndId3 = file + rank3;

  const destinationSquare = document.getElementById(destinationSquareId);
  const squareBhnd1 = document.getElementById(squareBhndId1);
  const squareBhnd2 = document.getElementById(squareBhndId2);
  const squareBhnd3 = document.getElementById(squareBhndId3);

  let piece1 = newPiece("queen", pieceColor, "promotionOption");
  let piece2 = newPiece("knight", pieceColor, "promotionOption");
  let piece3 = newPiece("rook", pieceColor, "promotionOption");
  let piece4 = newPiece("bishop", pieceColor, "promotionOption");

  destinationSquare.appendChild(piece1);
  squareBhnd1.appendChild(piece2);
  squareBhnd2.appendChild(piece3);
  squareBhnd3.appendChild(piece4);
  
  let promotionOptions = document.getElementsByClassName("promotionOption");
  for (let i = 0; i < promotionOptions.length; i++) {
    let pieceType = promotionOptions[i].classList[1];

  
    promotionOptions[i].addEventListener("click", function () {
      sendMove(startingSquareId,destinationSquareId,pieceType,pieceColor,captured,pieceType);

      promote(
        pieceId,
        pieceType,
        pieceColor,
        startingSquareId,
        destinationSquareId,
        captured
      );

    });
  }
}


// replace pawn with the selected new piece
function newPiece(pieceType, color, pieceClass) {
  let pieceName =
    "images/" +
    color.charAt(0).toUpperCase() +
    color.slice(1) +
    "-" +
    pieceType.charAt(0).toUpperCase() +
    pieceType.slice(1) +
    ".png";
  let pieceDiv = document.createElement("div");
  pieceDiv.className = `${pieceClass} ${pieceType}`;
  pieceDiv.setAttribute("color", color);
  let img = document.createElement("img");
  img.src = pieceName;
  img.alt = pieceType;
  if(whiteEnemy)
    pieceDiv.style.transform = "rotate(180deg)";
  pieceDiv.appendChild(img);
  return pieceDiv;
}

chessBoard.addEventListener("click", ressetAfterPromotion);

// change things back to normal after promotion
function ressetAfterPromotion() {
  for (let i = 0; i < BdSq.length; i++) {
    let style = getComputedStyle(BdSq[i]);
    let backgroundColor = style.backgroundColor;
    let rgbaColor = backgroundColor.replace("0.5)", "1)");
    BdSq[i].style.backgroundColor = rgbaColor;
    BdSq[i].style.opacity = 1;

    if (BdSq[i].querySelector(".piece"))
      BdSq[i].querySelector(".piece").style.opacity = 1;
  }
  let elementsToRemove = chessBoard.querySelectorAll(".promotionOption");
  elementsToRemove.forEach(function (element) {
    element.parentElement.removeChild(element);
  });
  movement = true;
}

function setBdSqOpacity(startingSquareId) {
  for (let i = 0; i < BdSq.length; i++) {
    
    if(BdSq[i].id==startingSquareId)
    BdSq[i].querySelector(".piece").style.opacity = 0;

    if (!BdSq[i].querySelector(".promotionOption")) {
      BdSq[i].style.opacity = 0.5;
    } else {
      let style = getComputedStyle(BdSq[i]);
      let backgroundColor = style.backgroundColor;
      let rgbaColor = backgroundColor
        .replace("rgb", "rgba")
        .replace(")", ",0.5)");
      BdSq[i].style.backgroundColor = rgbaColor;

      if (BdSq[i].querySelector(".piece"))
        BdSq[i].querySelector(".piece").style.opacity = 0;
    }
  }
}
// entry point function for promotion
function promote(
  pieceId,
  pieceType,
  pieceColor,
  startingSquareId,
  destinationSquareId,
  captured
) {
  ressetAfterPromotion();
  promotionPiece = pieceType;
  piece = newPiece(pieceType, pieceColor, "piece");

  piece.addEventListener("dragstart", drag);
  piece.setAttribute("draggable", true);
  piece.firstChild.setAttribute("draggable", false);
  piece.id = pieceType + pieceId;

  const startingSquare = document.getElementById(startingSquareId);
  while (startingSquare.firstChild) {
    startingSquare.removeChild(startingSquare.firstChild);
  }
  const destinationSquare = document.getElementById(destinationSquareId);

  if (captured) {
    let children = destinationSquare.children;
    for (let i = 0; i < children.length; i++) {
      if (!children[i].classList.contains("coordinate")) {
        destinationSquare.removeChild(children[i]);
      }
    }
  }

  destinationSquare.appendChild(piece);
  whiteToPlay = !whiteToPlay;

  updatingPGN(startingSquareId,destinationSquareId,whiteToPlay,pieceType);
  updateBdSqAry(
    startingSquareId,
    destinationSquareId,
    BdSqAry,
    pieceType
  );

  doMove(
    startingSquareId,
    destinationSquareId,
    pieceType,
    pieceColor,
    captured,
    pieceType
  );

  weAreEndGame();
  return;
}
function doCopyArray(array) {
  let arrayCopy = array.map((element) => {
    return { ...element };
  });
  return arrayCopy;
}
function setupBdSq() {
  for (let i = 0; i < BdSq.length; i++) {
    BdSq[i].addEventListener("dragover", allowDrop);
    BdSq[i].addEventListener("drop", drop);
    let row = 8 - Math.floor(i / 8);
    let column = String.fromCharCode(97 + (i % 8));
    let square = BdSq[i];
    square.id = column + row;
  }
}
function setPieces() {
  for (let i = 0; i < pieces.length; i++) {
    pieces[i].addEventListener("dragstart", drag);
    pieces[i].setAttribute("draggable", true);
    pieces[i].id =
      pieces[i].className.split(" ")[1] + pieces[i].parentElement.id;
  }
  for (let i = 0; i < piecesImages.length; i++) {
    piecesImages[i].setAttribute("draggable", false);
  }
}

// this so we can add to the function to do more things, drop the main function in this app
function allowDrop(ev) {
  ev.preventDefault();
}

// records important details are dragged object, includes who is turn, what piece and previous position and future position if move was legal
function drag(ev) {
  if (!movement) return;

  const piece = ev.target;
  const pieceColor = piece.getAttribute("color");
  const pieceType = piece.classList[1];
  const pieceId = piece.id;

  if (
    (whiteToPlay && pieceColor == "white") ||
    (!whiteToPlay && pieceColor == "black")
  ) {
    const startingSquareId = piece.parentNode.id;
    ev.dataTransfer.setData("text", piece.id + "|" + startingSquareId);
    const pieceObject = {
      pieceColor: pieceColor,
      pieceType: pieceType,
      pieceId: pieceId,
    };
    let legalSquares = getLegalMoves(
      startingSquareId,
      pieceObject,
      BdSqAry
    );
    let legalSquaresJson = JSON.stringify(legalSquares);
    ev.dataTransfer.setData("application/json", legalSquaresJson);
  }
}

// calculates if the move is legal or not once you drop the piece after dragging "MAIN FUNCTION"
function drop(ev) {
  let isEngineTurn =(whiteEnemy && whiteToPlay) || (!whiteEnemy && !whiteToPlay);
  if(isEngineTurn) return;
  ev.preventDefault();
  const destinationSquare = ev.currentTarget;
  let destinationSquareId = destinationSquare.id;
  let data = ev.dataTransfer.getData("text");
  let [pieceId, startingSquareId] = data.split("|");
  showMove(startingSquareId,destinationSquareId);
  highlightCertainMv(positionArray.length-1);
}

function showMove(startingSquareId,destinationSquareId,promotedTo="blank",fromServer=false){
  if(fromServer) {
    lastMove();
  }

  const pieceObject = getPieceSq(startingSquareId,BdSqAry);
  const piece = document.getElementById(pieceObject.pieceId);
  const pieceId = pieceObject.pieceId;
  const pieceColor = pieceObject.pieceColor;
  const pieceType = pieceObject.pieceType;
  let destinationSquare = document.getElementById(destinationSquareId);
  let legalSquares = getLegalMoves(startingSquareId,pieceObject,BdSqAry);
  
  legalSquares = isMoveValidAgainstCheck(
    legalSquares,
    startingSquareId,
    pieceColor,
    pieceType
  );
  if (pieceType == "king") {
    let isCheck = isKingInCheck(
      destinationSquareId,
      pieceColor,
      BdSqAry
    );
    if (isCheck) return;
  }
  let squareContent = getPieceSq(destinationSquareId, BdSqAry);
  if (
    squareContent.pieceColor == "blank" &&
    legalSquares.includes(destinationSquareId)
  ) {
    let isCheck = false;
    if (pieceType == "king")
      isCheck = isKingInCheck(startingSquareId, pieceColor, BdSqAry);
    if (
      pieceType == "king" &&
      !kingHasMoved(pieceColor) &&
      castlingSquares.includes(destinationSquareId) &&
      !isCheck
    ) {
      if(!fromServer)
        sendMove(startingSquareId,destinationSquareId,pieceType,pieceColor,false);

      doCastle(
        piece,
        pieceColor,
        startingSquareId,
        destinationSquareId,
        BdSqAry
      );
 

      return;

    }
    if (
      pieceType == "king" &&
      !kingHasMoved(pieceColor) &&
      castlingSquares.includes(destinationSquareId) &&
      isCheck
    )
      return;


    if (pieceType == "pawn" && enPassSq == destinationSquareId) {
      if(!fromServer)
        sendMove(startingSquareId,destinationSquareId,pieceType,pieceColor,false);
      doEnPassant(
        piece,
        pieceColor,
        startingSquareId,
        destinationSquareId
      );
      return;
    }
    enPassSq = "blank";
    if (
      pieceType == "pawn" &&
      (destinationSquareId.charAt(1) == 8 || destinationSquareId.charAt(1) == 1)
    ) {
      movement = false;
      showPromotion(
        pieceId,
        pieceColor,
        startingSquareId,
        destinationSquareId,
        false,
        promotedTo
      );
      if(promotedTo == "blank")
       setBdSqOpacity(startingSquareId);
      return;
    }
    destinationSquare.appendChild(piece);
    whiteToPlay = !whiteToPlay;

    updatingPGN(startingSquareId,destinationSquareId,whiteToPlay);

    updateBdSqAry(
      startingSquareId,
      destinationSquareId,
      BdSqAry
    );
    let captured = false;

    doMove(
      startingSquareId,
      destinationSquareId,
      pieceType,
      pieceColor,
      captured
    );

    if(!fromServer)
    sendMove(startingSquareId,destinationSquareId,pieceType,pieceColor,captured);

    weAreEndGame();
    return;
  }
  if (
    squareContent.pieceColor != "blank" &&
    legalSquares.includes(destinationSquareId)
  ) {
    if (
      pieceType == "pawn" &&
      (destinationSquareId.charAt(1) == 8 || destinationSquareId.charAt(1) == 1)
    ) {
      movement = false;
      showPromotion(
        pieceId,
        pieceColor,
        startingSquareId,
        destinationSquareId,
        true,
        promotedTo
      );
      if(promotedTo =="blank")
      setBdSqOpacity(startingSquareId);
      return;
    }
    let children = destinationSquare.children;
    for (let i = 0; i < children.length; i++) {
      if (!children[i].classList.contains("coordinate")) {
        destinationSquare.removeChild(children[i]);
      }
    }

    destinationSquare.appendChild(piece);
    whiteToPlay = !whiteToPlay;

    updatingPGN(startingSquareId,destinationSquareId,whiteToPlay);

    updateBdSqAry(
      startingSquareId,
      destinationSquareId,
      BdSqAry
    );
    let captured = true;

    doMove(
      startingSquareId,
      destinationSquareId,
      pieceType,
      pieceColor,
      captured
    );

    if(!fromServer)
    sendMove(startingSquareId,destinationSquareId,pieceType,pieceColor,captured);
    weAreEndGame();
    return;
  }
}
// calculates the legal moves for the piece from certain square, main function to link all piece functions which each piece has it's own rules
function getLegalMoves(startingSquareId, piece, BdSqAry) {
  const pieceColor = piece.pieceColor;
  const pieceType = piece.pieceType;
  let legalSquares = [];
  if (pieceType == "rook") {
    legalSquares = calcRookMoves(
      startingSquareId,
      pieceColor,
      BdSqAry
    );
    return legalSquares;
  }
  if (pieceType == "bishop") {
    legalSquares = calcBishopMv(
      startingSquareId,
      pieceColor,
      BdSqAry
    );
    return legalSquares;
  }
  if (pieceType == "queen") {
    legalSquares = calcQueenMv(
      startingSquareId,
      pieceColor,
      BdSqAry
    );
    return legalSquares;
  }
  if (pieceType == "knight") {
    legalSquares = calcKnightmoves(
      startingSquareId,
      pieceColor,
      BdSqAry
    );
    return legalSquares;
  }

  if (pieceType == "pawn") {
    legalSquares = pawnMoves(
      startingSquareId,
      pieceColor,
      BdSqAry
    );
    return legalSquares;
  }
  if (pieceType == "king") {
    legalSquares = calcKingMv(
      startingSquareId,
      pieceColor,
      BdSqAry
    );
    return legalSquares;
  }
}

function pawnMoves(startingSquareId, pieceColor, BdSqAry) {
  let diogonalSquares = pawnDiagTakes(
    startingSquareId,
    pieceColor,
    BdSqAry
  );
  let forwardSquares = pawnUp(
    startingSquareId,
    pieceColor,
    BdSqAry
  );
  let legalSquares = [...diogonalSquares, ...forwardSquares];
  return legalSquares;
}

function pawnDiagTakes(
  startingSquareId,
  pieceColor,
  BdSqAry
) {
  const file = startingSquareId.charAt(0);
  const rank = startingSquareId.charAt(1);
  const rankNumber = parseInt(rank);
  let legalSquares = [];
  let currentFile = file;
  let currentRank = rankNumber;
  let currSqId = currentFile + currentRank;
  const direction = pieceColor == "white" ? 1 : -1;
  currentRank += direction;
  for (let i = -1; i <= 1; i += 2) {
    currentFile = String.fromCharCode(file.charCodeAt(0) + i);
    if (currentFile >= "a" && currentFile <= "h" && currentRank<=8 && currentRank>=1) {
      currSqId = currentFile + currentRank;
      let currSq = BdSqAry.find(
        (element) => element.squareId === currSqId
      );
      
      let squareContent = currSq.pieceColor;
      if (squareContent != "blank" && squareContent != pieceColor)
        legalSquares.push(currSqId);

      if (squareContent == "blank") {
        currSqId = currentFile + rank;
        let pawnStartingSquareRank = rankNumber + direction * 2;
        let pawnStartingSquareId = currentFile + pawnStartingSquareRank;

        if (
          enPassantAvailable(currSqId, pawnStartingSquareId, direction)
        ) {
          let pawnStartingSquareRank = rankNumber + direction;
          let enPassSq = currentFile + pawnStartingSquareRank;
          legalSquares.push(enPassSq);
        }
      }
    }
  }
  return legalSquares;
}
function enPassantAvailable(currSqId, pawnStartingSquareId, direction) {
  if (moves.length == 0) return false;
  let lastMove = moves[moves.length - 1];
  if (
    !(lastMove.to === currSqId && lastMove.from === pawnStartingSquareId)
  )
    return false;

  let file = currSqId[0];
  let rank = parseInt(currSqId[1]);
  rank += direction;
  let squareBhndId = file + rank;
  enPassSq = squareBhndId;
  return true;
}
function pawnUp(
  startingSquareId,
  pieceColor,
  BdSqAry
) {
  const file = startingSquareId.charAt(0);
  const rank = startingSquareId.charAt(1);
  const rankNumber = parseInt(rank);
  let legalSquares = [];
  let currentFile = file;
  let currentRank = rankNumber;
  let currSqId = currentFile + currentRank;
  const direction = pieceColor == "white" ? 1 : -1;
  currentRank += direction;
  currSqId = currentFile + currentRank;
  let currSq = BdSqAry.find(
    (element) => element.squareId === currSqId
  );
  let squareContent = currSq.pieceColor;
  if (squareContent != "blank") return legalSquares;
  legalSquares.push(currSqId);
  if (
    !(
      (rankNumber == 2 && pieceColor == "white") ||
      (rankNumber == 7 && pieceColor == "black")
    )
  )
    return legalSquares;
  currentRank += direction;
  currSqId = currentFile + currentRank;
  currSq = BdSqAry.find(
    (element) => element.squareId === currSqId
  );
  squareContent = currSq.pieceColor;
  if (squareContent != "blank")
    if (squareContent != "blank") return legalSquares;
  legalSquares.push(currSqId);
  return legalSquares;
}
function calcKnightmoves(startingSquareId, pieceColor, BdSqAry) {
  const file = startingSquareId.charCodeAt(0) - 97;
  const rank = startingSquareId.charAt(1);
  const rankNumber = parseInt(rank);
  let currentFile = file;
  let currentRank = rankNumber;
  let legalSquares = [];

  const moves = [
    [-2, 1],
    [-1, 2],
    [1, 2],
    [2, 1],
    [2, -1],
    [1, -2],
    [-1, -2],
    [-2, -1],
  ];
  moves.forEach((move) => {
    currentFile = file + move[0];
    currentRank = rankNumber + move[1];
    if (
      currentFile >= 0 &&
      currentFile <= 7 &&
      currentRank > 0 &&
      currentRank <= 8
    ) {
      let currSqId = String.fromCharCode(currentFile + 97) + currentRank;
      let currSq = BdSqAry.find(
        (element) => element.squareId === currSqId
      );
      let squareContent = currSq.pieceColor;
      if (squareContent != "blank" && squareContent == pieceColor)
        return legalSquares;
      legalSquares.push(String.fromCharCode(currentFile + 97) + currentRank);
    }
  });
  return legalSquares;
}
function calcRookMoves(startingSquareId, pieceColor, BdSqAry) {
  let eighthRank = eighthRankSq(
    startingSquareId,
    pieceColor,
    BdSqAry
  );
  let firstRank = firstRankSq(
    startingSquareId,
    pieceColor,
    BdSqAry
  );
  let AFile = AFileSq(
    startingSquareId,
    pieceColor,
    BdSqAry
  );
  let HFile = HFileSq(
    startingSquareId,
    pieceColor,
    BdSqAry
  );
  let legalSquares = [
    ...eighthRank,
    ...firstRank,
    ...AFile,
    ...HFile,
  ];
  return legalSquares;
}
function calcBishopMv(startingSquareId, pieceColor, BdSqAry) {
  let eighthRankSqHFileSquares = eighthRankSqHFile(
    startingSquareId,
    pieceColor,
    BdSqAry
  );
  let eighthRankSqAFileSquares = eighthRankSqAFile(
    startingSquareId,
    pieceColor,
    BdSqAry
  );
  let firstRankSqHFileSquares = firstRankSqHFile(
    startingSquareId,
    pieceColor,
    BdSqAry
  );
  let firstRankSqAFileSquares = firstRankSqAFile(
    startingSquareId,
    pieceColor,
    BdSqAry
  );
  let legalSquares = [
    ...eighthRankSqHFileSquares,
    ...eighthRankSqAFileSquares,
    ...firstRankSqHFileSquares,
    ...firstRankSqAFileSquares,
  ];
  return legalSquares;
}
// calc rook and bishop moves and add them to one array for queen moves
function calcQueenMv(startingSquareId, pieceColor, BdSqAry) {
  let bishopMoves = calcBishopMv(
    startingSquareId,
    pieceColor,
    BdSqAry
  );
  let rookMoves = calcRookMoves(startingSquareId, pieceColor, BdSqAry);
  let legalSquares = [...bishopMoves, ...rookMoves];
  return legalSquares;
}

// entry point for all king moves including caslting both sides
function calcKingMv(startingSquareId, pieceColor, BdSqAry) {
  const file = startingSquareId.charCodeAt(0) - 97;
  const rank = startingSquareId.charAt(1);
  const rankNumber = parseInt(rank);
  let currentFile = file;
  let currentRank = rankNumber;
  let legalSquares = [];
  const moves = [
    [0, 1],
    [0, -1],
    [1, 1],
    [1, -1],
    [-1, 0],
    [-1, 1],
    [-1, -1],
    [1, 0],
  ];

  moves.forEach((move) => {
    let currentFile = file + move[0];
    let currentRank = rankNumber + move[1];

    if (
      currentFile >= 0 &&
      currentFile <= 7 &&
      currentRank > 0 &&
      currentRank <= 8
    ) {
      let currSqId = String.fromCharCode(currentFile + 97) + currentRank;
      let currSq = BdSqAry.find(
        (element) => element.squareId === currSqId
      );
      let squareContent = currSq.pieceColor;
      if (squareContent != "blank" && squareContent == pieceColor) {
        return legalSquares;
      }
      legalSquares.push(String.fromCharCode(currentFile + 97) + currentRank);
    }
  });
  let shortCastleSquare = ShortCastleAvailable(pieceColor, BdSqAry);
  let longCastleSquare = LongCastleAvailable(pieceColor, BdSqAry);
  if (shortCastleSquare != "blank") legalSquares.push(shortCastleSquare);
  if (longCastleSquare != "blank") legalSquares.push(longCastleSquare);

  return legalSquares;
}

// calculates short castle"king side castle"
function ShortCastleAvailable(pieceColor, BdSqAry) {
  let rank = pieceColor === "white" ? "1" : "8";
  let fSquare = BdSqAry.find(
    (element) => element.squareId === `f${rank}`
  );
  let gSquare = BdSqAry.find(
    (element) => element.squareId === `g${rank}`
  );
  if (
    fSquare.pieceColor !== "blank" ||
    gSquare.pieceColor !== "blank" ||
    kingHasMoved(pieceColor) ||
    rookHasMoved(pieceColor, `h${rank}`)
  ) {
    return "blank";
  }

  return `g${rank}`;
}

// queen side castle calculations
function LongCastleAvailable(pieceColor, BdSqAry) {
  let rank = pieceColor === "white" ? "1" : "8";
  let dSquare = BdSqAry.find(
    (element) => element.squareId === `d${rank}`
  );
  let cSquare = BdSqAry.find(
    (element) => element.squareId === `c${rank}`
  );
  let bSquare = BdSqAry.find(
    (element) => element.squareId === `b${rank}`
  );
  if (
    dSquare.pieceColor !== "blank" ||
    cSquare.pieceColor !== "blank" ||
    bSquare.pieceColor !== "blank" ||
    kingHasMoved(pieceColor) ||
    rookHasMoved(pieceColor, `a${rank}`)
  ) {
    return "blank";
  }

  return `c${rank}`;
}
function kingHasMoved(pieceColor) {
  let result = moves.find(
    (element) =>
      element.pieceColor === pieceColor && element.pieceType === "king"
  );
  if (result != undefined) return true;
  return false;
}
function rookHasMoved(pieceColor, startingSquareId) {
  let result = moves.find(
    (element) =>
      element.pieceColor === pieceColor &&
      element.pieceType === "rook" &&
      element.from === startingSquareId
  );
  if (result != undefined) return true;
  return false;
}
//8th rank is last rank in the board, used to calculate movement of pieces that can move across the board eg rook, queen bishop
function eighthRankSq(startingSquareId, pieceColor, BdSqAry) {
  const file = startingSquareId.charAt(0);
  const rank = startingSquareId.charAt(1);
  const rankNumber = parseInt(rank);
  let currentRank = rankNumber;
  let legalSquares = [];
  while (currentRank != 8) {
    currentRank++;
    let currSqId = file + currentRank;
    let currSq = BdSqAry.find(
      (element) => element.squareId === currSqId
    );
    let squareContent = currSq.pieceColor;
    if (squareContent != "blank" && squareContent == pieceColor)
      return legalSquares;
    legalSquares.push(currSqId);
    if (squareContent != "blank" && squareContent != pieceColor)
      return legalSquares;
  }
  return legalSquares;
}

// first rank in the board
function firstRankSq(startingSquareId, pieceColor, BdSqAry) {
  const file = startingSquareId.charAt(0);
  const rank = startingSquareId.charAt(1);
  const rankNumber = parseInt(rank);
  let currentRank = rankNumber;
  let legalSquares = [];
  while (currentRank != 1) {
    currentRank--;
    let currSqId = file + currentRank;
    let currSq = BdSqAry.find(
      (element) => element.squareId === currSqId
    );
    let squareContent = currSq.pieceColor;
    if (squareContent != "blank" && squareContent == pieceColor)
      return legalSquares;
    legalSquares.push(currSqId);
    if (squareContent != "blank" && squareContent != pieceColor)
      return legalSquares;
  }
  return legalSquares;
}
function AFileSq(startingSquareId, pieceColor, BdSqAry) {
  const file = startingSquareId.charAt(0);
  const rank = startingSquareId.charAt(1);
  let currentFile = file;
  let legalSquares = [];

  while (currentFile != "a") {
    currentFile = String.fromCharCode(
      currentFile.charCodeAt(currentFile.length - 1) - 1
    );
    let currSqId = currentFile + rank;
    let currSq = BdSqAry.find(
      (element) => element.squareId === currSqId
    );
    let squareContent = currSq.pieceColor;
    if (squareContent != "blank" && squareContent == pieceColor)
      return legalSquares;
    legalSquares.push(currSqId);
    if (squareContent != "blank" && squareContent != pieceColor)
      return legalSquares;
  }
  return legalSquares;
}
function HFileSq(startingSquareId, pieceColor, BdSqAry) {
  const file = startingSquareId.charAt(0);
  const rank = startingSquareId.charAt(1);
  let currentFile = file;
  let legalSquares = [];
  while (currentFile != "h") {
    currentFile = String.fromCharCode(
      currentFile.charCodeAt(currentFile.length - 1) + 1
    );
    let currSqId = currentFile + rank;
    let currSq = BdSqAry.find(
      (element) => element.squareId === currSqId
    );
    let squareContent = currSq.pieceColor;
    if (squareContent != "blank" && squareContent == pieceColor)
      return legalSquares;
    legalSquares.push(currSqId);
    if (squareContent != "blank" && squareContent != pieceColor)
      return legalSquares;
  }
  return legalSquares;
}
function eighthRankSqAFile(
  startingSquareId,
  pieceColor,
  BdSqAry
) {
  const file = startingSquareId.charAt(0);
  const rank = startingSquareId.charAt(1);
  const rankNumber = parseInt(rank);
  let currentFile = file;
  let currentRank = rankNumber;
  let legalSquares = [];
  while (!(currentFile == "a" || currentRank == 8)) {
    currentFile = String.fromCharCode(
      currentFile.charCodeAt(currentFile.length - 1) - 1
    );
    currentRank++;
    let currSqId = currentFile + currentRank;
    let currSq = BdSqAry.find(
      (element) => element.squareId === currSqId
    );
    let squareContent = currSq.pieceColor;
    if (squareContent != "blank" && squareContent == pieceColor)
      return legalSquares;
    legalSquares.push(currSqId);
    if (squareContent != "blank" && squareContent != pieceColor)
      return legalSquares;
  }
  return legalSquares;
}
function eighthRankSqHFile(
  startingSquareId,
  pieceColor,
  BdSqAry
) {
  const file = startingSquareId.charAt(0);
  const rank = startingSquareId.charAt(1);
  const rankNumber = parseInt(rank);
  let currentFile = file;
  let currentRank = rankNumber;
  let legalSquares = [];
  while (!(currentFile == "h" || currentRank == 8)) {
    currentFile = String.fromCharCode(
      currentFile.charCodeAt(currentFile.length - 1) + 1
    );
    currentRank++;
    let currSqId = currentFile + currentRank;
    let currSq = BdSqAry.find(
      (element) => element.squareId === currSqId
    );
    let squareContent = currSq.pieceColor;
    if (squareContent != "blank" && squareContent == pieceColor)
      return legalSquares;
    legalSquares.push(currSqId);
    if (squareContent != "blank" && squareContent != pieceColor)
      return legalSquares;
  }
  return legalSquares;
}
function firstRankSqAFile(startingSquareId, pieceColor, BdSqAry) {
  const file = startingSquareId.charAt(0);
  const rank = startingSquareId.charAt(1);
  const rankNumber = parseInt(rank);
  let currentFile = file;
  let currentRank = rankNumber;
  let legalSquares = [];
  while (!(currentFile == "a" || currentRank == 1)) {
    currentFile = String.fromCharCode(
      currentFile.charCodeAt(currentFile.length - 1) - 1
    );
    currentRank--;
    let currSqId = currentFile + currentRank;
    let currSq = BdSqAry.find(
      (element) => element.squareId === currSqId
    );
    let squareContent = currSq.pieceColor;
    if (squareContent != "blank" && squareContent == pieceColor)
      return legalSquares;
    legalSquares.push(currSqId);
    if (squareContent != "blank" && squareContent != pieceColor)
      return legalSquares;
  }
  return legalSquares;
}
function firstRankSqHFile(startingSquareId, pieceColor, BdSqAry) {
  const file = startingSquareId.charAt(0);
  const rank = startingSquareId.charAt(1);
  const rankNumber = parseInt(rank);
  let currentFile = file;
  let currentRank = rankNumber;
  let legalSquares = [];
  while (!(currentFile == "h" || currentRank == 1)) {
    currentFile = String.fromCharCode(
      currentFile.charCodeAt(currentFile.length - 1) + 1
    );
    currentRank--;
    let currSqId = currentFile + currentRank;
    let currSq = BdSqAry.find(
      (element) => element.squareId === currSqId
    );
    let squareContent = currSq.pieceColor;
    if (squareContent != "blank" && squareContent == pieceColor)
      return legalSquares;
    legalSquares.push(currSqId);
    if (squareContent != "blank" && squareContent != pieceColor)
      return legalSquares;
  }
  return legalSquares;
}

// chessboard flipped for black pieces player
function blackboard() {
  Array.from(document.getElementsByClassName("piece")).forEach(div=>{
    div.style.transform = div.style.transform === "rotate(180deg)" ? "rotate(0deg)" : "rotate(180deg)";
  });
  Array.from(document.getElementsByClassName("coordinate")).forEach(div=>{
    div.style.transform = div.style.transform === "rotate(180deg)" ? "rotate(0deg)" : "rotate(180deg)";
    if(div.classList.contains("rank"))
     div.style.height = "20%";
  });
  chessBoard.style.transform = chessBoard.style.transform === "rotate(180deg)" ? "rotate(0deg)" : "rotate(180deg)";
  whiteEnemy = !whiteEnemy;
 fenposition = makeNewFEN(BdSqAry);
}

// array constructor for the chess board
function fillBdSqAry() {
  const BdSq = document.getElementsByClassName("square");
  for (let i = 0; i < BdSq.length; i++) {
    let row = 8 - Math.floor(i / 8);
    let column = String.fromCharCode(97 + (i % 8));
    let square = BdSq[i];
    square.id = column + row;
    let color = "";
    let pieceType = "";
    let pieceId = "";
    if (square.querySelector(".piece")) {
      color = square.querySelector(".piece").getAttribute("color");
      pieceType = square.querySelector(".piece").classList[1];
      pieceId = square.querySelector(".piece").id;
    } else {
      color = "blank";
      pieceType = "blank";
      pieceId = "blank";
    }
    let arrayElement = {
      squareId: square.id,
      pieceColor: color,
      pieceType: pieceType,
      pieceId: pieceId,
    };
    BdSqAry.push(arrayElement);
  }
}

//update boardarray after changes
function updateBdSqAry(
  currSqId,
  destinationSquareId,
  BdSqAry,
  promotionOption = "blank"
) {
  let currSq = BdSqAry.find(
    (element) => element.squareId === currSqId
  );
  let destinationSquareElement = BdSqAry.find(
    (element) => element.squareId === destinationSquareId
  );
  let pieceColor = currSq.pieceColor;
  let pieceType =
    promotionOption == "blank" ? currSq.pieceType : promotionOption;
  let pieceId =
    promotionOption == "blank"
      ? currSq.pieceId
      : promotionOption + currSq.pieceId;
  destinationSquareElement.pieceColor = pieceColor;
  destinationSquareElement.pieceType = pieceType;
  destinationSquareElement.pieceId = pieceId;
  currSq.pieceColor = "blank";
  currSq.pieceType = "blank";
  currSq.pieceId = "blank";
}
// records applys the move rules
function doMove(
  startingSquareId,
  destinationSquareId,
  pieceType,
  pieceColor,
  captured,
  promotedTo = "blank"
) {
  moves.push({
    from: startingSquareId,
    to: destinationSquareId,
    pieceType: pieceType,
    pieceColor: pieceColor,
    captured: captured,
    promotedTo: promotedTo,
  });
}

// returns object containing piece at certain sqID
function getPieceSq(squareId, BdSqAry) {
  let currSq = BdSqAry.find(
    (element) => element.squareId === squareId
  );
  const color = currSq.pieceColor;
  const pieceType = currSq.pieceType;
  const pieceId = currSq.pieceId;
  return { pieceColor: color, pieceType: pieceType, pieceId: pieceId };
}
// boolean function for checking the king
function isKingInCheck(squareId, pieceColor, BdSqAry) {
  let legalSquares = calcRookMoves(squareId, pieceColor, BdSqAry);
  for (let squareId of legalSquares) {
    let pieceProperties = getPieceSq(squareId, BdSqAry);
    if (
      (pieceProperties.pieceType == "rook" ||
        pieceProperties.pieceType == "queen") &&
      pieceColor != pieceProperties.pieceColor
    )
      return true;
  }
  legalSquares = calcBishopMv(squareId, pieceColor, BdSqAry);
  for (let squareId of legalSquares) {
    let pieceProperties = getPieceSq(squareId, BdSqAry);
    if (
      (pieceProperties.pieceType == "bishop" ||
        pieceProperties.pieceType == "queen") &&
      pieceColor != pieceProperties.pieceColor
    )
      return true;
  }
  legalSquares = calcKnightmoves(squareId, pieceColor, BdSqAry);
  for (let squareId of legalSquares) {
    let pieceProperties = getPieceSq(squareId, BdSqAry);
    if (
      pieceProperties.pieceType == "knight" &&
      pieceColor != pieceProperties.pieceColor
    )
      return true;
  }
  legalSquares = pawnDiagTakes(
    squareId,
    pieceColor,
    BdSqAry
  );
  for (let squareId of legalSquares) {
    let pieceProperties = getPieceSq(squareId, BdSqAry);
    if (
      pieceProperties.pieceType == "pawn" &&
      pieceColor != pieceProperties.color
    )
      return true;
  }
  legalSquares = calcKingMv(squareId, pieceColor, BdSqAry);
  for (let squareId of legalSquares) {
    let pieceProperties = getPieceSq(squareId, BdSqAry);
    if (
      pieceProperties.pieceType == "king" &&
      pieceColor != pieceProperties.color
    )
      return true;
  }
  return false;
}
function calcKingLastMv(color) {
  let kingLastMove = moves.findLast(
    (element) => element.pieceType === "king" && element.pieceColor === color
  );
  if (kingLastMove == undefined) return whiteToPlay ? "e1" : "e8";
  return kingLastMove.to;
}
// king must get out of check rule
function isMoveValidAgainstCheck(
  legalSquares,
  startingSquareId,
  pieceColor,
  pieceType
) {
  let kingSquare = whiteToPlay
    ? calcKingLastMv("white")
    : calcKingLastMv("black");
  let BdSqAryCopy = doCopyArray(BdSqAry);
  let legalSquaresCopy = legalSquares.slice();
  legalSquaresCopy.forEach((element) => {
    let destinationId = element;
    BdSqAryCopy = doCopyArray(BdSqAry);
    updateBdSqAry(
      startingSquareId,
      destinationId,
      BdSqAryCopy
    );
    if (
      pieceType != "king" &&
      isKingInCheck(kingSquare, pieceColor, BdSqAryCopy)
    ) {
      legalSquares = legalSquares.filter((item) => item != destinationId);
    }
    if (
      pieceType == "king" &&
      isKingInCheck(destinationId, pieceColor, BdSqAryCopy)
    ) {
      legalSquares = legalSquares.filter((item) => item != destinationId);
    }
  });
  return legalSquares;
}

// applies the rules of endgame chess, stalmate/threefold eg..
function weAreEndGame(){
  staleMateCheck();
  fenposition = makeNewFEN(BdSqAry);
  sendFen(fenposition);
  sendPgn(pgn);
  positionArray.push(fenposition);
  IDv  = positionArray.length -1;
  let threeFoldRepetition = threeFoldRep();
  let insufficientMaterial = insufficientMatsRule(fenposition);
  let fiftyMovesRuleCount = fenposition.split(" ")[4];
  let fiftyMovesRule = fiftyMovesRuleCount!=100 ? false : true;
  let isDraw = threeFoldRepetition||insufficientMaterial || fiftyMovesRule;
  if(isDraw){
    movement=false;
    showAlert("Draw");
    sendResign("");
    document.addEventListener('dragstart', function(event) {
        event.preventDefault();
    });
     document.addEventListener('drop', function(event) {
        event.preventDefault();
    });
    
  }
}
// mostly draw rule when there is no legal moves and king not in check
function staleMateCheck() {
  let kingSquare = whiteToPlay
    ? calcKingLastMv("white")
    : calcKingLastMv("black");
  let pieceColor = whiteToPlay ? "white" : "black";
  let BdSqAryCopy = doCopyArray(BdSqAry);
  let kingIsCheck = isKingInCheck(
    kingSquare,
    pieceColor,
    BdSqAryCopy
  );
  let possibleMoves = calcAllLegalMoves(BdSqAryCopy, pieceColor);
  if (possibleMoves.length > 0) return;
  let message = "";
  let blackPlayer = whiteEnemy?  player1.innerText : player2.innerText;
  let whitePlayer = whiteEnemy?  player2.innerText : player1.innerText;

  if(kingIsCheck) 
  whiteToPlay ? (message = `${blackPlayer} Wins!`) : (message =  `${whitePlayer} Wins!`);
  else
  message="Draw";
  message === "Draw" ? sendResign("") : sendResign(message.slice(0,-5).trim());

  showAlert(message);
}
// draw after 50 moves with no takes rule
function calcFiftymoveRule(){
  let count=0;
  for (let i=0;i<moves.length;i++){
    count++;
    if(moves[i].captured || moves[i].pieceType ==="pawn" || moves[i].promotedTo!="blank")
    count=0;
  }
  return count;
}
function threeFoldRep(){
  return positionArray.some((string)=>{
    const fen = string.split(" ").slice(0,4).join(" ");
    return positionArray.filter(
      (element)=>element.split(" ").slice(0,4).join(" ")===fen
    ).length>=3
  });
}

// draw rule when cant do checkmate
function insufficientMatsRule(fen){
  const piecePlacement = fen.split(" ")[0];

  const whiteBishops = piecePlacement.split("").filter(char=>char==="B").length;
  const blackBishops = piecePlacement.split("").filter(char=>char==="b").length;
  const whiteKnights = piecePlacement.split("").filter(char=>char==="N").length;
  const blackKnights = piecePlacement.split("").filter(char=>char==="n").length;
  const whiteQueens = piecePlacement.split("").filter(char=>char==="Q").length;
  const blackQueens = piecePlacement.split("").filter(char=>char==="q").length;
  const whiteRooks = piecePlacement.split("").filter(char=>char==="R").length;
  const blackRooks = piecePlacement.split("").filter(char=>char==="r").length;
  const whitePawns = piecePlacement.split("").filter(char=>char==="P").length;
  const blackPawns = piecePlacement.split("").filter(char=>char==="p").length;
 
  if(whiteQueens+blackQueens+whiteRooks+blackRooks+whitePawns+blackPawns>0){
    return false;
  }

  if(whiteKnights+blackKnights>1){
    return false;
  }
  if(whiteKnights+blackKnights>1) {
    return false;
  }

  if((whiteBishops>0|| blackBishops>0)&&(whiteKnights+blackKnights>0))
    return false;

    if(whiteBishops>1 || blackBishops>1)
      return false;

    if(whiteBishops===1 && blackBishops===1){
      let whiteBishopSquareColor,blackBishopSquareColor;

      let whiteBishopSquare = BdSqAry.find(element=>(element.pieceType==="bishop" && element.pieceColor==="white"));
      let blackBishopSquare = BdSqAry.find(element=>(element.pieceType==="bishop" && element.pieceColor==="black"));

      whiteBishopSquareColor = getSqaureColor(whiteBishopSquare.squareId);
      blackBishopSquareColor = getSqaureColor(blackBishopSquare.squareId);

      if(whiteBishopSquareColor!== blackBishopSquareColor){
        return false;
      }
    }
    return true;
}
function getSqaureColor(squareId){
  let squareElement = document.getElementById(squareId);
  let squareColor = squareElement.classList.contains("white") ? "white" : "black";
  return squareColor;
}
// calc legal moves for the whole board for certain color, this is supposed to be the main backend function that would send array of only allowed moves the player would make .
function calcAllLegalMoves(squaresArray, color) {
  return squaresArray
    .filter((square) => square.pieceColor === color)
    .flatMap((square) => {
      const { pieceColor, pieceType, pieceId } = getPieceSq(
        square.squareId,
        squaresArray
      );
      if (pieceId === "blank") return [];
      let squaresArrayCopy = doCopyArray(squaresArray);
      const pieceObject = {
        pieceColor: pieceColor,
        pieceType: pieceType,
        pieceId: pieceId,
      };
      let legalSquares = getLegalMoves(
        square.squareId,
        pieceObject,
        squaresArrayCopy
      );
      legalSquares = isMoveValidAgainstCheck(
        legalSquares,
        square.squareId,
        pieceColor,
        pieceType
      );
      return legalSquares;
    });
}
// white flag for players
 resignButton.addEventListener("click",()=>{
  movement = false;
  showAlert(player2.innerText+" Wins!");
  sendResign(player2.innerText);
 });

 function clearBoard() {
  const squares = document.querySelectorAll('.square');
  squares.forEach(square => {
    square.innerHTML = ''; // Clear all pieces from the squares
  });
}
// decription function for FEN , 
function loadFEN(fen) {
  const pieceMap = {
    'p': 'pawn',
    'r': 'rook',
    'n': 'knight',
    'b': 'bishop',
    'q': 'queen',
    'k': 'king',
    'P': 'pawn',
    'R': 'rook',
    'N': 'knight',
    'B': 'bishop',
    'Q': 'queen',
    'K': 'king'
  };

  const rows = fen.split(' ')[0].split('/');
  const board = document.getElementById('board');
  
  clearBoard();

  rows.forEach((row, rowIndex) => {
    let columnIndex = 0;
    for (const char of row) {
      if (isNaN(char)) { // It's a piece
        const pieceType = pieceMap[char];
        const color = char === char.toUpperCase() ? 'white' : 'black';
        const squareId = String.fromCharCode(97 + columnIndex) + (8 - rowIndex);
        
        const piece = newPiece(pieceType, color, "piece") ;
       
        const square = document.getElementById(squareId);
        square.appendChild(piece);

        columnIndex++;
      } else {
        columnIndex += parseInt(char); // It's a number of empty squares
      }
    }
  });
  setPieces();
  BdSqAry = [];
  fillBdSqAry();
}

function StandardNotation(move){
  let standardMove = "";
  let BdSqAryCopy = doCopyArray(BdSqAry);
  
  {
    let from = move.substring(0,2);
    let to =  move.substring(2,4);
    let promotion = move.length>4? move.charAt(4) : null;
    let fromSquare = BdSqAryCopy.find(square=>square.squareId===from);
    let toSquare = getPieceSq(to,BdSqAryCopy);
    if(fromSquare&&toSquare) {
      let fromPiece = fromSquare.pieceType;
      switch(fromPiece.toLowerCase()) {
        case "pawn":
          fromPiece="";
          break;
          case "knight":
            fromPiece="N";
            break;
          case "bishop":
            fromPiece="B";
            break;
          case "rook":
            fromPiece="R";
            break;   
          case "queen":
            fromPiece="Q";
            break;  
          case "king":
            fromPiece="K";
            break;
      }
      let captureSymbol="";
      if((toSquare.pieceType !=="blank") || (toSquare.pieceType=="blank" && fromSquare.pieceType.toLowerCase()==="pawn" && from.charAt(0)!=to.charAt(0))){
        captureSymbol="x";
        if(fromSquare.pieceType.toLowerCase()==="pawn") {
          fromPiece = from.charAt(0);
        }
      }
      standardMove = `${fromPiece}${captureSymbol}${to}`;
      if(promotion){
        switch(promotion.toLowerCase()){
          case "q":
          standardMove+="=Q";
          break;
          case "r":
            standardMove+="=R";
            break;
          case "b":
            standardMove+="=B";
            break;
          case "n":
            standardMove+="=N";
            break;  
        }
      }
      let kingColor = fromSquare.pieceColor == "white" ? "black":"white";
      let kingSquareId = calcKingSq(kingColor,BdSqAryCopy);
      updateBdSqAry(from,to,BdSqAryCopy);

      if(isKingInCheck(kingSquareId,kingColor,BdSqAryCopy)) {
        standardMove +="+";
      }
      if((standardMove =="Kg8" && fromSquare.squareId=="e8")||(standardMove == "Kg1" && fromSquare.squareId=="e1")) {
        if(standardMove ==="Kg8")
         updateBdSqAry("h8","f8",BdSqAryCopy);
        else
         updateBdSqAry("h1","f1",BdSqAryCopy);
         standardMove = "O-O";

      }
      if((standardMove =="Kc8" && fromSquare.squareId=="e8")||(standardMove == "Kc1" && fromSquare.squareId=="e1")) {
        if(standardMove ==="Kc8")
         updateBdSqAry("a8","d8",BdSqAryCopy);
        else
         updateBdSqAry("a1","d1",BdSqAryCopy);
        standardMove = "O-O-O";
      }
    
    }
  }
  return standardMove.trim();
}

function calcKingSq(color,squareArray) {
  let kingSquare = squareArray.find(square=>square.pieceType.toLowerCase()==="king" && square.pieceColor === color);
  return kingSquare ? kingSquare.squareId : null;
}

function updatingPGN(startingSquareId,destinationSquareId,whiteTurn,promotedTo="") {
  let move = startingSquareId+destinationSquareId+promotedTo;
  let standardMove = StandardNotation(move);
  let moveNumber = moves.length/2+1;
  if(whiteTurn) {
    let newMove = newMoveElement(standardMove,"playerMove");
    pgnContainer.appendChild(newMove);
    pgn+=" "+standardMove;
  } else {
    let number = newMoveElement(moveNumber,"moveNumber");
    let newMove = newMoveElement(standardMove,"playerMove");
    pgnContainer.appendChild(number);
    pgnContainer.appendChild(newMove);
    pgn+=" "+moveNumber+". "+standardMove;
  }
  pgnContainer.scrollTop = pgnContainer.scrollHeight;
}
// used for live recording moves
function newMoveElement(standardMove,elementClass) {
  let playerMove = document.createElement("div");
  let moveNumber = moves.length;
  playerMove.classList.add(elementClass);
  if(elementClass == "playerMove") {
    playerMove.id = moveNumber;
    playerMove.addEventListener("click",()=>{
      IDv = parseInt(playerMove.id)+1;
      highlightCertainMv(IDv);
      newPosition();
      (IDv != positionArray.length-1) ? 
       movement = false : movement = true;
    });
  }

  playerMove.innerHTML = standardMove;
  return playerMove;
}

// will recreate the chessboard based on selected position, with options to slide from first to last move and vice versa
function newHTMLPNG(pgn) {
  if(pgn === "") return;
  pgnContainer.innerHTML = "";
  let moveArray = pgn.trim().split(/\s+/);
  let moveNumber = 1;
  let moveId =-1;
  for(let i=0;i<moveArray.length;i++) {
    if(moveArray[i].includes(".")) {
      let number = newMoveElement(moveNumber,"moveNumber");
      pgnContainer.appendChild(number);
      moveNumber++;
    } else {
      let newMove = newMoveElement(moveArray[i],"playerMove");
      moveId++;
      newMove.id = moveId;
      pgnContainer.appendChild(newMove);
    }
  }
  pgnContainer.scrollTop = pgnContainer.scrollHeight;
}

stepBackward.addEventListener("click",()=>{
  previousMove();
});
stepForward.addEventListener("click",()=>{
  nextMove();
});
fastBackward.addEventListener("click",()=>{
  firstMove();
});
fastForward.addEventListener("click",()=>{
  lastMove();
});

function previousMove() {
  if(IDv>0) {
    IDv--;
    IDv>0 ?  highlightCertainMv(IDv) : {};
    movement = false;
  }
  newPosition();
}

function nextMove() {
  if(IDv < positionArray.length-1) {
    IDv++;
    highlightCertainMv(IDv);
    newPosition();
  }
  if(IDv === positionArray.length-1)
    movement = true;
}

function firstMove() {
  if(IDv >=0) {
    IDv =0;
    highlightCertainMv(1);
    newPosition();
  }
  movement = false;
}



function lastMove() {
  if(IDv>=0) {
    IDv = positionArray.length-1;
    newPosition();
  }
  if(IDv>0)
    highlightCertainMv(IDv);
  movement = true;
}
// will highlight the move made in certain position
function highlightCertainMv(IDv) {
  let moveElement = document.getElementById(IDv-1);
  document.querySelectorAll(".highlighted").forEach(element=>{
    element.classList.remove("highlighted");
  });
  moveElement.classList.add("highlighted");
}
function newPosition() {
  FENv = positionArray[IDv];
  loadFEN(FENv);
}


function showAlert(message) {
  const alert = document.getElementById("alert");
  alert.innerHTML = message;
  alert.style.display = "flex";
  if(whiteEnemy)
   alert.style.transform = alert.style.transform ='rotate(180deg)' ;

  setTimeout(function () {
    alert.style.display = "none";
  }, 3000);
}
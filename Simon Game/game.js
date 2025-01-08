var gamePattern = [];
var buttonColours = ["red", "blue", "green", "yellow"];
var userClickedPattern = [];
var level = 0;
var started = false;

$(document).on( "keydown", function(){
    if (!started) {
        $("h1").text("level " + level)
        nextSequence();
        started = true; 
    }
} );

$(".btn").click(function() {
    var userChosenColour = $(this).attr("id");
    userClickedPattern.push(userChosenColour);
    playSound("./sounds/" + userChosenColour + ".mp3");
    animatePress(userChosenColour);
    index = userClickedPattern.length - 1;
    checkAnswer(index);
  } );

function nextSequence() {
    userClickedPattern = []
    level++;
    var randomNumber = Math.floor(Math.random() * 4);
    var randomChosenColour = buttonColours[randomNumber];
    gamePattern.push(randomChosenColour);
    $("h1").text("level " + level);
    var chosenId = "#" + randomChosenColour;
    $(chosenId).fadeOut(100).fadeIn(100);
    var chosenAudio = "./sounds/" + randomChosenColour + ".mp3";
    playSound(chosenAudio);
}


function playSound(name) {
    var audio = new Audio(name);
    audio.play();
}

function animatePress(currentColour) {
    colorID = "#" + currentColour;
    $(colorID).addClass("pressed");
    setTimeout(function() {
        $(colorID).removeClass("pressed");
    }, 100);
}

function checkAnswer(currentLevel) {
    if (userClickedPattern[currentLevel] === gamePattern[currentLevel]) {
        console.log('success');
        if (userClickedPattern.length === gamePattern.length) {
            setTimeout(function () {
                nextSequence();
            }, 1000);
        }
    } else {
        console.log('wrong')
        playSound("/sounds/wrong.mp3")
        $("body").addClass("game-over")
        setTimeout(function () {
            $("body").removeClass("game-over");
        }, 200)
        $("h1").text("Game Over, Press Any Key to Restart");
        startOver();
    }
}

function startOver(){
    level = 0;
    gamePattern = [];
    started = false;
}
    /*function checkAnswer(currentLevel) {

        //3. Write an if statement inside checkAnswer() to check if the most recent user answer is the same as the game pattern. If so then log "success", otherwise log "wrong".
        if (gamePattern[currentLevel] === userClickedPattern[currentLevel]) {
    
          console.log("success");
    
          //4. If the user got the most recent answer right in step 3, then check that they have finished their sequence with another if statement.
          if (userClickedPattern.length === gamePattern.length){
    
            //5. Call nextSequence() after a 1000 millisecond delay.
            setTimeout(function () {
              nextSequence();
            }, 1000);
    
          }
    
        } else {
    
          console.log("wrong");
    
        }
    
    }*/
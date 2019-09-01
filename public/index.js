// setup variables
var passageIntros = new Array(4);
var passages = new Array(4);
var questions;
var currentQuestion = 1;
var currentPassage = 1;
var serialisedHighlights = new Array(40);
var userAnswers = new Array(40);

var time = 35 * 60;
var isTimerRunning = false;
var timer = setInterval(function () {
    if (isTimerRunning && time > 0) {
        time--;
        renderTimer();
    }
}, 1000);


var highlighter;

//connect html elements
let option1Elm = document.querySelector("#option1");
let option2Elm = document.querySelector("#option3");
let option3Elm = document.querySelector("#option2");
let option4Elm = document.querySelector("#option4");

//run when webpage loads
document.addEventListener("DOMContentLoaded", function () {

    //highlighter
    rangy.init();
    highlighter = rangy.createHighlighter();
    highlighter.addClassApplier(rangy.createClassApplier("highlight", {
        ignoreWhiteSpace: true,
        tagNames: ["span", "a"]
    }));

    //highlighting for middlebar
    document.querySelector(".middlebar").addEventListener("mouseup", function () {

        var found = false;
        var sel = rangy.getSelection();
        var ranges = sel.getAllRanges();


        let i;
        for (range of ranges) {
            var nodes = range.getNodes();
            for (node of nodes) {
                if (node.nodeType == 3)
                    node = node.parentNode;
                if (node.classList.contains("highlight"))
                    found = true
            }
        }
        if (found)
            highlighter.unhighlightSelection();
        else
            highlighter.highlightSelection("highlight");
        sel.removeAllRanges();

        //save highlight
        serialisedHighlights[currentQuestion] = highlighter.serialize();
    });

    document.querySelector(".middlebar").addEventListener("dblclick", function () {
        console.log("dblclick");
        highlighter.unhighlightSelection();
    });

    //fetch api
    fetch("questions.txt", {
        'Content-Type': 'text/plain; charset=UTF-8'
    })
        .then(function (res) {
            return res.text();
        })
        .then(function (data) {
            Papa.parse(data, {
                delimiter: "\t",
                complete: function (results, file) {
                    console.log("Parsing complete:", results, file);
                    questions = results.data;
                    render();
                }
            })
        });

    //init passage old version 
    // refreshPassage();

    //init passage with single document
    fetch("./passage.txt")
    .then(function(res) {
        return res.text()
    })
    .then(function(data) {
        data = data.split("***");
        //remove the first empty one
        data.shift();
        passageIntros[0] = data[1]
        passages[0] = data[3]
        passageIntros[1] = data[5]
        passages[1] = data[7]
        passageIntros[2] = data[9]
        passages[2] = data[11]
        passageIntros[3] = data[13]
        passages[3] = data[15]

        renderPassage();
    })

    
    

    //render timer
    renderTimer();

    //add flag and pagination items
    let pagination = document.querySelector(".pagination");
    let flag = document.querySelector(".flag");

    let j;
    for (j = 0; j < 40; j++) {

        flag.innerHTML += '<a href="#" id="flag' + (j + 1) + '"><i class="fas fa-flag"></i></a>'
        pagination.innerHTML += '<a href="#" id="pagination' + (j + 1) + '" onclick="goToQuestion('+(j+1)+')">' + (j + 1) + '</a>'
    }

    // set first question as active
    document.querySelector("#pagination1").classList.add("pagination-active");

    // event listener when answer is selected
    document.querySelector(".options").addEventListener("change", function(){
        if(document.querySelector("#option1").checked)
            userAnswers[currentQuestion-1] = currentQuestion%2 == 1 ? "A" : "F"
        else
        if(document.querySelector("#option2").checked)
            userAnswers[currentQuestion-1] = currentQuestion%2 == 1 ? "B" : "G"
        else
        if(document.querySelector("#option3").checked)
            userAnswers[currentQuestion-1] = currentQuestion%2 == 1 ? "C" : "H"
        else
        if(document.querySelector("#option4").checked)
            userAnswers[currentQuestion-1] = currentQuestion%2 == 1 ? "D" : "J"

    })


}, false);




//keyboard shortcuts
document.addEventListener("keydown", (evt) => {
    //disable moving between questions when overlay is on
    if (evt.altKey && evt.key == "n" && document.getElementsByClassName("overlay-on").length == 0) {
        nextQuestion();
    }
    else if (evt.altKey && evt.key == "p" && document.getElementsByClassName("overlay-on").length == 0) {
        prevQuestion();
    }
    // flag overriding default functionality
    else if (evt.ctrlKey && evt.key == "f") {
        event.preventDefault();
        toggleFlagQuestion()
    }
    else if (evt.key == 1) {
        document.querySelector("#option1").checked = true;
        userAnswers[currentQuestion-1] = currentQuestion%2 == 1 ? "A" : "F";
    }
    else if (evt.key == 2) {
        document.querySelector("#option2").checked = true;
        userAnswers[currentQuestion-1] = currentQuestion%2 == 1 ? "B" : "G";
    }
    else if (evt.key == 3) {
        document.querySelector("#option3").checked = true;
        userAnswers[currentQuestion-1] = currentQuestion%2 == 1 ? "C" : "H";
    }
    else if (evt.key == 4) {
        document.querySelector("#option4").checked = true;
        userAnswers[currentQuestion-1] = currentQuestion%2 == 1 ? "D" : "J";
    }
});


function nextQuestion() {

    fakeProcessing();

    currentQuestion++;

    if (needToChangePassage())
        renderPassage();
    render();
}

function prevQuestion() {

    fakeProcessing();

    currentQuestion--;
    if (currentQuestion < 1) {
        currentQuestion = 1;
    }

    if (needToChangePassage())
        renderPassage();
    render();

}

function goToQuestion(question) {
    fakeProcessing();

    currentQuestion = question;

    if (needToChangePassage())
        renderPassage();
    render();
}

function fakeProcessing(innerFunction) {
    // document.getElementById("overlay").style.display = "table";
    // document.getElementById("overlay").classList.add("overlay-on");
    document.querySelector(".overlay").classList.add("overlay-on");

    setTimeout(() => {
        document.querySelector(".overlay").classList.remove("overlay-on");
    }, 1000 + Math.random() * 500);
}


function renderPassage(){
    document.getElementById("passage-intro").innerHTML = passageIntros[currentPassage-1];
    document.getElementById("passage").innerHTML = passages[currentPassage-1];
}

// async function refreshPassage() {

//     let response = await fetch("./passages/passage" + currentPassage + ".txt");

//     let data = await response.text();

//     document.getElementById("passage").innerHTML = data;
// }


function needToChangePassage() {
    if (1 <= currentQuestion && currentQuestion <= 10 && currentPassage !== 1) {
        currentPassage = 1;
        return true;
    }
    if (11 <= currentQuestion && currentQuestion <= 20 && currentPassage !== 2) {
        currentPassage = 2;
        return true;
    }
    if (21 <= currentQuestion && currentQuestion <= 30 && currentPassage !== 3) {
        currentPassage = 3;
        return true;
    }
    if (31 <= currentQuestion && currentQuestion <= 40 && currentPassage !== 4) {
        currentPassage = 4;
        return true;
    }

    return false;
}

function render() {

    document.getElementById("question-number").innerHTML = currentQuestion;

    let question = questions[currentQuestion - 1];

    if (question) {

        document.getElementById("question").innerHTML = question[0];

        document.querySelector("#option1 ~ label").innerHTML = question[1];
        document.querySelector("#option3 ~ label").innerHTML = question[3];
        document.querySelector("#option2 ~ label").innerHTML = question[2];
        document.querySelector("#option4 ~ label").innerHTML = question[4];
    }

    //remove existing passage highlights
    let passageHighlights = document.getElementsByClassName("passage-highlight");
    while (passageHighlights[0]) {
        passageHighlights[0].classList.remove("passage-highlight");
    }

    // add passage highlights
    if (typeof question !== "undefined" && typeof question[5] !== "undefined") {
        let highlights = question[5].split(",");
        let i;
        for (i = 0; i < highlights.length; i++) {
            document.getElementById(highlights[i]).classList.add("passage-highlight");
        }
    }

    // remove user highlights
    let userHighlights = document.getElementsByClassName("highlight");
    while (userHighlights[0]) {
        userHighlights[0].classList.remove("highlight");
    }

    //restore user highlights
    if (serialisedHighlights[currentQuestion])
        highlighter.deserialize(serialisedHighlights[currentQuestion]);

    //set active pagination
    let activePagination = document.getElementsByClassName("pagination-active");
    while (activePagination[0]) {
        activePagination[0].classList.remove("pagination-active");
    }
    document.querySelector("#pagination" + currentQuestion).classList.add("pagination-active");

    // set answered pagination
    let i;
    for(i=0; i<userAnswers.length; i++){
        if(userAnswers[i])
            document.querySelector("#pagination"+(i+1)).classList.add("pagination-answered");
    }

    //clear answers
    for(radioButton of document.querySelectorAll(".options input")){
        radioButton.checked=false;
    }
    //load previously set answer
    let ans = userAnswers[currentQuestion-1];
    if(ans){
        if(ans=="A" || ans=="F")
            document.querySelector("#option1").checked = true;
        else
        if(ans=="B" || ans=="G")
            document.querySelector("#option2").checked = true;
        else
        if(ans=="C" || ans=="H")
            document.querySelector("#option3").checked = true;
        else
        if(ans=="D" || ans=="J")
            document.querySelector("#option4").checked = true;
        
    }
    
     
}

function toggleTimer() {
    // if(isTimerRunning){
    //     stopTimer();
    //     document.querySelector("#timer-toggle").innerHTML = "Stop"
    // }else{
    //     startTimer();
    //     document.querySelector("#timer-toggle").innerHTML = "Start"
    // }
    isTimerRunning = !isTimerRunning;
    document.querySelector("#timer-toggle").innerHTML = isTimerRunning ? "Stop" : "Start";
}

function startTimer() {
    timer = setInterval(function () {
        time--;
        renderTimer();
    }, 1000);
}

function stopTimer() {
    timer = clearInterval();
}

function resetTimer() {
    time = 35 * 60;
    renderTimer();
}

function renderTimer() {

    let minutes = Math.floor(time / 60);
    let seconds = Math.floor(time % 60);

    document.querySelector("#timer-display").innerHTML = minutes + ":" + seconds;
}

function toggleFlagQuestion() {
    console.log("toggle flag")

    if (document.querySelector("#flag" + currentQuestion).style.color == "red")
        document.querySelector("#flag" + currentQuestion).style.color = "white";
    else
        document.querySelector("#flag" + currentQuestion).style.color = "red";
    console.log(document.querySelector("#flag" + currentQuestion).style.color);
}

function toggleShowUserAnswers(){
    if(document.querySelector(".user-answers").classList.contains("user-answers-active")){
        document.querySelector(".user-answers").classList.remove("user-answers-active");
    }
    else{
        document.querySelector(".user-answers").classList.add("user-answers-active");
        //clear existing answers in the DOM
        document.querySelector(".user-answers-1-20").innerHTML = "";
        document.querySelector(".user-answers-21-40").innerHTML = "";
        //render the answers
        let i;
        for(i=0; i<userAnswers.length; i++){
            if(i<20)
                document.querySelector(".user-answers-1-20").innerHTML += "Q"+(i+1)+". "+userAnswers[i]+"<br>";
            else if(i<40)
                document.querySelector(".user-answers-21-40").innerHTML += "Q"+(i+1)+". "+userAnswers[i]+"<br>";
        }
    }
    
}
    //add listener to file input
    // document.getElementById("files").addEventListener('change', function(evt){
    //     let files = evt.target.files;

    //     for (var i=0; i<files.length; i++){
    //         Papa.parse(files[i], {
    //             complete: function(results, file) {
    //                 console.log("Parsing complete:", results, file);
    //                 questions = results.data;
    //             }
    //         })
    //     }

    // }, false);
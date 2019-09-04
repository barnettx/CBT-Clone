// setup variables
var passageIntros = new Array(4);
var passages = new Array(4);
var questions = [];
var currentQuestion = 1;
var currentPassage = 1;
var serialisedHighlights = new Array(40);
var userAnswers = new Array(40);

let passagesFileName, questionsFileName;

var time = 35 * 60;
var isTimerRunning = false;
var timer = setInterval(function () {
    if (isTimerRunning && time > 0) {
        time--;
        renderTimer();
    }
}, 1000);


var highlighter;
var passageHighlightsStyle;

var isEditing = false;
var isFakeProcessingEnabled = true;
function toggleFakeProcessing() {
    isFakeProcessingEnabled = !isFakeProcessingEnabled;
    document.querySelector("#fake-processing-toggle").innerHTML = isFakeProcessingEnabled ? "Disable fake processing" : "Enable fake processing";
}

var isFindEnabled = false;
function toggleFind() {
    isFindEnabled = !isFindEnabled;
    document.querySelector("#find-toggle").innerHTML = isFindEnabled ? "Disable Ctrl-F find" : "Enable Ctrl-F find";
}

var passageHighlightsActive = false;

function togglePassageHighlights() {
    passageHighlightsActive = !passageHighlightsActive;
    document.querySelector("#passage-reference-highlighting").innerHTML = passageHighlightsActive ? "Disable passage reference highlighting" : "Enable passage reference highlighting";
}

//connect html elements
let option1Elm = document.querySelector("#option1");
let option2Elm = document.querySelector("#option3");
let option3Elm = document.querySelector("#option2");
let option4Elm = document.querySelector("#option4");

let passageHighlightFormats = {};
let i;
for (i = 1; i <= 40; i++) {
    passageHighlightFormats["Q" + i] = { inline: 'span', attributes: { class: "Q" + i }, exact: true };
}

let tinyMCEPassagePromise;
let fetchPassagesPromise;
let fetchQuestionsPromise;

let questionEditor;

//tinyMCE
tinyMCEPassagePromise = tinymce.init({
    selector: "#passage",
    inline: true,
    menubar: false,
    readonly: true,
    toolbar: 'undo redo | bold italic | highlight',
    formats: passageHighlightFormats,
    setup: function (editor) {

        editor.ui.registry.addToggleButton('highlight', {
            text: 'Passage Highlight',
            icon: "highlight-bg-color",
            onAction: function () {
                toggleTinyMCEHighlight();
                passageDomToData();
            },
            onSetup: function (api) {
                editor.on('NodeChange', function (e) {
                    api.setActive(e.element.className.includes("Q" + currentQuestion))
                });
            }
        });
    },
    init_instance_callback: function (editor) {
        editor.on('Change', function (e) {
            passageDomToData();
        });
    },

});

tinymce.init({
    selector: "#passage-intro",
    inline: true,
    menubar: false,
    readonly: true,
    toolbar: 'undo redo | bold italic | highlight',
    init_instance_callback: function (editor) {
        editor.on('Change', function (e) {
            passageIntroDomToData();
        });
    }
});

questionEditor = tinymce.init({
    selector: "#question-editor",
    inline: true,
    menubar: false,
    height: 500,
    readonly: true,
    toolbar: 'undo redo | bold italic | highlight',
    init_instance_callback: function (editor) {
        editor.on('Change', function (e) {
            questionEditorDomToData();
        });

        editor.on("paste", function (e) {
            let paste = (event.clipboardData || window.clipboardData).getData('text');

            (event.clipboardData || window.clipboardData).setData("text/plain", paste.toUpperCase());
        })
    },
    plugins: "paste",
    paste_as_text: true,
    paste_preprocess: function (plugin, args) {
        console.log(args);
        console.log(args.content);
        args.content = args.content.replace(/<\/?(br)\b[^<>]*>/g, " ")
            .replace(" A.", " </p><p>A.")
            .replace(" B.", " </p><p>B.")
            .replace(" C.", " </p><p>C.")
            .replace(" D.", " </p><p>D.")
            .replace(" F.", " </p><p>F.")
            .replace(" G.", " </p><p>G.")
            .replace(" H.", " </p><p>H.")
            .replace(" J.", " </p><p>J.")
        args.content = "<p>" + args.content + "</p>";
        // .replace("B.","<br>B.")

        console.log(args.content);
        // args.content += ' preprocess';
    },
});


function passageDomToData() {
    // remove the user highlights first
    processor.innerHTML = tinymce.get("passage").getContent({ format: "raw" });
    let highlights = document.querySelectorAll("#processor span.highlight");
    for (h of highlights) {
        h.parentNode.removeChild(h);
    }
    passages[currentPassage - 1] = processor.innerHTML;
    processor.innerHTML = "";
}

function passageIntroDomToData() {
    // remove the user highlights first
    processor.innerHTML = tinymce.get("passage-intro").getContent({ format: "raw" });
    let highlights = document.querySelectorAll("#processor span.highlight");
    for (h of highlights) {
        h.parentNode.removeChild(h);
    }
    passageIntros[currentPassage - 1] = processor.innerHTML;
    processor.innerHTML = "";
}

function isQuestionEditorValid() {
    let questionData = tinymce.get("question-editor").getContent({ format: "text" }).split("\n\n");
    return questionData.length == 5;

}

function questionEditorDomToData() {
    let question = tinymce.get("question-editor").getContent({ format: "text" }).split("\n\n");
    questions[currentQuestion - 1] = question;
    console.log(question);
}


function toggleTinyMCEHighlight() {
    tinymce.activeEditor.formatter.toggle('Q' + currentQuestion)
}

function toggleEditing() {

    //make sure the question editor is valid
    if (isEditing && !isQuestionEditorValid()) {
        alert("Cannot convert edited text to question. Ensure 5 lines of text. \nAns.\nOption 1.\nOption 2.\nOption 3.\nOption 4.")
        return;
    }
    isEditing = !isEditing;

    document.querySelector("#edit-toggle").innerHTML = isEditing ? "Disable Editing" : "Enable Editing";
    isEditing ? document.querySelector(".topbar").classList.add("topbar-editing") : document.querySelector(".topbar").classList.remove("topbar-editing")

    tinymce.get("passage-intro").setMode(isEditing ? "design" : "readonly");
    tinymce.get("passage").setMode(isEditing ? "design" : "readonly");
    tinymce.get("question-editor").setMode(isEditing ? "design" : "readonly");

    //sync question edits
    if (isEditing) {

        document.querySelector("#question-test-mode").style.display = "none";
        document.querySelector("#question-editor").style.display = "block";

        tinymce.get("question-editor").setContent(
            "<p>" + questions[currentQuestion - 1][0] + "</p>"
            + "<p>" + questions[currentQuestion - 1][1] + "</p>"
            + "<p>" + questions[currentQuestion - 1][2] + "</p>"
            + "<p>" + questions[currentQuestion - 1][3] + "</p>"
            + "<p>" + questions[currentQuestion - 1][4] + "</p>", { format: "raw" })
    } else {


        questionEditorDomToData();

        let question = questions[currentQuestion - 1];
        console.log(question);

        if (question) {

            document.getElementById("question").innerHTML = question[0];

            document.querySelector("#option1 ~ label").innerHTML = question[1];
            document.querySelector("#option3 ~ label").innerHTML = question[3];
            document.querySelector("#option2 ~ label").innerHTML = question[2];
            document.querySelector("#option4 ~ label").innerHTML = question[4];
        }

        document.querySelector("#question-test-mode").style.display = "block";
        document.querySelector("#question-editor").style.display = "none";

    }

}


//run when webpage loads
document.addEventListener("DOMContentLoaded", function () {

    //highlighter
    rangy.init();
    highlighter = rangy.createHighlighter();
    highlighter.addClassApplier(rangy.createClassApplier("highlight", {
        ignoreWhiteSpace: true,
        // useExistingElements: false,
        tagNames: ["span", "a"]
    }));

    //passage highlights
    let i;
    for (i = 1; i <= 40; i++) {
        highlighter.addClassApplier(rangy.createClassApplier("Q" + i));
    }

    //highlighting for middlebar
    document.querySelector(".middlebar").addEventListener("mouseup", function () {

        //only use rangy highlighting when we are not editing the document
        if (!isEditing) {
            var found = false;
            var sel = rangy.getSelection();
            var ranges = sel.getAllRanges();


            let i;
            for (range of ranges) {
                var nodes = range.getNodes();
                for (node of nodes) {
                    if (node.nodeType == 3)
                        node = node.parentNode;
                    if ((!passageHighlightsActive && node.classList.contains("highlight"))
                        || (passageHighlightsActive && node.classList.contains("Q" + currentQuestion))) {
                        found = true
                        // console.log(found);
                    }
                }
            }
            if (found) {
                highlighter.unhighlightSelection();
            } else {
                highlighter.highlightSelection("highlight");
            }

            sel.removeAllRanges();

            //save highlight
            serialisedHighlights[currentQuestion - 1] = highlighter.serialize();
        }
    });

    // check localstorage
    if (localStorage.getItem("questions")) {
        let localStoragePromise = new Promise(function (resolve, reject) {
            data = JSON.parse(localStorage.getItem("questions"))
            resolve(data)
        })

        Promise.all([tinyMCEPassagePromise, localStoragePromise])
            .then((data) => {
                questions = data[1];
                render();
                tinymce.get("question-editor").setContent(
                    "<p>" + questions[currentQuestion - 1][0] + "</p>"
                    + "<p>" + questions[currentQuestion - 1][1] + "</p>"
                    + "<p>" + questions[currentQuestion - 1][2] + "</p>"
                    + "<p>" + questions[currentQuestion - 1][3] + "</p>"
                    + "<p>" + questions[currentQuestion - 1][4] + "</p>", { format: "raw" })

            });
    } else {
        //fetch api
        fetchQuestionsPromise = fetch("./questions68A.1.txt", {
            'Content-Type': 'text/plain; charset=UTF-8'
        })
            .then(function (res) {
                return res.text();
            })
            .then(function (data) {
                data = data.split(/\n\s*\n/);
                let i;
                questions = [];
                for (i = 0; i < 40; i++) {
                    let row = data[i].split(/\n/);
                    row.shift();
                    questions.push(row);
                }
                render();
            });

        Promise.all([questionEditor, fetchQuestionsPromise])
            .then(() => {
                tinymce.get("question-editor").setContent(
                    "<p>" + questions[currentQuestion - 1][0] + "</p>"
                    + "<p>" + questions[currentQuestion - 1][1] + "</p>"
                    + "<p>" + questions[currentQuestion - 1][2] + "</p>"
                    + "<p>" + questions[currentQuestion - 1][3] + "</p>"
                    + "<p>" + questions[currentQuestion - 1][4] + "</p>", { format: "raw" })
            });
    }

    //try loading from localstorage
    if (localStorage.getItem("passageIntros") && localStorage.getItem("passages")) {
        
        let localStoragePromise = new Promise(function (resolve, reject) {
            let data = {};
            data.passageIntros = JSON.parse(localStorage.getItem("passageIntros"))
            data.passages = JSON.parse(localStorage.getItem("passages"))
            resolve(data)
        })

        Promise.all([tinyMCEPassagePromise, localStoragePromise])
            .then((data) => {
                passageIntros = data[1].passageIntros;
                passages = data[1].passages;
                renderPassage();
                render();
            });

    } else {
        //init passage with single document
        fetchPassagesPromise = fetch("./passage68A.txt")
            .then(function (res) {
                return res.text()
            })
        // .then(function (data) {
        //     dataToPassage(data)
        //     render();
        // })

        //Wait for both tinymce to load and data to be fetched
        Promise.all([tinyMCEPassagePromise, fetchPassagesPromise])
            .then((data) => {
                console.log(data)
                dataToPassage(data[1])
                render();
            });
    }


    //render timer
    renderTimer();

    //add flag and pagination items
    let pagination = document.querySelector(".pagination");
    let flag = document.querySelector(".flag");

    let j;
    for (j = 0; j < 40; j++) {

        flag.innerHTML += '<a href="#" id="flag' + (j + 1) + '"><i class="fas fa-flag"></i></a>'
        pagination.innerHTML += '<a href="#" id="pagination' + (j + 1) + '" onclick="goToQuestion(' + (j + 1) + ')">' + (j + 1) + '</a>'
    }

    // set first question as active
    document.querySelector("#pagination1").classList.add("pagination-active");

    // event listener when answer is selected
    document.querySelector(".options").addEventListener("change", function () {
        if (document.querySelector("#option1").checked)
            userAnswers[currentQuestion - 1] = currentQuestion % 2 == 1 ? "A" : "F"
        else
            if (document.querySelector("#option2").checked)
                userAnswers[currentQuestion - 1] = currentQuestion % 2 == 1 ? "B" : "G"
            else
                if (document.querySelector("#option3").checked)
                    userAnswers[currentQuestion - 1] = currentQuestion % 2 == 1 ? "C" : "H"
                else
                    if (document.querySelector("#option4").checked)
                        userAnswers[currentQuestion - 1] = currentQuestion % 2 == 1 ? "D" : "J"

    })

    //event listener for when files are uploaded
    document.querySelector("#custom-passages").addEventListener("change", function () {
        console.log("custom passage txt")
        passagesFileName = document.querySelector("#custom-passages").files[0].name;
        document.querySelector("#custom-passages").files[0].text()
            .then((data) => {
                if (!validPassagesData(data)) {
                    alert("Invalid Passages Txt. Please Check Again.")
                    return
                }
                dataToPassage(data);
                render();
            });


    })
    document.querySelector("#custom-questions").addEventListener("change", function () {
        console.log("custom questions txt")

        questionsFileName = document.querySelector("#custom-questions").files[0].name;
        document.querySelector("#custom-questions").files[0].text()
            .then((data) => {

                data = data.split(/\n\s*\n/);
                if (!validQuestionsData(data)) {
                    alert("Invalid Questions Txt. Please Check Again.")
                    return
                }

                let i;
                questions = [];
                for (i = 0; i < 40; i++) {
                    let row = data[i].split(/\n/);
                    row.shift();
                    questions.push(row);
                }
                render();
            })

    });

    //create style sheet to add yellow passage highlights to question
    passageHighlightsStyle = document.createElement('style');
    passageHighlightsStyle.type = 'text/css';
    passageHighlightsStyle.innerHTML = '.Q1 { background-color: yellow; }';
    document.getElementsByTagName('head')[0].appendChild(passageHighlightsStyle);

}, false);

// save to localstorage on closing
window.addEventListener("beforeunload", function () {
    localStorage.setItem("passageIntros", JSON.stringify(passageIntros));
    localStorage.setItem("passages", JSON.stringify(passages));
    localStorage.setItem("questions", JSON.stringify(questions));
})

function validPassagesData(data) {
    data = data.split("***");
    data.shift();
    return data.length == 16
}

function dataToPassage(data) {
    data = data.split("***");
    //remove the first empty one
    data.shift();

    passagesIntros = new Array(4);
    passages = new Array(4);
    passageIntros[0] = data[1]
    passages[0] = data[3]
    passageIntros[1] = data[5]
    passages[1] = data[7]
    passageIntros[2] = data[9]
    passages[2] = data[11]
    passageIntros[3] = data[13]
    passages[3] = data[15]

    renderPassage();
}

function validQuestionsData(data) {
    return data.length == 40 || data.length == 41;
}

function downloadPassagesTxt() {

    let data = "";
    let i;
    for (i = 0; i < 4; i++) {
        data += "***PASSAGE " + (i + 1) + " INTRO***\n"
        data += passageIntros[i] + "\n"
        data += "***PASSAGE " + (i + 1) + "***\n"
        data += passages[i] + "\n"
    }


    download(data,
        (passagesFileName ? passagesFileName.replace(".txt", " ") : "passages ") + getDateString() + ".txt"
        , "text/plain");
}

function downloadQuestionsTxt() {

    let data = "";
    let i;
    for (i = 0; i < 40; i++) {
        data += (i + 1) + "\n"
            + questions[i][0].replace("\n") + "\n"
            + questions[i][1].replace("\n") + "\n"
            + questions[i][2].replace("\n") + "\n"
            + questions[i][3].replace("\n") + "\n"
            + questions[i][4].replace("\n") + "\n\n"
    }

    download(data,
        (questionsFileName ? questionsFileName.replace(".txt", " ") : "questions ") + getDateString() + ".txt"
        , "text/plain");
}

function getDateString() {
    let d = new Date();
    return d.getFullYear() + "-" + (d.getMonth() + 1) + "-" + (d.getDate()) + "-" + (d.getHours()) + "-" + (d.getMinutes())
}

function download(data, filename, type) {
    var file = new Blob([data], { type: type });
    if (window.navigator.msSaveOrOpenBlob) // IE10+
        window.navigator.msSaveOrOpenBlob(file, filename);
    else { // Others
        var a = document.createElement("a"),
            url = URL.createObjectURL(file);
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        setTimeout(function () {
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
        }, 0);
    }
}


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
        if (!isFindEnabled)
            event.preventDefault();
        toggleFlagQuestion()
    }
    else if (evt.key == 1) {
        document.querySelector("#option1").checked = true;
        userAnswers[currentQuestion - 1] = currentQuestion % 2 == 1 ? "A" : "F";
    }
    else if (evt.key == 2) {
        document.querySelector("#option2").checked = true;
        userAnswers[currentQuestion - 1] = currentQuestion % 2 == 1 ? "B" : "G";
    }
    else if (evt.key == 3) {
        document.querySelector("#option3").checked = true;
        userAnswers[currentQuestion - 1] = currentQuestion % 2 == 1 ? "C" : "H";
    }
    else if (evt.key == 4) {
        document.querySelector("#option4").checked = true;
        userAnswers[currentQuestion - 1] = currentQuestion % 2 == 1 ? "D" : "J";
    }
});


function nextQuestion() {

    if (isFakeProcessingEnabled)
        fakeProcessing();

    currentQuestion++;

    if (needToChangePassage())
        renderPassage();
    render();
}

function prevQuestion() {

    if (isFakeProcessingEnabled)
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

    if (isFakeProcessingEnabled)
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


function renderPassage() {
    document.getElementById("passage-intro").innerHTML = passageIntros[currentPassage - 1];
    console.log(tinymce.get("passage"));
    document.getElementById("passage").innerHTML = passages[currentPassage - 1];
    // tinymce.get("passage").setContent(passages[currentPassage - 1], {format: "raw"});
    // tinymce.get("passage").setContent("<h1>hello</h1>", {format: "raw"});
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

    // render the question-editor
    tinymce.get("question-editor").setContent(
        "<p>" + questions[currentQuestion - 1][0] + "</p>"
        + "<p>" + questions[currentQuestion - 1][1] + "</p>"
        + "<p>" + questions[currentQuestion - 1][2] + "</p>"
        + "<p>" + questions[currentQuestion - 1][3] + "</p>"
        + "<p>" + questions[currentQuestion - 1][4] + "</p>", { format: "raw" })


    //passage highlights through changing class that CSS is applied
    passageHighlightsStyle.innerHTML = ".Q" + currentQuestion + "{ background-color: yellow; }";


    // remove user highlights
    highlighter.removeAllHighlights();

    //restore user highlights
    if (serialisedHighlights[currentQuestion - 1])
        highlighter.deserialize(serialisedHighlights[currentQuestion - 1]);

    //set active pagination
    let activePagination = document.getElementsByClassName("pagination-active");
    while (activePagination[0]) {
        activePagination[0].classList.remove("pagination-active");
    }
    document.querySelector("#pagination" + currentQuestion).classList.add("pagination-active");

    // set answered pagination
    let i;
    for (i = 0; i < userAnswers.length; i++) {
        if (userAnswers[i])
            document.querySelector("#pagination" + (i + 1)).classList.add("pagination-answered");
    }

    //clear answers
    for (radioButton of document.querySelectorAll(".options input")) {
        radioButton.checked = false;
    }
    //load previously set answer
    let ans = userAnswers[currentQuestion - 1];
    if (ans) {
        if (ans == "A" || ans == "F")
            document.querySelector("#option1").checked = true;
        else
            if (ans == "B" || ans == "G")
                document.querySelector("#option2").checked = true;
            else
                if (ans == "C" || ans == "H")
                    document.querySelector("#option3").checked = true;
                else
                    if (ans == "D" || ans == "J")
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

function toggleShowUserAnswers() {
    if (document.querySelector(".user-answers").classList.contains("user-answers-active")) {
        document.querySelector(".user-answers").classList.remove("user-answers-active");
    }
    else {
        document.querySelector(".user-answers").classList.add("user-answers-active");
        //clear existing answers in the DOM
        document.querySelector(".user-answers-1-20").innerHTML = "";
        document.querySelector(".user-answers-21-40").innerHTML = "";
        //render the answers
        let i;
        for (i = 0; i < userAnswers.length; i++) {
            if (i < 20)
                document.querySelector(".user-answers-1-20").innerHTML += "Q" + (i + 1) + ". " + userAnswers[i] + "<br>";
            else if (i < 40)
                document.querySelector(".user-answers-21-40").innerHTML += "Q" + (i + 1) + ". " + userAnswers[i] + "<br>";
        }
    }

}


function toggleShowUserFile() {
    if (document.querySelector(".user-file").classList.contains("user-file-active")) {
        document.querySelector(".user-file").classList.remove("user-file-active");
    } else
        document.querySelector(".user-file").classList.add("user-file-active");
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
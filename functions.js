var data, lang, length, letters, contains, regexBox, answer, images, selectedImage, lettersInputs, imagesToLoad, counter;

function initialize() {
    lang = document.getElementById("lang");
    length = document.getElementById("length");
    letters = document.getElementById("letters");
    contains = document.getElementById("contains");
    regexBox = document.getElementById("regexBox");
    answer = document.getElementById("answer");
    images = document.getElementById("images");

    d3.csv("assets/data/answers.csv", function (data) {
        this.data = data;

        createLanguageOptions();
        createLengthOptions();

        lang.onchange = createLengthOptions;
        length.onchange = createLetters;
        contains.onchange = createImages;
        regexBox.onclick = applyRegex;
        document.getElementById("defaultLang").onclick = setDefaultLanguage;
        document.getElementById("defaultLength").onclick = setDefaultLength;
        document.getElementById("clearLetters").onclick = clearLetters;
        document.getElementById("clearContains").onclick = clearContains;
        window.onscroll = yHandler;
    });
}

function yHandler() {
    if (imagesToLoad[counter] === undefined) {
        return;
    }
    var container = document.getElementById("container");
    var contentHeight = container.offsetHeight;
    var yOffset = window.pageYOffset;
    var y = yOffset + window.innerHeight + 100;

    if (y >= contentHeight) {
        addBlockOfImages();
    }
}

function createLanguageOptions() {
    $("#lang").empty();
    var headers = d3.keys(data[0]);

    for (var i = 5; i < headers.length; i++) {
        var option = document.createElement("option");
        option.value = option.innerHTML = headers[i];
        lang.appendChild(option);
    }
    lang.value = "Greek";
}

function createLengthOptions() {
    $("#length").empty();
    contains.value = "";
    var selectedLang = lang.options[lang.selectedIndex].innerHTML;

    var firstOption = document.createElement("option");
    firstOption.value = -1;
    firstOption.innerHTML = "All";
    length.appendChild(firstOption);

    for (var i = 0; i < data.length; i++) {
        var wordLength = data[i][selectedLang].length;

        if (wordLength != 0 && !selectContainsOption(length, wordLength)) {
            var option = document.createElement("option");
            option.value = option.innerHTML = wordLength;
            length.appendChild(option);
        }
    }
    sortSelect(length);
    createLetters();
}

function selectContainsOption(selectbox, optionValue) {
    for (var i = 0; i < selectbox.options.length; i++) {
        if (selectbox.options[i].value == optionValue) {
            return true;
        }
    }
    return false;
}

function sortSelect(selectbox) {
    var i;
    var values = [];
    for (i = 0; i < selectbox.options.length; i++) {
        values[i] = selectbox.options[i];
    }
    values.sort(function compareOptions(option1, option2) {
        return option1.value - option2.value;
    });
    for (i = 0; i < values.length; i++) {
        selectbox.options[i] = values[i];
    }
}

function createLetters() {
    $("#letters").empty();
    lettersInputs = [];

    var selectedLength = length.options[length.selectedIndex].value;

    for (var i = 0; i < selectedLength; i++) {
        var inputbox = document.createElement("input");
        inputbox.style.margin = inputbox.style.padding = 0;
        inputbox.type = "text";
        inputbox.size = 1;
        inputbox.maxLength = "1";
		inputbox.style.minWidth = "40px";
        inputbox.placeholder = i + 1;
        letters.appendChild(inputbox);
        lettersInputs[i] = inputbox;
        inputbox.onchange = createImages;
    }
    if (selectedLength < 0) {
        letters.innerHTML = "Please select length";
        $("#clearLetters").hide();
    } else {
        $("#clearLetters").show();
    }
    createImages();
}

function createImages() {
    $("#images").empty();
    answer.style.fontWeight = "normal";
    answer.style.fontStyle = "italic";
    answer.style.backgroundColor = "transparent";
    answer.innerHTML = "Please select an image";
    selectedImage = undefined;
    imagesToLoad = [];
    counter = 0;

    var selectedLang = lang.options[lang.selectedIndex].innerHTML;
    var word, i, j, error, regex;

    if (lettersInputs.length == 0 && contains.value.length == 0) {
        for (i = 0; i < data.length; i++) {
            word = data[i][selectedLang];
            imagesToLoad[counter] = i;
            counter++;
        }
    } else if (lettersInputs.length != 0 && contains.value.length == 0) {
        for (i = 0; i < data.length; i++) {
            error = false;
            word = data[i][selectedLang];
            if (length.options[length.selectedIndex].value == word.length) {
                for (j = 0; j < word.length; j++) {
                    if (lettersInputs[j].value != "" && word[j].toUpperCase() != lettersInputs[j].value.toUpperCase()) {
                        error = true;
                        break;
                    }
                }
                if (!error) {
                    imagesToLoad[counter] = i;
                    counter++;
                }
            }
        }
    } else if (lettersInputs.length == 0 && contains.value.length != 0) {
        for (i = 0; i < data.length; i++) {
            word = data[i][selectedLang];
            try {
                if (regexBox.checked) {
                    regex = new RegExp(contains.value.toUpperCase(), "i");
                } else {
                    regex = new RegExp(escapeRegex(contains.value.toUpperCase()), "i");
                }
                if (regex.test(word)) {
                    imagesToLoad[counter] = i;
                    counter++;
                }
            } catch (e) {
                break;
            }
        }
    } else if (lettersInputs.length != 0 && contains.value.length != 0) {
        for (i = 0; i < data.length; i++) {
            error = false;
            word = data[i][selectedLang];
            if (length.options[length.selectedIndex].value == word.length) {
                for (j = 0; j < word.length; j++) {
                    if (lettersInputs[j].value != "" && word[j].toUpperCase() != lettersInputs[j].value.toUpperCase()) {
                        error = true;
                        break;
                    }
                }
                if (!error) {
                    try {
                        if (regexBox.checked) {
                            regex = new RegExp(contains.value.toUpperCase(), "i");
                        } else {
                            regex = new RegExp(escapeRegex(contains.value.toUpperCase()), "i");
                        }
                        if (regex.test(word)) {
                            imagesToLoad[counter] = i;
                            counter++;
                        }
                    } catch (e) {
                        break;
                    }
                }
            }
        }
    }
    counter = 0;
    addBlockOfImages();
}

function escapeRegex(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function addBlockOfImages() {
    var selectedLang = lang.options[lang.selectedIndex].innerHTML;
    var word;
    var limit = counter + 100;

    for (counter; counter < limit; counter++) {
        if (imagesToLoad[counter] === undefined) {
            break;
        }
        word = data[imagesToLoad[counter]][selectedLang];
        addImage(word, imagesToLoad[counter]);
    }
    $(function () {
        $("img.lazy").lazyload({
            effect: "fadeIn",
            threshold: 300
        });
    });
}

function addImage(word, index) {
    var img = document.createElement("img");
    img.setAttribute("data-original", "assets/images/" + data[index].Image);
    img.className = "lazy";
    img.alt = word;
    img.title = word;
    img.id = index;
    img.style.width = '150px';
    img.style.height = 'auto';
    img.onclick = function () {
        $("html, body").stop().animate({scrollTop: "0px"});
        commitAnswer(event);
    };
    images.appendChild(img);
}

function commitAnswer(event) {
    var selectedLang = lang.options[lang.selectedIndex].innerHTML;

    if (selectedImage !== undefined) {
        selectedImage.style.borderColor = "transparent";
    }
    selectedImage = event.srcElement;
    selectedImage.style.borderColor = "blue";

    answer.style.fontWeight = "bold";
    answer.style.fontStyle = "normal";
    answer.style.backgroundColor = "yellow";
    answer.innerHTML = data[selectedImage.id][selectedLang];
}

function setDefaultLanguage() {
    if (lang.value != "Greek") {
        lang.value = "Greek";
        lang.onchange();
    }
}

function setDefaultLength() {
    if (length.value != -1) {
        length.value = -1;
        length.onchange();
    }
}

function clearLetters() {
    for (var i = 0; i < lettersInputs.length; i++) {
        if (lettersInputs[i].value != "") {
            lettersInputs[i].value = "";
            lettersInputs[i].onchange();
        }
    }
}

function clearContains() {
    if (contains.value != "") {
        contains.value = "";
        contains.onchange();
    }
}

function applyRegex() {
    if (regexBox.checked) {
        document.getElementById("regexLabel").style.color = "green";
    } else {
        document.getElementById("regexLabel").style.color = "red";
    }
    if (contains.value != "") {
        createImages();
    }
}
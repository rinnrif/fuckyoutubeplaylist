
// fuck yt official 
var tag = document.createElement('script');

tag.src = "https://www.youtube.com/iframe_api";
var firstScriptTag = document.getElementsByTagName('script')[0];
firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

var player;
window.onYouTubeIframeAPIReady = function () {
    player = new YT.Player('player', {
        height: '390',
        width: '640',
        videoId: 'hcHhpi2buA8',
        playerVars: {
            'playsinline': 1
        },
        events: {
            // 'onReady': onPlayerReady,
            'onStateChange': onPlayerStateChange
        }
    });
}

function onPlayerReady(event) {
    event.target.playVideo();
}

function onPlayerStateChange(event) {

    if (event.data == 0) {
        changePlayVideo(1)
    }
}
function stopVideo() {
    player.stopVideo();
}

// user definetion

// sound
function PlayAudio(filename) {
    var audio = new Audio(filename).play();
}
var currentPlayIndex;

//  fire
document.body.onkeyup = function (e) {
    if (e.key == "e" || e.code == "KeyE" || e.keyCode == 69) {
        PlayAudio('./src/sounds/AK47_Fire1.wav');
    }
}

// onload
window.addEventListener('load', (event) => {
    const data = localStorage.getItem('songs')
    jsondata = JSON.parse(data)
    restorePlaylist(jsondata)
    restoreUrls(jsondata)
    inputtime.value = 25
    expectedtime.innerText =  calcExpected(inputtime.value)
});

// timer
const inputtime = document.getElementById("inputtime")
const timer = document.getElementById("timer")
const expectedtime = document.getElementById("expected")

// global
let currentIntervalId
let leftTime


// listener
inputtime.addEventListener('input', (e) => {
    const seconds = inputtime.value * 60
    updateTimeString(timer, seconds)
    expectedtime.innerText = calcExpected(inputtime.value)
})

inputtime.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        PlayAudio("./src/sounds/armbomb2.wav")
        PlayAudio("./src/sounds/drawfirst.wav")
        starttimer()
    }
})

function resettimer(intervalid, miliseconds) {
    clearInterval(intervalid)
    if (!miliseconds) {
        updateTimeString(timer, inputtime.value * 60)
    } else {
        updateTimeString(timer, miliseconds / 1000)
    }
    leftTime = 0
}

function calcExpected(minutes) {
    let d = new Date()
    var newDateObj = new Date(d.getTime() + minutes*60000);

    return newDateObj.toTimeString().split(' ')[0].slice(0, 5)
}


function starttimer(resume) {

    let miliseconds = 0
    let elapsed = 0
    let isfirst = true
    let done = false

    if (resume) {
        console.log("from resume")
        miliseconds = resume
    } else {
        miliseconds = inputtime.value * 60 * 1000
    }

    updateTimeString(timer, miliseconds / 1000)

    if (currentIntervalId) {
        console.log("intervalid found:", currentIntervalId)
        resettimer(currentIntervalId, miliseconds)
    }

    currentIntervalId = setInterval(() => {
        console.log("delta:", performance.now() - elapsed)
        if (isfirst) {
            miliseconds = miliseconds - 1000
            // PlayAudio("./src/sounds/drawfirst.wav")
            isfirst = false
        } else {
            const delta = performance.now() - elapsed
            miliseconds = miliseconds - delta
        }

        leftTime = miliseconds

        if (miliseconds > 0) {
            if (miliseconds <= 10000) {
                PlayAudio("./src/sounds/beep.wav")
            }
            updateTimeString(timer, miliseconds / 1000)
        }

        if (miliseconds / 1000 <= 0) {
            if (!done) {
                PlayAudio("./src/sounds/doublebeep.wav")
                updateTimeString(timer, 0)
                done = true
            } else {
                PlayAudio("./src/sounds/ct_win.mp3")
                expectedtime.innerText = calcExpected(inputtime.value)
                clearInterval(currentIntervalId)
            }
        }

        elapsed = performance.now()
    }, 1000);

}


function updateTimeString(element, seconds) {
    const mm = Math.floor(seconds / 60).toString().padStart(2, '0')
    const ss = Math.floor(seconds % 60).toString().padStart(2, '0')
    timer.textContent = `${mm}:${ss}`
}

async function reloadPlaylist() {

    const ids = document.getElementById("youtube-urls").value
    const playlistUrls = ids.split(/\r?\n/);

    const queueboard = document.getElementById("queue");
    queueboard.replaceChildren();

    const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

    store = []
    var index = 1
    for (const url of playlistUrls) {
        if (url == "") {
            continue
        }

        // extract video id
        const m = url.match(/=(.*?)(?=&|;|$)/);
        const extractid = m?.[1] ?? "";

        // mapping
        const dict = {}

        const title = await getYouTubeTitle(extractid)
        dict["id"] = extractid
        dict["title"] = title
        store.push(dict)

        // add element
        const newChild = document.createElement("div");
        newChild.setAttribute("class", "queue");
        newChild.videoid = extractid
        newChild.videoindex = index
        newChild.textContent = `${index} - ${title}`
        newChild.addEventListener('click', changePlayVideo, false);
        queueboard.appendChild(newChild);
        index++
        await sleep(100);
    }

    playstate.updateSize(index - 1)
    console.log(playstate.currentSize)
    localStorage.setItem("songs", JSON.stringify(store));
}

const playstate = {
    currentindex: 0,
    currentsize: 0,
    updateIndex(index) {
        this.currentindex = index
    },
    updateSize(size) {
        this.currentSize = size
    }
}

function restoreUrls(object) {
    const textarea = document.getElementById("youtube-urls");
    let str = ""
    for (const data of object) {
        if (data.id) {
            str += `https://www.youtube.com/watch?v=${data.id}\n`
        }
    }
    console.log(str)
    textarea.value = str
}

function restorePlaylist(object) {
    const queueboard = document.getElementById("queue");
    queueboard.replaceChildren();
    var index = 1

    for (const data of object) {
        const newChild = document.createElement("div");
        newChild.setAttribute("class", "queue");
        newChild.videoid = data.id
        newChild.videoindex = index
        newChild.textContent = `${index} - ${data.title}`
        newChild.addEventListener('click', changePlayVideo, false);
        queueboard.appendChild(newChild);
        index++
    }
    playstate.updateSize(index - 1)

}

function changePlayVideo(event) {
    clearAllStyle()
    const queueboard = document.getElementById("queue");
    const child = queueboard.children
    let target
    let index

    // previous
    if (event == -1) {
        index = playstate.currentindex - 1
        console.log(index)
        if (index == -1) {
            index = playstate.currentSize - 1
        }
        target = child[index]
    }
    // next
    else if (event == 1) {
        index = playstate.currentindex + 1
        console.log(index)
        if (index >= playstate.currentSize) {
            index = 0
        }
        target = child[index]
    }
    // click
    else if (event.target) {
        index = event.target.videoindex - 1
        target = event.target
    }

    videoid = target.videoid

    target.style.backgroundColor = "#f0f0f0"
    player.loadVideoByUrl(`http://www.youtube.com/v/${videoid}?version=3`, 0)
    playstate.updateIndex(index)
}

function clearAllStyle() {
    const queueboard = document.getElementById("queue");
    const child = queueboard.children
    for (const c of child) {
        c.style.backgroundColor = ""
    }
}

// fetch youtube url
async function getYouTubeTitle(videoid) {
    try {
        const urlaaa = `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoid}&format=json`
        const res = await fetch(urlaaa);
        if (!res.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        const data = await res.json();
        return data.title
    } catch (error) {
        return null;
    }
}

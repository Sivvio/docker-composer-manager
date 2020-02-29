const skt = io();

let currentLogLength = 0;
let lastUpdatedLogLength = 0;
let formattedArr = [];

let autoScroll;

// if the path is not full then just append else request full log
if(window.location.href.search('/full') === -1) {
    skt.emit('request-log',  window.location.href.split('/')[4]);
} else {
    skt.emit('request-full-log',  window.location.href.split('/')[4]);
}


skt.on('log-stream', chunk => {
    let split = chunk.split('\n');
    formattedArr = formattedArr.concat(split);
    currentLogLength = formattedArr.length;
});

setInterval(() => {
    if (currentLogLength >= lastUpdatedLogLength) {

        for (let i = lastUpdatedLogLength; i <= currentLogLength; i++) {
            let line = formattedArr[i];
            if (line) {
                //formatting
                line = line.replace(//g, "");
                let newline = line.split("|");

                //first part of coloured log
                const initLine = document.createElement("p");
                initLine.style.color = 'red';
                const initLineNode = document.createTextNode(newline[0] + " | ");
                initLine.appendChild(initLineNode);

                //white part
                const textLine = document.createElement("p");
                const textLineNode = document.createTextNode(newline[1]);
                textLine.appendChild(textLineNode);

                // append to container
                const div = document.createElement("div");
                div.appendChild(initLine);
                div.appendChild(textLine);
                const container = document.getElementById('terminal-container');
                container.appendChild(div);

                div.scrollTop = div.scrollHeight; // autoscroll
            }
        }

        lastUpdatedLogLength = currentLogLength;
    }
}, 100);

autoScrollEnabled(); //auto scroll by default

function autoScrollEnabled() {
    autoScroll = setInterval(() => {
        window.scrollBy(0, 1000);
    }, 100);
}

function loadFullLogs() {
    if(window.location.href.search('/full') === -1) {
        window.location.href += "/full"
    }
}
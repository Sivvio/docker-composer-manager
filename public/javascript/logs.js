const socket = io();

let currentLogLength = 0;
let lastUpdatedLogLength = 0;
let formattedArr = [];


socket.on('log-stream', chunk => {
    let split = chunk.split('\n');

    formattedArr = formattedArr.concat(split);
    currentLogLength = formattedArr.length;
});

setInterval(() => {
    if (currentLogLength > lastUpdatedLogLength) {
        formattedArr.forEach(line => {

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
            }


        });
    }

    lastUpdatedLogLength = currentLogLength;
}, 500);


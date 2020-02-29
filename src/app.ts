import * as dotenv from 'dotenv';
dotenv.config();

import express from "express";
import bodyParser from 'body-parser';
import { ApplicationStatus } from "./models/application-status";
import { ActionService } from "./services/action.service";
import { ConfigInit } from "./configuration/config-init";
import http from 'http';
import path from 'path';
import process from 'process';

const app = express();
const port = process.env.PORT || 3000;
const server = http.createServer(app);

app.set('view engine', 'hbs');
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use('/static', express.static('node_modules')); //exposing node_modules for socket
app.use('/public', express.static(path.join(__dirname, '../../public')));

export const io = require('socket.io').listen(server);


export const applicationStatus: ApplicationStatus = new ApplicationStatus();
export const actionService: ActionService = new ActionService(applicationStatus);
new ConfigInit(applicationStatus);


app.set('socketio', io);

app.get('/', (req, res) => {
    res.render('overview', applicationStatus.commands);
});

app.post('/spin-up-image', (req, res) => {
    actionService.spinUpImages(req.body).then(() => res.render('overview', applicationStatus.commands));
});

app.get('/tail-logs/:serviceName', (req, res) => {
    res.sendFile(path.resolve(__dirname + '/../../views/logs.html'));
});

app.get('/tail-logs/:serviceName/full', (req, res) => {
    res.sendFile(path.resolve(__dirname + '/../../views/logs.html'))
});

app.get('/alt-service/:serviceName', (req, res) => {
    const serviceName = req.params.serviceName;
    actionService.altImages(serviceName);

    res.render('overview', applicationStatus.commands);
});

io.on('connection', (socket) => {
   // console.log("socket " + socket.id + " connected");

    socket.on('request-log', (serviceName) => {
        console.log('start tailing on service: ' + serviceName + ' for socket ' + socket.id);
        actionService.tailLogs(serviceName, socket, null);
    });

    socket.on('request-full-log', (serviceName) => {
        console.log('streaming full logs for service: ' + serviceName + ' for socket ' + socket.id);
        actionService.streamFullLogs(serviceName, socket);
    });

    socket.on('disconnect', () => {
        console.log('socket ' + socket.id + ' disconnected, killing tail');
        if(this.applicationStatus.runningTails.get(socket.id)) {
            this.applicationStatus.runningTails.get(socket.id).tail.unwatch(); // kills the event
            this.applicationStatus.runningTails.delete(socket.id);
        }
    });
});

server.listen(port, () => console.log(`Microservices server started on port ${port}`));

//dealing with process kill
process.on('SIGINT', () => {
    applicationStatus.commands.cmd.forEach(service => {

        if(service.active) {
            console.log('stopping service: ' + service.serviceName);
            actionService.altImages(service.serviceName);
            console.log('successfully stopped service: ' + service.serviceName);
        }

    });
    console.log('Successfully stopped all services, terminating server');
    process.exit();
});
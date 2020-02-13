import * as dotenv from 'dotenv';
dotenv.config();

import express from "express";
import bodyParser from 'body-parser';
import {ApplicationStatus} from "./models/application-status";
import {ActionService} from "./services/action.service";
import {ConfigInit} from "./configuration/config-init";
import http from 'http';
import path from 'path';

const app = express();
const port = process.env.PORT || 3000 ;
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

app.get('/', (req, res) => {
    res.render('overview', applicationStatus.commands);
});

app.post('/spin-up-image', (req, res) => {
    actionService.spinUpImages(req.body).then(() => res.render('overview', applicationStatus.commands));
});

app.get('/tail-logs/:serviceName', (req, res) => {
    
    actionService.tailLogs(req.params.serviceName);
    res.status(200);
    res.sendFile(path.resolve(__dirname + '/../../views/logs.html'))
});

app.get('/alt-service/:serviceName', (req, res) => {
    const serviceName = req.params.serviceName;
    actionService.altImages(serviceName);

    res.render('overview', applicationStatus.commands);
});

server.listen(port, () => console.log(`Microservices server started on port ${port}`));
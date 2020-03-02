import * as fs from 'fs';
import { ApplicationStatus } from "../models/application-status";
import { Util } from '../util/util';
import { Socket } from 'socket.io';
import { PrivateKeyInput } from 'crypto';
import { setInterval } from 'timers';
const Tail = require('tail').Tail;


export class ActionService {

    constructor(private applicationStatus: ApplicationStatus) { }

    spinUpImages(actions): Promise<any> {
        const selectedActions = Array.isArray(Object.values(actions)[0]) ? Object.values(actions)[0] : [Object.values(actions)][0];

        const executedAll: Promise<any>[] = [];

        //@ts-ignore
        selectedActions.forEach(a => {
            executedAll.push(this.actionToPromise(a));
        });

        return Promise.all(executedAll);
    }

    private actionToPromise(a: string): Promise<any> {
        return new Promise(resolve => {

            let errorPromise: Promise<Map<string, string>>;

            const command = this.applicationStatus.config.commandsList.get(a);

            const serviceName = command.slice(command.lastIndexOf(' ') + 1);
            const fileLogName = this.applicationStatus.config.dockerLogsFolder + serviceName;
            const runningServiceProcess = Util.spawn(command);

            Util.tailLogsToFile(fileLogName, runningServiceProcess);

            //prepare a promise for the error to be displayed
            errorPromise = new Promise(res => {
                let errorMsg = '';
                let error: Map<string, string> = new Map<string, string>();

                runningServiceProcess.stderr.on("data", (data) => {
                    errorMsg += data.toString();
                });

                runningServiceProcess.stderr.on("end", (data) => {
                    error.set(serviceName, errorMsg);
                });

                runningServiceProcess.stdout.on("close", (data) => {
                    res(error);
                });
            });

            //saving the process into a map, we can kill the process on altImages
            this.applicationStatus.runningServicesProcesses.set(serviceName, runningServiceProcess);

            // set running images, will confirm later if they ar actually running with docker ps
            this.applicationStatus.runningImages.add(serviceName);

            let uiStatus = this.applicationStatus.commands.cmd.filter(c => c.serviceName === a)[0];

            // performing a docker ps on the specific instance to check if it actually got started, try 
            let numberOfTrials = 0;

            let trial;
            let psOutput: string;
            let psOutputArray: string[];

            // try to docker ps 5 times if there's no result, fail
            if (numberOfTrials <= 5) {
                trial = setInterval(() => {
                    psOutput = Util.executeBashCommand('docker ps --filter name=' + uiStatus.serviceName);
                    psOutputArray = psOutput.split(" ");
                    psOutputArray = psOutputArray.filter(out => out.trim() === uiStatus.serviceName);

                    if (psOutputArray.length >= 1) {
                        uiStatus.active = true;
                        uiStatus.errorMessage = null;
                        clearInterval(trial);
                        resolve();
                    }

                    numberOfTrials++;
                    console.log('Attempting docker ps for service : ' + uiStatus.serviceName + ' - ' + numberOfTrials);
                }, 1000);
            } else {
                uiStatus.active = false;
                errorPromise.then(err => {
                    uiStatus.errorMessage = err.get(uiStatus.serviceName);
                    resolve();
                });
            }
        });
    }



    altImages(serviceName): void {

        const fileLogName = this.applicationStatus.config.dockerLogsFolder + serviceName + '.log';

        const runningInstance = this.applicationStatus.runningServicesProcesses.get(serviceName);

        //bring down the service
        Util.spawnSync('docker stop ' + serviceName);

        runningInstance.kill();
        // removing the running images
        this.applicationStatus.runningImages.delete(serviceName);

        //removing the process from the map
        this.applicationStatus.runningServicesProcesses.delete(serviceName);

        // setting the image to inactive
        const imageIdx = this.applicationStatus.commands.cmd.findIndex((c) => c.serviceName === serviceName);
        this.applicationStatus.commands.cmd[imageIdx].active = false;

        setTimeout(() => fs.appendFileSync(fileLogName, 'PROCESS TERMINATED'), 0);
    }

    tailLogs(serviceName: string, socket: Socket, fullLogs = false): void {
        const fileLogName = this.applicationStatus.config.dockerLogsFolder + serviceName + '.log';
        let tail;
        var options = { separator: /[\r]{0,1}\n/, fromBeginning: fullLogs, fsWatchOptions: {}, follow: true, useWatchFile: true }

        try {
            tail = new Tail(fileLogName, options);
            this.applicationStatus.runningTails.set(socket.id, { tail: tail, isFull: fullLogs });
        } catch (e) {
            console.log(e);
        }

        tail.on('line', (chunk) => {
            if (chunk) {
                socket.emit('log-stream', chunk);
            }
        });

        tail.on('error', (err) => {
            console.log(err);
        });
    }

    streamFullLogs(serviceName: string, socket: Socket): void {
        this.tailLogs(serviceName, socket, true);
    }
}
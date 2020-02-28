import * as fs from 'fs';
import { ApplicationStatus } from "../models/application-status";
import { Util } from '../util/util';
import { io } from './../app';
const Tail = require('tail').Tail;
export class ActionService {

    constructor(private applicationStatus: ApplicationStatus) { }

    spinUpImages(actions): Promise<any> {
        return new Promise(resolve => {
            const selectedActions = Array.isArray(Object.values(actions)[0]) ? Object.values(actions)[0] : Object.values(actions);

            const commandsToPerform = [];

            let errorPromises: Promise<Map<string, string>>[] = [];

            //@ts-ignore
            selectedActions.forEach(a => {
                commandsToPerform.push(this.applicationStatus.config.commandsList.get(a));
            });

            commandsToPerform.forEach((c) => {
                const serviceName = c.slice(c.lastIndexOf(' ') + 1);
                const fileLogName = this.applicationStatus.config.dockerLogsFolder + serviceName;
                const runningServiceProcess = Util.spawn(c);

                Util.tailLogsToFile(fileLogName, runningServiceProcess);

                //prepare a promise for the error to be displayed
                let errorPromise = new Promise(res => {
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

                //@ts-ignore
                errorPromises.push(errorPromise);

                //saving the process into a map, we can kill the process on altImages
                this.applicationStatus.runningServicesProcesses.set(serviceName, runningServiceProcess);

                // we set the terminal id and the name of the running service associated with the terminal
                this.applicationStatus.runningImages.add(serviceName);
            });

            // set the services to be active for the UI
            this.applicationStatus.commands.cmd.forEach(c => {
                this.applicationStatus.runningImages.forEach((value) => {
                    if (c.serviceName === value) {
                        c.active = true;

                    }
                    resolve();
                    //@TODO improve this bit, until then commented out
                    //performing a docker ps on the specific instance to check if it actually got started
                    // const psOutput: string = Util.executeBashCommand('docker ps --filter name=' + c.serviceName);
                    // let psOutputArray: string[] = psOutput.split(" ");
                    // psOutputArray = psOutputArray.filter(out => out.trim() === c.serviceName);
                    //
                    // if (c.serviceName === value && psOutputArray.length === 1) {
                    //     c.active = true;
                    //     c.errorMessage = null;
                    //     resolve();
                    // } else if (c.serviceName === value) {
                    //     Promise.all(errorPromises)
                    //         .then(array => {
                    //             c.active = false;
                    //             array.forEach(el => {
                    //                 let err = el ? el.get(c.serviceName) : null;
                    //                 if (err) {
                    //                     c.errorMessage = err;
                    //                 }
                    //             });
                    //             resolve();
                    //         })
                    //         .catch(err => console.log(err))
                    // }
                });

            });
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


    tailLogs(serviceName: string, fullLogs = false):void {

        const fileLogName = this.applicationStatus.config.dockerLogsFolder + serviceName + '.log';
        let tail;
        var options = { separator: /[\r]{0,1}\n/, fromBeginning: fullLogs, fsWatchOptions: {}, follow: true, logger: console, useWatchFile: true }


        try {
            tail = new Tail(fileLogName, options);
        } catch (e) {
            console.log(e);
        }


        tail.on('line', (chunk) => {
            if (chunk) {
                setTimeout(() => io.emit('log-stream', chunk), 100);
            }
        });
        tail.on('error', (err) => {
            console.log(err);
        });

    }

    streamFullLogs(serviceName: string):void {
        this.tailLogs(serviceName, true);
    }
}
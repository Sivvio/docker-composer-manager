import * as fs from 'fs';
import {ApplicationStatus} from "../models/application-status";
import { Util } from '../util/util';


export class ActionService {

    constructor(private applicationStatus: ApplicationStatus){}

    spinUpImages(actions) {
        const selectedActions = Array.isArray(Object.values(actions)[0])? Object.values(actions)[0] : Object.values(actions);

        const commandsToPerform = [];

        //@ts-ignore
        selectedActions.forEach(a => {
            commandsToPerform.push(this.applicationStatus.config.commandsList.get(a));
        });

        commandsToPerform.forEach((c) => {
            const serviceName = c.slice(c.lastIndexOf(' ') + 1);
<<<<<<< HEAD
            const fileLogName = this.applicationStatus.config.logsFolder + serviceName + '.log';
            const logStream = fs.createWriteStream(fileLogName, { flags: 'a' });

            const runningServiceProcess = Util.spawn(c);

            runningServiceProcess.stdout.pipe(logStream); //attaching the output of the child console to a file
=======
            const fileLogName = this.applicationStatus.config.dockerLogsFolder + serviceName;
            const runningServiceProcess = Util.spawn(c);

            Util.tailLogsToFile(fileLogName, runningServiceProcess);
>>>>>>> got rid of katsu part

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
            });
        });

    }

    altImages(serviceName): void {

<<<<<<< HEAD
        const fileLogName = this.applicationStatus.config.logsFolder + serviceName + '.log';
=======
        const fileLogName = this.applicationStatus.config.dockerLogsFolder + serviceName + '.log';
>>>>>>> got rid of katsu part

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
<<<<<<< HEAD

    runScript(scriptName: string, args?: string[] ): boolean {
        
        const matchedScriptFile = this.applicationStatus.scriptsNames.find((s) => s === scriptName);

        if(matchedScriptFile) {
            const scriptProc = Util.execFile(`${this.applicationStatus.config.scriptsFolder}/${scriptName}`, args);

            scriptProc.stdout.on('data', (data) => {
                console.log(data.toString());
            });
            
            scriptProc.stderr.on('data', (err) => {
                console.log(err.toString());
            });
            
            scriptProc.on('close', (code) => {
                console.log(code);
                console.log("close");
            });
            return true;
        }
        return false;
    }
=======
>>>>>>> got rid of katsu part
}
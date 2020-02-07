import {Config} from "./config";
import { ActiveService } from "./active-service";

export class ApplicationStatus {
    config: Config = new Config();
    commands: {cmd: ActiveService[]} = {cmd: new Array<ActiveService>()};
    runningServicesProcesses: Map<string, any> = new Map<string, any>();
    runningImages: Set<string> = new Set<string>();
<<<<<<< HEAD
    scriptsNames: Array<string> = new Array<string>();
=======
>>>>>>> got rid of katsu part
}
import {Config} from "./config";
import { ActiveService } from "./active-service";
import * as process from 'child_process';

export class ApplicationStatus {
    config: Config = new Config();
    commands: {cmd: ActiveService[]} = {cmd: new Array<ActiveService>()};
    runningServicesProcesses: Map<string, any> = new Map<string, process.ChildProcess>();
    runningImages: Set<string> = new Set<string>();
}
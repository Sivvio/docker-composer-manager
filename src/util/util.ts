import * as process from 'child_process';
import * as fs from 'fs';

export class Util{
    /**
     * Executes the command passed and returns the result as a string
     * @param {string} command
     */
    static executeBashCommand(command): string {
        const result = process.execSync(command);
        return result.toString();
    }

    static spawn(command: string): process.ChildProcess {
       return process.spawn(command, {
            shell: true
        });
    }

    static spawnWithOpts(command: string, opts): process.ChildProcess {
        return process.spawn(command, opts);
    }

    static spawnSync(command: string): process.SpawnSyncReturns<Buffer> {
        return process.spawnSync(command, {
             shell: true
         });
     }

     static execFile(fileName: string, args?: string[]): process.ChildProcess {
        console.debug(`Running script: ${fileName}, with args: ${args}`)
        return process.execFile(fileName, args);
     }

     static tailLogsToFile(fileName: string, process: process.ChildProcess ) {
        const fileLogName = fileName + '.log';
        const logStream = fs.createWriteStream(fileLogName, { flags: 'a' });
        process.stdout.pipe(logStream); //attaching the output of the child console to a file
     }
}
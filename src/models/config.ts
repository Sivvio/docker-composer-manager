export class Config {
    readonly dockerComposeFolder = __dirname + '/../../config/docker-compose/';
<<<<<<< HEAD
    readonly scriptsFolder = process.env['SCRIPT_FOLDER'] || __dirname + '/../../config/scripts/';
    readonly tempFolder = __dirname + '/../../~tmp/';
    readonly logsFolder = this.tempFolder + '/logs/';
=======
    readonly tempFolder = __dirname + '/../../~tmp-docker/';
    readonly dockerLogsFolder = this.tempFolder + '/logs/';

>>>>>>> got rid of katsu part
    commandsList: Map<string, string>;
    environmentVariables: string;
}
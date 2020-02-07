export class Config {
    readonly dockerComposeFolder = __dirname + '/../../config/docker-compose/';
    readonly tempFolder = __dirname + '/../../~tmp-docker/';
    readonly dockerLogsFolder = this.tempFolder + '/logs/';

    commandsList: Map<string, string>;
    environmentVariables: string;
}
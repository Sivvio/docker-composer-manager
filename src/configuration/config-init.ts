import * as fs from 'fs-extra';
import {ApplicationStatus} from "../models/application-status";
import * as dotenv from 'dotenv';
import {Util} from '../util/util';


export class ConfigInit {

    constructor(private applicationStatus: ApplicationStatus) {
        this.init();
    }

    init(): void {
        // prepare the temp folder for the new yml files
        if (fs.existsSync(this.applicationStatus.config.tempFolder)) {
            fs.removeSync(this.applicationStatus.config.tempFolder);
        }
        fs.mkdirSync(this.applicationStatus.config.tempFolder);

        this.applicationStatus.config.environmentVariables = this.buildConfigVariables();
        this.createTempDockerFiles();
        this.applicationStatus.config.commandsList = this.createDockerCommand();
    }

    /**
     * reads the variables from the env file and adds dynamic ones too
     */
    buildConfigVariables(): any {
        const env = dotenv.config().parsed;
        env['HOSTNAME'] = Util.executeBashCommand('hostname').replace('\n', '');
        env['LOCAL_DOCKER_HOST'] = Util.executeBashCommand('hostname -I | awk \'{print $1}\'').replace('\n', '');
        return env;
    }

    createTempDockerFiles(): void {
        setTimeout(() => fs.mkdirSync(this.applicationStatus.config.dockerLogsFolder), 0); //creating the logs folder

        const files = fs.readdirSync(this.applicationStatus.config.dockerComposeFolder);

        files.forEach((file) => {
            let contents = fs.readFileSync(this.applicationStatus.config.dockerComposeFolder + file, 'utf8');

            // filtering the good part of the file to be used
            contents = contents.split('\n');
            contents = contents
                .filter(c => !c.includes('#'));

            const envArray = Object.entries(this.applicationStatus.config.environmentVariables);
            envArray.forEach(a => {
                contents = contents.map(line => line.replace('${' + a[0] + '}', a[1])); //formatting the yaml file

                fs.writeFileSync(this.applicationStatus.config.tempFolder + file, contents.join('\n'), (err) => {
                    if (err) throw err;
                });
            });
        });
    }

    createDockerCommand(): Map<string, string> {
        const commandListSet = new Set<string>();
        const commandList = new Map<string, string>();
        const files = fs.readdirSync(this.applicationStatus.config.tempFolder);

        files.forEach((file) => {
            let contents = fs.readFileSync(this.applicationStatus.config.tempFolder + file, 'utf8');

            // extracting the names from the docker compose file and creating the command
            contents = contents.split("\n");
            contents = contents
                .filter(c => c.includes('container_name'))
                .map(c => c.slice(c.search(':') + 1, c.length).replace('"', '').trim())
                .map(c => 'docker-compose -f ' + this.applicationStatus.config.tempFolder + file + ' up ' + c);

            // delete duplicates
            contents.forEach((c) => commandListSet.add(c));

            // create a map with key the name of the command and value the command itself
            commandListSet.forEach(c => commandList.set(c.slice(c.lastIndexOf(' ') + 1), c));
        });
        console.log(commandList);

        // pushing the commands list to the status class
        commandList.forEach((value, key) => this.applicationStatus.commands.cmd.push({serviceName: key, active: false}));
        
        return commandList;
    }
}
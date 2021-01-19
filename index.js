const fs = require('fs')
const core = require('@actions/core')
const github = require('@actions/github')
const exec = require('@actions/exec')

async function main() {
    try {
        const destination = core.getInput('destination')
        // check if destination exists
        if (fs.existsSync(destination)) {
            // get destination repo url
            let url = '';
            let error = '';
            let exitCode = 0;

            const options = {};
            options.listeners = {
                stdout: (data) => {
                    url += data.toString().trim();
                },
                stderr: (data) => {
                    error += data.toString();
                }
            };
            options.cwd = destination;

            await exec.exec('git config --local --get remote.origin.url', undefined, options)

            if (error) core.setFailed(error)

            // mirror only if identical git repo
            if (url===github.context.payload.repository.url) {
                try {
                    exitCode = await exec.exec('robocopy.exe', ['.', destination, '/MIR'])
                } catch (error) {
                    if (exitCode >= 8) {
                        core.setFailed(error.message)
                    }
                }
                console.log('MIRRORED')
            } else {
                console.dir({
                    src: github.context.payload.repository.url,
                    dest: url
                })
                core.setFailed('INVALID DESTINATION')
            }
        } else {
            // just copy over
            await exec.exec('robocopy.exe', ['.', destination, '/E'])
            console.log('COPY OVER')
        }
        core.setOutput("dest", destination)
        const payload = JSON.stringify(github.context, undefined, 2)
        console.log(`The event payload: ${payload}`);
    } catch(error) {
        core.setFailed(error.message)
    }
}

main()
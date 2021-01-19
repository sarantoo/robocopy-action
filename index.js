const fs = require('fs')
const core = require('@actions/core')
const github = require('@actions/github')
const exec = require('@actions/exec')

async function execWithOutput(cmd, args, cwd) {
    const options = {}
    const result = { output: '', error: '' }
    options.listeners = {
        stdout: (data) => { result.output += data.toString() },
        stderr: (err) => { result.error += err.toString() },
    }
    if (cwd) options.cwd = cwd
    try {
        result.exitCode = await exec.exec(cmd, args, options)
    } catch (error) {
        if (/robocopy/i.test(cmd) && result.exitCode < 8) {
            // suppress error if robocopy exit with code < 8
            console.log('HEY')
        } else {
            throw new Error(`${error.message} ${result.error}`)
        }
    }
    return result
}

async function main() {
    try {
        const destination = core.getInput('destination')
        // check if destination exists
        if (fs.existsSync(destination)) {
            // get local repo url
            let src = await execWithOutput('git config --local --get remote.origin.url')

            // get destination repo url
            let dst = await execWithOutput('git config --local --get remote.origin.url', undefined, destination)
            let url = dst.output.trim()
            console.log("DESTINATION REPO", url)

            // mirror only if identical git repo
            if (src.output.trim() === dst.output.trim()) {
                // and working tree is clean
                let result = await execWithOutput('git status --short', undefined, destination)

                if (result.output.trim() === '') {
                    result = await execWithOutput('robocopy.exe', ['.', destination, '/MIR'])
                    console.log('MIRRORED')
                } else {
                    console.log(result.output)
                    core.setFailed('DESTINATION DIRTY')
                }
            } else {
                console.dir({
                    src: github.context.payload.repository.url,
                    dest: url
                })
                core.setFailed('INVALID DESTINATION')
            }
        } else {
            // just copy over
            await execWithOutput('robocopy.exe', ['.', destination, '/E'])
            // await exec.exec('robocopy.exe', ['.', destination, '/E'])
            console.log('COPY OVER')
        }
        core.setOutput("dest", destination)
        const payload = JSON.stringify(github.context.payload, undefined, 2)
        console.log(`The event payload: ${payload}`);
    } catch(error) {
        core.setFailed(error.message)
    }
}

main()
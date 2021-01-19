const fs = require('fs')
const core = require('@actions/core')
const exec = require('@actions/exec')
const isEmpty = require('empty-dir')

async function execWithOutput(cmd, args, cwd) {
    const options = {}
    const result = { output: '', error: '' }
    options.listeners = {
        stdout: (data) => { result.output += data.toString() },
        stderr: (err) => { result.error += err.toString() },
    }
    if (cwd) options.cwd = cwd
    try {
        await exec.exec(cmd, args, options)
    } catch (error) {
        console.log('ERROR CAPTURED', error)
        // we did't get exit code here as it was intercepted by node
        // manually extract exit code from error.message
        let exitCode = error.message.match(/exit code (\d+)/i)[1]
        // suppress error if robocopy exit with code < 8
        if (/robocopy/i.test(cmd) && Number(exitCode) < 8) {
            console.log('ROBOCOPY EXIT CODE', exitCode)
        } else {
            throw new Error(error.message)
        }
    }
    return result
}

async function main() {
    try {
        const destination = core.getInput('destination')
        // check if destination exists and not empty
        if (fs.existsSync(destination) && !isEmpty(destination)) {
            // get local repo url
            let src = await execWithOutput('git config --local --get remote.origin.url')

            // get destination repo url
            let dst = await execWithOutput('git config --local --get remote.origin.url', undefined, destination)
            let url = dst.output.trim()
            console.log("DESTINATION REPO", url)

            // mirror only if identical git repo
            if (src.output.trim() === dst.output.trim()) {
                // and working tree is clean
                let result = await execWithOutput('git diff', undefined, destination)

                if (result.output.trim() === '') {
                    result = await execWithOutput('robocopy.exe', ['.', destination, '/MIR'])
                    console.log('MIRRORED')
                } else {
                    console.log(result.output)
                    core.setFailed('DESTINATION DIRTY')
                }
            } else {
                console.dir({
                    src: src.output,
                    dest: url
                })
                core.setFailed('INVALID DESTINATION')
            }
        } else {
            // just copy over
            await execWithOutput('robocopy.exe', ['.', destination, '/E'])
            console.log('DIRECTORY CREATED')
        }
    } catch(error) {
        core.setFailed(error.message)
    }
}

main()
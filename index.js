const core = require('@actions/core')
const github = require('@actions/github')

async function main() {
    try {
        const destination = core.getInput('destination')
        core.setOutput("dest", destination)
        const payload = JSON.stringify(github.context.payload, undefined, 2)
        console.log(`The event payload: ${payload}`);
    } catch(error) {
        core.setFailed(error.message)
    }
}

main()
import { execa } from 'execa';
async function testClaude() {
    const prompt = "Write a python script that prints 'Hello Singularity'. Output ONLY the code, no markdown.";
    console.log("Starting Claude CLI test...");
    console.log(`Prompt: "${prompt}"`);
    try {
        const { stdout, stderr, exitCode } = await execa('claude', ['-p', prompt], {
            input: '',
            reject: false
        });
        console.log("\n--- EXECUTION RESULT ---");
        console.log(`Exit Code: ${exitCode}`);
        console.log("\n--- STDOUT ---");
        console.log(stdout);
        if (stderr) {
            console.log("\n--- STDERR ---");
            console.log(stderr);
        }
    }
    catch (error) {
        console.error("Failed to execute Claude CLI:");
        console.error(error);
    }
}
testClaude();

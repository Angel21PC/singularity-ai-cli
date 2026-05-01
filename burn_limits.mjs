import { execa } from 'execa';

async function burn() {
  const promises = [];
  for(let i = 0; i < 20; i++) {
    console.log(`Starting request ${i}`);
    promises.push(
      execa('claude', ['-p', `Write an extremely long essay about the history of the universe. Request ${Math.random()}`, '--permission-mode', 'dontAsk'], { reject: false })
    );
  }
  const results = await Promise.all(promises);
  for(let r of results) {
    const text = r.stdout || r.stderr;
    if(text.toLowerCase().includes('limit')) {
      console.log('LIMIT DETECTED!');
      console.log(text);
      return;
    }
  }
  console.log("No limit hit yet. Rerunning...");
  burn();
}

burn();

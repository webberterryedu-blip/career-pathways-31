// Credential checker - helps identify which password is correct
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('🔐 CREDENTIAL CHECKER 🔐\n');

const testCredentials = [
  { email: 'frankwebber33@hotmail.com', password: '13a21r15' },
  { email: 'frankwebber33@hotmail.com', password: 'senha123' }
];

function askForPassword(index) {
  if (index >= testCredentials.length) {
    console.log('\n✅ All credentials checked!');
    console.log('Use the one that worked for logging in.');
    rl.close();
    return;
  }

  const creds = testCredentials[index];
  console.log(`\nTesting: ${creds.email}`);
  
  rl.question(`Enter password (or press Enter to skip): `, (password) => {
    if (password.trim() === '') {
      console.log('Skipped.');
      askForPassword(index + 1);
      return;
    }

    if (password === creds.password) {
      console.log('✅ CORRECT! This is the working password.');
    } else {
      console.log('❌ INCORRECT. This password does not work.');
    }

    // Ask if they want to test the next credential
    rl.question('\nTest next credential? (y/n): ', (answer) => {
      if (answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes') {
        askForPassword(index + 1);
      } else {
        console.log('\n✅ Credential checking complete!');
        console.log('Use the password that worked for logging in.');
        rl.close();
      }
    });
  });
}

console.log('We know these credentials exist:');
testCredentials.forEach((creds, index) => {
  console.log(`${index + 1}. ${creds.email} with password: ${creds.password}`);
});

console.log('\nLet\'s check which one works for you:');
askForPassword(0);
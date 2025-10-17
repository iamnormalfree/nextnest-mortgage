const RATES = { FIXED: 1.0, VARIABLE: 0.7, SELF_EMPLOYED: 0.7, RENTAL: 0.7, MIXED: 0.85 };

function calc(income, type = 'fixed', variable = 0, rental = 0) {
  if (!type) return Math.floor(income);
  switch (type) {
    case 'fixed': return Math.floor(income * RATES.FIXED);
    case 'variable': return Math.floor(income * RATES.VARIABLE);
    case 'self_employed': return Math.floor(income * RATES.SELF_EMPLOYED);
    case 'rental': return Math.floor(income * RATES.RENTAL);
    case 'mixed':
      const fixed = income - variable - rental;
      return Math.floor(fixed * RATES.FIXED + variable * RATES.VARIABLE + rental * RATES.RENTAL);
    default: return Math.floor(income);
  }
}

console.log('MAS 645 Income Recognition Tests
');
let passed = 0;

function test(name, actual, expected) {
  if (actual === expected) {
    console.log('OK: ' + name + ' = ' + actual);
    passed++;
  } else {
    console.log('FAIL: ' + name + ' (expected ' + expected + ', got ' + actual + ')');
    process.exit(1);
  }
}

test('Fixed 100%', calc(10000, 'fixed'), 10000);
test('Self-employed 70%', calc(10000, 'self_employed'), 7000);
test('Variable 70%', calc(8000, 'variable'), 5600);
test('Rental 70%', calc(5000, 'rental'), 3500);
test('Mixed', calc(10000, 'mixed', 3000, 0), 9100);
test('Rounding', calc(10001, 'self_employed'), 7000);
test('Default', calc(10000), 10000);

console.log('
All ' + passed + ' tests PASSED!');

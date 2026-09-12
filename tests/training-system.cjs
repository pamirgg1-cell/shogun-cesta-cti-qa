const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');

const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
const source = html.match(/<script id="training-final">([\s\S]*?)<\/script>/)[1];
let persisted = '';

function makeContext(savedState) {
  const list = {innerHTML: ''};
  const context = vm.createContext({
    state: savedState || {
      level: 1, gold: 1_000_000,
      attrs: {Strength: 5, Dexterity: 5, Defense: 5, Skill: 5, Charisma: 5},
      training039a11: {total: 0, byStat: {}}
    },
    document: {getElementById: id => id === 'trainingList' ? list : null},
    window: {},
    attrNames: {Strength: 'Sila', Dexterity: 'Obratnosť', Defense: 'Obrana', Skill: 'Zručnosť', Charisma: 'Charizma'},
    toast: () => {},
    telemetry039a02: () => ({training: 0}),
    saveGame: () => { persisted = JSON.stringify(context.state); return true; },
    render: () => {},
    trainingLedger039a11() {
      context.state.training039a11 = context.state.training039a11 || {total: 0, byStat: {}};
      return context.state.training039a11;
    }
  });
  vm.runInContext(source, context);
  return {context, list};
}

let {context, list} = makeContext();
assert.equal(context.trainingCostFinal('Strength'), 450);
assert.equal(context.trainingCostFinal('Dexterity'), 450);

const strengthCosts = [];
for (let i = 0; i < 5; i++) {
  strengthCosts.push(context.trainingCostFinal('Strength'));
  assert.equal(context.trainFinal('Strength'), true);
}
assert.deepEqual(strengthCosts, [450, 675, 1013, 1520, 2280]);
assert.equal(context.state.attrs.Strength, 10);
assert.equal(context.trainingCostFinal('Strength'), 3420);
assert.equal(context.trainingCostFinal('Dexterity'), 450, 'each attribute keeps an independent price');

context.state.level = 1;
assert.equal(context.trainFinal('Defense'), true, 'training works below the retired cap');
context.state.level = 999;
assert.equal(context.trainFinal('Dexterity'), true, 'training works above the retired cap');
assert.equal(context.trainingCap(), Infinity);
assert.equal(context.renderTrainingFinal(), true);
assert.match(list.innerHTML, /TRÉNING BEZ LIMITU ÚROVNE/);
assert.match(list.innerHTML, /3\s420/);

({context, list} = makeContext(JSON.parse(persisted)));
assert.equal(context.trainingCostFinal('Strength'), 3420, 'price survives save/load');
assert.equal(context.trainingCostFinal('Dexterity'), 675, 'second attribute persists independently');
assert.equal(context.renderTrainingFinal(), true);
assert.match(list.innerHTML, /TRÉNING BEZ LIMITU ÚROVNE/);

console.log('PASS: final training has independent +50% prices, no level cap, and persistent save/load state');

import { generateTypes } from '../src/lib/generator';

const testJson = {
  "contributes": {
    "commands": [
      {
        "command": "json2type.initialize",
        "title": "Initialize JSON2Type"
      },
      {
        "command": "json2type.convertJsonToType",
        "title": "Convert JSON to Type"
      }
    ]
  }
};

console.log('Without extractObjects:');
console.log(generateTypes(testJson, { extractObjects: false }));
console.log('\n---\n');
console.log('With extractObjects:');
console.log(generateTypes(testJson, { extractObjects: true }));
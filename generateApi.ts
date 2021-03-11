const prettier = require('prettier');
const { codegen } = require('./src');
const colors = require('colors');
const fs = require('fs');
const diff = require('diff');
const { exec } = require('child_process');
const axios = require('axios');

function getApiJson() {
  console.log('Retrieving api swagger.json from devapi.mer.gg...');
  return axios.get('https://devapi.mer.gg/v2/api-docs').then(res => res.data);
}

async function generateClientSideApi() {
  codegen({
    methodNameMode: 'summary',
    source: await getApiJson(),
    useCustomerRequestInstance: false,
    outputDir: './api2',
    multipleFileMode: true,
    useClassTransformer: false,
    useStaticMethod: true,
    serviceNameSuffix: '',
    extendGenericType: [],
    extendDefinitionFile: undefined,
    strictNullChecks: true,
    modelMode: 'interface',
  });

  exec('npm run lint-api', (err, stdout, stderr) => {
    console.log('Ran eslint\n');
    console.log('Api was generated in ./api2/');
    console.log('Types declaration generated in ./swagger.d.ts');
    console.log(
      '\nCopy over the contents of ./api2/ into mergg-react-native-refactored/src/api2',
    );
    console.log(
      'Replace the current swagger.d.ts in there with the newly generated one as well\n',
    );
  });
}

generateClientSideApi();

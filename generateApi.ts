const prettier = require('prettier');
const { codegen } = require('./src');
const colors = require('colors');
const fs = require('fs');
const diff = require('diff');
const { exec } = require('child_process');
const axios = require('axios');

function getApiJson() {
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
    console.log('Ran eslint:', stdout);
  });
}

generateClientSideApi();

const prettier = require('prettier');
const { codegen } = require('./src');

const PRETTIER_CONFIG = {
  bracketSpacing: true,
  jsxBracketSameLine: true,
  singleQuote: true,
  trailingComma: 'all',
  parser: 'typescript'
}

codegen({
  methodNameMode: 'summary',
  source: require('./swagger.json'),
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
  format: (text: string) => prettier.format(text, PRETTIER_CONFIG),
});

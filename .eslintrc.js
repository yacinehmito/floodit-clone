module.exports = {
  root: true,
  extends: ['prettier'],
  parserOptions: {
    ecmaVersion: '2016'
  },
  env: {
    browser: true
  },
  plugins: ['prettier'],
  rules: {
    'prettier/prettier': [
      'error',
      {
        singleQuote: true,
        semi: false,
        bracketSpacing: true
      }
    ]
  },
  globals: {}
}

module.exports = {
  tsconfig: {
    target: 'es2022',
    module: 'commonjs',
    lib: ['es2022'],
    types: ['jest', 'node', 'google-apps-script'],
    esModuleInterop: true,
    skipLibCheck: true
  }
};
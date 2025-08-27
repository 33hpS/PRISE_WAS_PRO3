module.exports = {
  root: true,
  env: { 
    browser: true, 
    es2020: true, 
    node: true 
  },
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:react-hooks/recommended',
    'plugin:react/recommended'
  ],
  ignorePatterns: [
    'dist', 'build', '.eslintrc.cjs', 'node_modules', 'coverage',
    '*.config.js', '*.config.ts', 'scripts', '.vscode'
  ],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
    ecmaFeatures: { jsx: true }
  },
  plugins: ['react-refresh', '@typescript-eslint', 'react-hooks', 'react'],
  settings: { react: { version: 'detect' } },
  rules: {
    // React правила
    'react-refresh/only-export-components': 'warn',
    'react/react-in-jsx-scope': 'off',
    'react/prop-types': 'off',
    'react/display-name': 'off',
    'react/no-unescaped-entities': 'off',
    'react/no-unknown-property': 'warn',
    
    // TypeScript - мягкие правила
    '@typescript-eslint/no-unused-vars': 'warn', // warn вместо error
    '@typescript-eslint/no-explicit-any': 'off',
    '@typescript-eslint/ban-ts-comment': 'off',
    
    // Общие правила - мягкие
    'no-console': 'off',
    'no-debugger': 'warn',
    'no-extra-semi': 'warn', // warn вместо error
    'no-useless-escape': 'warn', // warn вместо error
    
    // React Hooks - предупреждения
    'react-hooks/exhaustive-deps': 'warn'
  }
}

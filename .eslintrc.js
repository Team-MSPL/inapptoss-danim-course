module.exports = {
    root: true,
    extends: [
        '@react-native-community',
        'plugin:@typescript-eslint/recommended',
        'prettier',
        'plugin:prettier/recommended',
    ],
    plugins: ['@typescript-eslint', 'prettier'],
    rules: {
        // Prettier formatting 오류를 warning 으로만 처리 (실행 차단 X)
        'prettier/prettier': ['warn'],
    },
};
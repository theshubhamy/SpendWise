module.exports = {
  presets: ['module:@react-native/babel-preset'],
  plugins: [
    [
      'module-resolver',
      {
        root: ['./'],
        alias: {
          '@': './src',
          '@/components': './src/components',
          '@/screens': './src/screens',
          '@/services': './src/services',
          '@/store': './src/store',
          '@/navigation': './src/navigation',
          '@/utils': './src/utils',
          '@/constants': './src/constants',
          '@/types': './src/types',
          '@/theme': './src/theme',
          '@/context': './src/context',
          '@/database': './src/database',
        },
        extensions: [
          '.ios.ts',
          '.android.ts',
          '.ts',
          '.ios.tsx',
          '.android.tsx',
          '.tsx',
          '.jsx',
          '.js',
          '.json',
        ],
      },
    ],
  ],
};

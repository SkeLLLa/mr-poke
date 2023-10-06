module.exports = [
  '@semantic-release/git',
  {
    assets: ['deploy', 'docs', 'package.json', 'pnpm-lock.yaml'],
  },
];

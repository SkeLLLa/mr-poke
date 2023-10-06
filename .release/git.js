module.exports = [
  '@semantic-release/git',
  {
    assets: ['helm/chart', 'docs', 'package.json', 'pnpm-lock.yaml'],
  },
];

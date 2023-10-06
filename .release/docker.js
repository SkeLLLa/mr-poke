module.exports = [
  '@codedependant/semantic-release-docker',
  {
    // dockerTags: ['{{version}}', '{{major}}-latest'],
    dockerRegistry: 'ghcr.io',
    dockerProject: 'skellla',
    dockerLogin: false,
    dockerArgs: {
      RELEASE_DATE: new Date().toISOString(),
      RELEASE_VERSION: '{{next.version}}',
      GITHUB_TOKEN: null,
      NPM_TOKEN: null,
    },
  },
];

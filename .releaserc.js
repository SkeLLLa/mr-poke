module.exports = {
  branches: ['master', 'next'],
  plugins: [
    require('./.release/commit-analyzer'),
    require('./.release/release-notes'),
    require('./.release/changelog'),
    require('./.release/npm-change-version'),
    require('./.release/docker'),
    require('./.release/helm'),
    require('./.release/git-service-deploy'),
    require('./.release/github-release'),
  ],
};

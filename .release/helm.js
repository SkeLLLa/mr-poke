module.exports = [
  'semantic-release-helm3',
  {
    chartPath: './helm/chart',
    registry: `oci://ghcr.io/skellla/mr-poke`,
  },
];

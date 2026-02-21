const { withGradleProperties } = require('@expo/config-plugins');

const withKotlinVersion = (config) => {
  return withGradleProperties(config, (config) => {
    // Remove existing kotlinVersion if any
    config.modResults = config.modResults.filter(
      (item) => !(item.type === 'property' && item.key === 'kotlinVersion')
    );

    // Add the correct Kotlin version to match expo-modules-autolinking
    config.modResults.push({
      type: 'property',
      key: 'kotlinVersion',
      value: '2.1.20',
    });

    return config;
  });
};

module.exports = withKotlinVersion;

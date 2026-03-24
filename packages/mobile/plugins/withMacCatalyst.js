/**
 * Enables Mac Catalyst for the iOS app (run the same build on Mac).
 * After prebuild, open ios/*.xcworkspace in Xcode and choose "My Mac (Mac Catalyst)" as destination.
 *
 * @see https://developer.apple.com/mac-catalyst/
 */
const { withXcodeProject } = require("@expo/config-plugins");

/** @type {import('@expo/config-plugins').ConfigPlugin} */
function withMacCatalyst(config) {
  return withXcodeProject(config, (config) => {
    const project = config.modResults;
    const configurations = project.pbxXCBuildConfigurationSection();

    for (const key in configurations) {
      const section = configurations[key];
      if (typeof section !== "object" || !section.buildSettings) continue;
      const bs = section.buildSettings;

      const plist = bs.INFOPLIST_FILE;
      if (!plist || String(plist).includes("Pods")) continue;
      if (!bs.PRODUCT_BUNDLE_IDENTIFIER) continue;
      if (bs.TEST_TARGET_NAME || bs.BUNDLE_LOADER) continue;

      bs.SUPPORTS_MACCATALYST = "YES";
    }

    return config;
  });
}

module.exports = withMacCatalyst;

/**
 * Patches .xcode.env so --no-experimental-strip-types is only set on Node >= 22.
 * EAS Build uses Node 20 where this flag is unrecognised, causing the
 * "Bundle React Native code and images" script phase to crash.
 */
const { withDangerousMod } = require("@expo/config-plugins");
const fs = require("fs");
const path = require("path");

/** @type {import('@expo/config-plugins').ConfigPlugin} */
function withSafeNodeOptions(config) {
  return withDangerousMod(config, [
    "ios",
    (config) => {
      const iosDir = path.join(config.modRequest.platformProjectRoot);
      const envFile = path.join(iosDir, ".xcode.env");

      if (fs.existsSync(envFile)) {
        let contents = fs.readFileSync(envFile, "utf8");

        const unsafePattern =
          /^export NODE_OPTIONS=.*--no-experimental-strip-types.*$/m;

        if (unsafePattern.test(contents)) {
          contents = contents.replace(
            unsafePattern,
            [
              '# Guard --no-experimental-strip-types for Node < 22 (EAS uses Node 20)',
              'NODE_MAJOR=$("$NODE_BINARY" -e "process.stdout.write(String(process.versions.node.split(\'.\')[0]))" 2>/dev/null || echo "0")',
              'if [ "$NODE_MAJOR" -ge 22 ] 2>/dev/null; then',
              '  export NODE_OPTIONS="${NODE_OPTIONS:-} --no-experimental-strip-types"',
              'fi',
            ].join("\n")
          );
          fs.writeFileSync(envFile, contents, "utf8");
        }
      }

      return config;
    },
  ]);
}

module.exports = withSafeNodeOptions;

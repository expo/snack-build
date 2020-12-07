const { buildAsync } = require("../dist/SnackBuild");

const sdkVersion = "39.0.0";
const manifest = {
  name: "snack-build-test",
  slug: "FILL-IN-SLUG-HERE",
  sdkVersion,
};

const sessionSecret = `FILL-IN-SESSIONSECRET-HERE`;

async function main() {
  console.log("Building...");
  try {
    const url = await buildAsync(manifest, {
      platform: "android",
      mode: "create",
      isSnack: true,
      sdkVersion,
      sessionSecret,
    });
    console.log("Build complete, url:", url);
  } catch (err) {
    console.log("Build failed", err);
  }
}
main();

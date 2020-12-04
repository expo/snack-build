const { buildAsync } = require("../dist/SnackBuild");

const sdkVersion = "39.0.0";
const manifest = {
  name: "snack-build-test",
  slug: "amused-edamame",
  sdkVersion,
};

const sessionSecret = `{"id":"4dbe319e-a96a-457b-b04c-d82f0275048f","version":1,"expires_at":1893456000000}`;

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

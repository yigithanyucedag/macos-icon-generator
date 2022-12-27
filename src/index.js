const { prompt } = require("prompts");
const fs = require("fs");
const sharp = require("sharp");
const chalk = require("chalk");

chalk.level = 1;

const SIZES = [16, 32, 64, 128, 256, 512, 1024];

const log = console.log;
const info = chalk.bold.blue;
const error = chalk.bold.red;
const success = chalk.bold.green;
const gray = chalk.gray;

(async () => {
  log(
    info(
      "Welcome to the macOS app icon generator! This tool will help you generate all the required icons for your macOS app."
    )
  );

  // Ask the user for the main icon path (1024x1024)
  let { mainIconPath } = await prompt({
    type: "text",
    name: "mainIconPath",
    message: "Enter the path to the main icon (1024x1024)",
  });

  if (!mainIconPath) {
    log(error("You must enter a path!"));
    return;
  }

  // trim and remove quotes
  mainIconPath = mainIconPath.trim().replace(/['"]+/g, "");

  //check if the main icon file exists
  if (!fs.existsSync(mainIconPath)) {
    log(error("The main icon file does not exist!"));
    return;
  }

  // check if the main icon file is 1024x1024
  const { width, height } = await sharp(mainIconPath).metadata();
  if (width !== 1024 || height !== 1024) {
    log(error("The main icon file is not 1024x1024!"));
    return;
  }

  // Ask user which resolution to use (multiselect)
  const { resolutions } = await prompt({
    type: "multiselect",
    name: "resolutions",
    message: "Select the resolutions to generate",
    choices: SIZES.map((size) => ({
      title: `${size}x${size}`,
      value: size,
    })),
    hint: "- Space to select. Return to submit",
  });

  if (!resolutions.length) {
    log(error("You must select at least one resolution!"));
    return;
  }

  // Ask user for the output directory (default ./macos-icons)
  let { outputDir } = await prompt({
    type: "text",
    name: "outputDir",
    message: "Enter the output directory",
    initial: "./macos-icons",
  });

  // trim and remove quotes
  outputDir = outputDir.trim().replace(/['"]+/g, "");

  // check if the output directory exists and create it if it doesn't
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir);
  }

  // generate the icons
  for (const size of resolutions) {
    const outputFilePath = `${outputDir}/icon_${size}.png`;
    await sharp(mainIconPath).resize(size, size).toFile(outputFilePath);
    log(success(`Generated ${outputFilePath}`));
  }

  log(info("All done! 🎉"));
})();

process.on("exit", () => {
  log(gray("Thanks for using the macOS app icon generator 🙏"));
  process.exit(0);
});

#!/usr/bin/env node

const { prompt } = require("prompts");
const fs = require("fs");
const sharp = require("sharp");
const chalk = require("chalk");
const { program } = require("commander");

chalk.level = 1;

const SIZES = [16, 32, 64, 128, 256, 512, 1024];

const log = console.log;
const info = chalk.bold.blue;
const error = chalk.bold.red;
const success = chalk.bold.green;
const gray = chalk.gray;

program
  .argument('<mainIconPath>', 'Path to the main icon file')
  .option('-r, --rounded', 'Enable rounded corners for icons')
  .parse(process.argv);

const options = program.opts();
const mainIconPath = program.args[0];

(async () => {
  log(
    info(
      "Welcome to the macOS app icon generator! This tool will help you generate all the required icons for your macOS app."
    )
  );

  if (!mainIconPath) {
    log(
      error(
        "❗️ You must enter a path! Example: npx macos-icon-generator ./icon.png"
      )
    );
    return;
  }

  // Trim and remove quotes from the path
  const trimmedIconPath = mainIconPath.trim().replace(/['"]+/g, "");

  // Check if the main icon file exists
  if (!fs.existsSync(trimmedIconPath)) {
    log(error("❗️ The main icon file does not exist!"));
    return;
  }

  // Check if the main icon file is 1024x1024
  const { width, height } = await sharp(trimmedIconPath).metadata();
  if (width !== 1024 || height !== 1024) {
    log(error("❗️ The main icon file is not 1024x1024!"));
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
    log(error("❗️ You must select at least one resolution!"));
    return;
  }

  // Ask user for the output directory (default ./macos-icons)
  let { outputDir } = await prompt({
    type: "text",
    name: "outputDir",
    message: "Enter the output directory",
    initial: "./macos-icons",
  });

  // Trim and remove quotes from the path
  outputDir = outputDir.trim().replace(/['"]+/g, "");

  // Check if the output directory exists and create it if it doesn't
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir);
  }

  // Function to create a rounded corner mask
  const createRoundedMask = (size, radius) => {
    const svg = `
      <svg width="${size}" height="${size}">
        <rect x="0" y="0" width="${size}" height="${size}" rx="${radius}" ry="${radius}" fill="white"/>
      </svg>
    `;
    return Buffer.from(svg);
  };

  // Generate the icons
  for (const size of resolutions) {
    const outputFilePath = `${outputDir}/icon_${size}.png`;
    const sharpInstance = sharp(trimmedIconPath).resize(size, size);

    if (options.rounded) {
      const radius = size * 0.1; // Adjust the radius as needed
      const mask = createRoundedMask(size, radius);
      await sharpInstance.composite([{ input: mask, blend: "dest-in" }]).toFile(outputFilePath);
    } else {
      await sharpInstance.toFile(outputFilePath);
    }

    log(success(`Generated ${outputFilePath}`));
  }

  log(info("All done! 🎉"));
})();

process.on("exit", () => {
  log(
    gray(
      "⚠️ If you found this tool useful, please star it on GitHub: https://github.com/yigithanyucedag/macos-icon-generator"
    )
  );
  process.exit(0);
});

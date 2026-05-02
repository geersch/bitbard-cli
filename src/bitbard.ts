#!/usr/bin/env node
import { defineCommand, runMain } from "citty";
import pdf from "./commands/pdf/index.js";

const main = defineCommand({
  meta: {
    name: "bitbard",
    version: "1.0.0",
    description: "Bitbard CLI tool",
  },
  subCommands: {
    pdf,
  },
});

runMain(main);

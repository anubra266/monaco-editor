// import { Linter } from "eslint";
import config from "../config/eslint.json";

declare const self: any;

self.addEventListener("message", (event: MessageEvent) => {
  const { code, version } = event.data;

  try {
    console.log('nah')
    // const ESLint = new Linter();
    // const markers = ESLint.verify(code, config).map((err) => ({
      // const markers = linter.verify(code, config).map((err) => ({
      //   startLineNumber: err.line,
      //   endLineNumber: err.line,
      //   startColumn: err.column,
      //   endColumn: err.column,
      //   message: `${err.message} (${err.ruleId})`,
      //   severity: 3,
      //   source: "ESLint",
    // }));

    // self.postMessage({ markers, version });
  } catch (e) {
    /* Ignore error */
  }
});

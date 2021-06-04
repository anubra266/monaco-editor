import { Monaco } from "@monaco-editor/react";

/**
 * Use prettier to format JavaScript code.
 * This will replace the default formatter.
 */
export const registerPrettierFormat = (monaco: Monaco) => {
  monaco.languages.registerDocumentFormattingEditProvider("javascript", {
    async provideDocumentFormattingEdits(model: any) {
      const prettier = await import("prettier/standalone");
      const babel = await import("prettier/parser-babel");
      const text = prettier.format(model.getValue(), {
        parser: "babel",
        plugins: [babel],
        singleQuote: false,
      });

      return [
        {
          range: model.getFullModelRange(),
          text,
        },
      ];
    },
  });
};

/**
 *  Configure the typescript compiler to detect JSX and load type definitions
 */
export const registerCompilerOptions = (monaco: Monaco) => {
  const compilerOptions = {
    allowJs: true,
    allowSyntheticDefaultImports: true,
    alwaysStrict: true,
    jsx: "React" as any,
    allowNonTsExtensions: true,
    jsxFactory: "React.createElement",
  };

  monaco.languages.typescript.typescriptDefaults.setCompilerOptions(
    compilerOptions
  );
  monaco.languages.typescript.javascriptDefaults.setCompilerOptions(
    compilerOptions
  );
};

/**
 * Sync all the models to the worker eagerly.
 * This enables intelliSense for all files without needing an `addExtraLib` call.
 */
export const registerEagerModelSync = (monaco: Monaco) => {
  monaco.languages.typescript.typescriptDefaults.setEagerModelSync(true);
  monaco.languages.typescript.javascriptDefaults.setEagerModelSync(true);
};

/**
 * Disable typescript's diagnostics for JavaScript files.
 * This suppresses errors when using Typescript syntax.
 * It's also unnecessary since we use ESLint for error checking.
 */
export const registerValidation = (monaco: Monaco) => {
  monaco.languages.typescript.javascriptDefaults.setDiagnosticsOptions({
    noSemanticValidation: true,
    noSyntaxValidation: true,
  });
};

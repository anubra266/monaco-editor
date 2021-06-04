import { useMonaco } from "@monaco-editor/react";
import { IDisposable } from "monaco-editor";
import { useEffect } from "react";
import { fetchDependencies } from "../helpers/fetchDepencies";

/**
 * Intialize the type definitions worker
 * @param {new Worker} typingsWorker
 */
export const useRegisterTypings = (typingsWorker: Worker) => {
  const monaco = useMonaco();
  // Map to store our typings
  let extraLibs = new Map();

  const addTypings = ({ name, typings }) => {
    Object.keys(typings).forEach((path) => {
      const content = typings[path];
      // const declaration = `declare module '${name}' {${typings[path]}}`;
      const dirPath = `file:///node_modules/${name}.d.ts`;
      let extraLib: IDisposable = extraLibs.get(dirPath);
      extraLib && extraLib.dispose();
      extraLib = monaco.languages.typescript.javascriptDefaults.addExtraLib(
        content,
        dirPath
      );

      // // When resolving definitions and references, the editor will try to use created models.
      // // Creating a model for the library allows "peek definition/references" commands to work with the library.
      // const uri = monaco.Uri.parse(dirPath);
      // // displose model if it exists
      // const model = monaco.editor.getModel(uri);
      // if (model) model.dispose();
      // monaco.editor.createModel(content, "typescript", uri);

      extraLibs.set(dirPath, extraLib);
    });
  };

  useEffect(() => {
    if (typingsWorker && monaco) {
      typingsWorker.addEventListener("message", ({ data }: any) =>
        addTypings(data)
      );

      typingsWorker.onerror = function () {
        if (process.env.NODE_ENV !== "production") {
          console.log("There is an error with the typings worker!");
        }
      };

      fetchDependencies().then((dependencies) => {
        Object.entries(dependencies).forEach(([name, version]) => {
          typingsWorker.postMessage({
            name,
            version,
          });
        });
      });
    }
  }, [typingsWorker, monaco]);
};

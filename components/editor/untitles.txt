
const handleEditorDidMount: OnMount = (editor, monaco) => {
 
  
  // start linter worker
  const updateMarkers = ({ markers, version }: any) => {
    requestAnimationFrame(() => {
      const model = editor.getModel();

      if (model && model.getVersionId() === version) {
        monaco.editor.setModelMarkers(model, "eslint", markers);
      }
    });
  };

  linterWorker.addEventListener("message", ({ data }: any) =>
    updateMarkers(data)
  );

  // Lint code when it changes
  const model = editor.getModel();
  monaco.editor.setModelMarkers(model, "eslint", []);
  const code = editor.getValue();
  linterWorker.postMessage({
    code,
    version: model.getVersionId(),
  });
};









// declare const global: { MonacoEnvironment: Environment | undefined };
// type MonacoEnvironments = "json" | "typescript" | "javascript";


// global.MonacoEnvironment = {
//   getWorker(_moduleId: any, label: MonacoEnvironments) {
//     let MonacoWorker: any;

//     switch (label) {
//       case "json":
//         MonacoWorker = require("worker-loader!monaco-editor/esm/vs/language/json/json.worker");
//         break;
//       case "typescript":
//       case "javascript":
//         MonacoWorker = require("worker-loader!monaco-editor/esm/vs/language/typescript/ts.worker");
//         break;
//       default:
//         MonacoWorker = require("worker-loader!monaco-editor/esm/vs/editor/editor.worker");
//     }

//     return new MonacoWorker();
//   },
// };

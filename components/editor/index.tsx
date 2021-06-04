import MonacoEditor, { OnChange, OnMount } from "@monaco-editor/react";
import { useLintTypingsWorkers } from "./hooks/useLintTypingsWorkers'";
import {
  handleEditorValidation,
  registerCompilerOptions,
  registerValidation,
  registerEagerModelSync,
  registerPrettierFormat,
} from "./helpers";
import { useRegisterTypings } from "./hooks/useRegisterTypings";

export default function Editor() {
  const { linterWorker: _, typingsWorker } = useLintTypingsWorkers();
  useRegisterTypings(typingsWorker);

  const handleEditorDidMount: OnMount = (_editor, monaco) => {
    registerPrettierFormat(monaco);
    registerEagerModelSync(monaco);
    registerValidation(monaco);
    registerCompilerOptions(monaco);
  };

  const handleEditorChange: OnChange = (_value, _event) => {};

  return (
    <div style={{ height: "400px" }}>
      <MonacoEditor
        defaultValue={code}
        theme="vs-dark"
        language="javascript"
        path={`App.js`}
        onMount={handleEditorDidMount}
        onChange={handleEditorChange}
        onValidate={handleEditorValidation}
        // saveViewState
        options={{
          autoIndent: "full",
          wordWrap: "off",
          smoothScrolling: true,
          dragAndDrop: true,
          formatOnPaste: true,
          formatOnType: false,
        }}
      />
    </div>
  );
}

const code = `import React from "react";
import {} from "@chakra-ui/react";
import {} from "@chakra-ui/layout";

export default function App() {
  const [state] = React.useEffect("a");
  return (
    <div>
      {state}
      Wow React Rocks!
    </div>
  );
}
`;

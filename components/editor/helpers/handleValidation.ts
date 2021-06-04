import { OnValidate } from "@monaco-editor/react";

export const handleEditorValidation: OnValidate = (markers) => {
  // model markers
  markers.forEach((marker) => console.log("onValidate:", marker.message));
};

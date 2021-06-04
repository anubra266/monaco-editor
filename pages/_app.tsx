import { useEffect } from "react";
import "../styles/globals.css";
import type { AppProps } from "next/app";
import { IMonacoConfig } from "@fluentui/react-monaco-editor";

declare const window: Window &
  typeof globalThis & { MonacoConfig: IMonacoConfig };

function MyApp({ Component, pageProps }: AppProps) {

  return <Component {...pageProps} />;
}

export default MyApp;

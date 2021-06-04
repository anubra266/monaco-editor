import { useEffect, useState } from "react";

export const useLintTypingsWorkers = () => {
  const [linterWorker, setLinterWorker] = useState<Worker>();
  const [typingsWorker, setTypingsWorker] = useState<Worker>();

  useEffect(() => {
    setLinterWorker(
      new Worker(new URL("../workers/eslint.worker", import.meta.url))
    );
    setTypingsWorker(
      new Worker(new URL("../workers/typings.worker", import.meta.url))
    );

    return () => {
      linterWorker && linterWorker.terminate();
      typingsWorker && typingsWorker.terminate();
    };
  }, []);

  return { linterWorker, typingsWorker };
};

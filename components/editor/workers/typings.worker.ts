import path from "path";
// import { createStore, set as setItem, get as getItem } from "idb-keyval";
import { openDB } from "idb";

declare const self: WorkerGlobalScope & {
  ts: Record<string, any>;
} & typeof globalThis;

self.importScripts(
  "https://cdnjs.cloudflare.com/ajax/libs/typescript/4.1.2/typescript.min.js"
);

const ROOT_URL = `https://cdn.jsdelivr.net/`;

const typingsStore = openDB("monaco-editor", 1, {
  upgrade(db) {
    db.createObjectStore("typings");
  },
});

async function getItem(key: string) {
  return (await typingsStore).get("typings", key);
}

async function setItem(key: string, val: Record<string, any>) {
  return (await typingsStore).put("typings", val, key);
}

// const store = createStore("typescript-definitions-cache-v1", "keyval");
const fetchCache = new Map();

const doFetch = (url: any): Promise<string> => {
  const cached = fetchCache.get(url);

  if (cached) {
    return cached;
  }

  const promise = fetch(url)
    .then((response) => {
      if (response.status >= 200 && response.status < 300) {
        return Promise.resolve(response);
      }

      const error = new Error(
        response.statusText || response.status.toString()
      );

      return Promise.reject(error);
    })
    .then((response) => response.text());

  fetchCache.set(url, promise);

  return promise;
};

const fetchFromDefinitelyTyped = (
  dependency: string,
  _version: string,
  fetchedPaths: Record<string, any>
) =>
  doFetch(
    `${ROOT_URL}npm/@types/${dependency
      .replace("@", "")
      .replace(/\//g, "__")}/index.d.ts`
  ).then((typings) => {
    fetchedPaths[`node_modules/${dependency}/index.d.ts`] = typings;
  });

const getRequireStatements = (title: string, code: string) => {
  const requires = [];

  const sourceFile = self.ts.createSourceFile(
    title,
    code,
    self.ts.ScriptTarget.Latest,
    true,
    self.ts.ScriptKind.TS
  );

  self.ts.forEachChild(sourceFile, (node: any) => {
    switch (node.kind) {
      case self.ts.SyntaxKind.ImportDeclaration: {
        requires.push(node.moduleSpecifier.text);
        break;
      }
      case self.ts.SyntaxKind.ExportDeclaration: {
        // For syntax 'export ... from '...'''
        if (node.moduleSpecifier) {
          requires.push(node.moduleSpecifier.text);
        }
        break;
      }
      default: {
        /* */
      }
    }
  });

  return requires;
};

const tempTransformFiles = (files: Record<string, any>[]) => {
  const finalObj = {};

  files.forEach((d) => {
    finalObj[d.name] = d;
  });

  return finalObj;
};

const transformFiles = (dir: Record<string, any>) =>
  dir.files
    ? dir.files.reduce((prev: any, next: any) => {
        if (next.type === "file") {
          return { ...prev, [next.path]: next };
        }

        return { ...prev, ...transformFiles(next) };
      }, {})
    : {};

const getFileMetaData = (
  dependency: string,
  version: string,
  depPath: string
) =>
  doFetch(
    `https://data.jsdelivr.com/v1/package/npm/${dependency}@${version}/flat`
  )
    .then((response: string) => JSON.parse(response))
    .then((response: any) =>
      response.files.filter((f: any) => f.name.startsWith(depPath))
    )
    .then(tempTransformFiles);

const resolveAppropiateFile = (
  fileMetaData: Record<string, any>,
  relativePath: string
) => {
  const absolutePath = `/${relativePath}`;

  if (fileMetaData[`${absolutePath}.d.ts`]) return `${relativePath}.d.ts`;
  if (fileMetaData[`${absolutePath}.ts`]) return `${relativePath}.ts`;
  if (fileMetaData[absolutePath]) return relativePath;
  if (fileMetaData[`${absolutePath}/index.d.ts`])
    return `${relativePath}/index.d.ts`;

  return relativePath;
};

const getFileTypes = (
  depUrl: string,
  dependency: string,
  depPath: string,
  fetchedPaths: Record<string, any>,
  fileMetaData: Record<string, any>
) => {
  const virtualPath = path.join("node_modules", dependency, depPath);

  if (fetchedPaths[virtualPath]) return null;

  return doFetch(`${depUrl}/${depPath}`).then((typings) => {
    if (fetchedPaths[virtualPath]) return null;

    fetchedPaths[virtualPath] = typings;

    // Now find all require statements, so we can download those types too
    return Promise.all(
      getRequireStatements(depPath, typings)
        .filter(
          // Don't add global deps
          (dep) => dep.startsWith(".")
        )
        .map((relativePath) => path.join(path.dirname(depPath), relativePath))
        .map((relativePath) =>
          resolveAppropiateFile(fileMetaData, relativePath)
        )
        .map((nextDepPath) =>
          getFileTypes(
            depUrl,
            dependency,
            nextDepPath,
            fetchedPaths,
            fileMetaData
          )
        )
    );
  });
};

function fetchFromMeta(
  dependency: string,
  version: string,
  fetchedPaths: Record<string, any>
) {
  const depUrl = `https://data.jsdelivr.com/v1/package/npm/${dependency}@${version}/flat`;

  return doFetch(depUrl)
    .then((response) => JSON.parse(response))
    .then((meta) => {
      const filterAndFlatten = (files: Record<string, any>[], filter: RegExp) =>
        files.reduce((paths, file) => {
          if (filter.test(file.name)) {
            paths.push(file.name);
          }
          return paths;
        }, []);

      let dtsFiles = filterAndFlatten(meta.files, /\.d\.ts$/);
      if (dtsFiles.length === 0) {
        // if no .d.ts files found, fallback to .ts files
        dtsFiles = filterAndFlatten(meta.files, /\.ts$/);
      }

      if (dtsFiles.length === 0) {
        throw new Error(`No inline typings found for ${dependency}@${version}`);
      }

      dtsFiles.forEach((file: string) => {
        doFetch(`https://cdn.jsdelivr.net/npm/${dependency}@${version}${file}`)
          .then((dtsFile) => {
            fetchedPaths[`node_modules/${dependency}${file}`] = dtsFile;
          })
          .catch(() => {});
      });
    });
}

function fetchFromTypings(
  dependency: string,
  version: string,
  fetchedPaths: Record<string, any>
) {
  const depUrl = `${ROOT_URL}npm/${dependency}@${version}`;

  return doFetch(`${depUrl}/package.json`)
    .then((response) => JSON.parse(response))
    .then((packageJSON) => {
      const types = packageJSON.typings || packageJSON.types;
      if (types) {
        // Add package.json, since this defines where all types lie
        fetchedPaths[`node_modules/${dependency}/package.json`] =
          JSON.stringify(packageJSON);

        // get all files in the specified directory
        return getFileMetaData(
          dependency,
          version,
          path.join("/", path.dirname(types))
        ).then((fileData) =>
          getFileTypes(
            depUrl,
            dependency,
            resolveAppropiateFile(fileData, types),
            fetchedPaths,
            fileData
          )
        );
      }

      throw new Error(
        `No typings field in package.json for ${dependency}@${version}`
      );
    });
}

function fetchDefinitions(name: string, version: string) {
  if (!version) {
    return Promise.reject(new Error(`No version specified for ${name}`));
  }

  // Query cache for the defintions
  const key = `${name}@${version}`;

  return getItem(key)
    .catch((e) => {
      console.error("An error occurred when getting definitions from cache", e);
    })
    .then((result) => {
      if (result) {
        return result;
      }

      // If result is empty, fetch from remote
      const fetchedPaths = {};
      return fetchFromTypings(name, version, fetchedPaths)
        .catch(() =>
          // not available in package.json, try checking meta for inline .d.ts files
          fetchFromMeta(name, version, fetchedPaths)
        )
        .catch(() =>
          // Not available in package.json or inline from meta, try checking in @types/
          fetchFromDefinitelyTyped(name, version, fetchedPaths)
        )
        .then(() => {
          if (Object.keys(fetchedPaths).length) {
            // Also cache the definitions
            setItem(key, fetchedPaths);

            return fetchedPaths;
          } else {
            throw new Error(`Type definitions are empty for ${key}`);
          }
        });
    });
}

self.addEventListener("message", (event: MessageEvent) => {
  const { name, version } = event.data;

  fetchDefinitions(name, version).then(
    (result) => {
      self.postMessage({
        name,
        version,
        typings: result,
      });
    },
    (_error) => {
      if (process.env.NODE_ENV !== "production") {
        /** Ignore Error */
        // console.error(name, error);
      }
    }
  );
});

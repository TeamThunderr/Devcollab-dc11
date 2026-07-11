export interface ProjectFile {
  id: string;
  name: string;
  language: string;
  content: string;
  isFolder?: boolean;
  children?: ProjectFile[];
  fileHandle?: any; // FileSystemFileHandle or FileSystemDirectoryHandle
}

export function getLanguageFromName(name: string): string {
  const ext = name.split('.').pop()?.toLowerCase() || '';
  switch (ext) {
    case 'ts':
    case 'tsx': return 'typescript';
    case 'js':
    case 'jsx':
    case 'mjs':
    case 'cjs': return 'javascript';
    case 'css':
    case 'scss':
    case 'less': return 'css';
    case 'html': return 'html';
    case 'json': return 'json';
    case 'md':
    case 'markdown': return 'markdown';
    case 'py': return 'python';
    case 'go': return 'go';
    case 'java': return 'java';
    case 'c':
    case 'cpp':
    case 'h': return 'cpp';
    case 'rs': return 'rust';
    case 'sql': return 'sql';
    case 'sh':
    case 'bash':
    case 'zsh': return 'shell';
    case 'yml':
    case 'yaml': return 'yaml';
    case 'xml': return 'xml';
    default: return 'text';
  }
}

export async function openLocalDirectory(): Promise<ProjectFile | null> {
  try {
    if (!('showDirectoryPicker' in window)) {
      throw new Error("Your browser does not support the Web File System Access API. Please use Chrome, Edge, or Opera.");
    }
    const dirHandle = await (window as any).showDirectoryPicker();
    const rootId = "f_" + Math.random().toString(36).substring(2, 9);
    
    async function readDirectory(handle: any, pathId: string): Promise<ProjectFile[]> {
      const children: ProjectFile[] = [];
      for await (const entry of handle.values()) {
        if (entry.name.startsWith('.') || entry.name === 'node_modules' || entry.name === 'dist' || entry.name === 'build' || entry.name === '__pycache__') {
          continue; // Ignore common bulky or hidden directories
        }
        const entryId = pathId + "_" + Math.random().toString(36).substring(2, 7);
        if (entry.kind === 'file') {
          try {
            const file = await entry.getFile();
            const content = await file.text();
            children.push({
              id: entryId,
              name: entry.name,
              language: getLanguageFromName(entry.name),
              content,
              fileHandle: entry
            });
          } catch (e) {
            // Ignore binary or unreadable files
          }
        } else if (entry.kind === 'directory') {
          const subChildren = await readDirectory(entry, entryId);
          children.push({
            id: entryId,
            name: entry.name,
            language: 'folder',
            content: '',
            isFolder: true,
            children: subChildren,
            fileHandle: entry
          });
        }
      }
      // Sort folders first, then files alphabetically
      return children.sort((a, b) => {
        if (a.isFolder && !b.isFolder) return -1;
        if (!a.isFolder && b.isFolder) return 1;
        return a.name.localeCompare(b.name);
      });
    }

    const children = await readDirectory(dirHandle, rootId);
    return {
      id: rootId,
      name: dirHandle.name.toUpperCase(),
      language: 'folder',
      content: '',
      isFolder: true,
      children,
      fileHandle: dirHandle
    };
  } catch (err: any) {
    if (err?.name === 'AbortError') return null;
    throw err;
  }
}

export async function openLocalFiles(): Promise<ProjectFile[] | null> {
  try {
    if (!('showOpenFilePicker' in window)) {
      throw new Error("Your browser does not support the Web File System Access API.");
    }
    const fileHandles = await (window as any).showOpenFilePicker({
      multiple: true
    });
    const result: ProjectFile[] = [];
    for (const handle of fileHandles) {
      const file = await handle.getFile();
      const content = await file.text();
      result.push({
        id: "f_" + Math.random().toString(36).substring(2, 9),
        name: file.name,
        language: getLanguageFromName(file.name),
        content,
        fileHandle: handle
      });
    }
    return result;
  } catch (err: any) {
    if (err?.name === 'AbortError') return null;
    throw err;
  }
}

export async function saveToLocalDisk(file: ProjectFile): Promise<boolean> {
  if (file.fileHandle && 'createWritable' in file.fileHandle) {
    try {
      const writable = await file.fileHandle.createWritable();
      await writable.write(file.content);
      await writable.close();
      return true;
    } catch (err: any) {
      console.error("Failed to save to disk handle:", err);
      // Fallback to download
    }
  }
  // Fallback: trigger browser download of the file
  try {
    const blob = new Blob([file.content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = file.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    return true;
  } catch (err) {
    console.error("Failed download fallback:", err);
    return false;
  }
}

export async function readFilesFromInput(fileList: FileList): Promise<ProjectFile[]> {
  const allFiles: ProjectFile[] = [];

  for (let i = 0; i < fileList.length; i++) {
    const file = fileList.item(i);
    if (!file) continue;
    const path = (file as any).webkitRelativePath || file.name;
    const parts: string[] = path.split('/');
    
    // Ignore hidden or bulky folders
    if (parts.some((p: string) => p.startsWith('.') || p === 'node_modules' || p === 'dist' || p === 'build')) {
      continue;
    }

    try {
      const content = await file.text();
      const fileName = parts[parts.length - 1] || file.name;
      const newFile: ProjectFile = {
        id: "f_" + Math.random().toString(36).substring(2, 9),
        name: fileName,
        language: getLanguageFromName(file.name),
        content
      };
      allFiles.push(newFile);
    } catch (e) {
      // ignore non-text files
    }
  }
  return allFiles;
}

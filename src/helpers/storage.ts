import { existsSync, mkdirSync, unlinkSync, writeFileSync } from 'fs';

export const checkIfFileOrDirectoryExists = (path: string): boolean => {
  return existsSync(path);
};

export const createFile = (
  path: string,
  fileName: string,
  data: string,
): void => {
  if (!checkIfFileOrDirectoryExists(path)) {
    mkdirSync(path);
  }

  return writeFileSync(`${path}/${fileName}`, data, 'utf8');
};

export const deleteFile = (path: string): void => {
  return unlinkSync(path);
};

// export const getFile = async (path: string): Promise<string | Buffer> => {
//   return readFileSync(path, 'utf8');
// };

import {fs} from '@salesforce/core';

export const getFiles = (dir: string) => {
  const files = fs.readdirSync(dir).map(subdir => {
    const fullPath = `${dir}/${subdir}`;
    return fs.statSync(fullPath).isDirectory() ? getFiles(fullPath) : fullPath;
  });
  return files.reduce((a, f) => a.concat(f), []);
};

export const getExtension = (filename: string): string => {
  const i = filename.lastIndexOf('.');
  return (i < 0) ? '' : filename.substr(i);
};

export const mapFieldsToSF = (element, mapping, namespace?) => {
  return Object.entries(element).reduce((acc, [key, value]) => {
    if (!mapping[key]) {
      return {
        ...acc,
        [key]: value
      };
    } else if (mapping[key] === 'Name') {
      return {
        ...acc,
        [mapping[key]]: value
      };
    }
    const mappedKey = namespace ? `${namespace}${mapping[key]}` : mapping[key];
    return {
      ...acc,
      [mappedKey]: value
    };
  }, {});
};

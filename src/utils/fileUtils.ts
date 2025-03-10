export const loadImageFromFile = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    try {
      const url = URL.createObjectURL(file);
      resolve(url);
    } catch (error) {
      reject(new Error("Failed to create URL for file"));
    }
  });
};

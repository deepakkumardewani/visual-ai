export function useLocal() {
  function setLocal(key: string, data: object) {
    localStorage.setItem(key, JSON.stringify(data));
  }

  function getLocal(key: string) {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : undefined;
  }

  function removeLocal(key: string) {
    localStorage.removeItem(key);
  }

  return {
    setLocal,
    getLocal,
    removeLocal,
  };
}

export function useLocal() {
  function setLocal(key: string, data: object | string | boolean) {
    localStorage.setItem(key, JSON.stringify(data));
  }

  function getLocal(key: string) {
    const data = localStorage.getItem(key);
    console.log("data", data);
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

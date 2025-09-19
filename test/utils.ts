export async function eventually<T>(value: T): Promise<T> {
  return new Promise((res) => setTimeout(() => res(value), 0));
}

import { v4 as randomUuid } from 'uuid';

interface DBContent {
  id: string;
}

export class InMemoryMapDB {
  collections: Map<string, Map<string, DBContent>>;
  constructor() {
    this.collections = new Map();
  }

  createCollection(collectionName: string) {
    if (!this.collections.has(collectionName)) {
      this.collections.set(collectionName, new Map());
    }
    return this;
  }

  insert<T extends DBContent>(
    collectionName: string,
    data: Omit<T, 'id'>,
  ): string {
    if (!this.collections.has(collectionName)) {
      this.createCollection(collectionName);
    }

    const collection = this.collections.get(collectionName);
    const id = randomUuid();
    const record = { ...data, id };

    collection!.set(id, record);
    return id;
  }
  findById(collectionName: string, id: string) {
    return this.collections.get(collectionName)?.get(id) || null;
  }
  getAll(collectionName: string) {
    const collection = this.collections.get(collectionName);
    return collection ? Array.from(collection.values()) : [];
  }
  update<T extends DBContent>(
    collectionName: string,
    id: string,
    newData: Partial<T>,
  ) {
    const collection = this.collections.get(collectionName);
    if (!collection?.has(id)) return false;

    const oldData = collection.get(id);
    collection.set(id, { ...oldData, ...newData } as T);
    return true;
  }

  delete(collectionName: string, id: string) {
    return this.collections.get(collectionName)?.delete(id) || false;
  }
  dropCollection(collectionName: string) {
    return this.collections.delete(collectionName);
  }
}

import { CreateGame, RoomState, Turn, User, Winner } from 'types/types';

export type CollectionTypes = (
  | RoomState
  | User
  | CreateGame
  | Turn
  | Winner
) & {
  id?: string;
};

export class InMemoryMapDB {
  collections: Map<string, Map<string, CollectionTypes>>;
  constructor() {
    this.collections = new Map();
  }

  createCollection(collectionName: string) {
    if (!this.collections.has(collectionName)) {
      this.collections.set(collectionName, new Map());
    }
    return this;
  }

  insert<T extends CollectionTypes>(
    collectionName: string,
    data: T,
    id: string,
  ): string {
    if (!this.collections.has(collectionName)) {
      this.createCollection(collectionName);
    }

    const collection = this.collections.get(collectionName);
    const record = { ...data, id };

    collection!.set(id, record);
    return id;
  }
  findById(collectionName: string, id: string): CollectionTypes | null {
    return this.collections.get(collectionName)?.get(id) || null;
  }
  getAll(collectionName: string) {
    const collection = this.collections.get(collectionName);
    return collection ? Array.from(collection.values()) : [];
  }
  update<T extends CollectionTypes>(
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

  find<T extends CollectionTypes>(
    collectionName: string,
    query: Omit<T, 'id'>,
  ) {
    const getCollection = this.getAll(collectionName);

    const getQuery = Object.entries(query);

    const findByQuery = getCollection.filter((elem) => {
      return getQuery.every(
        ([queryKey, queryVal]) =>
          elem.hasOwnProperty(queryKey) &&
          queryVal === elem[queryKey as keyof typeof elem],
      );
    });
    return findByQuery;
  }

  delete(collectionName: string, id: string) {
    return this.collections.get(collectionName)?.delete(id) || false;
  }
  dropCollection(collectionName: string) {
    return this.collections.delete(collectionName);
  }
}

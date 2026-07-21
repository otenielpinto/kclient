//Classe tem letras maiuculoas

import { TMongo } from "../infra/mongoClient.js";

const collection = "tmp_fila_estoque";

class FilaEstoqueRepository {
  constructor() {
    this._db = null;
  }

  async getDb() {
    if (!this._db) {
      this._db = await TMongo.connect();
    }
    return this._db;
  }

  async getCollection() {
    const db = await this.getDb();
    return db.collection(collection);
  }

  async create(payload) {
    const col = await this.getCollection();
    const result = await col.insertOne(payload);
    return result.insertedId;
  }

  async update(id, payload) {
    const col = await this.getCollection();
    const result = await col.updateOne(
      { id: Number(id) },
      { $set: payload },
      { upsert: true },
    );
    return result.modifiedCount > 0;
  }

  async delete(id) {
    const col = await this.getCollection();
    const result = await col.deleteOne({ id: Number(id) });
    return result.deletedCount > 0;
  }

  async findAll(criterio = {}) {
    const col = await this.getCollection();
    return await col.find(criterio).toArray();
  }

  async findById(id) {
    const col = await this.getCollection();
    return await col.findOne({ id: Number(id) });
  }

  async insertMany(items) {
    if (!Array.isArray(items) || items.length == 0) return null;
    const col = await this.getCollection();
    try {
      return await col.insertMany(items);
    } catch (e) {
      console.log(e);
    }
  }

  async deleteMany(criterio = {}) {
    const col = await this.getCollection();
    try {
      return await col.deleteMany(criterio);
    } catch (e) {
      console.log(e);
    }
  }
}

export { FilaEstoqueRepository };
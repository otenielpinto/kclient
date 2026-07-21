//Classe tem letras maiuculoas
import { TMongo } from "../infra/mongoClient.js";
const collection = "tmp_estoque";

class EstoqueRepository {
  constructor(id_tenant) {
    this.id_tenant = id_tenant;
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
    if (!payload?.id_tenant) payload.id_tenant = this.id_tenant;
    payload.created_at = new Date();
    payload.updated_at = null;
    const col = await this.getCollection();
    const result = await col.insertOne(payload);
    return result.insertedId;
  }

  async update(id, payload) {
    if (!payload?.id_tenant) payload.id_tenant = this.id_tenant;
    payload.updated_at = new Date();
    const col = await this.getCollection();
    const result = await col.updateOne(
      { id: Number(id), id_tenant: this.id_tenant },
      { $set: payload },
      { upsert: true },
    );
    return result.modifiedCount > 0;
  }

  async delete(id) {
    const col = await this.getCollection();
    const result = await col.deleteOne({
      id: Number(id),
      id_tenant: this.id_tenant,
    });
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
    if (!Array.isArray(items)) return null;
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

  async updateMany(query = {}, fields = {}) {
    const col = await this.getCollection();
    try {
      return await col.updateMany(query, { $set: fields });
    } catch (e) {
      console.log(e);
    }
  }

  async updateEstoqueMany(items = []) {
    if (!Array.isArray(items)) return null;
    const col = await this.getCollection();
    let query = {};
    let i = 0;
    for (let item of items) {
      //console.log(i++, item?.id_produto);
      query = { codigo: String(item?.codigo) };
      item.id_tenant = this.id_tenant;
      let body = {
        ...item,
        updated_at: new Date(),
      };

      try {
        await col.updateMany(query, { $set: body }, { upsert: true });
      } catch (e) {
        await new Promise((resolve) => setTimeout(resolve, 250));
        console.log(e);
      }
    } //for
  }

  async findAllByIds(criterio = {}) {
    let queryObject = criterio;
    let sort = { id: 1 };

    const col = await this.getCollection();
    const rows = await col
      .aggregate([
        {
          $match: queryObject,
        },
        //second stage
        {
          $group: {
            _id: "$_id",
            id: { $first: "$id" },
            id_produto: { $first: "$id_produto" },
            id_tenant: { $first: "$id_tenant" },
            codigo: { $first: "$codigo" },
          },
        },

        // Third Stage
        {
          $sort: sort,
        },
      ])
      .toArray();
    return rows;
  }
}

export { EstoqueRepository };

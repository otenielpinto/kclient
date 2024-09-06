//Classe tem letras maiuculoas

const collection = "tmp_estoque";

class EstoqueRepository {
  constructor(db, id_tenant) {
    this.db = db;
    this.id_tenant = id_tenant;
  }

  async create(payload) {
    if (!payload?.id_tenant) payload.id_tenant = this.id_tenant;
    const result = await this.db.collection(collection).insertOne(payload);
    return result.insertedId;
  }

  async update(id, payload) {
    if (!payload?.id_tenant) payload.id_tenant = this.id_tenant;
    const result = await this.db
      .collection(collection)
      .updateOne(
        { id: Number(id), id_tenant: this.id_tenant },
        { $set: payload },
        { upsert: true }
      );
    return result.modifiedCount > 0;
  }

  async delete(id) {
    const result = await this.db
      .collection(collection)
      .deleteOne({ id: Number(id), id_tenant: this.id_tenant });
    return result.deletedCount > 0;
  }

  async findAll(criterio = {}) {
    return await this.db.collection(collection).find(criterio).toArray();
  }

  async findById(id) {
    return await this.db.collection(collection).findOne({ id: Number(id) });
  }

  async insertMany(items) {
    if (!Array.isArray(items)) return null;
    try {
      return await this.db.collection(collection).insertMany(items);
    } catch (e) {
      console.log(e);
    }
  }

  async deleteMany(criterio = {}) {
    try {
      return await this.db.collection(collection).deleteMany(criterio);
    } catch (e) {
      console.log(e);
    }
  }

  async updateEstoqueMany(items = []) {
    if (!Array.isArray(items)) return null;
    let query = {};
    for (let item of items) {
      query = { codigo: String(item?.codigo) };

      try {
        await this.db
          .collection(collection)
          .updateMany(query, { $set: item }, { upsert: true });
      } catch (e) {
        await new Promise((resolve) => setTimeout(resolve, 200));
        console.log(e);
      }
    } //for
  }

  async findAllByIds(criterio = {}) {
    let queryObject = criterio;
    let sort = { id: 1 };

    const rows = await this.db
      .collection(collection)
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

//Classe tem letras maiuculoas

const collection = "tmp_modelo";

class ModeloRepository {
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
      .updateOne({ id: Number(id) }, { $set: payload }, { upsert: true });
    return result.modifiedCount > 0;
  }

  async delete(id) {
    const result = await this.db
      .collection(collection)
      .deleteOne({ id: Number(id) });
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
}

export default { ModeloRepository };

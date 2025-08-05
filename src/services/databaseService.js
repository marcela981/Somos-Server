/**
 * @fileoverview Servicio de base de datos usando Google Cloud Firestore
 * @author Marcela
 */

const { Firestore } = require('@google-cloud/firestore');
const { logger } = require('./loggerService');

class DatabaseService {
  constructor() {
    this.db = new Firestore({
      projectId: process.env.GOOGLE_CLOUD_PROJECT_ID,
      keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS
    });
    
    this.collections = {
      users: this.db.collection('users'),
      workouts: this.db.collection('workouts'),
      progress: this.db.collection('progress'),
      nutrition: this.db.collection('nutrition'),
      aiSuggestions: this.db.collection('ai_suggestions'),
      logs: this.db.collection('logs'),
      routines: this.db.collection('routines'),
      sports: this.db.collection('sports'),
      achievements: this.db.collection('achievements'),
      motivation: this.db.collection('motivation'),
      exercises: this.db.collection('exercises'),
      goals: this.db.collection('goals'),
      reminders: this.db.collection('reminders'),
      community: this.db.collection('community'),
      settings: this.db.collection('settings')
    };
  }

  /**
   * Genera un ID único
   * @returns {string} ID único
   */
  generateId() {
    return this.db.collection('_').doc().id;
  }

  /**
   * Obtiene todos los documentos de una colección
   * @param {string} collectionName - Nombre de la colección
   * @returns {Promise<Array>} Array de documentos
   */
  async getAll(collectionName) {
    try {
      const snapshot = await this.collections[collectionName].get();
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      logger.error(`Error getting all from ${collectionName}`, error);
      throw error;
    }
  }

  /**
   * Busca documentos por criterio
   * @param {string} collectionName - Nombre de la colección
   * @param {Object} criteria - Criterios de búsqueda
   * @returns {Promise<Array>} Array de documentos que coinciden
   */
  async find(collectionName, criteria) {
    try {
      let query = this.collections[collectionName];
      
      // Aplicar filtros
      Object.keys(criteria).forEach(key => {
        query = query.where(key, '==', criteria[key]);
      });
      
      const snapshot = await query.get();
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      logger.error(`Error finding in ${collectionName}`, error);
      throw error;
    }
  }

  /**
   * Busca un documento por ID
   * @param {string} collectionName - Nombre de la colección
   * @param {string} id - ID del documento
   * @returns {Promise<Object|null>} Documento encontrado o null
   */
  async findById(collectionName, id) {
    try {
      const doc = await this.collections[collectionName].doc(id).get();
      
      if (!doc.exists) {
        return null;
      }
      
      return {
        id: doc.id,
        ...doc.data()
      };
    } catch (error) {
      logger.error(`Error finding by ID in ${collectionName}`, error);
      throw error;
    }
  }

  /**
   * Inserta un nuevo documento
   * @param {string} collectionName - Nombre de la colección
   * @param {Object} data - Datos a insertar
   * @returns {Promise<Object>} Documento insertado
   */
  async insert(collectionName, data) {
    try {
      // Generar ID automáticamente si no se proporciona
      if (!data.id) {
        data.id = this.generateId();
      }
      
      // Agregar timestamps si no existen
      if (!data.createdAt) {
        data.createdAt = new Date().toISOString();
      }
      
      if (!data.updatedAt) {
        data.updatedAt = new Date().toISOString();
      }

      const docRef = await this.collections[collectionName].doc(data.id).set(data);
      
      logger.info(`Document inserted in ${collectionName}`, { id: data.id });
      
      return {
        id: data.id,
        ...data
      };
    } catch (error) {
      logger.error(`Error inserting in ${collectionName}`, error);
      throw error;
    }
  }

  /**
   * Actualiza un documento existente
   * @param {string} collectionName - Nombre de la colección
   * @param {string} id - ID del documento
   * @param {Object} data - Datos a actualizar
   * @returns {Promise<Object>} Documento actualizado
   */
  async update(collectionName, id, data) {
    try {
      // Agregar timestamp de actualización
      data.updatedAt = new Date().toISOString();
      
      await this.collections[collectionName].doc(id).update(data);
      
      logger.info(`Document updated in ${collectionName}`, { id });
      
      // Retornar documento actualizado
      return await this.findById(collectionName, id);
    } catch (error) {
      logger.error(`Error updating in ${collectionName}`, error);
      throw error;
    }
  }

  /**
   * Elimina un documento
   * @param {string} collectionName - Nombre de la colección
   * @param {string} id - ID del documento
   * @returns {Promise<boolean>} True si se eliminó correctamente
   */
  async delete(collectionName, id) {
    try {
      await this.collections[collectionName].doc(id).delete();
      
      logger.info(`Document deleted in ${collectionName}`, { id });
      return true;
    } catch (error) {
      logger.error(`Error deleting in ${collectionName}`, error);
      throw error;
    }
  }

  /**
   * Busca documentos con paginación
   * @param {string} collectionName - Nombre de la colección
   * @param {Object} options - Opciones de paginación
   * @returns {Promise<Object>} Resultados paginados
   */
  async findWithPagination(collectionName, options = {}) {
    try {
      const { limit = 20, offset = 0, orderBy = 'createdAt', orderDirection = 'desc', filters = {} } = options;
      
      let query = this.collections[collectionName];
      
      // Aplicar filtros
      Object.keys(filters).forEach(key => {
        query = query.where(key, '==', filters[key]);
      });
      
      // Aplicar ordenamiento
      query = query.orderBy(orderBy, orderDirection);
      
      // Aplicar paginación
      if (offset > 0) {
        const offsetSnapshot = await query.limit(offset).get();
        const lastDoc = offsetSnapshot.docs[offsetSnapshot.docs.length - 1];
        if (lastDoc) {
          query = query.startAfter(lastDoc);
        }
      }
      
      query = query.limit(limit);
      
      const snapshot = await query.get();
      const documents = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      return {
        documents,
        pagination: {
          limit,
          offset,
          hasMore: documents.length === limit,
          total: documents.length
        }
      };
    } catch (error) {
      logger.error(`Error finding with pagination in ${collectionName}`, error);
      throw error;
    }
  }

  /**
   * Ejecuta una transacción
   * @param {Function} updateFunction - Función que contiene las operaciones de la transacción
   * @returns {Promise<any>} Resultado de la transacción
   */
  async runTransaction(updateFunction) {
    try {
      return await this.db.runTransaction(updateFunction);
    } catch (error) {
      logger.error('Error running transaction', error);
      throw error;
    }
  }

  /**
   * Crea un índice compuesto
   * @param {string} collectionName - Nombre de la colección
   * @param {Array} fields - Campos para el índice
   * @returns {Promise<void>}
   */
  async createIndex(collectionName, fields) {
    try {
      // En Firestore, los índices se crean automáticamente
      // pero puedes configurar índices compuestos en la consola de Firebase
      logger.info(`Index suggestion for ${collectionName}:`, fields);
    } catch (error) {
      logger.error(`Error creating index for ${collectionName}`, error);
      throw error;
    }
  }

  /**
   * Obtiene estadísticas de una colección
   * @param {string} collectionName - Nombre de la colección
   * @returns {Promise<Object>} Estadísticas de la colección
   */
  async getStats(collectionName) {
    try {
      const snapshot = await this.collections[collectionName].get();
      
      return {
        totalDocuments: snapshot.size,
        lastUpdated: new Date().toISOString()
      };
    } catch (error) {
      logger.error(`Error getting stats for ${collectionName}`, error);
      throw error;
    }
  }

  /**
   * Realiza una consulta compleja con múltiples condiciones
   * @param {string} collectionName - Nombre de la colección
   * @param {Array} conditions - Array de condiciones
   * @returns {Promise<Array>} Documentos que coinciden
   */
  async complexQuery(collectionName, conditions) {
    try {
      let query = this.collections[collectionName];
      
      conditions.forEach(condition => {
        const { field, operator, value } = condition;
        query = query.where(field, operator, value);
      });
      
      const snapshot = await query.get();
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      logger.error(`Error in complex query for ${collectionName}`, error);
      throw error;
    }
  }

  /**
   * Realiza una búsqueda de texto
   * @param {string} collectionName - Nombre de la colección
   * @param {string} field - Campo a buscar
   * @param {string} searchTerm - Término de búsqueda
   * @returns {Promise<Array>} Documentos que coinciden
   */
  async textSearch(collectionName, field, searchTerm) {
    try {
      // Firestore no tiene búsqueda de texto nativa
      // Esta es una implementación básica usando startsWith
      const snapshot = await this.collections[collectionName]
        .where(field, '>=', searchTerm)
        .where(field, '<=', searchTerm + '\uf8ff')
        .get();
      
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      logger.error(`Error in text search for ${collectionName}`, error);
      throw error;
    }
  }

  /**
   * Busca documentos por múltiples IDs
   * @param {string} collectionName - Nombre de la colección
   * @param {Array} ids - Array de IDs
   * @returns {Promise<Array>} Documentos encontrados
   */
  async findByIds(collectionName, ids) {
    try {
      if (ids.length === 0) return [];
      
      const promises = ids.map(id => this.findById(collectionName, id));
      const results = await Promise.all(promises);
      
      return results.filter(doc => doc !== null);
    } catch (error) {
      logger.error(`Error finding by IDs in ${collectionName}`, error);
      throw error;
    }
  }

  /**
   * Incrementa un campo numérico
   * @param {string} collectionName - Nombre de la colección
   * @param {string} id - ID del documento
   * @param {string} field - Campo a incrementar
   * @param {number} amount - Cantidad a incrementar
   * @returns {Promise<Object>} Documento actualizado
   */
  async increment(collectionName, id, field, amount = 1) {
    try {
      const docRef = this.collections[collectionName].doc(id);
      
      await docRef.update({
        [field]: Firestore.FieldValue.increment(amount),
        updatedAt: new Date().toISOString()
      });
      
      logger.info(`Field ${field} incremented in ${collectionName}`, { id, amount });
      
      return await this.findById(collectionName, id);
    } catch (error) {
      logger.error(`Error incrementing field in ${collectionName}`, error);
      throw error;
    }
  }
}

// Exportar instancia singleton
module.exports = { DatabaseService: new DatabaseService() }; 
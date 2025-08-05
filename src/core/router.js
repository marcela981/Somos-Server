/**
 * @fileoverview Sistema de routing para Google Apps Script
 * @author Marcela
 */

class Router {
  constructor() {
    this.routes = {
      GET: new Map(),
      POST: new Map(),
      PUT: new Map(),
      DELETE: new Map()
    };
    this.middleware = [];
  }

  /**
   * Registra middleware global
   * @param {Function} middleware - Función middleware
   */
  use(middleware) {
    this.middleware.push(middleware);
  }

  /**
   * Registra una ruta GET
   * @param {string} path - Ruta de la petición
   * @param {Function} handler - Función manejadora
   */
  get(path, handler) {
    this.routes.GET.set(path, handler);
  }

  /**
   * Registra una ruta POST
   * @param {string} path - Ruta de la petición
   * @param {Function} handler - Función manejadora
   */
  post(path, handler) {
    this.routes.POST.set(path, handler);
  }

  /**
   * Registra una ruta PUT
   * @param {string} path - Ruta de la petición
   * @param {Function} handler - Función manejadora
   */
  put(path, handler) {
    this.routes.PUT.set(path, handler);
  }

  /**
   * Registra una ruta DELETE
   * @param {string} path - Ruta de la petición
   * @param {Function} handler - Función manejadora
   */
  delete(path, handler) {
    this.routes.DELETE.set(path, handler);
  }

  /**
   * Maneja una petición HTTP
   * @param {Object} e - Evento de Google Apps Script
   * @param {string} method - Método HTTP
   * @returns {Object} Respuesta de la petición
   */
  handle(e, method) {
    const path = e.parameter.path || '/';
    const routes = this.routes[method];
    
    if (!routes) {
      throw new Error(`Método HTTP no soportado: ${method}`);
    }

    // Buscar la ruta exacta o con parámetros
    const handler = this.findHandler(path, routes);
    
    if (!handler) {
      throw new Error(`Ruta no encontrada: ${method} ${path}`);
    }

    // Crear contexto de la petición
    const req = this.createRequest(e, path);
    const res = this.createResponse();

    // Ejecutar middleware
    this.executeMiddleware(req, res);

    // Ejecutar el handler
    return handler(req, res);
  }

  /**
   * Encuentra el handler para una ruta
   * @param {string} path - Ruta de la petición
   * @param {Map} routes - Mapa de rutas
   * @returns {Function|null} Handler encontrado o null
   */
  findHandler(path, routes) {
    // Buscar ruta exacta
    if (routes.has(path)) {
      return routes.get(path);
    }

    // Buscar rutas con parámetros
    for (const [routePath, handler] of routes) {
      if (this.matchRoute(path, routePath)) {
        return handler;
      }
    }

    return null;
  }

  /**
   * Verifica si una ruta coincide con un patrón
   * @param {string} path - Ruta de la petición
   * @param {string} pattern - Patrón de ruta
   * @returns {boolean} True si coincide
   */
  matchRoute(path, pattern) {
    const pathParts = path.split('/').filter(Boolean);
    const patternParts = pattern.split('/').filter(Boolean);

    if (pathParts.length !== patternParts.length) {
      return false;
    }

    for (let i = 0; i < patternParts.length; i++) {
      if (patternParts[i].startsWith(':')) {
        // Es un parámetro, continuar
        continue;
      }
      
      if (pathParts[i] !== patternParts[i]) {
        return false;
      }
    }

    return true;
  }

  /**
   * Crea el objeto request
   * @param {Object} e - Evento de Google Apps Script
   * @param {string} path - Ruta de la petición
   * @returns {Object} Objeto request
   */
  createRequest(e, path) {
    const body = e.postData ? JSON.parse(e.postData.contents) : {};
    
    return {
      method: e.parameter.method || 'GET',
      path: path,
      params: e.parameter,
      body: body,
      headers: e.parameter,
      user: null // Se llenará con el middleware de autenticación
    };
  }

  /**
   * Crea el objeto response
   * @returns {Object} Objeto response
   */
  createResponse() {
    return {
      status: 200,
      headers: {},
      data: null,
      
      json(data) {
        this.data = data;
        return this;
      },
      
      status(code) {
        this.status = code;
        return this;
      }
    };
  }

  /**
   * Ejecuta el middleware en cadena
   * @param {Object} req - Objeto request
   * @param {Object} res - Objeto response
   */
  executeMiddleware(req, res) {
    for (const middleware of this.middleware) {
      try {
        middleware(req, res);
      } catch (error) {
        throw new Error(`Error en middleware: ${error.message}`);
      }
    }
  }
}

module.exports = { Router }; 
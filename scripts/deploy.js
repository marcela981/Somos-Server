#!/usr/bin/env node

/**
 * @fileoverview Script de despliegue para Google Apps Script
 * @author Marcela
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Iniciando despliegue a Google Apps Script...\n');

try {
  // Verificar que clasp está instalado
  console.log('📋 Verificando instalación de clasp...');
  execSync('clasp --version', { stdio: 'inherit' });
  
  // Verificar que estamos en el directorio correcto
  const claspConfigPath = path.join(process.cwd(), '.clasp.json');
  if (!fs.existsSync(claspConfigPath)) {
    throw new Error('Archivo .clasp.json no encontrado. Asegúrate de estar en el directorio correcto.');
  }
  
  const claspConfig = JSON.parse(fs.readFileSync(claspConfigPath, 'utf8'));
  if (!claspConfig.scriptId || claspConfig.scriptId === 'YOUR_SCRIPT_ID_HERE') {
    throw new Error('Script ID no configurado. Actualiza el archivo .clasp.json con tu Script ID.');
  }
  
  console.log('✅ Configuración de clasp verificada');
  
  // Verificar que el directorio src existe
  const srcPath = path.join(process.cwd(), 'src');
  if (!fs.existsSync(srcPath)) {
    throw new Error('Directorio src no encontrado. Asegúrate de que el código esté en el directorio src/');
  }
  
  console.log('✅ Estructura del proyecto verificada');
  
  // Hacer login con clasp si es necesario
  console.log('🔐 Verificando autenticación...');
  try {
    execSync('clasp list', { stdio: 'pipe' });
    console.log('✅ Autenticación verificada');
  } catch (error) {
    console.log('🔑 Iniciando proceso de autenticación...');
    execSync('clasp login', { stdio: 'inherit' });
  }
  
  // Subir archivos a Google Apps Script
  console.log('📤 Subiendo archivos a Google Apps Script...');
  execSync('clasp push', { stdio: 'inherit' });
  
  console.log('✅ Archivos subidos exitosamente');
  
  // Desplegar como aplicación web
  console.log('🌐 Desplegando como aplicación web...');
  execSync('clasp deploy', { stdio: 'inherit' });
  
  console.log('\n🎉 ¡Despliegue completado exitosamente!');
  console.log('\n📋 Próximos pasos:');
  console.log('1. Ve a Google Apps Script y configura las variables de entorno');
  console.log('2. Configura la API key de Gemini en Script Properties');
  console.log('3. Vincula el script a una hoja de cálculo de Google Sheets');
  console.log('4. Prueba los endpoints de la API');
  
} catch (error) {
  console.error('\n❌ Error durante el despliegue:', error.message);
  console.log('\n🔧 Solución de problemas:');
  console.log('1. Verifica que clasp esté instalado: npm install -g @google/clasp');
  console.log('2. Asegúrate de estar autenticado: clasp login');
  console.log('3. Verifica que el Script ID esté configurado en .clasp.json');
  console.log('4. Asegúrate de que todos los archivos estén en el directorio src/');
  process.exit(1);
} 
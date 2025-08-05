/**
 * @fileoverview Script para configurar las hojas de Google Sheets
 * @author Marcela
 */

require('dotenv').config();
const { google } = require('googleapis');

// Configurar autenticación
const auth = new google.auth.GoogleAuth({
  keyFile: process.env.GOOGLE_APPLICATION_CREDENTIALS || './credentials/service-account-key.json',
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});

const sheets = google.sheets({ version: 'v4', auth });

/**
 * Crea una nueva hoja en el spreadsheet
 * @param {string} spreadsheetId - ID del spreadsheet
 * @param {string} sheetName - Nombre de la hoja
 * @param {Array} headers - Headers de la hoja
 */
async function createSheet(spreadsheetId, sheetName, headers) {
  try {
    console.log(`Creando hoja: ${sheetName}`);
    
    // Crear la hoja
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId,
      resource: {
        requests: [{
          addSheet: {
            properties: {
              title: sheetName,
              gridProperties: {
                rowCount: 1000,
                columnCount: headers.length
              }
            }
          }
        }]
      }
    });

    // Agregar headers
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `${sheetName}!A1:${String.fromCharCode(65 + headers.length - 1)}1`,
      valueInputOption: 'RAW',
      resource: {
        values: [headers]
      }
    });

    // Formatear headers
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId,
      resource: {
        requests: [{
          repeatCell: {
            range: {
              sheetId: await getSheetId(spreadsheetId, sheetName),
              startRowIndex: 0,
              endRowIndex: 1,
              startColumnIndex: 0,
              endColumnIndex: headers.length
            },
            cell: {
              userEnteredFormat: {
                backgroundColor: { red: 0.2, green: 0.6, blue: 0.9 },
                textFormat: { bold: true, foregroundColor: { red: 1, green: 1, blue: 1 } }
              }
            },
            fields: 'userEnteredFormat(backgroundColor,textFormat)'
          }
        }]
      }
    });

    console.log(`✅ Hoja ${sheetName} creada exitosamente`);
  } catch (error) {
    console.error(`❌ Error creando hoja ${sheetName}:`, error.message);
  }
}

/**
 * Obtiene el ID de una hoja
 * @param {string} spreadsheetId - ID del spreadsheet
 * @param {string} sheetName - Nombre de la hoja
 * @returns {number} ID de la hoja
 */
async function getSheetId(spreadsheetId, sheetName) {
  const response = await sheets.spreadsheets.get({ spreadsheetId });
  const sheet = response.data.sheets.find(s => s.properties.title === sheetName);
  return sheet.properties.sheetId;
}

/**
 * Configura todas las hojas del spreadsheet
 */
async function setupSheets() {
  const spreadsheetId = process.env.GOOGLE_SHEETS_ID;
  
  if (!spreadsheetId) {
    console.error('❌ GOOGLE_SHEETS_ID no está configurado en las variables de entorno');
    return;
  }

  console.log('🚀 Iniciando configuración de hojas de Google Sheets...');
  console.log(`📊 Spreadsheet ID: ${spreadsheetId}`);

  const sheetsConfig = [
    {
      name: 'USUARIOS',
      headers: ['id', 'name', 'email', 'goal', 'experienceLevel', 'equipment', 'onboardingCompleted', 'createdAt', 'updatedAt']
    },
    {
      name: 'RUTINAS',
      headers: ['id', 'userId', 'name', 'type', 'duration', 'difficulty', 'exercises', 'createdAt', 'updatedAt']
    },
    {
      name: 'DEPORTES',
      headers: ['id', 'name', 'category', 'description', 'equipment', 'difficulty', 'videoUrl', 'createdAt']
    },
    {
      name: 'PROGRESO',
      headers: ['id', 'userId', 'date', 'weight', 'bodyFat', 'measurements', 'notes', 'createdAt']
    },
    {
      name: 'ENTRENAMIENTOS',
      headers: ['id', 'userId', 'date', 'routineId', 'duration', 'exercises', 'feedback', 'completed', 'createdAt']
    },
    {
      name: 'NUTRICION',
      headers: ['id', 'userId', 'date', 'calories', 'protein', 'carbs', 'fat', 'water', 'notes', 'createdAt']
    },
    {
      name: 'IA_SUGERENCIAS',
      headers: ['id', 'userId', 'type', 'prompt', 'response', 'context', 'createdAt']
    },
    {
      name: 'LOGROS',
      headers: ['id', 'userId', 'type', 'title', 'description', 'achievedAt', 'createdAt']
    },
    {
      name: 'MOTIVACION',
      headers: ['id', 'userId', 'message', 'type', 'context', 'createdAt']
    },
    {
      name: 'LOGS',
      headers: ['id', 'level', 'message', 'details', 'userId', 'timestamp']
    },
    {
      name: 'EJERCICIOS',
      headers: ['id', 'name', 'category', 'muscleGroup', 'equipment', 'difficulty', 'instructions', 'videoUrl', 'createdAt']
    },
    {
      name: 'OBJETIVOS',
      headers: ['id', 'userId', 'type', 'target', 'current', 'deadline', 'progress', 'status', 'createdAt']
    },
    {
      name: 'RECORDATORIOS',
      headers: ['id', 'userId', 'type', 'message', 'scheduledFor', 'completed', 'createdAt']
    },
    {
      name: 'COMUNIDAD',
      headers: ['id', 'userId', 'type', 'content', 'likes', 'comments', 'createdAt']
    },
    {
      name: 'CONFIGURACION',
      headers: ['id', 'userId', 'setting', 'value', 'createdAt']
    }
  ];

  try {
    for (const config of sheetsConfig) {
      await createSheet(spreadsheetId, config.name, config.headers);
    }

    console.log('\n🎉 ¡Configuración completada!');
    console.log('\n📋 Hojas creadas:');
    sheetsConfig.forEach(config => {
      console.log(`   ✅ ${config.name}`);
    });

    console.log('\n🔗 Enlace al spreadsheet:');
    console.log(`https://docs.google.com/spreadsheets/d/${spreadsheetId}`);

  } catch (error) {
    console.error('❌ Error en la configuración:', error.message);
  }
}

/**
 * Agrega datos de ejemplo
 */
async function addSampleData() {
  const spreadsheetId = process.env.GOOGLE_SHEETS_ID;
  
  if (!spreadsheetId) {
    console.error('❌ GOOGLE_SHEETS_ID no está configurado');
    return;
  }

  console.log('\n📝 Agregando datos de ejemplo...');

  const sampleData = [
    {
      sheet: 'USUARIOS',
      data: [
        ['1', 'Marcela', 'marcela@email.com', 'weight_loss', 'beginner', '["bodyweight", "dumbbells"]', 'true', '2024-01-15', '2024-01-15'],
        ['2', 'Usuario Demo', 'demo@email.com', 'muscle_gain', 'intermediate', '["gym", "barbell"]', 'true', '2024-01-15', '2024-01-15']
      ]
    },
    {
      sheet: 'DEPORTES',
      data: [
        ['1', 'Fútbol', 'Team Sports', 'Deporte de equipo con balón', '["pelota", "portería"]', 'intermediate', 'https://example.com/futbol', '2024-01-15'],
        ['2', 'Baloncesto', 'Team Sports', 'Deporte de canasta', '["pelota", "canasta"]', 'intermediate', 'https://example.com/basketball', '2024-01-15'],
        ['3', 'Boxeo', 'Combat Sports', 'Deporte de contacto', '["guantes", "saco"]', 'advanced', 'https://example.com/boxing', '2024-01-15']
      ]
    },
    {
      sheet: 'RUTINAS',
      data: [
        ['1', '1', 'Tren Superior Casa', 'strength', '45', 'beginner', '[{"name": "Flexiones", "sets": 3, "reps": 12}]', '2024-01-15', '2024-01-15'],
        ['2', '1', 'Cardio HIIT', 'cardio', '30', 'intermediate', '[{"name": "Burpees", "sets": 5, "reps": 10}]', '2024-01-15', '2024-01-15']
      ]
    }
  ];

  try {
    for (const item of sampleData) {
      console.log(`Agregando datos a ${item.sheet}...`);
      
      await sheets.spreadsheets.values.append({
        spreadsheetId,
        range: `${item.sheet}!A2`,
        valueInputOption: 'RAW',
        resource: {
          values: item.data
        }
      });
    }

    console.log('✅ Datos de ejemplo agregados exitosamente');

  } catch (error) {
    console.error('❌ Error agregando datos de ejemplo:', error.message);
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  const command = process.argv[2];

  if (command === 'sample-data') {
    addSampleData();
  } else {
    setupSheets();
  }
}

module.exports = { setupSheets, addSampleData }; 
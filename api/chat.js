/**
 * Función Serverless para Vercel
 * Actúa como un puente seguro entre el frontend de MovieNexus y la API de Google Gemini.
 * Protege la API Key de Gemini y obliga a la IA a responder en JSON estructurado.
 */

// Utiliza la API Key de las variables de entorno
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

module.exports = async (req, res) => {
  // Solo permitir peticiones POST
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: `Método ${req.method} no permitido. Utilice POST.` });
  }

  // Verificar que la API Key esté configurada en el servidor
  if (!GEMINI_API_KEY) {
    console.error('Error: GEMINI_API_KEY no está configurada en el entorno del servidor.');
    return res.status(500).json({
      message: 'El asistente Nexus AI no está configurado correctamente en el servidor. Falta la API Key.',
      recommendations: []
    });
  }

  try {
    const { message, history } = req.body;

    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'El parámetro "message" es obligatorio y debe ser un texto.' });
    }

    // Mapear historial al formato de Gemini
    // Cada elemento del historial debe tener el rol 'user' o 'model' y sus correspondientes parts con texto.
    const contents = [];
    if (history && Array.isArray(history)) {
      for (const h of history) {
        // Ignorar mensajes vacíos o mal estructurados
        if (h && h.role && h.text) {
          contents.push({
            role: h.role === 'user' ? 'user' : 'model',
            parts: [{ text: h.text }]
          });
        }
      }
    }

    // Agregar el mensaje actual del usuario al final del historial
    contents.push({
      role: 'user',
      parts: [{ text: message }]
    });

    // Configuración del System Instruction para definir el rol de Nexus AI
    const systemInstructionText = `
      Eres Nexus AI, un experto cinéfilo entusiasta, amigable y sumamente conocedor del cine mundial para la plataforma MovieNexus.
      Tu objetivo es responder de manera amigable, conversacional y profesional en español.
      Tus responsabilidades principales:
      1. Recomendar películas que encajen perfectamente con los gustos, preguntas o estado de ánimo del usuario.
      2. Explicar géneros cinematográficos, comparar directores, actores o películas.
      3. Mantener un tono entusiasta por el cine (estilo cinéfilo apasionado de Letterboxd).
      4. Si el usuario te pide recomendaciones, debes llenar el listado de "recommendations" en el JSON de respuesta con los títulos exactos de las películas sugeridas.
      5. Si el usuario solo está conversando o te hace una pregunta general que no requiere películas específicas, el arreglo de "recommendations" debe ir vacío.
      6. Utiliza un formato Markdown limpio para estructurar tus mensajes textuales (negritas, listas, saltos de línea).
    `.trim();

    // Estructura de esquema (JSON Schema) para obligar a Gemini a responder en el formato deseado
    const jsonSchema = {
      type: "OBJECT",
      properties: {
        message: {
          type: "STRING",
          description: "La respuesta textual en español del asistente Nexus AI en formato Markdown, dialogando con el usuario y explicando las recomendaciones si las hay."
        },
        recommendations: {
          type: "ARRAY",
          description: "Arreglo con las películas sugeridas de manera explícita (debe estar vacío si no se sugieren películas).",
          items: {
            type: "OBJECT",
            properties: {
              title: {
                type: "STRING",
                description: "Título exacto de la película (por ejemplo, 'Inception', 'El Padrino', 'Interstellar') para poder buscarlo en TMDB."
              }
            },
            required: ["title"]
          }
        }
      },
      required: ["message", "recommendations"]
    };

    // Llamar a la API oficial de Google Gemini
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`;

    const response = await fetch(geminiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        systemInstruction: {
          parts: [{ text: systemInstructionText }]
        },
        contents: contents,
        generationConfig: {
          responseMimeType: "application/json",
          responseSchema: jsonSchema,
          temperature: 0.7,
          maxOutputTokens: 1000
        }
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Error de API Gemini (Status ${response.status}):`, errorText);
      return res.status(response.status).json({
        message: 'Lo siento, en este momento el servidor de inteligencia artificial está sobrecargado. Por favor, intenta de nuevo.',
        recommendations: []
      });
    }

    const data = await response.json();

    // Extraer y parsear la respuesta JSON de Gemini
    if (
      data &&
      data.candidates &&
      data.candidates[0] &&
      data.candidates[0].content &&
      data.candidates[0].content.parts &&
      data.candidates[0].content.parts[0] &&
      data.candidates[0].content.parts[0].text
    ) {
      const rawText = data.candidates[0].content.parts[0].text;
      
      try {
        const parsedResponse = JSON.parse(rawText);
        return res.status(200).json(parsedResponse);
      } catch (parseError) {
        console.error('Error al parsear la respuesta estructurada de Gemini:', rawText, parseError);
        return res.status(200).json({
          message: rawText, // Fallback en caso de que devuelva texto plano
          recommendations: []
        });
      }
    } else {
      console.error('Estructura de respuesta de Gemini inesperada:', JSON.stringify(data));
      return res.status(500).json({
        message: 'No se recibió una respuesta válida del motor de inteligencia artificial.',
        recommendations: []
      });
    }

  } catch (error) {
    console.error('Excepción atrapada en el backend de chat:', error);
    return res.status(500).json({
      message: 'Ocurrió un error inesperado en el servidor al procesar el mensaje.',
      recommendations: []
    });
  }
};

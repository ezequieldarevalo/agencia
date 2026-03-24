// OCR utility for scanning DNI and Cédula Verde using Tesseract.js
import { createWorker } from "tesseract.js";

export interface DniData {
  firstName?: string;
  lastName?: string;
  dni?: string;
  sex?: string;
  birthDate?: string;
  address?: string;
}

export interface CedulaData {
  brand?: string;
  model?: string;
  year?: string;
  domain?: string;
  chassisNumber?: string;
  engineNumber?: string;
  ownerName?: string;
}

/** Parse Argentine DNI text from OCR */
function parseDniText(text: string): DniData {
  const lines = text
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
  const data: DniData = {};

  for (const line of lines) {
    const lower = line.toLowerCase();

    // DNI number - 7 or 8 digits
    const dniMatch = line.match(/\b(\d{7,8})\b/);
    if (dniMatch && !data.dni) {
      data.dni = dniMatch[1];
    }

    // Sex
    if (/\b(masculino|femenino)\b/i.test(line)) {
      data.sex = /masculino/i.test(line) ? "M" : "F";
    } else if (/\bsexo\s*[:.]?\s*([MF])\b/i.test(line)) {
      const m = line.match(/\bsexo\s*[:.]?\s*([MF])\b/i);
      if (m) data.sex = m[1].toUpperCase();
    }

    // Birth date
    const dateMatch = line.match(/(\d{1,2})\s*[/\-.]\s*(\d{1,2})\s*[/\-.]\s*(\d{2,4})/);
    if (dateMatch && !data.birthDate) {
      const [, d, m, y] = dateMatch;
      const year = y.length === 2 ? (parseInt(y) > 50 ? `19${y}` : `20${y}`) : y;
      data.birthDate = `${year}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
    }

    // Apellido (lines after "APELLIDO" label or second line pattern)
    if (/apellido/i.test(lower) && !data.lastName) {
      const val = line.replace(/apellido\s*[:.]?\s*/i, "").trim();
      if (val.length > 1) data.lastName = val;
    }

    // Nombre
    if (/^nombre\b/i.test(lower) && !data.firstName) {
      const val = line.replace(/nombre[s]?\s*[:.]?\s*/i, "").trim();
      if (val.length > 1) data.firstName = val;
    }

    // Domicilio
    if (/domicilio/i.test(lower) && !data.address) {
      const val = line.replace(/domicilio\s*[:.]?\s*/i, "").trim();
      if (val.length > 2) data.address = val;
    }
  }

  // Fallback: if we have lines but no name parsed, try structured pattern
  if (!data.lastName && !data.firstName && lines.length >= 4) {
    // In many DNIs, name is on lines 2-3 after the header
    for (let i = 0; i < lines.length; i++) {
      const l = lines[i];
      if (/^[A-ZÁÉÍÓÚÑ\s]{3,}$/.test(l) && !/REPUBLICA|ARGENTINA|DOCUMENTO|IDENTIDAD|NACIONAL/i.test(l)) {
        if (!data.lastName) {
          data.lastName = l.trim();
        } else if (!data.firstName) {
          data.firstName = l.trim();
          break;
        }
      }
    }
  }

  return data;
}

/** Parse Argentine Cédula Verde / registration card text from OCR */
function parseCedulaText(text: string): CedulaData {
  const data: CedulaData = {};
  const lines = text
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
  const fullText = lines.join(" ");

  // Domain/plate - pattern: ABC 123 or AB 123 CD or similar
  const domainMatch = fullText.match(/\b([A-Z]{2,3}\s*\d{3}\s*[A-Z]{0,2})\b/);
  if (domainMatch) {
    data.domain = domainMatch[1].replace(/\s+/g, " ").trim();
  }

  for (const line of lines) {
    const lower = line.toLowerCase();

    // Marca
    if (/marca\s*[:.]?\s*/i.test(line) && !data.brand) {
      data.brand = line.replace(/marca\s*[:.]?\s*/i, "").trim();
    }

    // Modelo
    if (/modelo\s*[:.]?\s*/i.test(line) && !data.model) {
      data.model = line.replace(/modelo\s*[:.]?\s*/i, "").trim();
    }

    // Año / Year
    if (/a[ñn]o\s*[:.]?\s*/i.test(line) && !data.year) {
      const yearMatch = line.match(/\b(19|20)\d{2}\b/);
      if (yearMatch) data.year = yearMatch[0];
    }

    // Dominio / Domain
    if (/dominio\s*[:.]?\s*/i.test(lower) && !data.domain) {
      const val = line.replace(/dominio\s*[:.]?\s*/i, "").trim();
      if (val.length >= 5) data.domain = val;
    }

    // Chasis
    if (/chasis\s*[:.]?\s*/i.test(lower) && !data.chassisNumber) {
      const val = line.replace(/.*chasis\s*[:.]?\s*/i, "").trim();
      if (val.length >= 5) data.chassisNumber = val;
    }

    // Motor
    if (/motor\s*[:.]?\s*/i.test(lower) && !data.engineNumber) {
      const val = line.replace(/.*motor\s*[:.]?\s*/i, "").trim();
      if (val.length >= 3) data.engineNumber = val;
    }

    // Titular
    if (/titular\s*[:.]?\s*/i.test(lower) && !data.ownerName) {
      const val = line.replace(/titular\s*[:.]?\s*/i, "").trim();
      if (val.length > 2) data.ownerName = val;
    }
  }

  return data;
}

/** Run OCR on an image file and extract DNI data */
export async function scanDni(imageFile: File): Promise<DniData> {
  const worker = await createWorker("spa");
  try {
    const {
      data: { text },
    } = await worker.recognize(imageFile);
    return parseDniText(text);
  } finally {
    await worker.terminate();
  }
}

/** Run OCR on an image file and extract Cédula Verde data */
export async function scanCedula(imageFile: File): Promise<CedulaData> {
  const worker = await createWorker("spa");
  try {
    const {
      data: { text },
    } = await worker.recognize(imageFile);
    return parseCedulaText(text);
  } finally {
    await worker.terminate();
  }
}

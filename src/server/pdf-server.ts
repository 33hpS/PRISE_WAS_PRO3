import express from 'express';
import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';
import { spawn } from 'child_process';

interface PdfGenerationOptions {
  title?: string;
  author?: string;
  subject?: string;
  keywords?: string[];
  layout?: 'portrait' | 'landscape';
  size?: string;
  margins?: {
    top?: number;
    bottom?: number;
    left?: number;
    right?: number;
  };
}

interface PriceListItem {
  article: string;
  name: string;
  collection: string;
  material: string;
  price: number;
  vat?: number;
  discount?: number;
}

class PdfGenerator {
  private doc: PDFDocument;
  private filename: string;
  
  constructor(filename: string, options?: PdfGenerationOptions) {
    this.filename = filename;
    this.doc = new PDFDocument({
      size: options?.size || 'A4',
      layout: options?.layout || 'portrait',
      margins: {
        top: options?.margins?.top || 50,
        bottom: options?.margins?.bottom || 50,
        left: options?.margins?.left || 50,
        right: options?.margins?.right || 50
      },
      info: {
        Title: options?.title || 'Document',
        Author: options?.author || 'System',
        Subject: options?.subject || '',
        Keywords: options?.keywords?.join(', ') || ''
      }
    });
  }

  // Метод генерации PDF должен возвращать PDFDocument
  public generateDocument(): PDFDocument {
    // Pipe to file
    this.doc.pipe(fs.createWriteStream(this.filename));
    
    // Возвращаем документ для дальнейшей работы
    return this.doc;
  }
  
  public addHeader(title: string): void {
    this.doc
      .fontSize(20)
      .text(title, { align: 'center' })
      .moveDown();
  }
  
  public addSubheader(subtitle: string): void {
    this.doc
      .fontSize(14)
      .text(subtitle, { align: 'center' })
      .moveDown();
  }
  
  public addText(text: string, options?: any): void {
    this.doc
      .fontSize(12)
      .text(text, options)
      .moveDown();
  }
  
  public addTable(headers: string[], data: string[][], options?: any): void {
    const startX = this.doc.x;
    const startY = this.doc.y;
    const columnWidth = options?.columnWidth || 100;
    const rowHeight = options?.rowHeight || 20;
    
    // Draw headers
    this.doc.fontSize(10).font('Helvetica-Bold');
    headers.forEach((header, index) => {
      this.doc.text(
        header,
        startX + (index * columnWidth),
        startY,
        { width: columnWidth, align: 'center' }
      );
    });
    
    // Draw header line
    this.doc
      .moveTo(startX, startY + rowHeight)
      .lineTo(startX + (headers.length * columnWidth), startY + rowHeight)
      .stroke();
    
    // Draw data rows
    this.doc.font('Helvetica').fontSize(9);
    let currentY = startY + rowHeight + 5;
    
    data.forEach((row) => {
      row.forEach((cell, index) => {
        this.doc.text(
          cell,
          startX + (index * columnWidth),
          currentY,
          { width: columnWidth, align: 'center' }
        );
      });
      currentY += rowHeight;
    });
    
    this.doc.y = currentY + 10;
  }
  
  public addPageBreak(): void {
    this.doc.addPage();
  }
  
  public addImage(imagePath: string, options?: any): void {
    if (fs.existsSync(imagePath)) {
      this.doc.image(imagePath, options);
    }
  }
  
  public finalize(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.doc.on('finish', resolve);
      this.doc.on('error', reject);
      this.doc.end();
    });
  }
}

// Функция генерации прайс-листа
export async function generatePriceList(
  items: PriceListItem[],
  outputPath: string,
  options?: PdfGenerationOptions
): Promise<string> {
  const generator = new PdfGenerator(outputPath, {
    title: 'Прайс-лист мебельной фабрики',
    author: 'Wasser Furniture Factory',
    ...options
  });
  
  const doc = generator.generateDocument();
  
  // Добавляем заголовок
  generator.addHeader('ПРАЙС-ЛИСТ');
  generator.addSubheader(`Дата: ${new Date().toLocaleDateString('ru-RU')}`);
  
  // Подготавливаем данные для таблицы
  const headers = ['Артикул', 'Наименование', 'Коллекция', 'Материал', 'Цена (₽)'];
  const data = items.map(item => [
    item.article,
    item.name,
    item.collection,
    item.material,
    item.price.toFixed(2)
  ]);
  
  // Добавляем таблицу
  generator.addTable(headers, data, {
    columnWidth: 110,
    rowHeight: 20
  });
  
  // Добавляем итоги
  const total = items.reduce((sum, item) => sum + item.price, 0);
  generator.addText(`Итого позиций: ${items.length}`, { align: 'right' });
  generator.addText(`Общая сумма: ${total.toFixed(2)} ₽`, { align: 'right' });
  
  // Если есть НДС
  const vat = total * 0.2; // 20% НДС
  generator.addText(`НДС 20%: ${vat.toFixed(2)} ₽`, { align: 'right' });
  generator.addText(`Итого с НДС: ${(total + vat).toFixed(2)} ₽`, { align: 'right' });
  
  // Финализируем документ
  await generator.finalize();
  
  return outputPath;
}

// Express сервер для генерации PDF
const app = express();
app.use(express.json());

app.post('/api/generate-pdf', async (req, res) => {
  try {
    const { items, options } = req.body;
    
    if (!items || !Array.isArray(items)) {
      return res.status(400).json({ error: 'Items array is required' });
    }
    
    const outputDir = path.join(__dirname, '../../public/exports');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    const filename = `price-list_${Date.now()}.pdf`;
    const outputPath = path.join(outputDir, filename);
    
    await generatePriceList(items, outputPath, options);
    
    res.json({
      success: true,
      filename,
      path: `/exports/${filename}`
    });
  } catch (error) {
    console.error('PDF generation error:', error);
    res.status(500).json({
      error: 'Failed to generate PDF',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Функция для конвертации PDF в другие форматы
export function convertPdf(
  inputPath: string,
  outputPath: string,
  format: 'png' | 'jpg' | 'txt'
): Promise<void> {
  return new Promise((resolve, reject) => {
    let command: string;
    let args: string[];
    
    switch (format) {
      case 'png':
      case 'jpg':
        command = 'convert';
        args = [
          '-density', '150',
          inputPath,
          '-quality', '90',
          outputPath
        ];
        break;
      case 'txt':
        command = 'pdftotext';
        args = [inputPath, outputPath];
        break;
      default:
        reject(new Error(`Unsupported format: ${format}`));
        return;
    }
    
    const process = spawn(command, args, {
      shell: true // Используем boolean вместо "new"
    });
    
    process.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Conversion failed with code ${code}`));
      }
    });
    
    process.on('error', (error) => {
      reject(error);
    });
  });
}

// Функция для объединения нескольких PDF
export function mergePdfs(
  inputPaths: string[],
  outputPath: string
): Promise<void> {
  return new Promise((resolve, reject) => {
    const args = inputPaths.concat(['cat', 'output', outputPath]);
    
    const process = spawn('pdftk', args, {
      shell: true // Используем boolean
    });
    
    process.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Merge failed with code ${code}`));
      }
    });
    
    process.on('error', (error) => {
      reject(error);
    });
  });
}

// Запуск сервера только если файл запущен напрямую
if (require.main === module) {
  const PORT = process.env.PDF_SERVER_PORT || 3001;
  app.listen(PORT, () => {
    console.log(`PDF server running on port ${PORT}`);
  });
}

export default app;
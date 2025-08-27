import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { Product } from '../types/product'

// Минимальная рабочая версия для теста
export class PDFGenerator {
  private doc: jsPDF
  
  constructor() {
    this.doc = new jsPDF()
  }

  generatePriceList(products: Product[]): Blob {
    this.doc.text('Прайс-лист WASSER', 105, 20, { align: 'center' })
    
    const headers = [['Артикул', 'Название', 'Цена']]
    const data = products.map(p => [
      p.article || '-',
      p.name,
      `${p.basePrice} ₽`
    ])
    
    autoTable(this.doc, {
      head: headers,
      body: data,
      startY: 30
    })
    
    return this.doc.output('blob')
  }
}

export default PDFGenerator

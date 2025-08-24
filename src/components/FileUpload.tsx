/**
 * File upload component with drag and drop functionality
 * - New: replaces spinner with an indeterminate progress bar while processing.
 */
import { useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { Upload, FileSpreadsheet, Image, X } from 'lucide-react'
import { Button } from './ui/button'
import { Card, CardContent } from './ui/card'
import { Badge } from './ui/badge'
import { parseXLSXTechCard, TechCard } from '../lib/xlsx-parser'

interface FileUploadProps {
  onFilesUploaded?: (files: File[]) => void
  onTechCardParsed?: (techCard: TechCard) => void
  title?: string
  description?: string
  acceptedFileTypes?: string[]
  maxFiles?: number
  mode?: 'files' | 'tech-card'
}

/**
 * File upload component with support for Excel parsing
 */
export default function FileUpload({
  onFilesUploaded,
  onTechCardParsed,
  title = 'Загрузить файлы',
  description = 'Перетащите файлы сюда или нажмите для выбора',
  acceptedFileTypes = ['.jpg', '.jpeg', '.png', '.pdf'],
  maxFiles = 5,
  mode = 'files',
}: FileUploadProps) {
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([])
  const [isProcessing, setIsProcessing] = useState<boolean>(false)
  const [processedTechCard, setProcessedTechCard] = useState<TechCard | null>(null)

  /**
   * Handle dropped files
   */
  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      if (acceptedFiles.length === 0) return

      setIsProcessing(true)

      try {
        if (mode === 'tech-card') {
          // Handle Excel file for tech card
          const excelFile = acceptedFiles.find((file) => file.name.endsWith('.xlsx') || file.name.endsWith('.xls'))

          if (excelFile) {
            try {
              const techCard = await parseXLSXTechCard(excelFile)
              setProcessedTechCard(techCard)

              if (onTechCardParsed) {
                onTechCardParsed(techCard)
              }
            } catch (error) {
              console.error('Error parsing Excel file:', error)
              alert('Ошибка при обработке Excel файла. Проверьте формат.')
            }
          }
        } else {
          // Handle regular files
          const newFiles = [...uploadedFiles, ...acceptedFiles].slice(0, maxFiles)
          setUploadedFiles(newFiles)

          if (onFilesUploaded) {
            onFilesUploaded(newFiles)
          }
        }
      } catch (error) {
        console.error('Error processing files:', error)
      } finally {
        setIsProcessing(false)
      }
    },
    [uploadedFiles, maxFiles, mode, onFilesUploaded, onTechCardParsed]
  )

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: acceptedFileTypes.reduce((acc, type) => {
      if (type.includes('jpg') || type.includes('jpeg')) {
        acc['image/jpeg'] = ['.jpg', '.jpeg']
      } else if (type.includes('png')) {
        acc['image/png'] = ['.png']
      } else if (type.includes('pdf')) {
        acc['application/pdf'] = ['.pdf']
      } else if (type.includes('xlsx')) {
        acc['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'] = ['.xlsx']
      } else if (type.includes('xls')) {
        acc['application/vnd.ms-excel'] = ['.xls']
      }
      return acc
    }, {} as Record<string, string[]>),
    maxFiles: maxFiles,
    multiple: maxFiles > 1,
  })

  /**
   * Remove uploaded file
   */
  const removeFile = (index: number) => {
    const newFiles = uploadedFiles.filter((_, i) => i !== index)
    setUploadedFiles(newFiles)

    if (onFilesUploaded) {
      onFilesUploaded(newFiles)
    }
  }

  /**
   * Clear all files
   */
  const clearFiles = () => {
    setUploadedFiles([])
    setProcessedTechCard(null)

    if (onFilesUploaded) {
      onFilesUploaded([])
    }
  }

  /**
   * Get file icon based on type
   */
  const getFileIcon = (file: File) => {
    if (file.type.includes('image')) {
      return <Image className="w-4 h-4" />
    } else if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
      return <FileSpreadsheet className="w-4 h-4" />
    }
    return <Upload className="w-4 h-4" />
  }

  return (
    <div className="space-y-4">
      {/* Upload Area */}
      <Card
        className={`border-2 border-dashed transition-colors ${
          isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'
        }`}
      >
        <CardContent className="p-6">
          <div {...getRootProps()} className="cursor-pointer text-center">
            <input {...getInputProps()} />

            <div className="flex flex-col items-center space-y-4">
              <div
                className={`p-4 rounded-full ${
                  isDragActive ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'
                }`}
              >
                <Upload className="w-8 h-8" />
              </div>

              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">{title}</h3>
                <p className="text-sm text-gray-600 mb-2">{description}</p>
                <p className="text-xs text-gray-500">Поддерживаемые форматы: {acceptedFileTypes.join(', ')}</p>
                {maxFiles > 1 && <p className="text-xs text-gray-500">Максимум файлов: {maxFiles}</p>}
              </div>

              {isProcessing && (
                <div className="w-full max-w-sm">
                  <div className="h-2 w-full bg-gray-200 rounded">
                    <div className="h-2 w-1/2 bg-blue-500 animate-pulse rounded" />
                  </div>
                  <p className="mt-2 text-sm text-blue-600">Обработка...</p>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tech Card Results */}
      {mode === 'tech-card' && processedTechCard && (
        <Card className="p-4 bg-green-50 border-green-200">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center space-x-2">
              <FileSpreadsheet className="w-5 h-5 text-green-600" />
              <h4 className="font-medium text-green-800">Тех карта обработана</h4>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setProcessedTechCard(null)}
              className="text-green-600 hover:text-green-800"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium text-green-700">Изделие:</span>
              <p className="text-green-800">{processedTechCard.productName}</p>
            </div>
            <div>
              <span className="font-medium text-green-700">Материалов:</span>
              <p className="text-green-800">{processedTechCard.materials.length}</p>
            </div>
            {processedTechCard.collection && (
              <div>
                <span className="font-medium text-green-700">Коллекция:</span>
                <p className="text-green-800">{processedTechCard.collection}</p>
              </div>
            )}
            {processedTechCard.type && (
              <div>
                <span className="font-medium text-green-700">Тип:</span>
                <p className="text-green-800">{processedTechCard.type}</p>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Uploaded Files List */}
      {mode === 'files' && uploadedFiles.length > 0 && (
        <Card className="p-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-medium">Загруженные файлы</h4>
            <Button variant="outline" size="sm" onClick={clearFiles} className="text-red-600 hover:text-red-800">
              Очистить все
            </Button>
          </div>

          <div className="space-y-2">
            {uploadedFiles.map((file, index) => (
              <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  {getFileIcon(file)}
                  <div>
                    <p className="text-sm font-medium text-gray-900">{file.name}</p>
                    <p className="text-xs text-gray-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                  </div>
                </div>

                <Button variant="ghost" size="sm" onClick={() => removeFile(index)} className="text-red-600 hover:text-red-800">
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>

          <div className="mt-3 flex items-center justify-between text-xs text-gray-500">
            <span>{uploadedFiles.length} из {maxFiles} файлов</span>
            <Badge variant="outline">
              {uploadedFiles.reduce((sum, file) => sum + file.size, 0) > 1024 * 1024
                ? `${(uploadedFiles.reduce((sum, file) => sum + file.size, 0) / 1024 / 1024).toFixed(1)} MB`
                : `${Math.round(uploadedFiles.reduce((sum, file) => sum + file.size, 0) / 1024)} KB`}
            </Badge>
          </div>
        </Card>
      )}
    </div>
  )
}

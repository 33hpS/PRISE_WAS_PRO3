/**
 * Technology stack footer component
 */
import { Card } from './ui/card'

interface TechItem {
  name: string
  logo: string
  description: string
  color: string
}

const techStack: TechItem[] = [
  {
    name: 'React',
    logo: 'https://raw.githubusercontent.com/devicons/devicon/master/icons/react/react-original.svg',
    description: 'Frontend Framework',
    color: 'bg-blue-50 border-blue-200',
  },
  {
    name: 'TypeScript',
    logo: 'https://raw.githubusercontent.com/devicons/devicon/master/icons/typescript/typescript-original.svg',
    description: 'Type Safety',
    color: 'bg-blue-50 border-blue-300',
  },
  {
    name: 'Tailwind CSS',
    logo: 'https://raw.githubusercontent.com/devicons/devicon/master/icons/tailwindcss/tailwindcss-plain.svg',
    description: 'UI Styling',
    color: 'bg-cyan-50 border-cyan-200',
  },
  {
    name: 'Supabase',
    logo: 'https://supabase.com/dashboard/img/supabase-logo.svg',
    description: 'Backend & Database',
    color: 'bg-green-50 border-green-200',
  },
  {
    name: 'Vite',
    logo: 'https://raw.githubusercontent.com/devicons/devicon/master/icons/vitejs/vitejs-original.svg',
    description: 'Build Tool',
    color: 'bg-purple-50 border-purple-200',
  },
  {
    name: 'Lucide',
    logo: 'https://lucide.dev/logo.dark.svg',
    description: 'Icons',
    color: 'bg-gray-50 border-gray-200',
  },
]

/**
 * TechStack component displaying the technology stack used
 */
export default function TechStack() {
  return (
    <div className='mt-12 pt-8 border-t border-gray-200'>
      <div className='text-center mb-6'>
        <h3 className='text-lg font-semibold text-gray-800 mb-2'>
          Технологический стек приложения
        </h3>
        <p className='text-sm text-gray-600'>Современные технологии для надежного решения</p>
      </div>

      <div className='grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4'>
        {techStack.map(tech => (
          <TechCard key={tech.name} tech={tech} />
        ))}
      </div>

      <div className='mt-6 text-center'>
        <div className='inline-flex items-center gap-2 px-4 py-2 bg-gray-50 rounded-full border'>
          <div className='w-2 h-2 bg-green-500 rounded-full animate-pulse'></div>
          <span className='text-sm text-gray-600 font-medium'>
            Система управления мебельным производством v1.0
          </span>
        </div>
      </div>
    </div>
  )
}

interface TechCardProps {
  tech: TechItem
}

function TechCard({ tech }: TechCardProps) {
  return (
    <Card
      className={`p-4 ${tech.color} hover:shadow-lg transition-all duration-300 hover:scale-105 group`}
    >
      <div className='flex flex-col items-center text-center space-y-3'>
        <div className='w-12 h-12 flex items-center justify-center bg-white rounded-lg shadow-sm group-hover:shadow-md transition-shadow'>
          <img
            src={tech.logo}
            alt={tech.name}
            className='w-8 h-8 object-contain'
            onError={e => {
              // Fallback to placeholder
              e.currentTarget.src = `data:image/svg+xml;base64,${btoa(`
                <svg width="32" height="32" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
                  <rect width="32" height="32" fill="#f3f4f6" rx="6"/>
                  <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="#6b7280" font-size="8" font-family="monospace">${tech.name.charAt(0)}</text>
                </svg>
              `)}`
            }}
          />
        </div>

        <div>
          <h4 className='text-sm font-semibold text-gray-800'>{tech.name}</h4>
          <p className='text-xs text-gray-600 mt-1'>{tech.description}</p>
        </div>
      </div>
    </Card>
  )
}

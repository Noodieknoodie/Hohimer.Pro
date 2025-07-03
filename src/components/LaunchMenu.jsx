import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  CreditCardIcon, 
  DocumentIcon, 
  ChartBarIcon, 
  ChatBubbleLeftRightIcon,
  ChartPieIcon 
} from '@heroicons/react/24/outline';

const modules = [
  {
    id: 'payments',
    title: '401k Payments Manager',
    description: 'Manage and Review Client 401k payments',
    href: '/payments',
    icon: CreditCardIcon,
    available: true,
  },
  {
    id: 'agenda',
    title: 'Agenda Generator',
    description: 'Create and manage meeting agendas',
    href: '/agenda',
    icon: DocumentIcon,
    available: false,
  },
  {
    id: 'efip',
    title: 'eFIP',
    description: 'Financial Independence Projections',
    href: '/efip',
    icon: ChartBarIcon,
    available: false,
  },
  {
    id: 'structured-notes',
    title: 'Structured Notes Tracker',
    description: 'GBIL, Cash, and Structured Notes',
    href: '/structured-notes',
    icon: ChatBubbleLeftRightIcon,
    available: false,
  },
  {
    id: 'ai-tools',
    title: 'AI Tools',
    description: 'AI-powered investment analysis',
    href: '/ai-tools',
    icon: ChartPieIcon,
    available: false,
  },
];

export default function LaunchMenu() {
  const navigate = useNavigate();

  const handleNavigation = (module) => {
    if (module.available) {
      navigate(module.href);
    } else {
      navigate(`/under-construction?feature=${encodeURIComponent(module.title)}`);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="py-12 sm:py-16 lg:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl">
              Welcome to HohimerPro
            </h1>
            <p className="mt-4 text-xl text-gray-600">
              Investment management suite for Hohimer Wealth Management
            </p>
          </div>

          <div className="mt-12 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {modules.map((module) => (
              <button
                key={module.id}
                onClick={() => handleNavigation(module)}
                className="group relative rounded-lg border border-gray-200 bg-white p-6 shadow-sm transition-all hover:border-blue-500 hover:shadow-lg"
              >
                <div>
                  <span className="inline-flex rounded-lg bg-blue-50 p-3 text-blue-600 ring-4 ring-white">
                    <module.icon className="h-6 w-6" aria-hidden="true" />
                  </span>
                </div>
                <div className="mt-4">
                  <h3 className="text-xl font-medium text-gray-900">
                    {module.title}
                  </h3>
                  <p className="mt-2 text-sm text-gray-500">
                    {module.description}
                  </p>
                </div>
                <span
                  className="pointer-events-none absolute right-6 top-6 text-gray-300 group-hover:text-gray-400"
                  aria-hidden="true"
                >
                  <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M20 4h1a1 1 0 00-1-1v1zm-1 12a1 1 0 102 0h-2zM8 3a1 1 0 000 2V3zM3.293 19.293a1 1 0 101.414 1.414l-1.414-1.414zM19 4v12h2V4h-2zm1-1H8v2h12V3zm-.707.293l-16 16 1.414 1.414 16-16-1.414-1.414z" />
                  </svg>
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
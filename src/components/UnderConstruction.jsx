import React from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';

export default function UnderConstruction() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const featureName = searchParams.get('feature') || 'This feature';

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-16 sm:px-6 sm:py-24 md:grid md:place-items-center lg:px-8">
      <div className="mx-auto max-w-max">
        <main className="sm:flex">
          <div className="text-center sm:text-left">
            <div className="flex justify-center sm:justify-start">
              <ExclamationTriangleIcon className="h-12 w-12 text-yellow-400" aria-hidden="true" />
            </div>
            <h1 className="mt-4 text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl">
              Under Construction
            </h1>
            <p className="mt-4 text-base text-gray-500">
              {featureName} is currently under development and will be available soon.
            </p>
            <div className="mt-10 flex flex-col space-y-3 sm:flex-row sm:space-x-3 sm:space-y-0">
              <button
                type="button"
                onClick={() => navigate('/')}
                className="inline-flex items-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                Go back home
              </button>
              <button
                type="button"
                onClick={() => navigate('/payments')}
                className="inline-flex items-center rounded-md bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                Go to 401k Payments
              </button>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
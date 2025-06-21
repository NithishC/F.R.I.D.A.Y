import React, { useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { Disclosure } from '@headlessui/react';
import { Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline';
import { useOcv } from '../../contexts/OcvContext';
import ContextBanner from './ContextBanner';

const navigation = [
  { name: 'Home', href: '/' },
  { name: 'Destinations', href: '/destinations' },
  { name: 'Travel History', href: '/history' },
  { name: 'Preferences', href: '/preferences' },
];

const MainLayout: React.FC = () => {
  const { user } = useOcv();
  const location = useLocation();

  return (
    <div className="min-h-screen bg-gray-50">
      <Disclosure as="nav" className="bg-emerald-600">
        {({ open }) => (
          <>
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
              <div className="flex h-16 items-center justify-between">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <span className="text-white text-xl font-bold">Wanderlust</span>
                  </div>
                  <div className="hidden md:block">
                    <div className="ml-10 flex items-baseline space-x-4">
                      {navigation.map((item) => (
                        <Link
                          key={item.name}
                          to={item.href}
                          className={`${
                            location.pathname === item.href
                              ? 'bg-emerald-700 text-white'
                              : 'text-white hover:bg-emerald-500'
                          } px-3 py-2 rounded-md text-sm font-medium`}
                        >
                          {item.name}
                        </Link>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="hidden md:block">
                  <div className="ml-4 flex items-center md:ml-6">
                    {user.hasAccessGranted ? (
                      <span className="text-white text-sm px-3 py-2 rounded-md bg-emerald-700">
                        OCV Connected
                      </span>
                    ) : (
                      <button
                        onClick={user.requestAccess}
                        className="text-white text-sm px-3 py-2 rounded-md bg-emerald-700 hover:bg-emerald-800"
                      >
                        Connect to OCV
                      </button>
                    )}
                  </div>
                </div>
                <div className="-mr-2 flex md:hidden">
                  <Disclosure.Button className="inline-flex items-center justify-center rounded-md bg-emerald-700 p-2 text-emerald-200 hover:bg-emerald-500 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-emerald-600">
                    <span className="sr-only">Open main menu</span>
                    {open ? (
                      <XMarkIcon className="block h-6 w-6" aria-hidden="true" />
                    ) : (
                      <Bars3Icon className="block h-6 w-6" aria-hidden="true" />
                    )}
                  </Disclosure.Button>
                </div>
              </div>
            </div>

            <Disclosure.Panel className="md:hidden">
              <div className="space-y-1 px-2 pt-2 pb-3 sm:px-3">
                {navigation.map((item) => (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`${
                      location.pathname === item.href
                        ? 'bg-emerald-700 text-white'
                        : 'text-white hover:bg-emerald-500'
                    } block px-3 py-2 rounded-md text-base font-medium`}
                  >
                    {item.name}
                  </Link>
                ))}
              </div>
              <div className="border-t border-emerald-700 pt-4 pb-3">
                <div className="flex items-center px-5">
                  <div className="flex-shrink-0">
                    {user.hasAccessGranted ? (
                      <span className="text-white text-sm px-3 py-2 rounded-md bg-emerald-700">
                        OCV Connected
                      </span>
                    ) : (
                      <button
                        onClick={user.requestAccess}
                        className="text-white text-sm px-3 py-2 rounded-md bg-emerald-700 hover:bg-emerald-800"
                      >
                        Connect to OCV
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </Disclosure.Panel>
          </>
        )}
      </Disclosure>

      <ContextBanner />

      <main>
        <div className="mx-auto max-w-7xl py-6 sm:px-6 lg:px-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default MainLayout;

import React from 'react';
import { Link } from 'react-router-dom';
import { useOcv } from '../contexts/OcvContext';

// Featured destinations
const featuredDestinations = [
  {
    id: '1',
    name: 'Bali, Indonesia',
    image: 'https://images.unsplash.com/photo-1573790387438-4da905039392',
    category: 'beach',
    description: 'Tropical paradise with stunning beaches and vibrant culture.',
  },
  {
    id: '2',
    name: 'Kyoto, Japan',
    image: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e',
    category: 'city',
    description: 'Ancient temples, traditional gardens, and timeless culture.',
  },
  {
    id: '3',
    name: 'Swiss Alps',
    image: 'https://images.unsplash.com/photo-1527668752968-14dc70a27c95',
    category: 'mountain',
    description: 'Breathtaking mountain scenery and world-class skiing.',
  },
  {
    id: '4',
    name: 'Paris, France',
    image: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34',
    category: 'city',
    description: 'The city of light, love, and unforgettable cuisine.',
  },
];

const HomePage: React.FC = () => {
  const { user } = useOcv();
  
  // Get personalized recommendations based on preferences
  const getRecommendedDestinations = () => {
    const { preferences } = user;
    
    // Filter destinations that match user's preferred categories
    const recommended = featuredDestinations.filter(dest => 
      preferences.preferredDestinations.includes(dest.category)
    );
    
    // If no matches, return all destinations
    return recommended.length > 0 ? recommended : featuredDestinations;
  };
  
  const recommendedDestinations = getRecommendedDestinations();
  
  return (
    <div className="container mx-auto px-4">
      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 py-16 px-6 text-center shadow-xl sm:py-20 mb-12">
        <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl">
          Discover Your Next Adventure
        </h1>
        <p className="mt-6 max-w-lg mx-auto text-xl text-emerald-50">
          Personalized travel recommendations based on your preferences and history.
        </p>
        <div className="mt-8 flex justify-center">
          <Link
            to="/destinations"
            className="inline-block rounded-md border border-transparent bg-white px-8 py-3 text-base font-medium text-emerald-600 hover:bg-emerald-50"
          >
            Explore Destinations
          </Link>
          {!user.hasAccessGranted && (
            <button
              onClick={user.requestAccess}
              className="ml-4 inline-block rounded-md border border-white bg-transparent px-8 py-3 text-base font-medium text-white hover:bg-emerald-700"
            >
              Connect OCV
            </button>
          )}
        </div>
      </div>

      {/* Recommendations Section */}
      <div className="mb-12">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900">
            {user.hasAccessGranted 
              ? 'Personalized Recommendations' 
              : 'Featured Destinations'}
          </h2>
          <p className="mt-2 text-gray-600">
            {user.hasAccessGranted 
              ? 'Based on your travel preferences' 
              : 'Popular destinations you might enjoy'}
          </p>
        </div>
        
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {recommendedDestinations.map((dest) => (
            <Link
              key={dest.id}
              to={`/destinations/${dest.id}`}
              className="group overflow-hidden rounded-lg shadow-lg transform transition duration-300 hover:scale-105"
            >
              <div className="aspect-w-16 aspect-h-9 relative h-48 w-full overflow-hidden">
                <img
                  src={dest.image}
                  alt={dest.name}
                  className="h-full w-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <div className="absolute bottom-0 left-0 p-4">
                  <h3 className="text-xl font-bold text-white">{dest.name}</h3>
                  <span className="inline-flex items-center rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-medium text-emerald-800">
                    {dest.category}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Recent Trips Section (if connected to OCV and has history) */}
      {user.hasAccessGranted && user.travelHistory.length > 0 && (
        <div className="mb-12">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Your Recent Trips</h2>
            <p className="mt-2 text-gray-600">Continue exploring your favorite destinations</p>
          </div>
          
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {user.travelHistory.slice(0, 3).map((trip, index) => (
              <div key={index} className="overflow-hidden rounded-lg bg-white shadow">
                <div className="p-6">
                  <h3 className="text-lg font-bold text-gray-900">{trip.destination}</h3>
                  <p className="mt-1 text-sm text-gray-500">{trip.date}</p>
                  <p className="mt-3 text-gray-700">{trip.notes}</p>
                </div>
              </div>
            ))}
          </div>
          
          <div className="mt-6 text-center">
            <Link
              to="/history"
              className="inline-flex items-center text-sm font-medium text-emerald-600 hover:text-emerald-800"
            >
              View all trips
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="ml-1 h-4 w-4"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"
                />
              </svg>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};

export default HomePage;

import React, { useState } from 'react';
import { useOcv } from '../contexts/OcvContext';

const PreferencesPage: React.FC = () => {
  const { user } = useOcv();
  const [preferences, setPreferences] = useState(user.preferences);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setIsSuccess(false);
    
    try {
      await user.updatePreferences(preferences);
      setIsSuccess(true);
    } catch (err) {
      console.error('Failed to update preferences:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDestinationToggle = (type: string) => {
    const current = [...preferences.preferredDestinations];
    if (current.includes(type)) {
      setPreferences({
        ...preferences,
        preferredDestinations: current.filter(t => t !== type),
      });
    } else {
      setPreferences({
        ...preferences,
        preferredDestinations: [...current, type],
      });
    }
  };

  const handleActivityToggle = (activity: string) => {
    const current = [...preferences.activities];
    if (current.includes(activity)) {
      setPreferences({
        ...preferences,
        activities: current.filter(a => a !== activity),
      });
    } else {
      setPreferences({
        ...preferences,
        activities: [...current, activity],
      });
    }
  };

  const handleFoodToggle = (food: string) => {
    const current = [...preferences.foodPreferences];
    if (current.includes(food)) {
      setPreferences({
        ...preferences,
        foodPreferences: current.filter(f => f !== food),
      });
    } else {
      setPreferences({
        ...preferences,
        foodPreferences: [...current, food],
      });
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Travel Preferences</h1>
        <p className="mt-2 text-gray-600">
          Customize your travel experience by updating your preferences.
          {!user.hasAccessGranted && (
            <span className="ml-2 text-amber-600">
              <button 
                onClick={user.requestAccess}
                className="underline hover:text-amber-800"
              >
                Connect to OCV
              </button>{' '}
              to save these preferences across devices.
            </span>
          )}
        </p>
      </div>

      {isSuccess && (
        <div className="mb-6 rounded-md bg-green-50 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-green-400"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                aria-hidden="true"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-green-800">
                Your preferences have been updated successfully!
              </p>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8 bg-white p-6 rounded-lg shadow">
        {/* Destination Types */}
        <div>
          <h2 className="text-lg font-medium text-gray-900">Preferred Destinations</h2>
          <p className="text-sm text-gray-500">Select the types of destinations you enjoy.</p>
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
            {['beach', 'mountain', 'city', 'rural', 'island', 'desert'].map((type) => (
              <div key={type} className="relative flex items-start">
                <div className="flex h-5 items-center">
                  <input
                    id={`destination-${type}`}
                    type="checkbox"
                    checked={preferences.preferredDestinations.includes(type)}
                    onChange={() => handleDestinationToggle(type)}
                    className="h-4 w-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                  />
                </div>
                <div className="ml-3 text-sm">
                  <label htmlFor={`destination-${type}`} className="font-medium text-gray-700">
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </label>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Accommodation Type */}
        <div>
          <h2 className="text-lg font-medium text-gray-900">Accommodation Type</h2>
          <p className="text-sm text-gray-500">Select your preferred accommodation.</p>
          <div className="mt-4 space-y-4">
            {['hotel', 'resort', 'hostel', 'apartment', 'camping'].map((type) => (
              <div key={type} className="relative flex items-start">
                <div className="flex h-5 items-center">
                  <input
                    id={`accommodation-${type}`}
                    type="radio"
                    name="accommodationType"
                    checked={preferences.accommodationType === type}
                    onChange={() => setPreferences({ ...preferences, accommodationType: type })}
                    className="h-4 w-4 border-gray-300 text-emerald-600 focus:ring-emerald-500"
                  />
                </div>
                <div className="ml-3 text-sm">
                  <label htmlFor={`accommodation-${type}`} className="font-medium text-gray-700">
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </label>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Budget */}
        <div>
          <h2 className="text-lg font-medium text-gray-900">Budget</h2>
          <p className="text-sm text-gray-500">Select your preferred budget range.</p>
          <div className="mt-4">
            <select
              id="budget"
              name="budget"
              value={preferences.budget}
              onChange={(e) => setPreferences({ ...preferences, budget: e.target.value })}
              className="block w-full rounded-md border-gray-300 py-2 pl-3 pr-10 text-base focus:border-emerald-500 focus:outline-none focus:ring-emerald-500 sm:text-sm"
            >
              <option value="budget">Budget</option>
              <option value="economy">Economy</option>
              <option value="medium">Medium</option>
              <option value="luxury">Luxury</option>
              <option value="ultra-luxury">Ultra Luxury</option>
            </select>
          </div>
        </div>

        {/* Travel Style */}
        <div>
          <h2 className="text-lg font-medium text-gray-900">Travel Style</h2>
          <p className="text-sm text-gray-500">How do you prefer to travel?</p>
          <div className="mt-4 space-y-4">
            {['relaxed', 'balanced', 'active', 'adventurous'].map((style) => (
              <div key={style} className="relative flex items-start">
                <div className="flex h-5 items-center">
                  <input
                    id={`style-${style}`}
                    type="radio"
                    name="travelStyle"
                    checked={preferences.travelStyle === style}
                    onChange={() => setPreferences({ ...preferences, travelStyle: style })}
                    className="h-4 w-4 border-gray-300 text-emerald-600 focus:ring-emerald-500"
                  />
                </div>
                <div className="ml-3 text-sm">
                  <label htmlFor={`style-${style}`} className="font-medium text-gray-700">
                    {style.charAt(0).toUpperCase() + style.slice(1)}
                  </label>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Activities */}
        <div>
          <h2 className="text-lg font-medium text-gray-900">Activities</h2>
          <p className="text-sm text-gray-500">Select activities you enjoy while traveling.</p>
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
            {[
              'sightseeing',
              'museums',
              'food',
              'shopping',
              'hiking',
              'beach',
              'nightlife',
              'relaxation',
              'adventure',
            ].map((activity) => (
              <div key={activity} className="relative flex items-start">
                <div className="flex h-5 items-center">
                  <input
                    id={`activity-${activity}`}
                    type="checkbox"
                    checked={preferences.activities.includes(activity)}
                    onChange={() => handleActivityToggle(activity)}
                    className="h-4 w-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                  />
                </div>
                <div className="ml-3 text-sm">
                  <label htmlFor={`activity-${activity}`} className="font-medium text-gray-700">
                    {activity.charAt(0).toUpperCase() + activity.slice(1)}
                  </label>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Food Preferences */}
        <div>
          <h2 className="text-lg font-medium text-gray-900">Food Preferences</h2>
          <p className="text-sm text-gray-500">Select your food preferences.</p>
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
            {[
              'local',
              'international',
              'vegetarian',
              'vegan',
              'seafood',
              'street food',
              'fine dining',
            ].map((food) => (
              <div key={food} className="relative flex items-start">
                <div className="flex h-5 items-center">
                  <input
                    id={`food-${food}`}
                    type="checkbox"
                    checked={preferences.foodPreferences.includes(food)}
                    onChange={() => handleFoodToggle(food)}
                    className="h-4 w-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                  />
                </div>
                <div className="ml-3 text-sm">
                  <label htmlFor={`food-${food}`} className="font-medium text-gray-700">
                    {food.charAt(0).toUpperCase() + food.slice(1)}
                  </label>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="pt-6">
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex justify-center rounded-md border border-transparent bg-emerald-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 disabled:opacity-50"
            >
              {isSubmitting ? 'Saving...' : 'Save Preferences'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default PreferencesPage;

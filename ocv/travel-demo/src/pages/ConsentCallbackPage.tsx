import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const ConsentCallbackPage: React.FC = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // The OCV context will handle the callback parameters
    // We just need to redirect to the home page
    navigate('/');
  }, [navigate]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-emerald-600 border-r-transparent"></div>
        <p className="mt-4 text-gray-700">Processing authorization...</p>
      </div>
    </div>
  );
};

export default ConsentCallbackPage;

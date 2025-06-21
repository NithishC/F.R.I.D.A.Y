import React, { createContext, useContext, useState, useEffect } from 'react';
import { OcvClient } from '@ocv/sdk';
import { v4 as uuidv4 } from 'uuid';

interface UserContext {
  userId: string | null;
  preferences: any;
  travelHistory: any[];
  hasAccessGranted: boolean;
  requestAccess: () => void;
  updatePreferences: (preferences: any) => Promise<void>;
  addTravelHistory: (history: any) => Promise<void>;
}

interface OcvContextType {
  user: UserContext;
  client: OcvClient;
}

// Generate a session ID that will be used if user doesn't grant OCV access
const getSessionId = () => {
  const storedId = localStorage.getItem('travelSessionId');
  if (storedId) return storedId;
  
  const newId = uuidv4();
  localStorage.setItem('travelSessionId', newId);
  return newId;
};

// Default travel preferences
const defaultPreferences = {
  preferredDestinations: ['beach', 'mountain', 'city'],
  accommodationType: 'hotel',
  budget: 'medium',
  travelStyle: 'relaxed',
  foodPreferences: ['local', 'international'],
  activities: ['sightseeing', 'relaxation', 'adventure'],
};

// Default OCV client
const defaultClient = new OcvClient({
  endpoint: process.env.REACT_APP_OCV_API_URL || 'http://localhost:8000/api/graphql',
  clientId: 'travel-demo-app',
});

const OcvContext = createContext<OcvContextType>({
  user: {
    userId: null,
    preferences: defaultPreferences,
    travelHistory: [],
    hasAccessGranted: false,
    requestAccess: () => {},
    updatePreferences: async () => {},
    addTravelHistory: async () => {},
  },
  client: defaultClient,
});

export const useOcv = () => useContext(OcvContext);

export const OcvProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [userId, setUserId] = useState<string | null>(null);
  const [preferences, setPreferences] = useState<any>(defaultPreferences);
  const [travelHistory, setTravelHistory] = useState<any[]>([]);
  const [hasAccessGranted, setHasAccessGranted] = useState<boolean>(false);
  const [client] = useState<OcvClient>(defaultClient);
  
  // Check if access is already granted
  useEffect(() => {
    const checkAccess = async () => {
      // Check if we have a stored user ID
      const storedUserId = localStorage.getItem('ocvUserId');
      if (storedUserId) {
        setUserId(storedUserId);
        
        try {
          // Try to load user preferences
          const shards = await client.context.getShardsByDomain(
            storedUserId,
            'travel-preferences',
            1
          );
          
          if (shards.length > 0) {
            const shardWithContent = await client.context.getShardWithContent(shards[0].id);
            if (shardWithContent) {
              setPreferences(shardWithContent.content);
              setHasAccessGranted(true);
            }
          }
          
          // Try to load travel history
          const historyShards = await client.context.getShardsByDomain(
            storedUserId,
            'travel-history',
            10
          );
          
          if (historyShards.length > 0) {
            const historyItems = await Promise.all(
              historyShards.map(shard => client.context.getShardWithContent(shard.id))
            );
            
            setTravelHistory(
              historyItems
                .filter(Boolean)
                .map(item => item!.content)
                .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
            );
          }
        } catch (err) {
          console.error('Failed to load user context:', err);
          // Access might have been revoked
          setHasAccessGranted(false);
        }
      }
    };
    
    checkAccess();
  }, [client]);
  
  // Handle consent callback
  useEffect(() => {
    const handleConsentCallback = () => {
      const urlParams = new URLSearchParams(window.location.search);
      const requestId = urlParams.get('requestId');
      const granted = urlParams.get('granted') === 'true';
      
      if (requestId && granted) {
        // Access was granted, but we need the user ID
        // In a real app, this would be handled by the server
        // For this demo, we'll just use the session ID
        const sessionId = getSessionId();
        localStorage.setItem('ocvUserId', sessionId);
        setUserId(sessionId);
        setHasAccessGranted(true);
        
        // Clean up the URL
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    };
    
    handleConsentCallback();
  }, []);
  
  // Request access to OCV
  const requestAccess = () => {
    // Generate a new request ID
    const requestId = uuidv4();
    
    // In a real app, we would make an API call to register this request
    // For this demo, we'll just redirect to the consent page
    const consentUrl = `${process.env.REACT_APP_CONSENT_URL || 'http://localhost:3000'}/consent-request/${requestId}`;
    
    // Redirect to the consent page
    window.location.href = consentUrl;
  };
  
  // Update preferences
  const updatePreferences = async (newPreferences: any) => {
    setPreferences(newPreferences);
    
    if (hasAccessGranted && userId) {
      try {
        // Check if we already have a preferences shard
        const existingShards = await client.context.getShardsByDomain(
          userId,
          'travel-preferences',
          1
        );
        
        if (existingShards.length > 0) {
          // Update existing shard
          await client.context.updateShard(
            existingShards[0].id,
            {
              content: newPreferences,
              currentVersion: existingShards[0].version,
            }
          );
        } else {
          // Create new shard
          await client.context.createShard({
            userId,
            domain: 'travel-preferences',
            contentType: 'preferences',
            metadata: {
              lastUpdated: new Date().toISOString(),
              source: 'travel-demo-app',
            },
            content: newPreferences,
          });
        }
      } catch (err) {
        console.error('Failed to update preferences:', err);
      }
    } else {
      // Store locally in this session only
      localStorage.setItem('travelPreferences', JSON.stringify(newPreferences));
    }
  };
  
  // Add travel history
  const addTravelHistory = async (historyItem: any) => {
    const newHistory = [historyItem, ...travelHistory];
    setTravelHistory(newHistory);
    
    if (hasAccessGranted && userId) {
      try {
        // Create new history shard
        await client.context.createShard({
          userId,
          domain: 'travel-history',
          contentType: 'history-item',
          metadata: {
            date: historyItem.date,
            destination: historyItem.destination,
            source: 'travel-demo-app',
          },
          content: historyItem,
        });
      } catch (err) {
        console.error('Failed to add travel history:', err);
      }
    } else {
      // Store locally in this session only
      localStorage.setItem('travelHistory', JSON.stringify(newHistory));
    }
  };
  
  return (
    <OcvContext.Provider
      value={{
        user: {
          userId,
          preferences,
          travelHistory,
          hasAccessGranted,
          requestAccess,
          updatePreferences,
          addTravelHistory,
        },
        client,
      }}
    >
      {children}
    </OcvContext.Provider>
  );
};

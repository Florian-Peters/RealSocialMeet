import React, { createContext, useContext, useState } from 'react';

const GpsContext = createContext();

export const GpsProvider = ({ children }) => {
  const [gpsEnabled, setGpsEnabled] = useState(true);

  return (
    <GpsContext.Provider value={{ gpsEnabled, setGpsEnabled }}>
      {children}
    </GpsContext.Provider>
  );
};

export const useGps = () => useContext(GpsContext);

import React from 'react';
import ClothingFinder from './components/ClothingFinder';

const App: React.FC = () => {
  return (
    <div className="w-full min-h-screen flex items-center justify-center py-8">
      <ClothingFinder />
    </div>
  );
};

export default App;
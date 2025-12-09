import React from 'react';
import ClothingFinder from './components/ClothingFinder';

const App: React.FC = () => {
  return (
    // We change this to h-full to inherit the 100svh set on the #root container
    <div className="w-full h-full flex items-center justify-center">
      <ClothingFinder />
    </div>
  );
};

export default App;

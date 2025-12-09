import React from 'react';
import ClothingFinder from './components/ClothingFinder';

const App: React.FC = () => {
  return (
    // Replaced min-h-screen with h-screen (which uses the full height of the parent #root container)
    // and removed py-8 padding so the app uses the very edges of the screen.
    <div className="w-full h-screen flex items-center justify-center">
      <ClothingFinder />
    </div>
  );
};

export default App;
